"use client";
import Link from "next/link";

import { useEffect, useState } from "react";

type TypeAnnonce = "disparition" | "retrouve";

interface Annonce {
  id: string;
  type_annonce: TypeAnnonce;
  categorie: string;
  titre: string;
  description: string;
  nom_personne: string | null;
  ville: string;
  commune: string | null;
  date_creation: string;
  photos_urls: string[];
}

interface Stats {
  total_annonces: number;
  total_resolues: number;
  taux_reussite: number;
  annonces_par_categorie: Record<string, number>;
}

const categories = [
  { key: "personne", label: "Personnes", icon: "👤" },
  { key: "document", label: "Documents", icon: "📄" },
  { key: "electronique", label: "Électronique", icon: "📱" },
  { key: "vehicule", label: "Véhicules", icon: "🚗" },
  { key: "animal", label: "Animaux", icon: "🐾" },
  { key: "bijou", label: "Bijoux", icon: "💍" },
];

function getCategoryIcon(category: string) {
  const categoryFound = categories.find((item) => item.key === category);
  return categoryFound?.icon ?? "📦";
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const differenceMs = now.getTime() - date.getTime();
  const differenceHours = Math.floor(differenceMs / (1000 * 60 * 60));
  const differenceDays = Math.floor(differenceHours / 24);

  if (differenceHours < 1) {
    return "À l'instant";
  }

  if (differenceHours < 24) {
    return `Il y a ${differenceHours} h`;
  }

  if (differenceDays === 1) {
    return "Il y a 1 jour";
  }

  return `Il y a ${differenceDays} jours`;
}

