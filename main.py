from model.train import train_lstm_model

if __name__ == "__main__":
    # Train the LSTM model for EUR/USD data
    print("Training LSTM model for EUR/USD...")
    train_lstm_model()


# import pandas as pd

# # Load the data
# data = pd.read_csv('data/eurusd.csv', sep='\t')  # Replace with your actual file path

# # Print the column names
# print(data.columns)