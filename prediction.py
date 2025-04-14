import numpy as np
from keras.models import load_model
import joblib
import os

MODELS_BASE_DIR = "models"

# Load model and scaler dynamically based on currency pair
def load_model_and_scaler(currency_pair: str, period: str):
    model_path = os.path.join(MODELS_BASE_DIR, currency_pair, period, "model.keras")
    scaler_path = os.path.join(MODELS_BASE_DIR, currency_pair, period, "scaler.pkl")

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
def get_multiple_predictions(sequences, model, scaler, num_predictions=5, sentiment_score=None):
    predictions = []
    current_sequence = sequences.copy()
    if sentiment_score is not None:
        # Adjust the last sequence based on sentiment score
        current_sequence[:, -1, 3] = current_sequence[:, -1, 3] * sentiment_score

    for i in range(num_predictions):
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
