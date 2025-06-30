# LSTM Forex Price Prediction

This project implements a deep learning pipeline for predicting Forex currency pair prices using LSTM neural networks. It includes data preprocessing, feature engineering with technical indicators, model training with K-Fold cross-validation, and performance evaluation.

## Project Structure

- `main.py` — Entry point for training models on selected currency pairs.
- `model/`
  - `model.py` — Defines the LSTM model architecture.
  - `preprocess.py` — Data loading, feature engineering (RSI, MACD), normalization, and sequence creation.
  - `train.py` — Handles model training, cross-validation, evaluation, and saving results.
- `data/` — Contains historical Forex data in CSV format, organized by timeframe (`D1`, `H1`, `H4`).
- `stats/` — Stores evaluation results and plots for each symbol and fold.
- `requirements.txt` — Python dependencies.

## Data Preparation

- Place your historical Forex data in the `data/` directory, organized by timeframe and symbol (e.g., `data/D1/EURUSD_D1.csv`).
- Each CSV should have columns: `Time, Open, High, Low, Close, Volume` (no header row).

## Features & Preprocessing

- Fills missing values.
- Adds technical indicators: RSI and MACD.
- Normalizes features using `MinMaxScaler` (scaler saved for each symbol).
- Creates sliding window sequences for LSTM input.

## Model Training

- LSTM model with two layers and dropout for regularization.
- 5-fold cross-validation for robust evaluation.
- Metrics: MSE, RMSE, MAE, Direction Accuracy, MAPE, R².
- Saves best model and fold-wise plots/statistics in the `stats/` directory.

## Usage

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Edit `main.py`:**
   - Add the desired symbols to the `symbols` list.
3. **Run training:**
   ```bash
   python main.py
   ```

## Output

- Trained models and scalers saved per symbol.
- Evaluation statistics and prediction plots for each fold in `stats/<SYMBOL>/`.

## Requirements

- Python 3.8+
- See `requirements.txt` for package list.

## Notes

- Data files must be present and correctly formatted for each symbol and timeframe.
- The code is modular and can be extended for other timeframes or additional features.

## License

This project is for educational and research purposes.
