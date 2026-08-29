"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Status =
  | "en_attente"
  | "publiee"
  | "contact_etabli"
  | "resolue"
  | "rejetee"
  | "archivee";

interface Annonce {
  id: string;
  type_annonce: "disparition" | "retrouve";
  categorie: string;
  statut: Status;
  titre: string;
  description: string;
  nom_personne: string | null;
  age_approx: number | null;
  ville: string;
  commune: string | null;
  lieu_precis: string | null;
  date_evenement: string;
  contact_telephone: string;
  contact_whatsapp: string | null;
  date_creation: string;
  vues: number;
}

const statusLabels: Record<Status, string> = {
  en_attente: "En attente",
  publiee: "Publiée",
  contact_etabli: "Contact établi",
  resolue: "Résolue",
  rejetee: "Rejetée",
  archivee: "Archivée",
};

const statusStyles: Record<Status, string> = {
  en_attente: "bg-amber-100 text-amber-800",
  publiee: "bg-blue-100 text-blue-800",
  contact_etabli: "bg-violet-100 text-violet-800",
  resolue: "bg-emerald-100 text-emerald-800",
  rejetee: "bg-red-100 text-red-800",
  archivee: "bg-slate-200 text-slate-700",
};

const categoryIcons: Record<string, string> = {
  personne: "👤",
  document: "📄",
  electronique: "📱",
  vehicule: "🚗",
  animal: "🐾",
  bijou: "💍",
  autre: "📦",
};

