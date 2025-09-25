# backend/app/create_tables.py
from .database import Base, engine
from .models import Material, Supplier, Product  # importa las clases correctas

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

print("✅ Tablas creadas correctamente")
