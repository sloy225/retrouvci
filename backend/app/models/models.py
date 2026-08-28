"""
Modèles SQLAlchemy pour RetrouvCI.

Deux entités principales :
- User : utilisateurs de la plateforme (optionnel pour signaler, requis pour suivre ses annonces)
- Annonce : le cœur de la plateforme, avec un type (personne/objet) et un statut (disparu/retrouve)

Utilise PostGIS (via GeoAlchemy2) pour la géolocalisation et le calcul de proximité.
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey, Boolean, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CategorieEnum(str, enum.Enum):
    PERSONNE = "personne"
    DOCUMENT = "document"
    ELECTRONIQUE = "electronique"
    VEHICULE = "vehicule"
    ANIMAL = "animal"
    BIJOU = "bijou"
    AUTRE = "autre"


class TypeAnnonceEnum(str, enum.Enum):
    DISPARITION = "disparition"
    RETROUVE = "retrouve"


class StatutAnnonceEnum(str, enum.Enum):
    EN_ATTENTE = "en_attente"       # en attente de modération
    PUBLIEE = "publiee"             # visible publiquement
    CONTACT_ETABLI = "contact_etabli"
    RESOLUE = "resolue"             # retrouvaille confirmée
    REJETEE = "rejetee"             # rejetée par la modération
    ARCHIVEE = "archivee"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom_complet: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    telephone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ville: Mapped[str | None] = mapped_column(String(100), nullable=True)
    est_verifie: Mapped[bool] = mapped_column(Boolean, default=False)  # ex: ONG/autorité vérifiée
    est_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    date_creation: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    annonces: Mapped[list["Annonce"]] = relationship(back_populates="auteur")


class Annonce(Base):
    __tablename__ = "annonces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    type_annonce: Mapped[TypeAnnonceEnum] = mapped_column(Enum(TypeAnnonceEnum), index=True)
    categorie: Mapped[CategorieEnum] = mapped_column(Enum(CategorieEnum), index=True)
    statut: Mapped[StatutAnnonceEnum] = mapped_column(
        Enum(StatutAnnonceEnum), default=StatutAnnonceEnum.EN_ATTENTE, index=True
    )

    titre: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)

    # Champs spécifiques "personne disparue"
    nom_personne: Mapped[str | None] = mapped_column(String(150), nullable=True)
    age_approx: Mapped[int | None] = mapped_column(nullable=True)
    signes_distinctifs: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Localisation
    ville: Mapped[str] = mapped_column(String(100), index=True)
    commune: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lieu_precis: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    date_evenement: Mapped[datetime] = mapped_column(DateTime)  # date de disparition/découverte
    photos_urls: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)

    contact_telephone: Mapped[str] = mapped_column(String(20))
    contact_whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    autoriser_contact_direct: Mapped[bool] = mapped_column(Boolean, default=True)

    vues: Mapped[int] = mapped_column(default=0)
    annonce_liee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("annonces.id"), nullable=True
    )  # rapprochement automatique disparition <-> retrouvé

    auteur_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    auteur: Mapped["User"] = relationship(back_populates="annonces")

    date_creation: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    date_maj: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
