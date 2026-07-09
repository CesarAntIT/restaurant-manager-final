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
  id: number;
  ownerId: string;
  name: string;
  category: string;
  status: string;
  address: string;
  phoneNumber: string;
  createdAt: string;
  images: string[];
};

const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

export default function AdminApprovalsPage() {
  const { user, token, isAuthenticated } = useAuthStore();

  const isAdmin = Boolean(
    user && (user.role === "Admin" || user.role === "Admin" || user.isAdmin)
  );

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ id: number; name: string; status: string } | null>(null);
  const [undoData, setUndoData] = useState<{ restaurant: RequestItem; previousStatus: string } | null>(null);
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    fetchRequests();
  }, [isAuthenticated, isAdmin]);

  async function fetchRequests() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const response = await res.json();
      const restaurantData = response.data || response;
      const pendingRestaurants = Array.isArray(restaurantData) ? restaurantData.filter((r) => r.status === "Pending") : [];
      setRequests(pendingRestaurants);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function changeRestaurantStatus(
    restaurantId: number,
    status: string
  ) {
    try {
      setProcessingId(String(restaurantId));
      setError(null);
      
      // Encontrar el restaurante en la lista
      const restaurant = requests.find((r) => r.id === restaurantId);
      if (!restaurant) throw new Error("Restaurante no encontrado");
      
      const res = await fetch(
        `${API_URL}/api/restaurants/change-status/${restaurantId}`,
        {
          method: "PATCH",
          headers: {
            "accept": "*/*",
            "Authorization": token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(status),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      // Guardar datos para deshacer
      setUndoData({
        restaurant,
        previousStatus: restaurant.status,
      });

      // Remover del listado
      setRequests((prev) => prev.filter((r) => r.id !== restaurantId));

      // Mostrar notificación
      const statusMessage = status === "Approved" ? "aprobado" : "denegado";
      setNotification({
        id: restaurantId,
        name: restaurant.name,
        status: statusMessage,
      });

      // Limpiar timeout anterior si existe
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }

      // Auto-cerrar notificación después de 10 segundos
      const timeout = setTimeout(() => {
        setNotification(null);
        setUndoData(null);
      }, 10000);
      setNotificationTimeout(timeout);

      // Hacer refetch silencioso después de 500ms para actualizar datos
      setTimeout(() => {
        fetchRequests();
      }, 500);

      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setProcessingId(null);
    }
  }

  async function undoStatusChange() {
    if (!undoData) return;

    try {
      setProcessingId(String(undoData.restaurant.id));
      setError(null);

      const res = await fetch(
        `${API_URL}/api/restaurants/change-status/${undoData.restaurant.id}`,
        {
          method: "PATCH",
          headers: {
            "accept": "*/*",
            "Authorization": token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify("Pending"),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      // Volver a agregar el restaurante a la lista
      setRequests((prev) => [...prev, undoData.restaurant]);

      // Limpiar notificación y datos de deshacer
      setNotification(null);
      setUndoData(null);
      
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        setNotificationTimeout(null);
      }

      // Hacer refetch silencioso después de 500ms para actualizar datos
      setTimeout(() => {
        fetchRequests();
      }, 500);
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
                        <p>Categoría: {r.category}</p>
                        <p>Estado: <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-amber-500/20 text-amber-200">{r.status}</span></p>
                        <p>Teléfono: {r.phoneNumber}</p>
                        <p>Dirección: {r.address}</p>
                        <p>Solicitado: {new Date(r.createdAt).toLocaleString()}</p>
                        
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={processingId === String(r.id)}
                        onClick={() => changeRestaurantStatus(r.id, "Approved")}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === String(r.id) ? "Procesando..." : "Aprobar"}
                      </button>
                      <button
                        disabled={processingId === String(r.id)}
                        onClick={() => changeRestaurantStatus(r.id, "Rejected")}
                        className="rounded-full border border-red-500 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processingId === String(r.id) ? "Procesando..." : "Denegar"}
                      </button>
                    </div>
                  </div>

                  {r.images && r.images.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {r.images.map((imgSrc, i) => (
                        <div key={i} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                          <img src={API_URL+imgSrc} alt={`${r.name}-img-${i}`} className="h-36 w-full object-cover" />
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

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-3xl border border-emerald-500/50 bg-emerald-950/80 p-4 text-sm text-emerald-200 backdrop-blur-xl shadow-2xl">
          <div>
            <p className="font-semibold">{notification.name} fue {notification.status}.</p>
          </div>
          <button
            onClick={undoStatusChange}
            disabled={processingId === String(notification.id)}
            className="whitespace-nowrap rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processingId === String(notification.id) ? "Procesando..." : "Deshacer cambios"}
          </button>
        </div>
      )}
    </main>
  );
}
