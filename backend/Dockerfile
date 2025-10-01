# Imagen base de Python
FROM python:3.11-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar requirements primero (para aprovechar cache)
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Exponer puerto (Render usará $PORT automáticamente)
EXPOSE 8000

# Arrancar FastAPI con Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