export default function Home() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [annoncesResponse, statsResponse] = await Promise.all([
          fetch(`${API_URL}/annonces/`),
          fetch(`${API_URL}/annonces/statistiques/publiques`),
        ]);

        if (!annoncesResponse.ok || !statsResponse.ok) {
          throw new Error("Impossible de charger les données.");
        }

        const annoncesData: Annonce[] = await annoncesResponse.json();
        const statsData: Stats = await statsResponse.json();

        setAnnonces(annoncesData);
        setStats(statsData);
      } catch (err) {
        console.error(err);
        setError(
          "Impossible de joindre l'API. Vérifie que Docker et le backend FastAPI sont démarrés."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [API_URL]);

  const filteredAnnonces = annonces.filter((annonce) => {
    const text = `${annonce.titre} ${annonce.description} ${annonce.ville} ${annonce.commune ?? ""}`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesCategory = category === "" || annonce.categorie === category;
    const matchesCity =
      city === "" || annonce.ville.toLowerCase() === city.toLowerCase();

    return matchesSearch && matchesCategory && matchesCity;
  });

  function scrollToAnnonces() {
    document
      .getElementById("annonces")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-extrabold text-white shadow-lg shadow-orange-500/25">
              R
            </div>

            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Retrouv<span className="text-orange-500">CI</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <button
              type="button"
              onClick={scrollToAnnonces}
              className="transition hover:text-orange-500"
            >
              Annonces
            </button>

            <a href="#comment-ca-marche" className="transition hover:text-orange-500">
              Comment ça marche
            </a>

            <a href="#statistiques" className="transition hover:text-orange-500">
              Statistiques
            </a>
          </nav>

          <Link
  href="/signaler"
  className="rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
>
  Signaler un cas
</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-300">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-40 left-1/2 h-96 w-96 rounded-full bg-orange-950/10" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
          <div className="max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Plateforme citoyenne en Côte d'Ivoire
            </span>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
              Chaque disparition compte.
              <br />
              Chaque retrouvaille aussi.
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
              Signalez une personne ou un objet disparu. Consultez les avis de
              recherche et aidez la communauté ivoirienne à retrouver ce qui
              compte.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
  href="/signaler"
  className="rounded-2xl bg-white px-7 py-4 text-center font-bold text-orange-600 shadow-xl transition hover:scale-[1.02] hover:bg-orange-50"
>
  🚨 Signaler une disparition
</Link>

              <Link
  href="/retrouver"
  className="rounded-2xl bg-slate-950 px-7 py-4 text-center font-bold text-white shadow-xl transition hover:scale-[1.02] hover:bg-slate-800"
>
  ✅ J&apos;ai retrouvé quelque chose
</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recherche */}
      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-5 md:px-8">
        <div className="grid gap-3 rounded-2xl bg-white p-3 shadow-2xl shadow-slate-300/40 md:grid-cols-[1fr_180px_160px_auto]">
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <span aria-hidden="true">🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Nom, objet, lieu..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="">Toutes catégories</option>
            {categories.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
          >
            <option value="">Toutes les villes</option>
            <option value="Abidjan">Abidjan</option>
            <option value="Bouaké">Bouaké</option>
            <option value="Yamoussoukro">Yamoussoukro</option>
            <option value="San-Pédro">San-Pédro</option>
          </select>

          <button
            type="button"
            onClick={scrollToAnnonces}
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Rechercher
          </button>
        </div>
      </section>

      {/* Statistiques */}
      <section id="statistiques" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        {loading ? (
          <p className="text-center text-slate-500">
            Chargement des statistiques…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <StatCard
              value={stats?.total_annonces ?? 0}
              label="Annonces publiées"
              color="text-orange-500"
            />

            <StatCard
              value={stats?.total_resolues ?? 0}
              label="Retrouvailles réussies"
              color="text-emerald-500"
            />

            <StatCard
              value={`${stats?.taux_reussite ?? 0}%`}
              label="Taux de réussite"
              color="text-slate-900"
            />

            <StatCard
              value={Object.keys(stats?.annonces_par_categorie ?? {}).length}
              label="Catégories actives"
              color="text-slate-900"
            />
          </div>
        )}
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-7xl px-5 pb-10 md:px-8">
        <h2 className="text-2xl font-extrabold md:text-3xl">
          Parcourir par catégorie
        </h2>
        <p className="mt-2 text-slate-500">
          Accédez rapidement aux avis qui vous intéressent.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setCategory(item.key);
                scrollToAnnonces();
              }}
              className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
            >
              <span className="text-3xl">{item.icon}</span>
              <p className="mt-3 text-sm font-bold text-slate-800">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {stats?.annonces_par_categorie?.[item.key] ?? 0} annonce(s)
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Annonces */}
      <section id="annonces" className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">
              Annonces récentes
            </h2>
            <p className="mt-2 text-slate-500">
              Les derniers signalements publiés par la communauté.
            </p>
          </div>

          <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
            {filteredAnnonces.length} résultat(s)
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Chargement des annonces…
          </p>
        ) : filteredAnnonces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">🔍</p>
            <h3 className="mt-4 text-lg font-bold">Aucune annonce trouvée</h3>
            <p className="mt-2 text-sm text-slate-500">
              Modifie tes filtres ou publie le premier signalement.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnonces.slice(0, 9).map((annonce) => (
              <article
                key={annonce.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-6xl">
                  {getCategoryIcon(annonce.categorie)}
                </div>

                <div className="p-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                      annonce.type_annonce === "disparition"
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {annonce.type_annonce === "disparition"
                      ? "DISPARITION"
                      : "RETROUVÉ"}
                  </span>

                  <h3 className="mt-4 text-lg font-extrabold text-slate-900">
                    {annonce.titre}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {annonce.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-400">
                    <span>
                      📍 {annonce.ville}
                      {annonce.commune ? `, ${annonce.commune}` : ""}
                    </span>
                    <span>{formatRelativeTime(annonce.date_creation)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <h2 className="text-center text-2xl font-extrabold md:text-3xl">
            Comment ça marche
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              number="1"
              title="Signalez"
              description="Décrivez une personne ou un objet perdu, ajoutez une photo et précisez la ville ou la commune."
            />
            <Step
              number="2"
              title="Diffusez"
              description="Partagez rapidement votre annonce avec vos proches et sur les réseaux sociaux."
            />
            <Step
              number="3"
              title="Retrouvez"
              description="La communauté consulte les annonces et vous aide à établir un contact lorsque quelque chose correspond."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-5 text-center md:px-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 font-extrabold text-white">
              R
            </div>
            <span className="text-lg font-extrabold text-white">
              Retrouv<span className="text-orange-500">CI</span>
            </span>
          </div>

          <p className="mt-4 text-sm">
            Une initiative citoyenne pour faciliter les retrouvailles en Côte
            d&apos;Ivoire.
          </p>

          <p className="mt-6 text-xs text-slate-500">
            © 2026 RetrouvCI. Tous droits réservés.
          </p>
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
      <p className={`text-3xl font-extrabold md:text-4xl ${color}`}>{value}</p>
      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-extrabold text-orange-600">
        {number}
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}