# Forex Predictions Server

This is the server-side component of the Forex Predictions project. It provides a RESTful API for managing currency pairs, storing and retrieving predictions, and running machine learning models to forecast forex prices. The server is built with FastAPI and uses a relational database via SQLAlchemy.

## Purpose

- Serve as the backend for forex prediction and analytics
- Store and manage currency pairs, periods, and prediction results
- Run LSTM-based models for price prediction, optionally incorporating sentiment analysis
- Provide endpoints for prediction, data download, and management

## Installation

1. **Clone the repository**
2. **Install dependencies**:

```bash
pip install -r requirements.txt
```

3. **Run the server**:

```bash
uvicorn app:app --reload
```

4. **Environment**: Python 3.9+ is recommended. Ensure you have the required models and database files in place.

## API Endpoints

### `GET /currency_pairs`
- **Description:** List all available currency pairs.
- **Response:**
  - `200 OK`: `["EURUSD", "GBPUSD", ...]`

### `POST /symbol`
- **Description:** Add a new currency pair.
- **Body:**
  ```json
  {
    "symbol": "EURUSD",
    "periods": ["d1", "h1"]
  }
  ```
- **Response:**
  - `200 OK`: `{ "message": "Currency pair added successfully" }`

### `POST /predict/{currency_pair}/{period}`
- **Description:** Get price predictions for a currency pair and period.
- **Path Params:**
  - `currency_pair`: e.g. `EURUSD`
  - `period`: e.g. `d1`, `h1`
- **Body:**
  ```json
  {
    "data": [
      { "Open": 1.1, "High": 1.2, "Low": 1.0, "Close": 1.15, "Volume": 1000 },
      ...
    ],
    "sentimentScore": 1.05 // optional
  }
  ```
- **Response:**
  - `200 OK`: 
    ```json
    {
      "LSTM_predictions": [ { "value": 1.16, "time": "2025-06-30T00:00:00" }, ... ],
      "LSTM_sentiment_predictions": [ { "value": 1.17, "time": "2025-06-30T00:00:00" }, ... ]
    }
    ```

### `GET /download-db`
- **Description:** Download the predictions database file.
- **Response:**
  - File download: `predictions.db`

## Project Structure

- `app.py` - Main FastAPI app and endpoints
- `prediction.py` - ML model loading and prediction logic
- `db/` - Database models and service functions
- `models/` - Trained ML models (not included in repo)

## Notes
- Ensure the `models/` directory contains the trained models and scalers for each currency pair and period.
- The database file (`predictions.db`) will be created automatically if not present.
- For production, configure environment variables and database settings as needed.

---

For more details, see the code and comments in each file.
