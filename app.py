from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from typing import Optional

from prediction import calculate_macd, calculate_rsi, get_multiple_predictions, load_model_and_scaler, preprocess_data

# FastAPI app instance
app = FastAPI()

# Supported currency pairs
SUPPORTED_PAIRS = ["AUDUSD", "EURUSD"]

# Base directory where models and scalers are stored
MODELS_BASE_DIR = "models"

# Pydantic model to define the data structure for incoming requests
class OHLCData(BaseModel):
    Open: float
    High: float
    Low: float
    Close: float
    Volume: int

class PredictionRequest(BaseModel):
    data: list[OHLCData]  # A list of OHLC data points
    sentimentScore: Optional[float] = None  # Optional sentiment score


# Prediction endpoint with currency pair as a path parameter
@app.post("/predict/{currency_pair}/{period}")
async def predict(currency_pair: str, period: str, data: PredictionRequest):
    try:
        # Validate currency pair
        currency_pair = currency_pair.upper()
        if currency_pair not in SUPPORTED_PAIRS:
            raise HTTPException(status_code=400, detail=f"Unsupported currency pair. Supported pairs are: {SUPPORTED_PAIRS}")

        # Load model and scaler for the specified currency pair
        model, scaler = load_model_and_scaler(currency_pair, period)

        # Convert input data to DataFrame
        data_dict = [item.dict() for item in data.data]
        df = pd.DataFrame(data_dict)
        
        sentiment_score = data.sentimentScore 
        print(f"Sentiment Score: {sentiment_score}")
        
        # Calculate RSI and MACD
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
            # Use sentiment score to adjust the last 
            predictions_with_sentiment = get_multiple_predictions(sequences, model, scaler, sentiment_score=sentiment_score)
        
        # Return predictions as a JSON response
        return {
            "currency_pair": currency_pair,
            "predictions": predictions,
            "predictions_with_sentiment": predictions_with_sentiment,
        }
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")