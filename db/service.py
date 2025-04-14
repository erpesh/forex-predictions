from sqlalchemy.orm import Session
from datetime import datetime
from db import models

# Get currency pair by name and check if enabled
def get_currency_pair(db: Session, currency_pair_name: str):
    return db.query(models.CurrencyPair).filter(
        models.CurrencyPair.name == currency_pair_name,
        models.CurrencyPair.enabled == '1'
    ).first()
    
# Get all enabled currency pairs
def get_all_currency_pairs(db: Session):
    return db.query(models.CurrencyPair).filter(
        models.CurrencyPair.enabled == '1'
    ).all()

# Get period by name and check if enabled
def get_period(db: Session, period_name: str):
    return db.query(models.Period).filter(
        models.Period.name == period_name,
        models.Period.enabled == '1'
    ).first()
    
# Get prediction model by name and check if enabled
def get_prediction_model(db: Session, model_name: str):
    return db.query(models.PredictionModel).filter(
        models.PredictionModel.name == model_name,
        models.PredictionModel.enabled == '1'
    ).first()

# Get prediction by date
def get_prediction_by_date(db: Session, currency_pair_id: int, period_id: int, model_id: int, match_date: datetime):
    return db.query(models.Prediction).filter(
        models.Prediction.currency_pair_id == currency_pair_id,
        models.Prediction.period_id == period_id,
        models.Prediction.prediction_model_id == model_id,
        models.Prediction.date == match_date
    ).first()
    
# Get N predictions by currency pair, period and model using period as offset
def get_n_predictions(db: Session, currency_pair_id: int, period_id: int, model_id: int, start_date: datetime, n: int):
    return db.query(models.Prediction).filter(
        models.Prediction.currency_pair_id == currency_pair_id,
        models.Prediction.period_id == period_id,
        models.Prediction.prediction_model_id == model_id,
        models.Prediction.date >= start_date
    ).order_by(models.Prediction.date).limit(n).all()
    
def get_all_past_predictions(db: Session, currency_pair_id: int, period_id: int, model_id: int, last_date: datetime):
    return db.query(models.Prediction).filter(
        models.Prediction.currency_pair_id == currency_pair_id,
        models.Prediction.period_id == period_id,
        models.Prediction.prediction_model_id == model_id,
        models.Prediction.date < last_date
    ).order_by(models.Prediction.date).all()

# Update prediction
def update_prediction(db: Session, existing_prediction, new_value: float, last_live_value: float):
    existing_prediction.value = new_value
    existing_prediction.last_live_value = last_live_value
    db.commit()
    db.refresh(existing_prediction)
    return existing_prediction

# Create a new prediction
def create_prediction(db: Session, currency_pair_id: int, period_id: int, prediction_model_id: int, value: float, last_live_value: float, match_date: datetime):
    new_prediction = models.Prediction(
        currency_pair_id=currency_pair_id,
        period_id=period_id,
        prediction_model_id=prediction_model_id,
        value=value,
        last_live_value=last_live_value,
        date=match_date
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    return new_prediction

# Create N predictions with start date and period
def create_n_predictions(db: Session, currency_pair_id: int, period_id: int, prediction_model_id: int, values: list, last_live_value: float, match_dates: list):
    predictions = []
    for value, last_live_value, match_date in zip(values, last_live_values, match_dates):
        new_prediction = models.Prediction(
            currency_pair_id=currency_pair_id,
            period_id=period_id,
            prediction_model_id=prediction_model_id,
            value=value,
            last_live_value=last_live_value,
            date=match_date
        )
        db.add(new_prediction)
        predictions.append(new_prediction)
    db.commit()
    return predictions
