"""
Sché¬©mas Pydantic pour la validation des entrées/sorties de l'API.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.models.models import CategorieEnum, TypeAnnonceEnum, StatutAnnonceEnum


def strip_timezone(dt: datetime) -> datetime:
    """Supprime la timezone d'un datetime pour être compatible avec TIMESTAMP WITHOUT TIME ZONE."""
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


# ---------- USER ----------

class UserCreate(BaseModel):
    nom_complet: str = Field(min_length=2, max_length=150)
    email: EmailStr
    telephone: str = Field(min_length=8, max_length=20)
    password: str = Field(min_length=8)
    ville: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    nom_complet: str
    email: EmailStr
    telephone: str
    ville: str | None
    est_verifie: bool
    date_creation: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- ANNONCE ----------

class AnnonceBase(BaseModel):
    type_annonce: TypeAnnonceEnum
    categorie: CategorieEnum
    titre: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=10)  # assoupli de 20 à 10 caractères
    nom_personne: str | None = None
    age_approx: int | None = Field(default=None, ge=0, le=120)
    signes_distinctifs: str | None = None
    ville: str
    commune: str | None = None
    lieu_precis: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    date_evenement: datetime
    contact_telephone: str = Field(min_length=8, max_length=20)
    contact_whatsapp: str | None = None
    autoriser_contact_direct: bool = True

    @field_validator("date_evenement", mode="before")
    @classmethod
    def normalize_date_evenement(cls, value):
        if isinstance(value, datetime):
            return strip_timezone(value)
        return value


class AnnonceCreate(AnnonceBase):
    photos_urls: list[str] = Field(default_factory=list)


class AnnonceUpdate(BaseModel):
    statut: StatutAnnonceEnum | None = None
    description: str | None = None
    annonce_liee_id: uuid.UUID | None = None


class AnnonceOut(AnnonceBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    statut: StatutAnnonceEnum
    photos_urls: list[str]
    vues: int
    annonce_liee_id: uuid.UUID | None
    auteur_id: uuid.UUID | None
    date_creation: datetime
    date_maj: datetime


class AnnonceFiltre(BaseModel):
    type_annonce: TypeAnnonceEnum | None = None
    categorie: CategorieEnum | None = None
    ville: str | None = None
    recherche: str | None = None  # recherche full-text sur titre/description
    page: int = Field(default=1, ge=1)
    taille_page: int = Field(default=20, ge=1, le=100)


class StatistiquesPubliques(BaseModel):
    total_annonces: int
    total_resolues: int
    taux_reussite: float
    annonces_par_categorie: dict[str, int]
