"use client";

import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7188";

type WorkDaySale = {
  dishId: number;
  dishName: string;
  quantitySold: number;
  revenue: number;
};

type WorkDayHistory = {
  workDayId: number;
  restaurantId: number;
  date: string;
  timeClose: string;
  totalRevenue: number;
  totalItemsSold: number;
  dishes: WorkDaySale[];
};

type SalesHistoryResponse = {
  success: boolean;
  data: {
    restaurantId: number;
    from: string;
    to: string;
    totalRevenue: number;
    totalItemsSold: number;
    workDaysCount: number;
    averageRevenuePerDay: number;
    dailyBreakdown: WorkDayHistory[];
    topDishes: WorkDaySale[];
  };
};

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDisplayDate(value?: string) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkDaySalesHistoryPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const { user, token, isAuthenticated } = useAuthStore();
  const isOwner = Boolean(user && user.role == "Dueño" && !user.isAdmin);
  const [workDays, setWorkDays] = useState<WorkDayHistory[]>([]);
  const [topDishes, setTopDishes] = useState<WorkDaySale[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalItemsSold: 0,
    workDaysCount: 0,
    averageRevenuePerDay: 0,
  });
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDateInput(date);
  });
  const [toDate, setToDate] = useState(() => formatDateInput(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSalesHistory() {
    if (!restaurantId || !token) return;
    setIsLoading(true);
    setError("");

    try {
      const fromISOString = new Date(`${fromDate}T00:00:00Z`).toISOString();
      const toISOString = new Date(`${toDate}T23:59:59Z`).toISOString();
      const res = await fetch(
        `${API_URL}/api/sales/${restaurantId}/history?from=${encodeURIComponent(fromISOString)}&to=${encodeURIComponent(toISOString)}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const message = json?.Error || json?.error || json?.message || "Error al cargar el historial";
        setError(message);
        setWorkDays([]);
        setTopDishes([]);
        return;
      }

      const json = (await res.json()) as SalesHistoryResponse;
      if (!json?.success) {
        setError((json as any)?.Error || (json as any)?.error || "Error al cargar el historial");
        setWorkDays([]);
        setTopDishes([]);
        return;
      }

      const data = json.data;
      setSummary({
        totalRevenue: data.totalRevenue ?? 0,
        totalItemsSold: data.totalItemsSold ?? 0,
        workDaysCount: data.workDaysCount ?? 0,
        averageRevenuePerDay: data.averageRevenuePerDay ?? 0,
      });
      setWorkDays(Array.isArray(data.dailyBreakdown) ? data.dailyBreakdown : []);
      setTopDishes(Array.isArray(data.topDishes) ? data.topDishes : []);
    } catch (e) {
      setError("Error de conexión al cargar el historial");
      setWorkDays([]);
      setTopDishes([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (restaurantId && token) {
      loadSalesHistory();
    }
  }, [restaurantId, token, fromDate, toDate]);

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <div className="p-8 text-center text-stone-100">
          Es necesario una cuenta para acceder a esta funcionalidad
        </div>
        <Link
          href="/login"
          className="rounded-full px-4 py-2 transition bg-amber-300 font-bold text-black hover:bg-amber-500"
        >
          Ir a Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center">
        <div className="p-8 text-center text-stone-100">
          Su cuenta no es del rol requerido
        </div>
        <Link
          href="/login"
          className="rounded-full px-4 py-2 transition bg-amber-300 font-bold text-black hover:bg-amber-500"
        >
          Iniciar sesión con Otra cuenta
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 sm:flex">
            <Image
              src="/tableup-logo.png"
              alt="TableUp logo"
              width={34}
              height={34}
              className="rounded-full"
            />
            <span className="text-sm font-semibold tracking-wide">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-3 text-sm text-stone-200">
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/owner/my-restaurants"
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            My Restaurants
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/workdays`}
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            Work Days
          </Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/tableup-logo.png"
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full border border-white/20 bg-white/10"
          />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">Historial de ventas</h1>
                <p className="text-sm text-stone-400">Detalles de ventas agrupados por workday.</p>
              </div>
              <Link
                href={`/owner/restaurants/${restaurantId}/workdays`}
                className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-600"
              >
                Volver a Work Day
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_auto_auto]">
              <label className="flex flex-col text-sm text-stone-300">
                Desde
                <input
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-900 outline-none"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm text-stone-300">
                Hasta
                <input
                  className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-900 outline-none"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
                onClick={loadSalesHistory}
              >
                Actualizar
              </button>
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200">
              <span className="font-semibold text-white">Rango seleccionado:</span> {formatDisplayDate(fromDate)} - {formatDisplayDate(toDate)}
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-stone-300">Cargando historial...</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-3xl border border-white/10 bg-[#121212]/80 p-5">
                  <p className="text-sm text-stone-400">Ingresos totales</p>
                  <p className="mt-2 text-2xl font-semibold text-white">${summary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121212]/80 p-5">
                  <p className="text-sm text-stone-400">Items vendidos</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.totalItemsSold}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121212]/80 p-5">
                  <p className="text-sm text-stone-400">Work days</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{summary.workDaysCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#121212]/80 p-5">
                  <p className="text-sm text-stone-400">Promedio por día</p>
                  <p className="mt-2 text-2xl font-semibold text-white">${summary.averageRevenuePerDay.toFixed(2)}</p>
                </div>
              </div>

              {workDays.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-stone-300">No se encontraron ventas en el rango seleccionado.</div>
              ) : (
                <div className="space-y-6">
                  {workDays.map((workDay) => (
                    <section key={workDay.workDayId} className="rounded-3xl border border-white/10 bg-[#121212]/80 p-6">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-stone-400">Workday #{workDay.workDayId}</p>
                          <p className="text-2xl font-semibold text-white">{formatDisplayDate(workDay.date)}</p>
                          <p className="text-sm text-stone-400">Cierre: {formatDisplayDate(workDay.timeClose)}</p>
                        </div>
                        <div className="space-y-2 text-right">
                          <p className="text-sm text-stone-400">Total items: {workDay.totalItemsSold}</p>
                          <p className="text-lg font-semibold text-white">Total: ${workDay.totalRevenue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm text-stone-200">
                          <thead>
                            <tr>
                              <th className="border-b border-white/10 px-4 py-3">Plato</th>
                              <th className="border-b border-white/10 px-4 py-3">Cantidad</th>
                              <th className="border-b border-white/10 px-4 py-3">Recaudación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workDay.dishes.length === 0 ? (
                              <tr>
                                <td colSpan={3} className="px-4 py-4 text-sm text-stone-400">
                                  No hay platos vendidos en este workday.
                                </td>
                              </tr>
                            ) : (
                              workDay.dishes.map((dish) => (
                                <tr key={dish.dishId} className="border-b border-white/5 last:border-b-0">
                                  <td className="px-4 py-4">{dish.dishName}</td>
                                  <td className="px-4 py-4">{dish.quantitySold}</td>
                                  <td className="px-4 py-4">${dish.revenue.toFixed(2)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {topDishes.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Top platos</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm text-stone-200">
                      <thead>
                        <tr>
                          <th className="border-b border-white/10 px-4 py-3">Plato</th>
                          <th className="border-b border-white/10 px-4 py-3">Cantidad vendida</th>
                          <th className="border-b border-white/10 px-4 py-3">Recaudación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topDishes.map((dish) => (
                          <tr key={dish.dishId} className="border-b border-white/5 last:border-b-0">
                            <td className="px-4 py-4">{dish.dishName}</td>
                            <td className="px-4 py-4">{dish.quantitySold}</td>
                            <td className="px-4 py-4">${dish.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
