from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
from keras.models import load_model
import joblib
import os
from typing import Optional

# FastAPI app instance
app = FastAPI()

# Supported currency pairs
SUPPORTED_PAIRS = ["AUDUSD", "EURUSD", "GBPUSD"]

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

# Load model and scaler dynamically based on currency pair
def load_model_and_scaler(currency_pair: str):
    if currency_pair not in SUPPORTED_PAIRS:
        raise ValueError(f"Unsupported currency pair: {currency_pair}. Supported pairs are: {SUPPORTED_PAIRS}")

    model_path = os.path.join(MODELS_BASE_DIR, currency_pair, "model.keras")
    scaler_path = os.path.join(MODELS_BASE_DIR, currency_pair, "scaler.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found for {currency_pair} at {model_path}")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler file not found for {currency_pair} at {scaler_path}")

    model = load_model(model_path)
    scaler = joblib.load(scaler_path)

    return model, scaler

# Calculate RSI using the custom function
def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Calculate MACD using the custom function
def calculate_macd(data, fast_period=12, slow_period=26, signal_period=9):
    fast_ema = data['Close'].ewm(span=fast_period, min_periods=1).mean()
    slow_ema = data['Close'].ewm(span=slow_period, min_periods=1).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal_period, min_periods=1).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

# Preprocess the data (normalize and reshape for LSTM input)
def preprocess_data(mock_df, scaler):
    mock_normalized = scaler.transform(mock_df[['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']])
    mock_sequences = np.array([mock_normalized])
    mock_sequences = mock_sequences.reshape((mock_sequences.shape[0], mock_sequences.shape[1], mock_sequences.shape[2]))
    return mock_sequences

# Get multiple predictions
def get_multiple_predictions(mock_sequences, model, scaler, num_predictions=5):
    predictions = []
    current_sequence = mock_sequences.copy()

    for _ in range(num_predictions):
        # Predict using the LSTM model
        prediction_normalized = model.predict(current_sequence)

        # Create a dummy array for inverse scaling
        dummy_array = current_sequence[:, -1, :].copy()
        dummy_array[:, 3] = prediction_normalized.flatten()

        # Inverse transform the entire dummy array
        dummy_array_inverse = scaler.inverse_transform(dummy_array)

        # Extract the 'Close' column from the inverse-transformed data
        prediction = dummy_array_inverse[:, 3][0]
        predictions.append(prediction)

        # Update the current_sequence with the new prediction
        new_row = current_sequence[:, -1, :].copy()
        new_row[:, 3] = prediction_normalized.flatten()
        current_sequence = np.append(current_sequence[:, 1:, :], [new_row], axis=1)

    return predictions

# Prediction endpoint with currency pair as a path parameter
@app.post("/predict/{currency_pair}")
async def predict(currency_pair: str, data: PredictionRequest):
    try:
        # Validate currency pair
        currency_pair = currency_pair.upper()
        if currency_pair not in SUPPORTED_PAIRS:
            raise HTTPException(status_code=400, detail=f"Unsupported currency pair. Supported pairs are: {SUPPORTED_PAIRS}")

        # Load model and scaler for the specified currency pair
        model, scaler = load_model_and_scaler(currency_pair)

        # Convert input data to DataFrame
        data_dict = [item.dict() for item in data.data]
        df = pd.DataFrame(data_dict)
        
        # Calculate RSI and MACD
        df['RSI'] = calculate_rsi(df, window=14)
        df['MACD'], df['Signal_Line'], df['Histogram'] = calculate_macd(df)

        # Drop rows with NaN values (if any)
        df.dropna(inplace=True)

        # Preprocess the data (normalize and reshape for LSTM input)
        mock_sequences = preprocess_data(df, scaler)

        # Get multiple predictions
        predictions = get_multiple_predictions(mock_sequences, model, scaler, num_predictions=5)
        
        # Return predictions as a JSON response
        return {
            "currency_pair": currency_pair,
            "predictions": predictions
        }
    
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")