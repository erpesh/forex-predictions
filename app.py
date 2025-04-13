from fastapi import FastAPI, HTTPException, Depends
from requests import get
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
from datetime import datetime
from typing import Optional

from db import models, service, setup
from prediction import calculate_macd, calculate_rsi, get_multiple_predictions, load_model_and_scaler, preprocess_data

app = FastAPI()

def get_db():
    db = setup.SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def match_date_to_period(period: str, offset: int = 0) -> datetime:
    # Convert the date to the nearest past date matching the given period, e.g. for 'd1' it should be the start of the current day
    # for 'h1' it should be the start of the current hour, etc.
    now = datetime.utcnow()
    if period == 'd1':
        return now.replace(hour=0, minute=0, second=0, microsecond=0) + pd.DateOffset(days=offset)
    elif period == 'h1':
        return now.replace(minute=0, second=0, microsecond=0) + pd.DateOffset(hours=offset)
    # Add more periods as needed
    return now

class OHLCData(BaseModel):
    Open: float
    High: float
    Low: float
    Close: float
    Volume: int

class PredictionRequest(BaseModel):
    data: list[OHLCData]
    sentimentScore: Optional[float] = None

@app.post("/predict/{currency_pair}/{period}")
async def predict(currency_pair: str, period: str, data: PredictionRequest, db: Session = Depends(get_db)):
    try:
        num_of_predictions = 5  # Number of predictions to generate
        
        # Validate currency pair
        currency_pair = currency_pair.upper()
        currency_pair_record = service.get_currency_pair(db, currency_pair)
        if currency_pair_record is None:
            raise HTTPException(status_code=400, detail=f"Unsupported currency pair")
        
        # Validate period
        period = period.lower()
        period_record = service.get_period(db, period)
        if period_record is None:
            raise HTTPException(status_code=400, detail=f"Unsupported period")
        
        # Get prediction models
        LSTM_model = service.get_prediction_model(db, "LSTM")
        LSTM_sentiment_model = service.get_prediction_model(db, "LSTM_Sentiment")
        
        data_dict = [item.dict() for item in data.data]
        df = pd.DataFrame(data_dict)
        
        last_data_value = df.iloc[-1]['Close']  # Get the last close value for the prediction
        sentiment_score = data.sentimentScore 

        matched_date = match_date_to_period(period)

        # Check if prediction exists for today
        existing_LSTM_predictions = service.get_n_predictions(db, currency_pair_record.id, period_record.id, LSTM_model.id, matched_date, num_of_predictions)
        existing_LSTM_sentiment_predictions = service.get_n_predictions(db, currency_pair_record.id, period_record.id, LSTM_sentiment_model.id, matched_date, num_of_predictions)

        if len(existing_LSTM_predictions) == num_of_predictions and existing_LSTM_predictions[0].last_live_value == last_data_value:
            return {
                "predictions": [pred.value for pred in existing_LSTM_predictions],
                "predictions_with_sentiment": [pred.value for pred in existing_LSTM_sentiment_predictions]
            }
        
        
        # Generate new predictions
        model, scaler = load_model_and_scaler(currency_pair, period)
        
        df['RSI'] = calculate_rsi(df, window=14)
        df['MACD'], df['Signal_Line'], df['Histogram'] = calculate_macd(df)

        # Drop rows with NaN values (if any)
        df.dropna(inplace=True)

        # Preprocess the data (normalize and reshape for LSTM input)
        sequences = preprocess_data(df, scaler)

        # Get multiple predictions
        predictions = get_multiple_predictions(sequences, model, scaler)
        predictions_with_sentiment = predictions.copy()
        if sentiment_score is not None:
            # Use sentiment score to adjust the last prediction
            predictions_with_sentiment = get_multiple_predictions(sequences, model, scaler, sentiment_score=sentiment_score)
        
        # Create new predictions in the database
        for i in range(num_of_predictions):
            prediction_date = match_date_to_period(period, i)
            
            # Check if LSTM prediction already exists for the date
            LSTM_prediction = predictions[i]
            existing_prediction = service.get_prediction_by_date(db, currency_pair_record.id, period_record.id, LSTM_model.id, prediction_date)
            if existing_prediction:
                service.update_prediction(db, existing_prediction, LSTM_prediction, last_data_value)
            else:
                service.create_prediction(db, currency_pair_record.id, period_record.id, LSTM_model.id, LSTM_prediction, last_data_value, prediction_date)
            
            # Check if LSTM sentiment prediction already exists for the date
            LSTM_sentiment_prediction = predictions_with_sentiment[i]
            existing_sentiment_prediction = service.get_prediction_by_date(db, currency_pair_record.id, period_record.id, LSTM_sentiment_model.id, prediction_date)
            if existing_sentiment_prediction:
                service.update_prediction(db, existing_sentiment_prediction, LSTM_sentiment_prediction, last_data_value)
            else:
                service.create_prediction(db, currency_pair_record.id, period_record.id, LSTM_sentiment_model.id, LSTM_sentiment_prediction, last_data_value, prediction_date)

        return {"predictions": predictions, "predictions_with_sentiment": predictions_with_sentiment}

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")
