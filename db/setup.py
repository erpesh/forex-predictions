from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Create an SQLite database file in the same directory as the project
SQLALCHEMY_DATABASE_URL = "sqlite:///./predictions.db"

# Create the database engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Create a session local to interact with the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)
