import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Variables de Clever Cloud MySQL
DB_HOST = os.getenv("MYSQL_ADDON_HOST")
DB_PORT = os.getenv("MYSQL_ADDON_PORT")
DB_NAME = os.getenv("MYSQL_ADDON_DB")
DB_USER = os.getenv("MYSQL_ADDON_USER")
DB_PASSWORD = os.getenv("MYSQL_ADDON_PASSWORD")

# URL de conexión
DATABASE_URL = f"mysql+mysqldb://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Crear el motor de conexión
engine = create_engine(DATABASE_URL)

# Sesión
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# Dependencia para inyectar sesión en los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
