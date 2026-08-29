"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type TypeAnnonce = "disparition" | "retrouve";
type Categorie =
  | "personne"
  | "document"
  | "electronique"
  | "vehicule"
  | "animal"
  | "bijou"
  | "autre";

interface FormData {
  type_annonce: TypeAnnonce;
  categorie: Categorie;
  titre: string;
  description: string;
  nom_personne: string;
  age_approx: string;
  signes_distinctifs: string;
  ville: string;
  commune: string;
  lieu_precis: string;
  date_evenement: string;
  contact_telephone: string;
  contact_whatsapp: string;
  autoriser_contact_direct: boolean;
}

const initialFormData: FormData = {
  type_annonce: "disparition",
  categorie: "personne",
  titre: "",
  description: "",
  nom_personne: "",
  age_approx: "",
  signes_distinctifs: "",
  ville: "Abidjan",
  commune: "",
  lieu_precis: "",
  date_evenement: "",
  contact_telephone: "",
  contact_whatsapp: "",
  autoriser_contact_direct: true,
};

const communesAbidjan = [
  "Abobo",
  "Adjamé",
  "Anyama",
  "Attécoubé",
  "Bingerville",
  "Cocody",
  "Koumassi",
  "Marcory",
  "Plateau",
  "Port-Bouët",
  "Songon",
  "Treichville",
  "Yopougon",
];

const categories = [
  { value: "personne", label: "Personne", icon: "👤" },
  { value: "document", label: "Document", icon: "📄" },
  { value: "electronique", label: "Téléphone / Électronique", icon: "📱" },
  { value: "vehicule", label: "Véhicule", icon: "🚗" },
  { value: "animal", label: "Animal", icon: "🐾" },
  { value: "bijou", label: "Bijou", icon: "💍" },
  { value: "autre", label: "Autre objet", icon: "📦" },
];

