import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import MinMaxScaler
import joblib

def load_data(data_directory: str, symbol: str, period: str):
    data_list = []
    
    # Walk through all subdirectories and files in the 'data' directory
    period_folder = os.path.join(data_directory, period)
    
    file_name = symbol + '_' + period + '.csv'
    file_path = os.path.join(period_folder, file_name)
    
    columns = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume']

    data = pd.read_csv(file_path, header=None, names=columns, sep=',')

    data['Time'] = pd.to_datetime(data['Time'], errors='coerce')

    data.set_index('Time', inplace=True)
    data.sort_index(inplace=True)

    currency_pair = file_name.split('_')[0]
    data['Currency'] = currency_pair
    data['Timeframe'] = period

    data_list.append(data)
    
    combined_data = pd.concat(data_list)
    print("Combined data head:", combined_data.head())  # Debug
    return combined_data

def fill_missing_values(data):
    data.fillna(method='ffill', inplace=True)
    return data

# Calculate RSI (Relative Strength Index)
def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

# Calculate MACD (Moving Average Convergence Divergence)
def calculate_macd(data, fast_period=12, slow_period=26, signal_period=9):
    fast_ema = data['Close'].ewm(span=fast_period, min_periods=fast_period).mean()
    slow_ema = data['Close'].ewm(span=slow_period, min_periods=slow_period).mean()
    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal_period, min_periods=signal_period).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram

# Add technical indicators to the data (RSI, MACD)
def add_technical_indicators(data):
    data['RSI'] = calculate_rsi(data, window=14)
    data['MACD'], data['Signal_Line'], data['Histogram'] = calculate_macd(data)
    data.dropna(inplace=True)  # Drop rows with NaN values
    return data

# Normalize the data using MinMaxScaler
def normalize_data(data):
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data[['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']])
    data_normalized = pd.DataFrame(data_scaled, columns=['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram'], index=data.index)
    
    joblib.dump(scaler, 'scaler.pkl') # Save the scaler for later use
    
    return data_normalized, scaler

# Create sequences for LSTM (with a sliding window approach)
import time

def create_sequences(data, seq_length=30):
    sequences = []
    labels = []
    total_rows = len(data) - seq_length
    start_time = time.time()
    
    for i in range(total_rows):
        seq = data.iloc[i:i+seq_length][['Open', 'High', 'Low', 'Close', 'Volume', 'RSI', 'MACD', 'Signal_Line', 'Histogram']].values
        label = data.iloc[i+seq_length]['Close']
        
        # Skip if any NaN is found
        if np.isnan(seq).any() or np.isnan(label):
            continue
        
        sequences.append(seq)
        labels.append(label)
        
        # Print progress every 10,000 rows
        if i % 10000 == 0:
            elapsed_time = time.time() - start_time
            print(f"Processed {i}/{total_rows} rows. Elapsed time: {elapsed_time:.2f} seconds.")
    
    print(f"Finished creating sequences. Total sequences: {len(sequences)}. Total time: {time.time() - start_time:.2f} seconds.")
    return np.array(sequences), np.array(labels)


def preprocess_data(data_directory: str, symbol: str, period: str, seq_length=30):
    data = load_data(data_directory, symbol, period)
    print("Data loaded. Shape:", data.shape)  # Debug
    
    data = fill_missing_values(data)
    print("After filling missing values. Shape:", data.shape)  # Debug
    
    data = add_technical_indicators(data)
    print("After adding technical indicators. Shape:", data.shape)  # Debug
    
    data_normalized, scaler = normalize_data(data)
    print("After normalization. Shape:", data_normalized.shape)  # Debug
    
    X, y = create_sequences(data_normalized, seq_length)
    print("Sequences created. X shape:", X.shape, "y shape:", y.shape)  # Debug
    
    return X, y, scaler
