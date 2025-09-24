from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, materials, products, purchases


app = FastAPI()

# Configuración del middleware CORS
origins = [
    "http://localhost",
    "http://localhost:5173",  # El puerto de tu frontend
    "http://127.0.0.1:5173", # La otra forma de escribirlo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los headers
)

# Incluir routers
app.include_router(auth.router)
app.include_router(materials.router)
app.include_router(products.router)
app.include_router(purchases.router)

@app.get("/")
def root():
    return {"message": "PyGlass_Stock API funcionando 🚀"}
