"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
}

type RequestItem = {
  id: string;
  name: string;
  ownerName?: string;
  description?: string;
  address?: string;
  images?: string[];
  createdAt?: string;
};

const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

export default function AdminApprovalsPage() {
  const { user, token, isAuthenticated } = useAuthStore();

  const isAdmin = Boolean(
    user && (user.Role === "Admin" || user.role === "Admin" || user.isAdmin)
  );

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchRequests();
  }, [isAuthenticated, isAdmin]);

  async function fetchRequests() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/restaurant-requests`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function decide(id: string, decision: "approve" | "deny") {
    try {
      setProcessingId(id);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/restaurant-requests/${id}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) throw new Error(await res.text());

      // quitar request de la UI
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center text-stone-100">Necesitas iniciar sesión como administrador para ver esta página.</div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-stone-100">No tienes permisos de administrador.</div>
    );
  }

  return (
    <main className="relative min-h-screen text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-black/55" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full" />
            <span className="text-sm font-semibold tracking-wide">TableUp</span>
          </div>
        </div>

        <nav className="relative z-10 flex items-center gap-3 text-sm text-stone-200">
          <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">Home</Link>
          <Link href="/restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">Restaurants</Link>
          <Link href="/admin/approvals" className="rounded-full bg-emerald-500/20 px-4 py-2 text-emerald-200 transition hover:bg-emerald-500/30">Approvals</Link>
          <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10">About Us</Link>
        </nav>

        <div className="relative z-10 flex items-center gap-3">
          <button className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-stone-100 transition hover:border-white/40 hover:bg-white/15">
            Admin Panel
          </button>
          <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.45em] text-amber-300">Mesa de control</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Aprobación de restaurantes</h1>
            </div>
            <p className="text-sm text-stone-300">Revisa las solicitudes, visualiza información y decide si apruebas o deniegas los restaurantes.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-3xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-200">{error}</div>
          )}

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-200">Cargando solicitudes...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">No hay solicitudes pendientes.</div>
          ) : (
            <div className="grid gap-6">
              {requests.map((r) => (
                <article key={r.id} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{r.name}</h2>
                      <div className="mt-1 space-y-1 text-sm text-stone-300">
                        {r.ownerName && <p>Propietario: {r.ownerName}</p>}
                        {r.address && <p>Dirección: {r.address}</p>}
                        {r.createdAt && <p>Solicitado: {new Date(r.createdAt).toLocaleString()}</p>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={processingId === r.id}
                        onClick={() => decide(r.id, "approve")}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === r.id ? "Procesando..." : "Aprobar"}
                      </button>
                      <button
                        disabled={processingId === r.id}
                        onClick={() => decide(r.id, "deny")}
                        className="rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === r.id ? "Procesando..." : "Denegar"}
                      </button>
                    </div>
                  </div>

                  {r.description && <p className="mb-4 text-sm leading-relaxed text-stone-300">{r.description}</p>}

                  {r.images && r.images.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {r.images.map((src, i) => (
                        <div key={i} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                          <img src={src} alt={`${r.name}-img-${i}`} className="h-36 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
