"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

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
  }, []);

  async function fetchTables() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    <main>
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
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">

          <div className="mb-6">
            <button onClick={() => router.back()} className="text-xs text-stone-400 hover:text-white mb-2 flex items-center gap-1">
              ← Volver
            </button>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Hacer una Reserva</h1>
            <p className="text-sm text-stone-400 mt-1">Selecciona una mesa, fecha y hora para tu visita</p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">{success}</div>}

          {/* Fecha, Hora y Personas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Personas</label>
              <input
                type="number"
                min={1}
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Mesas disponibles */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Mesas Disponibles</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-stone-300">Cargando mesas...</div>
            ) : tables.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-stone-300">No hay mesas disponibles en este momento.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedTable?.id === table.id
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-white/10 bg-slate-950/70 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{table.numberMesa}</span>
                      {selectedTable?.id === table.id && (
                        <span className="text-xs text-amber-400 font-bold">✓ Seleccionada</span>
                      )}
                    </div>
                    <p className="text-sm text-stone-400">{table.seats} personas</p>
                    <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      Disponible
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resumen y botón */}
          {selectedTable && (
            <div className="rounded-2xl border border-white/10 bg-[#1a100a]/90 p-5 mb-6">
              <h3 className="text-sm font-mono uppercase text-amber-400 mb-3">Resumen de tu reserva</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-stone-300">
                <p>Mesa: <span className="text-white font-semibold">{selectedTable.numberMesa}</span></p>
                <p>Capacidad: <span className="text-white font-semibold">{selectedTable.seats} personas</span></p>
                <p>Fecha: <span className="text-white font-semibold">{date || "—"}</span></p>
                <p>Hora: <span className="text-white font-semibold">{time || "—"}</span></p>
                <p>Personas: <span className="text-white font-semibold">{people}</span></p>
              </div>
            </div>
          )}

          <button
            onClick={handleReserve}
            disabled={submitting}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-500 disabled:opacity-60"
          >
            {submitting ? "Procesando reserva..." : "Confirmar Reserva"}
          </button>

          {!isAuthenticated && (
            <p className="text-center text-xs text-stone-400 mt-3">
              Debes <Link href="/login" className="text-amber-500 hover:underline">iniciar sesión</Link> para hacer una reserva.
            </p>
          )}

        </div>
      </div>
    </main>
  );
}