import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# Load data
def load_data(file_path):
    data = pd.read_csv(file_path, sep='\t')
    data['Time'] = pd.to_datetime(data['Time'], errors='coerce')
    data.set_index('Time', inplace=True)
    data.sort_index(inplace=True)
    return data

# Fill missing values
def fill_missing_values(data):
    data.fillna(method='ffill', inplace=True)
    return data

# Calculate RSI
def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Calculate MACD
def calculate_macd(data, fast_period=12, slow_period=26, signal_period=9):
    fast_ema = data['Close'].ewm(span=fast_period, min_periods=fast_period).mean()
    slow_ema = data['Close'].ewm(span=slow_period, min_periods=slow_period).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal_period, min_periods=signal_period).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

# Add technical indicators
def add_technical_indicators(data):
    data['RSI'] = calculate_rsi(data, window=14)
    data['MACD'], data['Signal_Line'], data['Histogram'] = calculate_macd(data)
    data.dropna(inplace=True)  # Drop rows with NaN values
    return data

# Normalize data
def normalize_data(data):
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data[['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']])
    data_normalized = pd.DataFrame(data_scaled, columns=['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram'], index=data.index)
    return data_normalized, scaler

# Create sequences
def create_sequences(data, seq_length=30):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        seq = data.iloc[i:i+seq_length][['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']].values
        label = data.iloc[i+seq_length]['Close']
        if np.isnan(seq).any() or np.isnan(label):
            continue
        sequences.append(seq)
        labels.append(label)
    return np.array(sequences), np.array(labels)

# Check for NaNs
def check_for_nans(data):
    print(data.isna().sum())

# Preprocess data
def preprocess_data(file_path, seq_length=30):
    data = load_data(file_path)
    data = fill_missing_values(data)
    data = add_technical_indicators(data)
    data_normalized, scaler = normalize_data(data)
    check_for_nans(data_normalized)
    X, y = create_sequences(data_normalized, seq_length)
    return X, y, scaler