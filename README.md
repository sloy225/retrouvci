# RetrouvCI 🇨🇮

**Plateforme citoyenne de signalement de disparitions et de retrouvailles en Côte d'Ivoire.**

RetrouvCI permet à chacun de signaler la disparition d'une personne ou d'un objet, et de publier les
retrouvailles pour reconnecter la communauté ivoirienne. L'objectif : réduire le temps entre une
disparition et sa résolution grâce à un signalement rapide, une diffusion virale (WhatsApp, réseaux
sociaux) et un système de rapprochement automatique entre annonces.

## ✨ Fonctionnalités

- **Signalement en 2 flux** : disparition (personne/objet) et retrouvaille, avec formulaire adaptatif.
- **Aucune inscription obligatoire** pour signaler ; compte optionnel pour suivre ses annonces.
- **Upload de photos multiples** avec galerie.
- **Géolocalisation** par ville/commune (optimisé pour Abidjan et ses communes).
- **Recherche et filtres** par catégorie, ville, mot-clé.
- **Rapprochement automatique** entre annonces "disparition" et "retrouvé" par mots-clés/catégorie/zone.
- **Statistiques publiques** (taux de réussite, total résolu) pour la crédibilité de la plateforme.
- **Partage direct** vers WhatsApp/Facebook en un clic.
- **Modération** des annonces sensibles avant publication.

## 🏗️ Architecture technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js (React) + TailwindCSS + shadcn/ui |
| Backend | FastAPI (Python 3.12, async) |
| Base de données | PostgreSQL + PostGIS |
| Auth | JWT (python-jose) + bcrypt |
| Conteneurisation | Docker & Docker Compose |
| CI/CD | GitHub Actions |

## 📂 Structure du projet

```
retrouvci/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, sécurité
│   │   ├── models/        # modèles SQLAlchemy
│   │   ├── schemas/       # schémas Pydantic
│   │   ├── routers/       # routes API (auth, annonces)
│   │   └── main.py        # point d'entrée FastAPI
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   └── index.html         # maquette de la page d'accueil (Tailwind)
└── docker-compose.yml
```

## 🚀 Démarrage rapide

### Avec Docker (recommandé)

```bash
git clone https://github.com/<ton-user>/retrouvci.git
cd retrouvci
cp backend/.env.example backend/.env
docker-compose up --build
```

L'API sera disponible sur `http://localhost:8000` (documentation Swagger sur `/docs`).

### Sans Docker (backend seul)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🗺️ Feuille de route

- [ ] Migration de la maquette HTML vers Next.js + composants shadcn/ui
- [ ] Upload de photos vers stockage cloud (Cloudinary / S3)
- [ ] Notifications push/email lors d'un rapprochement d'annonces
- [ ] Interface de modération pour administrateurs
- [ ] Amélioration du matching (embeddings sémantiques au lieu de mots-clés)
- [ ] Application mobile (React Native / Flutter)
- [ ] Intégration WhatsApp Business API pour signalement par message

## 🤝 Contribuer

Les contributions sont bienvenues. Merci d'ouvrir une issue avant de soumettre une pull request
importante pour discuter du changement proposé.

## 📄 Licence

MIT — libre d'utilisation et de modification.
