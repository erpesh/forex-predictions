import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base
from dotenv import load_dotenv
load_dotenv()

# Use an environment variable for the URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to database at {SQLALCHEMY_DATABASE_URL}")

# Create the engine (Neon requires SSL)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)
