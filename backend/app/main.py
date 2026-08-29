"""
Point d'entrée de l'API RetrouvCI.
Plateforme de signalement de disparitions/retrouvailles de personnes et d'objets en Côte d'Ivoire.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.core.config import get_settings
from app.routers import auth, annonces

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="API pour la plateforme citoyenne de signalement de disparitions et retrouvailles en Côte d'Ivoire.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(annonces.router)


@app.get("/", tags=["Santé"])
async def racine():
    return {"message": "Bienvenue sur l'API RetrouvCI", "statut": "opérationnel"}


@app.get("/sante", tags=["Santé"])
async def verification_sante():
    return {"statut": "ok"}



