from sqlalchemy import Integer, String, Float, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from typing import List, Optional

# Base class for all models
class Base:
    pass

# Declarative base class for SQLAlchemy models
Base = declarative_base(cls=Base)

class Period(Base):
    __tablename__ = "periods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, server_default="1")  # Store 1 for True and 0 for False
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # Use func.now() for server-side default
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())  # Auto-update timestamp

    currency_pairs: Mapped[List["CurrencyPair"]] = relationship("CurrencyPair", secondary="period_currency_pair")

class CurrencyPair(Base):
    __tablename__ = "currency_pairs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, server_default="1")  # Store 1 for True and 0 for False
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # Use func.now() for server-side default
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())  # Auto-update timestamp

    periods: Mapped[List["Period"]] = relationship("Period", secondary="period_currency_pair")

class PeriodCurrencyPair(Base):
    __tablename__ = "period_currency_pair"

    period_id: Mapped[int] = mapped_column(Integer, ForeignKey("periods.id"), primary_key=True)
    currency_pair_id: Mapped[int] = mapped_column(Integer, ForeignKey("currency_pairs.id"), primary_key=True)

class PredictionModel(Base):
    __tablename__ = "prediction_models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, server_default="1")  # Store 1 for True and 0 for False
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # Use func.now() for server-side default
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())  # Auto-update timestamp

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    currency_pair_id: Mapped[int] = mapped_column(Integer, ForeignKey("currency_pairs.id"))
    period_id: Mapped[int] = mapped_column(Integer, ForeignKey("periods.id"))
    prediction_model_id: Mapped[int] = mapped_column(Integer, ForeignKey("prediction_models.id"))
    value: Mapped[float] = mapped_column(Float)
    date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # Use func.now() for server-side default
    last_live_value: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())  # Use func.now() for server-side default
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())  # Auto-update timestamp

    currency_pair: Mapped["CurrencyPair"] = relationship("CurrencyPair")
    period: Mapped["Period"] = relationship("Period")
    prediction_model: Mapped["PredictionModel"] = relationship("PredictionModel")
