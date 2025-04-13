from model.train import train_lstm_model

if __name__ == "__main__":
    print("Training LSTM model...")
    train_lstm_model('GBPUSD', 'D1')