export default function SignalerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  useEffect(() => {
  const type = searchParams.get("type");

  if (type === "disparition" || type === "retrouve") {
    setFormData((previous) => ({
      ...previous,
      type_annonce: type,
    }));
  }
}, [searchParams]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const isPersonne = formData.categorie === "personne";

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateStep(currentStep: number) {
    setError("");

    if (currentStep === 1) {
      if (!formData.type_annonce || !formData.categorie) {
        setError("Choisis le type et la catégorie de ton signalement.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.titre.trim().length < 5) {
        setError("Le titre doit contenir au moins 5 caractères.");
        return false;
      }

      if (formData.description.trim().length < 10) {
        setError("La description doit contenir au moins 10 caractères.");
        return false;
      }

      if (isPersonne && formData.nom_personne.trim().length < 2) {
        setError("Indique le nom de la personne recherchée ou retrouvée.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.ville.trim()) {
        setError("Indique au minimum la ville concernée.");
        return false;
      }

      if (!formData.date_evenement) {
        setError("Indique la date de disparition ou de retrouvaille.");
        return false;
      }
    }

    if (currentStep === 4) {
      if (formData.contact_telephone.trim().length < 8) {
        setError("Indique un numéro de téléphone valide.");
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((current) => Math.min(current + 1, 4));
    }
  }

  function previousStep() {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const payload = {
      type_annonce: formData.type_annonce,
      categorie: formData.categorie,
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      nom_personne: isPersonne ? formData.nom_personne.trim() || null : null,
      age_approx:
        isPersonne && formData.age_approx
          ? Number(formData.age_approx)
          : null,
      signes_distinctifs:
        formData.signes_distinctifs.trim() || null,
      ville: formData.ville.trim(),
      commune: formData.commune || null,
      lieu_precis: formData.lieu_precis.trim() || null,
      date_evenement: formData.date_evenement,
      contact_telephone: formData.contact_telephone.trim(),
      contact_whatsapp: formData.contact_whatsapp.trim() || null,
      autoriser_contact_direct: formData.autoriser_contact_direct,
      photos_urls: [],
    };

    try {
      const response = await fetch(`${API_URL}/annonces/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "Une erreur est survenue lors de l'envoi.";

        throw new Error(detail);
      }

      setCreatedId(data.id);
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer le signalement.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl md:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            ✓
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-emerald-600">
            Signalement envoyé
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-900">
            Merci pour votre signalement
          </h1>

          <p className="mt-4 leading-relaxed text-slate-600">
            Votre annonce a été enregistrée avec succès. Elle est actuellement
            en attente de modération avant sa publication sur RetrouvCI.
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-bold uppercase text-slate-400">
              Référence du signalement
            </p>
            <p className="mt-2 break-all font-mono text-sm text-slate-700">
              {createdId}
            </p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setFormData(initialFormData);
                setStep(1);
                setSuccess(false);
                setCreatedId("");
              }}
              className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              Faire un autre signalement
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-extrabold text-white">
              R
            </div>

            <span className="text-xl font-extrabold tracking-tight">
              Retrouv<span className="text-orange-500">CI</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-slate-600 transition hover:text-orange-500"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <div className="mb-8">
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700">
            SIGNALER UN CAS
          </span>

          <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">
            Créer un signalement
          </h1>

          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Remplissez les informations essentielles. Votre annonce sera
            examinée avant publication afin de protéger la communauté.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-5 text-sm font-extrabold text-slate-900">
              Progression
            </p>

            <div className="space-y-4">
              <ProgressItem
                number="1"
                label="Type d'annonce"
                active={step === 1}
                done={step > 1}
              />
              <ProgressItem
                number="2"
                label="Description"
                active={step === 2}
                done={step > 2}
              />
              <ProgressItem
                number="3"
                label="Lieu et date"
                active={step === 3}
                done={step > 3}
              />
              <ProgressItem
                number="4"
                label="Vos coordonnées"
                active={step === 4}
                done={false}
              />
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {step === 1 && (
              <section>
                <h2 className="text-2xl font-extrabold">
                  Quel type de signalement ?
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Choisissez d&apos;abord si vous recherchez ou si vous avez
                  retrouvé une personne ou un objet.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => updateField("type_annonce", "disparition")}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      formData.type_annonce === "disparition"
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 hover:border-red-200"
                    }`}
                  >
                    <span className="text-3xl">🚨</span>
                    <p className="mt-4 font-extrabold text-slate-900">
                      Signaler une disparition
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Une personne ou un objet est perdu, disparu ou recherché.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField("type_annonce", "retrouve")}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      formData.type_annonce === "retrouve"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    <span className="text-3xl">✅</span>
                    <p className="mt-4 font-extrabold text-slate-900">
                      Signaler une retrouvaille
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      Vous avez retrouvé une personne ou un objet et souhaitez
                      aider à identifier son propriétaire.
                    </p>
                  </button>
                </div>

                <h3 className="mt-10 text-lg font-extrabold">
                  Quelle catégorie ?
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        updateField(
                          "categorie",
                          category.value as Categorie
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        formData.categorie === category.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 hover:border-orange-200"
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <p className="mt-2 text-sm font-bold">
                        {category.label}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section>
                <h2 className="text-2xl font-extrabold">
                  Décrivez le signalement
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Donnez le plus de détails possible pour augmenter les chances
                  de retrouvailles.
                </p>

                <div className="mt-7 space-y-5">
                  <FieldLabel label="Titre de l'annonce" required>
                    <input
                      value={formData.titre}
                      onChange={(event) =>
                        updateField("titre", event.target.value)
                      }
                      placeholder={
                        isPersonne
                          ? "Ex. Disparition de Aya Konan à Koumassi"
                          : "Ex. Téléphone perdu dans un taxi à Abidjan"
                      }
                      className="input"
                    />
                  </FieldLabel>

                  <FieldLabel label="Description détaillée" required>
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      rows={6}
                      placeholder="Décrivez les circonstances, les vêtements, la couleur de l'objet, les éléments distinctifs, etc."
                      className="input resize-none"
                    />
                  </FieldLabel>

                  {isPersonne && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FieldLabel label="Nom de la personne" required>
                        <input
                          value={formData.nom_personne}
                          onChange={(event) =>
                            updateField("nom_personne", event.target.value)
                          }
                          placeholder="Nom et prénom"
                          className="input"
                        />
                      </FieldLabel>

                      <FieldLabel label="Âge approximatif">
                        <input
                          value={formData.age_approx}
                          onChange={(event) =>
                            updateField("age_approx", event.target.value)
                          }
                          type="number"
                          min="0"
                          max="120"
                          placeholder="Ex. 24"
                          className="input"
                        />
                      </FieldLabel>
                    </div>
                  )}

                  <FieldLabel label="Signes ou détails distinctifs">
                    <textarea
                      value={formData.signes_distinctifs}
                      onChange={(event) =>
                        updateField(
                          "signes_distinctifs",
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="Ex. vêtements, cicatrice, marque, numéro de série, couleur, modèle…"
                      className="input resize-none"
                    />
                  </FieldLabel>

                  <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-5">
                    <p className="font-bold text-orange-900">
                      📷 Ajout de photos
                    </p>
                    <p className="mt-2 text-sm text-orange-800">
                      La structure est prévue pour les photos. Nous ajouterons
                      l&apos;upload Cloudinary ou S3 à l&apos;étape suivante.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section>
                <h2 className="text-2xl font-extrabold">
                  Où et quand ?
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Ces informations permettent de retrouver les annonces proches
                  et similaires.
                </p>

                <div className="mt-7 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FieldLabel label="Ville" required>
                      <input
                        value={formData.ville}
                        onChange={(event) =>
                          updateField("ville", event.target.value)
                        }
                        placeholder="Ex. Abidjan"
                        className="input"
                      />
                    </FieldLabel>

                    <FieldLabel label="Commune / quartier">
                      <select
                        value={formData.commune}
                        onChange={(event) =>
                          updateField("commune", event.target.value)
                        }
                        className="input"
                      >
                        <option value="">Sélectionnez une commune</option>
                        {communesAbidjan.map((commune) => (
                          <option key={commune} value={commune}>
                            {commune}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                  </div>

                  <FieldLabel label="Lieu précis">
                    <input
                      value={formData.lieu_precis}
                      onChange={(event) =>
                        updateField("lieu_precis", event.target.value)
                      }
                      placeholder="Ex. Marché de Koumassi, arrêt de bus, gare…"
                      className="input"
                    />
                  </FieldLabel>

                  <FieldLabel
                    label={
                      formData.type_annonce === "disparition"
                        ? "Date de disparition"
                        : "Date de retrouvaille"
                    }
                    required
                  >
                    <input
                      value={formData.date_evenement}
                      onChange={(event) =>
                        updateField("date_evenement", event.target.value)
                      }
                      type="datetime-local"
                      className="input"
                    />
                  </FieldLabel>
                </div>
              </section>
            )}

            {step === 4 && (
              <section>
                <h2 className="text-2xl font-extrabold">
                  Comment vous contacter ?
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Ces coordonnées permettront à une personne ayant une
                  information utile de vous joindre.
                </p>

                <div className="mt-7 space-y-5">
                  <FieldLabel label="Téléphone" required>
                    <input
                      value={formData.contact_telephone}
                      onChange={(event) =>
                        updateField("contact_telephone", event.target.value)
                      }
                      type="tel"
                      placeholder="Ex. +225 07 00 00 00 00"
                      className="input"
                    />
                  </FieldLabel>

                  <FieldLabel label="WhatsApp">
                    <input
                      value={formData.contact_whatsapp}
                      onChange={(event) =>
                        updateField("contact_whatsapp", event.target.value)
                      }
                      type="tel"
                      placeholder="Ex. +225 07 00 00 00 00"
                      className="input"
                    />
                  </FieldLabel>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4">
                    <input
                      checked={formData.autoriser_contact_direct}
                      onChange={(event) =>
                        updateField(
                          "autoriser_contact_direct",
                          event.target.checked
                        )
                      }
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-orange-500"
                    />

                    <span>
                      <span className="block text-sm font-bold text-slate-800">
                        Autoriser le contact direct
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        Les utilisateurs pourront vous contacter grâce aux
                        informations renseignées sur cette annonce.
                      </span>
                    </span>
                  </label>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
                    <p className="font-extrabold">Avant d&apos;envoyer</p>
                    <p className="mt-2">
                      Ne publiez pas d&apos;informations sensibles inutiles.
                      Pour toute disparition inquiétante, contactez aussi les
                      autorités compétentes.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-10 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={previousStep}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  ← Retour
                </button>
              ) : (
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Continuer →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Envoi en cours…"
                    : "Envoyer le signalement"}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function ProgressItem({
  number,
  label,
  active,
  done,
}: {
  number: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
          active
            ? "bg-orange-500 text-white"
            : done
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {done ? "✓" : number}
      </div>

      <span
        className={`text-sm font-semibold ${
          active ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function FieldLabel({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      {children}
    </label>
  );
}