import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Primero intentamos obtener la URI completa
DB_URI = os.getenv("MYSQL_ADDON_URI")

if DB_URI:
    # Render y Clever Cloud suelen dar "mysql://", pero SQLAlchemy necesita "mysql+mysqldb://"
    if DB_URI.startswith("mysql://"):
        DB_URI = DB_URI.replace("mysql://", "mysql+mysqldb://", 1)
    DATABASE_URL = DB_URI
else:
    # Usar variables individuales si no existe la URI
    DB_HOST = os.getenv("MYSQL_ADDON_HOST")
    DB_PORT = os.getenv("MYSQL_ADDON_PORT")  # valor por defecto
    DB_NAME = os.getenv("MYSQL_ADDON_DB")
    DB_USER = os.getenv("MYSQL_ADDON_USER")
    DB_PASSWORD = os.getenv("MYSQL_ADDON_PASSWORD")

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
