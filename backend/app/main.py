from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.routers import auth, materials, products, purchases, suppliers, kardex
from app.database import Base, engine
from app import models   # para registrar los modelos


# Crear aplicación FastAPI
app = FastAPI()

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# Configuración del middleware CORS
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://pyglass-frontend.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(products.router)
app.include_router(purchases.router)
app.include_router(suppliers.router)
app.include_router(kardex.router)

# Ruta principal
@app.get("/")
def root():
    return {"message": "PyGlass_Stock API funcionando 🚀"}


# Ruta para favicon
@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")