export default function AdminPage() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"toutes" | Status>(
    "en_attente"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function loadAnnonces() {
    try {
      setLoading(true);
      setError("");

      const url =
        selectedStatus === "toutes"
          ? `${API_URL}/annonces/?inclure_toutes=true`
          : `${API_URL}/annonces/?inclure_toutes=true&statut=${selectedStatus}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Impossible de récupérer les annonces.");
      }

      const data = await response.json();
      setAnnonces(data);
    } catch (err) {
      console.error(err);
      setError(
        "Impossible de charger les annonces. Vérifie que FastAPI est bien démarré."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("retrouvci_admin_token");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    loadAnnonces();
  }, [selectedStatus, router]);

  async function updateStatus(id: string, statut: Status) {
    const label = statusLabels[statut].toLowerCase();

    const confirmed = window.confirm(
      `Confirmer le changement de statut vers : ${label} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(id);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/annonces/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("retrouvci_admin_token")}`,
        },
        body: JSON.stringify({ statut }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("retrouvci_admin_token");
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Impossible de mettre à jour cette annonce."
        );
      }

      setMessage(`Annonce mise à jour : ${statusLabels[statut]}.`);

      setAnnonces((previous) =>
        previous.map((annonce) =>
          annonce.id === id ? { ...annonce, statut: data.statut } : annonce
        )
      );

      if (selectedStatus !== "toutes" && selectedStatus !== statut) {
        setAnnonces((previous) =>
          previous.filter((annonce) => annonce.id !== id)
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la mise à jour."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function deleteAnnonce(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement cette annonce ? Cette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(id);
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/annonces/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("retrouvci_admin_token")}`,
        },
      });

      const data = await response.json();
      console.log("DELETE response:", {
  status: response.status,
  statusText: response.statusText,
  data,
});

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("retrouvci_admin_token");
        router.replace("/admin/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Impossible de supprimer cette annonce."
        );
      }

      setMessage("Annonce supprimée définitivement.");

      setAnnonces((previous) =>
        previous.filter((annonce) => annonce.id !== id)
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la suppression."
      );
    } finally {
      setUpdatingId("");
    }
  }

  function handleLogout() {
    localStorage.removeItem("retrouvci_admin_token");
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-lg font-extrabold">
              R
            </div>

            <div>
              <p className="font-extrabold">
                Retrouv<span className="text-orange-500">CI</span>
              </p>
              <p className="text-xs text-slate-400">
                Espace de modération
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-slate-800 sm:inline-flex"
            >
              ← Voir le site
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">
              ADMINISTRATION
            </span>

            <h1 className="mt-4 text-3xl font-extrabold">
              Modération des annonces
            </h1>

            <p className="mt-2 text-slate-600">
              Valide les annonces fiables avant leur publication publique.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnnonces}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            ↻ Actualiser
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <FilterButton
            active={selectedStatus === "en_attente"}
            label="En attente"
            onClick={() => setSelectedStatus("en_attente")}
          />

          <FilterButton
            active={selectedStatus === "publiee"}
            label="Publiées"
            onClick={() => setSelectedStatus("publiee")}
          />

          <FilterButton
            active={selectedStatus === "resolue"}
            label="Résolues"
            onClick={() => setSelectedStatus("resolue")}
          />

          <FilterButton
            active={selectedStatus === "rejetee"}
            label="Rejetées"
            onClick={() => setSelectedStatus("rejetee")}
          />

          <FilterButton
            active={selectedStatus === "toutes"}
            label="Toutes"
            onClick={() => setSelectedStatus("toutes")}
          />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500">
          {loading
            ? "Chargement des annonces..."
            : `${annonces.length} annonce(s) dans : ${
                selectedStatus === "toutes"
                  ? "Toutes"
                  : statusLabels[selectedStatus]
              }`}
        </p>

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-slate-500">
            Chargement des annonces…
          </div>
        ) : annonces.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <p className="text-5xl">📭</p>
            <h2 className="mt-5 text-xl font-extrabold">
              Aucune annonce dans cette catégorie
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Les nouveaux signalements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {annonces.map((annonce) => {
              const isUpdating = updatingId === annonce.id;

              return (
                <article
                  key={annonce.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                        {categoryIcons[annonce.categorie] ?? "📦"}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                              annonce.type_annonce === "disparition"
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            {annonce.type_annonce === "disparition"
                              ? "DISPARITION"
                              : "RETROUVÉ"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles[annonce.statut]}`}
                          >
                            {statusLabels[annonce.statut]}
                          </span>
                        </div>

                        <h2 className="mt-3 text-lg font-extrabold">
                          {annonce.titre}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {annonce.description}
                    </p>

                    <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                      <p>
                        <span className="font-bold text-slate-800">Lieu : </span>
                        {annonce.ville}
                        {annonce.commune ? `, ${annonce.commune}` : ""}
                      </p>

                      <p>
                        <span className="font-bold text-slate-800">
                          Téléphone :{" "}
                        </span>
                        {annonce.contact_telephone}
                      </p>

                      {annonce.nom_personne && (
                        <p>
                          <span className="font-bold text-slate-800">
                            Personne :{" "}
                          </span>
                          {annonce.nom_personne}
                          {annonce.age_approx
                            ? ` (${annonce.age_approx} ans)`
                            : ""}
                        </p>
                      )}

                      <p>
                        <span className="font-bold text-slate-800">
                          Créée le :{" "}
                        </span>
                        {new Date(annonce.date_creation).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    </div>

                    <p className="break-all text-xs text-slate-400">
                      Référence : {annonce.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-slate-50 p-5">
                    {annonce.statut === "en_attente" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(annonce.id, "publiee")
                          }
                          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                          ✓ Publier
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(annonce.id, "rejetee")
                          }
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          ✕ Rejeter
                        </button>
                      </>
                    )}

                    {annonce.statut === "publiee" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(annonce.id, "contact_etabli")
                          }
                          className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-600 disabled:opacity-50"
                        >
                          Contact établi
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(annonce.id, "resolue")
                          }
                          className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                          ✓ Marquer résolue
                        </button>
                      </>
                    )}

                    {annonce.statut === "contact_etabli" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(annonce.id, "resolue")}
                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                      >
                        ✓ Confirmer la résolution
                      </button>
                    )}

                    {(annonce.statut === "rejetee" ||
                      annonce.statut === "archivee") && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(annonce.id, "publiee")}
                        className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
                      >
                        Republier
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => deleteAnnonce(annonce.id)}
                      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      🗑 Supprimer
                    </button>

                    {isUpdating && (
                      <span className="self-center text-sm font-medium text-slate-500">
                        Mise à jour…
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
          : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-600"
      }`}
    >
      {label}
    </button>
  );
}