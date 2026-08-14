"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

const markdownComponents = {
    h1: (props: any) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
    h2: (props: any) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
    h3: (props: any) => <h3 className="text-base font-semibold text-white mt-3 mb-1.5" {...props} />,
    p: (props: any) => <p className="text-sm text-stone-200 mb-3 leading-relaxed" {...props} />,
    strong: (props: any) => <strong className="font-bold text-amber-300" {...props} />,
    em: (props: any) => <em className="italic text-stone-100" {...props} />,
    ul: (props: any) => <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-stone-200" {...props} />,
    ol: (props: any) => <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-stone-200" {...props} />,
    li: (props: any) => <li className="text-sm text-stone-200" {...props} />,
    hr: () => <hr className="my-4 border-white/10" />,
    code: (props: any) => <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-amber-200" {...props} />,
    a: (props: any) => <a className="text-emerald-400 underline hover:text-emerald-300" target="_blank" rel="noopener noreferrer" {...props} />,
};

const SUGGESTED_PROMPTS = [
    "Dame 3 recomendaciones para reducir el desperdicio de stock según la demanda estimada.",
    "Sugiere una promoción para los días de menor afluencia de clientes.",
    "Analiza qué platos convendría destacar en el menú esta semana.",
];

export default function InsightsPage() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.id as string;

    const { token, isAuthenticated, user } = useAuthStore();
    const isOwner = Boolean(user && user.role === "Dueño");

    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState<string | null>(null);
    const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function generateInsight() {
        if (!prompt.trim()) {
            setError("Escribe una pregunta o instrucción para la IA.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setResponse(null);

            const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/insights`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prompt: prompt.trim() }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || "No se pudo generar el insight.");
            }

            const json = await res.json();
            const result: string = json.respuesta ?? "No se generaron insights.";
            setResponse(result);
            setHistory((h) => [{ prompt: prompt.trim(), response: result }, ...h].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al generar el insight.");
        } finally {
            setLoading(false);
        }
    }

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
                    <Link href={`/owner/restaurants/${restaurantId}/predictions`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Predicción</Link>
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
                        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Insights del Restaurante</h1>
                        <p className="text-sm text-stone-400 mt-1">
                            Pídele a la IA recomendaciones sobre stock, promociones o menú, basadas en tu operación.
                        </p>
                    </div>

                    {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}

                    <div className="mb-8 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Nueva consulta</h2>

                        <div className="mb-3 flex flex-wrap gap-2">
                            {SUGGESTED_PROMPTS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setPrompt(s)}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-300 hover:bg-white/10 hover:text-white"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Prompt</label>
                        <textarea
                            placeholder="Ej. ¿Qué recomendaciones de stock me darías para el próximo fin de semana?"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500 mb-4"
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={generateInsight}
                                disabled={loading}
                                className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50"
                            >
                                {loading ? "Generando..." : "Generar Insight"}
                            </button>
                        </div>
                    </div>

                    {response && (
                        <div className="mb-8 rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-bold text-white">Respuesta de la IA</h2>
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                                    Gemini
                                </span>
                            </div>
                            <div className="prose-invert max-w-none">
                                <ReactMarkdown components={markdownComponents}>{response}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                        <h2 className="text-lg font-semibold text-white mb-4">Historial de la sesión</h2>
                        {history.length === 0 ? (
                            <p className="text-sm text-stone-400">Todavía no has generado ningún insight en esta sesión.</p>
                        ) : (
                            <div className="space-y-4">
                                {history.map((h, i) => (
                                    <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                        <p className="text-xs font-mono uppercase text-stone-500 mb-1">Prompt</p>
                                        <p className="text-sm text-stone-300 mb-3">{h.prompt}</p>
                                        <p className="text-xs font-mono uppercase text-stone-500 mb-1">Respuesta</p>
                                        <div className="max-w-none">
                                            <ReactMarkdown components={markdownComponents}>{h.response}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}