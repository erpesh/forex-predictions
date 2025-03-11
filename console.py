import numpy as np
import pandas as pd
from keras.models import load_model
import joblib

# Load data from the csv file
file_path = 'data/AUDUSD_D1.csv'  # Ensure this file path is correct
data = pd.read_csv(file_path, sep=',', header=None, names=['Time', 'Open', 'High', 'Low', 'Close', 'Volume'])

# Display the first few rows of data to ensure it's loaded correctly
print("First few records from the data:\n", data.head())

# Select the first 30 records
data = data.head(30)

# Ensure the data has the correct columns: Open, High, Low, Close, Volume
if not all(col in data.columns for col in ['Open', 'High', 'Low', 'Close', 'Volume']):
    raise ValueError("CSV data must have 'Open', 'High', 'Low', 'Close', and 'Volume' columns.")

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
    
    # MACD line is the difference between the short and long EMAs
    macd_line = fast_ema - slow_ema
    
    # Signal line is the EMA of the MACD line
    signal_line = macd_line.ewm(span=signal_period, min_periods=1).mean()  # Use min_periods=1 to avoid NaNs
    
    # Histogram is the difference between the MACD and Signal lines
    histogram = macd_line - signal_line
    
    return macd_line, signal_line, histogram

# Apply the custom functions to calculate RSI and MACD
data['RSI'] = calculate_rsi(data, window=14)
data['MACD'], data['Signal_Line'], data['Histogram'] = calculate_macd(data)

# Drop rows with NaN values (e.g., the first 13 rows due to RSI calculation)
data.dropna(inplace=True)

# Check for NaN values in the mock data
if data.isnull().values.any():
    print("Warning: NaN values found in mock data after preprocessing!")
else:
    print("Mock data has no NaN values after preprocessing.")

# Print the processed mock data
print("Processed data with calculated features (NaN handled):\n", data)

# Load the scaler and model (make sure these files exist and are accessible)
scaler = joblib.load('scaler_aud.pkl')  # Load the scaler used during training
model = load_model('audusd_fold_1.keras')  # Load the trained model

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

# Main function
if __name__ == "__main__":
    # Preprocess the mock data
    mock_sequences = preprocess_mock_data(data, scaler)
    
    # Check for NaN values in the input sequences
    if np.isnan(mock_sequences).any():
        print("Warning: NaN values found in input sequences!")
    else:
        print("Input sequences have no NaN values.")
    
    # Get predictions
    predictions = get_predictions(mock_sequences, model, scaler)
    
    print("Predicted Close Prices:", predictions)
