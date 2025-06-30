from model.train import train_lstm_model

# List of symbols to train
symbols = [
    # 'AUDUSD',
    # 'EURGBP',
    # 'EURUSD',
    # 'GBPJPY',
    # 'GBPUSD',
    # 'NZDUSD',
    # 'USDCAD',
    # 'USDCHF',
]

if __name__ == "__main__":
    print("Training LSTM model...")
    for symbol in symbols:
        print(f"Training model for {symbol}...")
        train_lstm_model(symbol, 'D1')
