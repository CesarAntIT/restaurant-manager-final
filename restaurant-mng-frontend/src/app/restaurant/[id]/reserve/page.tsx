"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type TableStatus = "Available" | "Occupied" | "Reserved";

type TableItem = {
  id: number;
  restaurantId: number;
  numberMesa: string;
  seats: number;
  status: TableStatus;
};

export default function ReservePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const { token, isAuthenticated } = useAuthStore();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState("2");

  useEffect(() => {
    fetchTables();
  }, [token]);

  async function fetchTables() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables`, {
        headers: { Authorization: `Bearer ${token ? token : ""}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar las mesas.");
      const json = await res.json();
      const all: TableItem[] = Array.isArray(json) ? json : json.data ?? [];
      setTables(all.filter((t) => t.status === "Available"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las mesas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve() {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!selectedTable) {
      setError("Selecciona una mesa.");
      return;
    }
    if (!date) {
      setError("Selecciona una fecha.");
      return;
    }
    if (!time) {
      setError("Selecciona una hora.");
      return;
    }
    if (!people || Number(people) < 1) {
      setError("Ingresa la cantidad de personas.");
      return;
    }
    if (Number(people) > selectedTable.seats) {
      setError(`Esta mesa tiene capacidad para ${selectedTable.seats} personas máximo.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const dateTimeReservation = `${date}T${time}:00`;

    fetch(`${API_URL}/api/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tableId: selectedTable.id,
        dateTimeReservation,
        peopleCount: Number(people),
      }),
    })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) {
          setError(json?.message ?? json ?? "No se pudo crear la reserva.");
          return;
        }
        setSuccess("¡Reserva creada correctamente! Te esperamos.");
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem("reservedRestaurantIds");
          const currentReserved: number[] = stored ? JSON.parse(stored) : [];
          const restaurantIdNumber = Number(restaurantId);
          if (!currentReserved.includes(restaurantIdNumber)) {
            window.localStorage.setItem(
              "reservedRestaurantIds",
              JSON.stringify([...currentReserved, restaurantIdNumber]),
            );
          }
        }
        setSelectedTable(null);
        setDate("");
        setTime("");
        setPeople("2");
      })
      .catch(() => {
        setError("No se pudo conectar con el servidor.");
      })
      .finally(() => {
        setSubmitting(false);
      });
  }

 return (
    <main className="min-h-screen bg-[#0d0705] text-stone-200">
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-[#0d0705]/80 backdrop-blur-[2px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#2d180d]/60 bg-[#120804]/60 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full border border-amber-900/40 bg-amber-950/20 px-3.5 py-1.5 shadow-inner sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full ring-2 ring-amber-600/30" />
            <span className="text-sm font-semibold tracking-wide text-amber-100">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-2 text-sm text-stone-300">
          <Link href="/" className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200">Home</Link>
          <Link href="/restaurants" className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200">Restaurants</Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-[#3a2013]/60 bg-gradient-to-b from-[#180d07]/90 via-[#120804]/90 to-[#0c0503]/90 p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl sm:p-8">

          <div className="mb-6">
            <button onClick={() => router.back()} className="text-xs text-amber-200/70 hover:text-amber-100 mb-2 flex items-center gap-1 transition-all">
              ← Volver
            </button>
            <h1 className="bg-gradient-to-r from-amber-100 via-stone-200 to-amber-300 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">Hacer una Reserva</h1>
            <p className="text-sm text-stone-400 mt-1">Selecciona una mesa, fecha y hora para tu visita</p>
          </div>

          {error && <div className="mb-6 rounded-2xl border border-rose-800/50 bg-rose-950/40 p-4 text-sm text-rose-200 backdrop-blur-md shadow-lg">{error}</div>}
          {success && <div className="mb-6 rounded-2xl border border-emerald-800/50 bg-emerald-950/40 p-4 text-sm text-emerald-200 backdrop-blur-md shadow-lg">{success}</div>}

          {/* Fecha, Hora y Personas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Personas</label>
              <input
                type="number"
                min={1}
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all"
              />
            </div>
          </div>

          {/* Mesas disponibles */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-amber-100 mb-4 tracking-wide">Mesas Disponibles</h2>
            {loading ? (
              <div className="rounded-2xl border border-[#3a2013]/60 bg-[#120704]/60 p-8 text-center text-sm text-stone-400">Cargando mesas...</div>
            ) : tables.length === 0 ? (
              <div className="rounded-2xl border border-[#3a2013]/60 bg-[#120704]/60 p-8 text-center text-sm text-stone-400">No hay mesas disponibles en este momento.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selectedTable?.id === table.id
                        ? "border-amber-500/80 bg-gradient-to-b from-amber-900/30 to-amber-950/40 shadow-lg shadow-amber-950/50"
                        : "border-[#3a2013]/80 bg-[#120704]/90 hover:border-amber-900/50 hover:bg-[#1a0c06]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-100 font-bold">{table.numberMesa}</span>
                      {selectedTable?.id === table.id && (
                        <span className="text-xs text-amber-300 font-bold">✓ Seleccionada</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">{table.seats} personas</p>
                    <span className="mt-3 inline-block rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 shadow-sm shadow-emerald-950/50">
                      Disponible
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resumen y botón */}
          {selectedTable && (
            <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a0e08] to-[#120804] p-5 mb-6 shadow-xl backdrop-blur-3xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200/80 mb-3">Resumen de tu reserva</h3>
              <div className="grid grid-cols-2 gap-2.5 text-sm text-stone-300">
                <p>Mesa: <span className="text-amber-100 font-semibold">{selectedTable.numberMesa}</span></p>
                <p>Capacidad: <span className="text-amber-100 font-semibold">{selectedTable.seats} personas</span></p>
                <p>Fecha: <span className="text-amber-100 font-semibold">{date || "—"}</span></p>
                <p>Hora: <span className="text-amber-100 font-semibold">{time || "—"}</span></p>
                <p>Personas: <span className="text-amber-100 font-semibold">{people}</span></p>
              </div>
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={submitting}
            className="w-full rounded-2xl border border-amber-600/50 bg-gradient-to-r from-amber-700 to-amber-600 py-3.5 text-sm font-bold uppercase tracking-wider text-stone-100 shadow-lg shadow-amber-950/50 transition-all hover:from-amber-600 hover:to-amber-500 disabled:opacity-60 active:scale-[0.99]"
          >
            {submitting ? "Procesando reserva..." : "Confirmar Reserva"}
          </button>

          {!isAuthenticated && (
            <p className="text-center text-xs text-stone-400 mt-4">
              Debes <Link href="/login" className="text-amber-300 hover:underline">iniciar sesión</Link> para hacer una reserva.
            </p>
          )}

        </div>
      </div>
    </main>
  );
}