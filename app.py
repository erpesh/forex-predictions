from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
from keras.models import load_model
import joblib

# FastAPI app instance
app = FastAPI()

# Load the model and scaler once when the server starts
scaler = joblib.load('scaler_aud.pkl')  # Load the scaler used during training
model = load_model('audusd_fold_1.keras')  # Load the trained model

# Pydantic model to define the data structure for incoming requests
class OHLCData(BaseModel):
    Open: float
    High: float
    Low: float
    Close: float
    Volume: int

class PredictionRequest(BaseModel):
    data: list[OHLCData]  # A list of OHLC data points


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
    fast_ema = data['Close'].ewm(span=fast_period, min_periods=1).mean()  # Use min_periods=1 to avoid NaNs
    slow_ema = data['Close'].ewm(span=slow_period, min_periods=1).mean()  # Use min_periods=1 to avoid NaNs
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal_period, min_periods=1).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

# Preprocess the mock data (normalize and reshape for LSTM input)
def preprocess_mock_data(mock_df, scaler):
    # Normalize the mock data using the loaded scaler
    mock_normalized = scaler.transform(mock_df[['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']])

    # Reshape the data to match the input shape of the LSTM model
    mock_sequences = np.array([mock_normalized])  # Add batch dimension (1 batch)
    mock_sequences = mock_sequences.reshape((mock_sequences.shape[0], mock_sequences.shape[1], mock_sequences.shape[2]))  # Shape (1, sequence_length, num_features)
    
    return mock_sequences

# Get predictions
def get_predictions(mock_sequences, model, scaler):
    # Predict using the LSTM model
    predictions_normalized = model.predict(mock_sequences)

    # Create a dummy array for inverse scaling
    dummy_array = mock_sequences[:, -1, :].copy()  # Use the last time step as a template (Shape: (1, num_features))
    
    # Replace the 'Close' column with the normalized predictions
    dummy_array[:, 3] = predictions_normalized.flatten()  # 'Close' column is index 3
    
    # Inverse transform the entire dummy array
    dummy_array_inverse = scaler.inverse_transform(dummy_array)
    
    # Extract the 'Close' column from the inverse-transformed data
    predictions = dummy_array_inverse[:, 3]
    
    return predictions


# Prediction endpoint
@app.post("/predict")
async def predict(data: PredictionRequest):
    try:
        # Convert input data to DataFrame
        data_dict = [item.dict() for item in data.data]
        df = pd.DataFrame(data_dict)
        
        # Calculate RSI and MACD
        df['RSI'] = calculate_rsi(df, window=14)
        df['MACD'], df['Signal_Line'], df['Histogram'] = calculate_macd(df)

        # Drop rows with NaN values (if any)
        df.dropna(inplace=True)

        # Preprocess the data (normalize and reshape for LSTM input)
        mock_sequences = preprocess_mock_data(df, scaler)

        # Get predictions
        predictions = get_predictions(mock_sequences, model, scaler)
        
        # Return predictions as a JSON response
        return {"predictions": predictions.tolist()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

