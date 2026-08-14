"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type Menu = {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;
  status: number | string;
};

type Prediction = {
  id: number;
  restaurantId: number;
  menuId: number;
  predictionDate: string;
  estimatedDemand: number;
  stockRecommendation: string | null;
  createdAt: string;
  sampleSizeUsed: number;
  confidenceLevel: string;
};

function toDateInputValue(d: Date) {
  return d.toISOString().split("T")[0];
}

function confidenceColor(level: string) {
  if (level === "Alta") return "bg-emerald-500/20 text-emerald-300";
  if (level === "Media") return "bg-amber-500/20 text-amber-300";
  return "bg-red-500/20 text-red-300";
}

export default function PredictionsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const { token, isAuthenticated, user } = useAuthStore();
  const isOwner = Boolean(user && user.role === "Dueño");

  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toDateInputValue(d);
  });
  const [lookbackWeeks, setLookbackWeeks] = useState("8");

  const [history, setHistory] = useState<Prediction[]>([]);
  const [latestResult, setLatestResult] = useState<Prediction | null>(null);

  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    fetchMenus();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isOwner]);

  async function fetchMenus() {
    try {
      setLoadingMenus(true);
      const res = await fetch(`${API_URL}/api/menus/restaurant/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const list: Menu[] = json.data ?? [];
      setMenus(list);
      if (list.length > 0) setSelectedMenuId(String(list[0].id));
    } catch {
      setError("No se pudieron cargar los menús.");
    } finally {
      setLoadingMenus(false);
    }
  }

  async function fetchHistory() {
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_URL}/api/predictions/${restaurantId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const list: Prediction[] = json.data ?? [];
      setHistory(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  }

  async function generatePrediction() {
    if (!selectedMenuId) {
      setError("Selecciona un menú primero.");
      return;
    }
    try {
      setGenerating(true);
      setError(null);
      setLatestResult(null);
      const res = await fetch(`${API_URL}/api/predictions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          menuId: Number(selectedMenuId),
          targetDate: new Date(targetDate).toISOString(),
          lookbackWeeks: Number(lookbackWeeks) || 8,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "No se pudo generar la predicción.");
      }
      setLatestResult(json.data);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar la predicción.");
    } finally {
      setGenerating(false);
    }
  }

  const selectedMenuName = menus.find((m) => String(m.id) === selectedMenuId)?.name;

  if (!isAuthenticated || !isOwner) {
    return (
      <div className="min-h-screen bg-[#120904] flex items-center justify-center text-stone-100 text-center p-8">
        <div>
          <p className="mb-4">Necesitas iniciar sesión como dueño para ver esta página.</p>
          <Link href="/login" className="rounded-full px-4 py-2 bg-amber-600 text-black font-bold hover:bg-amber-500">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-black/55" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full" />
            <span className="text-sm font-semibold tracking-wide">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-3 text-sm text-stone-200">
          <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">Home</Link>
          <Link href="/owner/my-restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">Mis Restaurantes</Link>
          <Link href={`/owner/restaurants/${restaurantId}/tables`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Mesas</Link>
          <Link href={`/owner/restaurants/${restaurantId}/dishes`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Platos</Link>
          <Link href={`/owner/restaurants/${restaurantId}/dashboard`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Ventas</Link>
          <Link href={`/owner/restaurants/${restaurantId}/predictions`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Predicción</Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">

          <div className="mb-6">
            <button onClick={() => router.back()} className="text-xs text-stone-400 hover:text-white mb-2 flex items-center gap-1">
              ← Volver
            </button>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Predicción de Demanda</h1>
            <p className="text-sm text-stone-400 mt-1">
              Estima la afluencia de clientes usando el historial de reservas y ventas para preparar el stock adecuado.
            </p>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}

          <div className="mb-8 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Generar nueva predicción</h2>

            {loadingMenus ? (
              <p className="text-sm text-stone-400">Cargando menús...</p>
            ) : menus.length === 0 ? (
              <p className="text-sm text-stone-400">
                No hay menús registrados para este restaurante. Crea uno primero para poder generar predicciones.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Menú</label>
                  <select
                    value={selectedMenuId}
                    onChange={(e) => setSelectedMenuId(e.target.value)}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Fecha objetivo</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    min={toDateInputValue(new Date())}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Semanas de historial</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    value={lookbackWeeks}
                    onChange={(e) => setLookbackWeeks(e.target.value)}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={generatePrediction}
              disabled={generating || menus.length === 0}
              className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50"
            >
              {generating ? "Generando predicción..." : "Generar Predicción"}
            </button>
          </div>

          {latestResult && (
            <div className="mb-8 rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">
                  Resultado para {selectedMenuName ?? `Menú #${latestResult.menuId}`}
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceColor(latestResult.confidenceLevel)}`}>
                  Confianza: {latestResult.confidenceLevel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-mono uppercase text-stone-500">Fecha objetivo</p>
                  <p className="text-lg font-bold text-white">
                    {new Date(latestResult.predictionDate).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase text-stone-500">Demanda estimada</p>
                  <p className="text-lg font-bold text-amber-400">{latestResult.estimatedDemand} clientes</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase text-stone-500">Muestra usada</p>
                  <p className="text-lg font-bold text-white">{latestResult.sampleSizeUsed} registros</p>
                </div>
              </div>
              {latestResult.stockRecommendation && (
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-mono uppercase text-stone-500 mb-1">Recomendación de stock</p>
                  <p className="text-sm text-stone-200">{latestResult.stockRecommendation}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Historial de predicciones</h2>
            {loadingHistory ? (
              <p className="text-sm text-stone-400">Cargando historial...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-stone-400">Todavía no se ha generado ninguna predicción.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-mono uppercase text-stone-500">
                      <th className="py-2 pr-4">Fecha objetivo</th>
                      <th className="py-2 pr-4">Menú</th>
                      <th className="py-2 pr-4">Demanda estimada</th>
                      <th className="py-2 pr-4">Confianza</th>
                      <th className="py-2 pr-4">Generado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p) => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-stone-200">
                          {new Date(p.predictionDate).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-2 pr-4 text-stone-400">
                          {menus.find((m) => m.id === p.menuId)?.name ?? `#${p.menuId}`}
                        </td>
                        <td className="py-2 pr-4 font-semibold text-amber-400">{p.estimatedDemand} clientes</td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${confidenceColor(p.confidenceLevel)}`}>
                            {p.confidenceLevel}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-stone-500">
                          {new Date(p.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}