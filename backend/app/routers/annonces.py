"""
Routes CRUD pour les annonces de disparition/retrouvaille.
Inclut la recherche filtrée, le rapprochement automatique et les statistiques publiques.
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from app.core.database import get_db
from app.models.models import Annonce, StatutAnnonceEnum, TypeAnnonceEnum, CategorieEnum
from app.schemas.schemas import AnnonceCreate, AnnonceOut, AnnonceUpdate, StatistiquesPubliques

router = APIRouter(prefix="/annonces", tags=["Annonces"])


@router.post("/", response_model=AnnonceOut, status_code=201)
async def creer_annonce(payload: AnnonceCreate, db: AsyncSession = Depends(get_db)):
    """
    Crée une nouvelle annonce. Passe par un statut 'en_attente' pour modération
    avant publication (surtout pour les disparitions de personnes).
    """
    annonce = Annonce(**payload.model_dump(), statut=StatutAnnonceEnum.EN_ATTENTE)
    db.add(annonce)
    await db.commit()
    await db.refresh(annonce)

    await suggerer_rapprochement(annonce, db)
    return annonce


@router.get("/", response_model=list[AnnonceOut])
async def lister_annonces(
    type_annonce: TypeAnnonceEnum | None = None,
    categorie: CategorieEnum | None = None,
    ville: str | None = None,
    recherche: str | None = None,
    page: int = Query(default=1, ge=1),
    taille_page: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Liste les annonces publiées avec filtres optionnels (catégorie, ville, mot-clé)."""
    stmt = select(Annonce).where(Annonce.statut == StatutAnnonceEnum.PUBLIEE)

    if type_annonce:
        stmt = stmt.where(Annonce.type_annonce == type_annonce)
    if categorie:
        stmt = stmt.where(Annonce.categorie == categorie)
    if ville:
        stmt = stmt.where(Annonce.ville.ilike(f"%{ville}%"))
    if recherche:
        motif = f"%{recherche}%"
        stmt = stmt.where(or_(Annonce.titre.ilike(motif), Annonce.description.ilike(motif)))

    stmt = stmt.order_by(Annonce.date_creation.desc())
    stmt = stmt.offset((page - 1) * taille_page).limit(taille_page)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{annonce_id}", response_model=AnnonceOut)
async def obtenir_annonce(annonce_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    annonce = await db.get(Annonce, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")
    annonce.vues += 1
    await db.commit()
    await db.refresh(annonce)
    return annonce


@router.patch("/{annonce_id}", response_model=AnnonceOut)
async def modifier_annonce(annonce_id: uuid.UUID, payload: AnnonceUpdate, db: AsyncSession = Depends(get_db)):
    annonce = await db.get(Annonce, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")

    for champ, valeur in payload.model_dump(exclude_unset=True).items():
        setattr(annonce, champ, valeur)

    await db.commit()
    await db.refresh(annonce)
    return annonce


@router.get("/statistiques/publiques", response_model=StatistiquesPubliques)
async def statistiques_publiques(db: AsyncSession = Depends(get_db)):
    """Statistiques affichées publiquement pour la crédibilité de la plateforme."""
    total = await db.scalar(select(func.count(Annonce.id)))
    resolues = await db.scalar(
        select(func.count(Annonce.id)).where(Annonce.statut == StatutAnnonceEnum.RESOLUE)
    )
    taux = round((resolues / total) * 100, 1) if total else 0.0

    par_categorie = {}
    result = await db.execute(
        select(Annonce.categorie, func.count(Annonce.id)).group_by(Annonce.categorie)
    )
    for cat, count in result.all():
        par_categorie[cat.value] = count

    return StatistiquesPubliques(
        total_annonces=total or 0,
        total_resolues=resolues or 0,
        taux_reussite=taux,
        annonces_par_categorie=par_categorie,
    )


async def suggerer_rapprochement(annonce: Annonce, db: AsyncSession) -> list[uuid.UUID]:
    """
    Algorithme simple de rapprochement automatique : quand une annonce est créée,
    cherche des annonces du type opposé (disparition <-> retrouve), même catégorie,
    même ville, créées récemment, avec des mots-clés communs dans le titre/description.
    Version basique par mots-clés ; évoluable vers un matching sémantique (embeddings).
    """
    type_oppose = (
        TypeAnnonceEnum.RETROUVE
        if annonce.type_annonce == TypeAnnonceEnum.DISPARITION
        else TypeAnnonceEnum.DISPARITION
    )

    mots_cles = [m for m in annonce.titre.split() if len(m) > 3][:5]
    conditions = [Annonce.description.ilike(f"%{m}%") for m in mots_cles] or [Annonce.id == annonce.id]

    stmt = select(Annonce).where(
        and_(
            Annonce.type_annonce == type_oppose,
            Annonce.categorie == annonce.categorie,
            Annonce.ville.ilike(f"%{annonce.ville}%"),
            Annonce.statut == StatutAnnonceEnum.PUBLIEE,
            or_(*conditions),
        )
    ).limit(5)

    result = await db.execute(stmt)
    candidats = result.scalars().all()
    return [c.id for c in candidats]
