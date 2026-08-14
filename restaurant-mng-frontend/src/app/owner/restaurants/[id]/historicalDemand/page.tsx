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
    generatedByAI: boolean;
};

type HistoricalEntry = {
    id: number;
    restaurantId: number;
    menuId: number | null;
    date: string;
    peopleCount: number;
    itemsSold: number | null;
    notes: string | null;
    createdAt: string;
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

    // ---- Historial manual (datos históricos) ----
    const [historicalData, setHistoricalData] = useState<HistoricalEntry[]>([]);
    const [loadingHistorical, setLoadingHistorical] = useState(false);
    const [savingHistorical, setSavingHistorical] = useState(false);
    const [historicalError, setHistoricalError] = useState<string | null>(null);
    const [showHistoricalForm, setShowHistoricalForm] = useState(false);

    const [histDate, setHistDate] = useState(() => toDateInputValue(new Date()));
    const [histMenuId, setHistMenuId] = useState<string>("");
    const [histPeopleCount, setHistPeopleCount] = useState("");
    const [histItemsSold, setHistItemsSold] = useState("");
    const [histNotes, setHistNotes] = useState("");

    useEffect(() => {
        if (!isAuthenticated || !isOwner) return;
        fetchMenus();
        fetchHistory();
        fetchHistoricalData();
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

    async function fetchHistoricalData() {
        try {
            setLoadingHistorical(true);
            const res = await fetch(`${API_URL}/api/predictions/${restaurantId}/historical-data`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            const list: HistoricalEntry[] = json.data ?? [];
            setHistoricalData(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch {
        } finally {
            setLoadingHistorical(false);
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

    function resetHistoricalForm() {
        setHistDate(toDateInputValue(new Date()));
        setHistMenuId("");
        setHistPeopleCount("");
        setHistItemsSold("");
        setHistNotes("");
    }

    async function addHistoricalData() {
        setHistoricalError(null);

        const peopleCount = Number(histPeopleCount);
        if (!histDate || !histPeopleCount || Number.isNaN(peopleCount) || peopleCount < 0) {
            setHistoricalError("Ingresa una fecha y una cantidad de personas válida.");
            return;
        }

        try {
            setSavingHistorical(true);
            const res = await fetch(`${API_URL}/api/predictions/${restaurantId}/historical-data`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    restaurantId: Number(restaurantId),
                    menuId: histMenuId ? Number(histMenuId) : null,
                    date: new Date(histDate).toISOString(),
                    peopleCount,
                    itemsSold: histItemsSold ? Number(histItemsSold) : null,
                    notes: histNotes || null,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error?.message ?? "No se pudo guardar el registro histórico.");
            }
            resetHistoricalForm();
            fetchHistoricalData();
        } catch (err) {
            setHistoricalError(err instanceof Error ? err.message : "Error al guardar el registro histórico.");
        } finally {
            setSavingHistorical(false);
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
                    <Link href={`/owner/restaurants/${restaurantId}/insights`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Insights IA</Link>
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
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                            latestResult.generatedByAI
                                                ? "bg-violet-500/20 text-violet-300"
                                                : "bg-stone-500/20 text-stone-300"
                                        }`}
                                        title={
                                            latestResult.generatedByAI
                                                ? "Esta predicción fue generada por el modelo de IA."
                                                : "La IA no estuvo disponible; se usó el cálculo estadístico de respaldo."
                                        }
                                    >
                                        {latestResult.generatedByAI ? "✨ Generado por IA" : "Cálculo estadístico"}
                                    </span>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceColor(latestResult.confidenceLevel)}`}>
                                        Confianza: {latestResult.confidenceLevel}
                                    </span>
                                </div>
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

                    {/* ---- Datos históricos manuales ---- */}
                    <div className="mb-8 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-lg font-bold text-white">Datos históricos manuales</h2>
                                <p className="text-sm text-stone-400 mt-1">
                                    Si aún no tienes suficientes reservas o ventas registradas en el sistema, agrega aquí días pasados
                                    (afluencia y/o platillos vendidos) para mejorar la precisión de la predicción.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowHistoricalForm((v) => !v)}
                                className="shrink-0 rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
                            >
                                {showHistoricalForm ? "Cerrar" : "+ Agregar registro"}
                            </button>
                        </div>

                        {showHistoricalForm && (
                            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                                {historicalError && (
                                    <div className="mb-3 rounded-lg border border-red-800/50 bg-red-950/30 p-2.5 text-xs text-red-200">
                                        {historicalError}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Fecha *</label>
                                        <input
                                            type="date"
                                            value={histDate}
                                            onChange={(e) => setHistDate(e.target.value)}
                                            max={toDateInputValue(new Date())}
                                            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Menú (opcional)</label>
                                        <select
                                            value={histMenuId}
                                            onChange={(e) => setHistMenuId(e.target.value)}
                                            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                        >
                                            <option value="">General (todos los menús)</option>
                                            {menus.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Personas atendidas *</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={histPeopleCount}
                                            onChange={(e) => setHistPeopleCount(e.target.value)}
                                            placeholder="ej. 35"
                                            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Platillos vendidos (opcional)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={histItemsSold}
                                            onChange={(e) => setHistItemsSold(e.target.value)}
                                            placeholder="ej. 48"
                                            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Notas (opcional)</label>
                                    <input
                                        type="text"
                                        value={histNotes}
                                        onChange={(e) => setHistNotes(e.target.value)}
                                        placeholder="ej. Fin de semana de feriado, hubo evento local, etc."
                                        className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                                    />
                                </div>
                                <button
                                    onClick={addHistoricalData}
                                    disabled={savingHistorical}
                                    className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50"
                                >
                                    {savingHistorical ? "Guardando..." : "Guardar registro"}
                                </button>
                            </div>
                        )}

                        <div className="mt-4">
                            {loadingHistorical ? (
                                <p className="text-sm text-stone-400">Cargando datos históricos...</p>
                            ) : historicalData.length === 0 ? (
                                <p className="text-sm text-stone-400">Todavía no has cargado datos históricos manuales.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 text-xs font-mono uppercase text-stone-500">
                                                <th className="py-2 pr-4">Fecha</th>
                                                <th className="py-2 pr-4">Menú</th>
                                                <th className="py-2 pr-4">Personas</th>
                                                <th className="py-2 pr-4">Platillos vendidos</th>
                                                <th className="py-2 pr-4">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historicalData.map((h) => (
                                                <tr key={h.id} className="border-b border-white/5">
                                                    <td className="py-2 pr-4 text-stone-200">
                                                        {new Date(h.date).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </td>
                                                    <td className="py-2 pr-4 text-stone-400">
                                                        {h.menuId ? (menus.find((m) => m.id === h.menuId)?.name ?? `#${h.menuId}`) : "General"}
                                                    </td>
                                                    <td className="py-2 pr-4 font-semibold text-amber-400">{h.peopleCount}</td>
                                                    <td className="py-2 pr-4 text-stone-300">{h.itemsSold ?? "—"}</td>
                                                    <td className="py-2 pr-4 text-stone-500">{h.notes ?? "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

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
                                            <th className="py-2 pr-4">Origen</th>
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
                                                <td className="py-2 pr-4">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                            p.generatedByAI
                                                                ? "bg-violet-500/20 text-violet-300"
                                                                : "bg-stone-500/20 text-stone-300"
                                                        }`}
                                                    >
                                                        {p.generatedByAI ? "IA" : "Estadístico"}
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