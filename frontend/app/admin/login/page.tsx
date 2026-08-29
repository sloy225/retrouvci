"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/connexion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Email ou mot de passe incorrect."
        );
      }

      localStorage.setItem("retrouvci_admin_token", data.access_token);
      router.push("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de se connecter."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl md:p-9">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-xl font-extrabold text-white">
            R
          </div>

          <span className="text-2xl font-extrabold text-slate-900">
            Retrouv<span className="text-orange-500">CI</span>
          </span>
        </Link>

        <div className="mt-8 text-center">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
            ADMINISTRATION
          </span>

          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Connexion administrateur
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Connectez-vous pour modérer les signalements RetrouvCI.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Adresse e-mail
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@retrouvci.ci"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Mot de passe
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-500 transition hover:text-orange-500"
        >
          ← Retour au site
        </Link>
      </section>
    </main>
  );
}