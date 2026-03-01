from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import categories, products, orders, uploads, settings, reports

# Crea las tablas de datos en Postgres
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jaffs Lomos API")

# Setup CORS (Importante para permitir llamadas desde localhost frontend/admin React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: Limitar esto al servidor en Producción.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(uploads.router)
app.include_router(settings.router)
app.include_router(reports.router)

# Sirve los archivos estáticos de forma pública (Las imágenes cargadas)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "API de Jaffs Lomos - Sistemas Inicializados"}
