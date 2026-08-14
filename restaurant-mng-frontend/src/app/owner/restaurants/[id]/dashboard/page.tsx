"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type DishSalesItem = {
    dishId: number;
    dishName: string;
    quantitySold: number;
    revenue: number;
};

type DailySalesSummary = {
    workDayId: number;
    restaurantId: number;
    date: string;
    timeClose: string | null;
    totalRevenue: number;
    totalItemsSold: number;
    dishes: DishSalesItem[];
};

type HistoricalSalesSummary = {
    restaurantId: number;
    from: string;
    to: string;
    totalRevenue: number;
    totalItemsSold: number;
    workDaysCount: number;
    averageRevenuePerDay: number;
    dailyBreakdown: DailySalesSummary[];
    topDishes: DishSalesItem[];
};

type RangePreset = "7" | "30" | "90";

const CHART_COLORS = ["#f59e0b", "#22c55e", "#38bdf8", "#f472b6", "#a78bfa", "#facc15", "#fb923c"];

function toDateInputValue(d: Date) {
    return d.toISOString().split("T")[0];
}

export default function SalesDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.id as string;

    const { token, isAuthenticated, user } = useAuthStore();
    const isOwner = Boolean(user && user.role === "Dueño");

    const [preset, setPreset] = useState<RangePreset>("30");
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return toDateInputValue(d);
    });
    const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));

    const [summary, setSummary] = useState<HistoricalSalesSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !isOwner) return;
        fetchHistory();
    }, [isAuthenticated, isOwner, fromDate, toDate]);

    function applyPreset(days: RangePreset) {
        setPreset(days);
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - Number(days));
        setFromDate(toDateInputValue(from));
        setToDate(toDateInputValue(to));
    }

    async function fetchHistory() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(
                `${API_URL}/api/sales/${restaurantId}/history?from=${fromDate}&to=${toDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("No se pudo cargar el resumen de ventas.");
            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message ?? "Error al cargar ventas.");
            setSummary(json.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar el dashboard.");
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }

    const dailyChartData = useMemo(() => {
        if (!summary) return [];
        return summary.dailyBreakdown
            .slice()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((d) => ({
                date: new Date(d.date).toLocaleDateString("es-DO", { day: "2-digit", month: "short" }),
                Ingresos: d.totalRevenue,
                Items: d.totalItemsSold,
            }));
    }, [summary]);

    const topDishesData = useMemo(() => {
        if (!summary) return [];
        return summary.topDishes
            .slice()
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 8)
            .map((d) => ({ name: d.dishName, Vendidos: d.quantitySold, Ingresos: d.revenue }));
    }, [summary]);

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
                    <Link href={`/owner/restaurants/${restaurantId}/dashboard`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Ventas</Link>
                    <Link href={`/owner/restaurants/${restaurantId}/predictions`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Predicción</Link>
                    <Link href={`/owner/restaurants/${restaurantId}/insights`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Insights IA</Link>
                
                </nav>
                <div className="relative z-10 flex items-center gap-3">
                    <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
                </div>
            </header>

            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
                <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <button onClick={() => router.back()} className="text-xs text-stone-400 hover:text-white mb-2 flex items-center gap-1">
                                ← Volver
                            </button>
                            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Ventas</h1>
                            <p className="text-sm text-stone-400 mt-1">Métricas y platos populares de tu restaurante</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {(["7", "30", "90"] as RangePreset[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => applyPreset(p)}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${preset === p ? "bg-amber-500 text-black" : "bg-white/10 text-stone-300 hover:bg-white/20"
                                        }`}
                                >
                                    {p} días
                                </button>
                            ))}
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => { setPreset("30"); setFromDate(e.target.value); }}
                                className="rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                            />
                            <span className="text-stone-500 text-xs">a</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setPreset("30"); setToDate(e.target.value); }}
                                className="rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}

                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">Cargando métricas...</div>
                    ) : !summary ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">
                            No hay datos de ventas para el rango seleccionado.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
                                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                    <p className="text-xs font-mono uppercase text-amber-400 mb-1">Ingresos Totales</p>
                                    <p className="text-2xl font-bold text-white">
                                        {summary.totalRevenue.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                    <p className="text-xs font-mono uppercase text-amber-400 mb-1">Items Vendidos</p>
                                    <p className="text-2xl font-bold text-white">{summary.totalItemsSold}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                    <p className="text-xs font-mono uppercase text-amber-400 mb-1">Jornadas Registradas</p>
                                    <p className="text-2xl font-bold text-white">{summary.workDaysCount}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                    <p className="text-xs font-mono uppercase text-amber-400 mb-1">Promedio Diario</p>
                                    <p className="text-2xl font-bold text-white">
                                        {summary.averageRevenuePerDay.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white mb-4">Ingresos por día</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={dailyChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2e1910" />
                                        <XAxis dataKey="date" stroke="#a8a29e" fontSize={12} />
                                        <YAxis stroke="#a8a29e" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#1a100a", border: "1px solid #2e1910", borderRadius: 8, color: "#fff" }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="Ingresos" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                                <h2 className="text-lg font-semibold text-white mb-4">Platos más populares</h2>
                                {topDishesData.length === 0 ? (
                                    <p className="text-sm text-stone-400">No hay ventas de platos en este rango.</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={topDishesData} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2e1910" horizontal={false} />
                                            <XAxis type="number" stroke="#a8a29e" fontSize={12} />
                                            <YAxis dataKey="name" type="category" stroke="#a8a29e" fontSize={12} width={120} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#1a100a", border: "1px solid #2e1910", borderRadius: 8, color: "#fff" }}
                                            />
                                            <Bar dataKey="Vendidos" radius={[0, 6, 6, 0]}>
                                                {topDishesData.map((_, i) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}