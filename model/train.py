import numpy as np
from sklearn.model_selection import KFold
from keras.models import load_model
from model.model import create_lstm_model
from model.preprocess import preprocess_data
from sklearn.metrics import mean_squared_error, mean_absolute_error
import matplotlib.pyplot as plt
import math


data_directory = r'C:\disk\uni\project\data'

# Load and preprocess data from the folder
X, y, scaler = preprocess_data(data_directory)

# Initialize K-fold Cross Validation
kf = KFold(n_splits=5, shuffle=False)

mse_scores = []
rmse_scores = []
mae_scores = []

# K-Fold Cross Validation
for train_index, test_index in kf.split(X):
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

    plt.figure(figsize=(12, 6))
    plt.plot(y_test_rescaled, color='blue', label='True Values')
    plt.plot(y_pred_rescaled, color='red', label='Predictions')
    plt.title(f'True vs Predicted Close Prices (Fold {len(mse_scores)})')
    plt.xlabel('Time')
    plt.ylabel('Close Price')
    plt.legend()
    plt.show()

    model.save(f'd1_fold_{len(mse_scores)}.keras')

print(f'Average MSE: {np.mean(mse_scores)}')
print(f'Average RMSE: {np.mean(rmse_scores)}')
print(f'Average MAE: {np.mean(mae_scores)}')
