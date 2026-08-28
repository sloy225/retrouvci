"""
Routes d'authentification : inscription, connexion.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/inscription", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def inscription(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email.")

    user = User(
        nom_complet=payload.nom_complet,
        email=payload.email,
        telephone=payload.telephone,
        hashed_password=hash_password(payload.password),
        ville=payload.ville,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/connexion", response_model=Token)
async def connexion(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token)
