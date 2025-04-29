import numpy as np
from sklearn.model_selection import KFold
from keras.models import load_model
from model.model import create_lstm_model
from model.preprocess import preprocess_data
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import math
import os

data_directory = r'C:\disk\uni\project\data'

def save_accuracy_stats(symbol, mse_scores, rmse_scores, mae_scores, direction_accuracies, mape_scores, r2_scores, best_model_score, best_model_fold):
    # Create directory for storing stats if it doesn't exist
    if not os.path.exists(symbol):
        os.makedirs(symbol)

    # Define the file path
    stats_file_path = os.path.join(symbol, 'accuracy_stats.txt')

    # Write the accuracy stats to the file
    with open(stats_file_path, 'w') as file:
        file.write(f'Accuracy Stats for {symbol}:\n')
        file.write(f'Average MSE: {np.mean(mse_scores)}\n')
        file.write(f'Average RMSE: {np.mean(rmse_scores)}\n')
        file.write(f'Average MAE: {np.mean(mae_scores)}\n')
        file.write(f'Average Direction Accuracy: {np.mean(direction_accuracies)}\n')
        file.write(f'Average MAPE: {np.mean(mape_scores)}\n')
        file.write(f'Average R²: {np.mean(r2_scores)}\n')
        file.write(f'Best Model from Fold {best_model_fold + 1} with MSE: {best_model_score}\n')
        file.write("\n")

        # Store fold-wise accuracy stats
        file.write("Fold-wise Accuracy Stats:\n")
        for i in range(len(mse_scores)):
            file.write(f"Fold {i + 1} - MSE: {mse_scores[i]}, RMSE: {rmse_scores[i]}, MAE: {mae_scores[i]}, Direction Accuracy: {direction_accuracies[i]}, MAPE: {mape_scores[i]}, R²: {r2_scores[i]}\n")
        file.write("\n")

def train_lstm_model(symbol: str, period: str):
    if not os.path.exists(symbol):
        os.makedirs(symbol)
    
    X, y, scaler = preprocess_data(data_directory, symbol, period)

    # Initialize K-fold Cross Validation
    kf = KFold(n_splits=5, shuffle=False)

    mse_scores = []
    rmse_scores = []
    mae_scores = []
    direction_accuracies = []
    mape_scores = []
    r2_scores = []
    best_model = None
    best_model_score = float('inf')  # We will minimize this score

    # K-Fold Cross Validation
    for fold, (train_index, test_index) in enumerate(kf.split(X)):
        X_train, X_test = X[train_index], X[test_index]
        y_train, y_test = y[train_index], y[test_index]
        
        X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], X_train.shape[2]))
        X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], X_test.shape[2]))
        
        model = create_lstm_model((X_train.shape[1], X_train.shape[2]))
        
        history = model.fit(X_train, y_train, epochs=50, batch_size=32, verbose=1)
        
        mse = model.evaluate(X_test, y_test)
        mse_scores.append(mse)
        
        y_pred = model.predict(X_test)
        
        y_pred_rescaled = scaler.inverse_transform(np.hstack((X_test[:, -1, :-1], y_pred)))[:, -1]
        y_test_rescaled = scaler.inverse_transform(np.hstack((X_test[:, -1, :-1], y_test.reshape(-1, 1))))[:, -1]
        
        rmse = math.sqrt(mean_squared_error(y_test_rescaled, y_pred_rescaled))
        mae = mean_absolute_error(y_test_rescaled, y_pred_rescaled)
        
        rmse_scores.append(rmse)
        mae_scores.append(mae)

        # Direction accuracy
        direction_accuracy = np.mean(np.sign(y_pred_rescaled) == np.sign(y_test_rescaled))
        direction_accuracies.append(direction_accuracy)

        # MAPE
        mape = np.mean(np.abs((y_test_rescaled - y_pred_rescaled) / y_test_rescaled)) * 100
        mape_scores.append(mape)

        # R²
        r2 = r2_score(y_test_rescaled, y_pred_rescaled)
        r2_scores.append(r2)

        # Select the best model based on MSE, RMSE, or MAE
        if mse < best_model_score:
            best_model_score = mse
            best_model = model
            best_model_fold = fold  # Keep track of the fold
        
        # Plot predictions vs true values for each fold
        plt.figure(figsize=(12, 6))
        plt.plot(y_test_rescaled, color='blue', label='True Values')
        plt.plot(y_pred_rescaled, color='red', label='Predictions')
        plt.title(f'True vs Predicted Close Prices (Fold {fold + 1})')
        plt.xlabel('Time')
        plt.ylabel('Close Price')
        plt.legend()

        # Save the plot for the fold
        plt.savefig(f'{symbol}/Fold_{fold + 1}.png')
        plt.close()  # Close the plot after saving to avoid overlapping in the next iteration

    # Save accuracy stats to a file
    save_accuracy_stats(symbol, mse_scores, rmse_scores, mae_scores, direction_accuracies, mape_scores, r2_scores, best_model_score, best_model_fold)

    print(f'Average MSE: {np.mean(mse_scores)}')
    print(f'Average RMSE: {np.mean(rmse_scores)}')
    print(f'Average MAE: {np.mean(mae_scores)}')
    print(f'Average Direction Accuracy: {np.mean(direction_accuracies)}')
    print(f'Average MAPE: {np.mean(mape_scores)}')
    print(f'Average R²: {np.mean(r2_scores)}')

    # Save the best model
    best_model.save(f'{symbol}/model.keras')
    print(f"Best Model is from Fold {best_model_fold + 1} with MSE: {best_model_score}")
