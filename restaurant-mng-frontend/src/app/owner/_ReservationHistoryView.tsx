"use client";

import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND =
  "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type AuthUser = {
  role?: string;
  isAdmin?: boolean;
};

type RestaurantOption = {
  id: number;
  name: string;
  category: string;
};

type ReservationStatus =
  | "Pendiente"
  | "Confirmada"
  | "Cancelada"
  | "Atendida"
  | "Otro";

type ReservationRow = {
  id: number | string;
  userId: string;
  restaurantId: number;
  restaurantName: string;
  tableId?: number;
  table: string;
  dateTimeReservation: string;
  createdAt: string;
  peopleCount: number;
  status: ReservationStatus;
};

type ApiRecord = Record<string, unknown>;

export default function ReservationHistoryView({
  restaurantId,
}: {
  restaurantId?: string;
}) {
  const { user, token, isAuthenticated } = useAuthStore() as {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
  };

  const fixedRestaurantId = useMemo(() => {
    const numericId = Number(restaurantId);
    return Number.isFinite(numericId) ? numericId : null;
  }, [restaurantId]);

  const isOwner = isOwnerRole(user);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [restaurantsLoaded, setRestaurantsLoaded] = useState(false);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const selectedRestaurant = useMemo(
    () =>
      fixedRestaurantId
        ? restaurants.find((restaurant) => restaurant.id === fixedRestaurantId)
        : null,
    [fixedRestaurantId, restaurants],
  );

  const targetRestaurants = useMemo(() => {
    if (!fixedRestaurantId) return restaurants;
    return selectedRestaurant ? [selectedRestaurant] : [];
  }, [fixedRestaurantId, restaurants, selectedRestaurant]);

  const sortedReservations = useMemo(
    () =>
      [...reservations].sort(
        (a, b) => dateValue(b.dateTimeReservation) - dateValue(a.dateTimeReservation),
      ),
    [reservations],
  );

  const statusCounts = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((item) => item.status === "Pendiente").length,
      confirmed: reservations.filter((item) => item.status === "Confirmada").length,
      cancelled: reservations.filter((item) => item.status === "Cancelada").length,
      attended: reservations.filter((item) => item.status === "Atendida").length,
    }),
    [reservations],
  );

  useEffect(() => {
    if (!isAuthenticated || !token || !isOwner) return;

    const authToken = token;
    const controller = new AbortController();

    async function loadRestaurants() {
      setLoadingRestaurants(true);
      setRestaurantsLoaded(false);
      setError("");

      try {
        const json = await fetchJson("/api/restaurants/my-restaurants", authToken, controller.signal);
        const rows = extractApiList(json)
          .map(mapRestaurantFromApi)
          .filter((restaurant) => Number.isFinite(restaurant.id));

        if (controller.signal.aborted) return;

        setRestaurants(rows);
        setMessage(
          rows.length
            ? "Restaurantes cargados desde la API."
            : "No tienes restaurantes registrados.",
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setRestaurants([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudieron cargar tus restaurantes.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRestaurants(false);
          setRestaurantsLoaded(true);
        }
      }
    }

    loadRestaurants();

    return () => controller.abort();
  }, [isAuthenticated, isOwner, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || !isOwner || !restaurantsLoaded) return;

    const authToken = token;

    if (fixedRestaurantId && restaurants.length > 0 && targetRestaurants.length === 0) {
      setReservations([]);
      setError("Este restaurante no esta asociado a tu cuenta.");
      setMessage("");
      return;
    }

    if (targetRestaurants.length === 0) {
      setReservations([]);
      setMessage("No hay restaurantes para consultar reservas.");
      return;
    }

    const controller = new AbortController();

    async function loadReservations() {
      setLoadingReservations(true);
      setError("");

      const results = await Promise.allSettled(
        targetRestaurants.map(async (restaurant) => {
          const json = await fetchJson(
            `/api/reservations/restaurant/${restaurant.id}`,
            authToken,
            controller.signal,
          );

          return extractApiList(json).map((reservation, index) =>
            mapReservationFromApi(reservation, restaurant, index),
          );
        }),
      );

      if (controller.signal.aborted) return;

      const rows = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      const hasRejected = results.some((result) => result.status === "rejected");

      setReservations(rows);
      setMessage(
        hasRejected
          ? "Algunas reservas no pudieron cargarse desde la API."
          : rows.length
            ? "Historial de reservas actualizado."
            : "No hay reservas registradas para esta consulta.",
      );
      setLoadingReservations(false);
    }

    loadReservations().catch((loadError) => {
      if (!controller.signal.aborted) {
        setReservations([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las reservas.",
        );
        setLoadingReservations(false);
      }
    });

    return () => controller.abort();
  }, [
    fixedRestaurantId,
    isAuthenticated,
    isOwner,
    reloadKey,
    restaurants.length,
    restaurantsLoaded,
    targetRestaurants,
    token,
  ]);

  if (!isAuthenticated) {
    return (
      <AccessState
        title="Acceso requerido"
        text="Inicia sesion para ver el historial de reservas."
        href="/login"
        action="Ir al login"
      />
    );
  }

  if (!isOwner) {
    return (
      <AccessState
        title="Rol no permitido"
        text="Este historial esta disponible solo para cuentas de dueno."
        href="/profile"
        action="Volver al perfil"
      />
    );
  }

  const loading = loadingRestaurants || loadingReservations;
  const title = fixedRestaurantId
    ? selectedRestaurant
      ? `Reservas de ${selectedRestaurant.name}`
      : "Reservas del restaurante"
    : "Historial de reservas";

  return (
    <main className="min-h-screen text-stone-100">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100"
        style={{
          backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-black/60" />

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

        <nav className="relative z-10 flex flex-wrap items-center gap-3 text-sm text-stone-200">
          <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">
            Home
          </Link>
          <Link
            href="/owner/my-restaurants"
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            My Restaurants
          </Link>
          <Link
            href="/owner/reservations"
            className="rounded-full bg-amber-500/20 px-4 py-2 text-amber-200 transition hover:bg-amber-500/30"
          >
            Reservas
          </Link>
          <Link
            href="/owner/ingredients"
            className="rounded-full  px-4 py-2 transition hover:bg-white/10"
          >
            Ingredientes
          </Link>
        </nav>

        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#0f0906]/85 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/owner/my-restaurants"
                className="text-xs text-stone-400 transition hover:text-white"
              >
                Volver a mis restaurantes
              </Link>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-400">
                {fixedRestaurantId
                  ? "Reservas asociadas al restaurante seleccionado."
                  : "Reservas agrupadas desde todos tus restaurantes registrados."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReloadKey((current) => current + 1)}
              className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <section className="rounded-2xl border border-white/10 bg-[#121212]/80 p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Resumen
                </p>
                <div className="mt-4 space-y-3">
                  <Stat label="Total" value={String(statusCounts.total)} tone="text-white" />
                  <Stat label="Confirmadas" value={String(statusCounts.confirmed)} tone="text-emerald-300" />
                  <Stat label="Pendientes" value={String(statusCounts.pending)} tone="text-amber-300" />
                  <Stat label="Canceladas" value={String(statusCounts.cancelled)} tone="text-red-300" />
                  <Stat label="Atendidas" value={String(statusCounts.attended)} tone="text-sky-300" />
                </div>
              </section>

              {!fixedRestaurantId && (
                <section className="rounded-2xl border border-white/10 bg-[#121212]/80 p-5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    Por restaurante
                  </p>
                  <div className="mt-4 space-y-2">
                    {restaurants.length === 0 ? (
                      <p className="text-sm text-stone-400">No hay restaurantes cargados.</p>
                    ) : (
                      restaurants.map((restaurant) => (
                        <Link
                          key={restaurant.id}
                          href={`/owner/restaurants/${restaurant.id}/reservations`}
                          className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-amber-500/60"
                        >
                          <span className="block text-sm font-semibold text-white">
                            {restaurant.name || `Restaurante ${restaurant.id}`}
                          </span>
                          <span className="mt-1 block text-xs text-stone-400">
                            {countByRestaurant(reservations, restaurant.id)} reservas
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              )}

              {fixedRestaurantId && (
                <Link
                  href="/owner/reservations"
                  className="block rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
                >
                  Ver reservas de todos mis restaurantes
                </Link>
              )}
            </aside>

            <div className="space-y-5">
              {(message || error) && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    error
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-sky-500/30 bg-sky-500/10 text-sky-200"
                  }`}
                >
                  {error || message}
                </div>
              )}

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#121212]/80">
                <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Reservas registradas
                    </h2>
                    <p className="text-sm text-stone-400">
                      Fecha de reserva, mesa, personas y estado actual.
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-stone-300">
                    {targetRestaurants.length} restaurante(s)
                  </span>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-sm text-stone-300">
                    Cargando reservas...
                  </div>
                ) : sortedReservations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-stone-300">
                    No hay reservas para mostrar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm text-stone-200">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="border-b border-white/10 px-4 py-3">Restaurante</th>
                          <th className="border-b border-white/10 px-4 py-3">Reserva</th>
                          <th className="border-b border-white/10 px-4 py-3">Mesa</th>
                          <th className="border-b border-white/10 px-4 py-3">Personas</th>
                          <th className="border-b border-white/10 px-4 py-3">Estado</th>
                          <th className="border-b border-white/10 px-4 py-3">Creada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedReservations.map((reservation) => (
                          <tr
                            key={`${reservation.restaurantId}-${reservation.id}`}
                            className="border-b border-white/5 last:border-b-0"
                          >
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-white">
                                  {reservation.restaurantName}
                                </p>
                                <p className="text-xs text-stone-500">
                                  ID {reservation.restaurantId}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {formatDateTime(reservation.dateTimeReservation)}
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-semibold text-white">
                                {reservation.table}
                              </span>
                              {reservation.tableId ? (
                                <span className="ml-2 text-xs text-stone-500">
                                  #{reservation.tableId}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-4">{reservation.peopleCount}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                                  reservation.status,
                                )}`}
                              >
                                {reservation.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-stone-400">
                              {formatDateTime(reservation.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function fetchJson(endpoint: string, token: string, signal: AbortSignal) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json().catch(() => null) as Promise<unknown>;
}

async function readApiError(response: Response) {
  try {
    const json = await response.json();
    return (
      json?.error?.message ??
      json?.Error ??
      json?.message ??
      "No se pudo procesar la solicitud."
    );
  } catch {
    return "No se pudo procesar la solicitud.";
  }
}

function isOwnerRole(user: AuthUser | null) {
  const role = normalizeText(user?.role ?? "");
  return Boolean(
    user &&
      !user.isAdmin &&
      (role.includes("owner") || role.includes("dueno") || role.includes("due")),
  );
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractApiList(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) return payload.filter(isApiRecord);

  const record = toRecord(payload);
  const data = record.data ?? record.Data;
  if (Array.isArray(data)) return data.filter(isApiRecord);

  const dataRecord = toRecord(data);
  const nestedReservations = dataRecord.reservations ?? dataRecord.Reservations;
  if (Array.isArray(nestedReservations)) return nestedReservations.filter(isApiRecord);

  const directReservations = record.reservations ?? record.Reservations;
  if (Array.isArray(directReservations)) return directReservations.filter(isApiRecord);

  return [];
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function toRecord(value: unknown): ApiRecord {
  return isApiRecord(value) ? value : {};
}

function getValue(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }

  return undefined;
}

function getString(value: unknown, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function getNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function mapRestaurantFromApi(item: ApiRecord): RestaurantOption {
  return {
    id: getNumber(getValue(item, "id", "Id")),
    name: getString(getValue(item, "name", "Name"), "Restaurante sin nombre"),
    category: getString(getValue(item, "category", "Category"), "Categoria pendiente"),
  };
}

function mapReservationFromApi(
  item: ApiRecord,
  restaurant: RestaurantOption,
  index: number,
): ReservationRow {
  const id = getValue(item, "id", "Id");

  return {
    id: id === undefined ? `${restaurant.id}-${index}` : getString(id),
    userId: getString(getValue(item, "userId", "UserId"), "N/A"),
    restaurantId: getNumber(
      getValue(item, "restaurantId", "RestaurantId"),
      restaurant.id,
    ),
    restaurantName: restaurant.name,
    tableId: getNumber(getValue(item, "tableId", "TableId")) || undefined,
    table: getString(
      getValue(item, "numberMesa", "NumberMesa", "table", "Table"),
      "N/A",
    ),
    dateTimeReservation: getString(
      getValue(item, "dateTimeReservation", "DateTimeReservation"),
    ),
    createdAt: getString(getValue(item, "createdAt", "CreatedAt")),
    peopleCount: getNumber(getValue(item, "peopleCount", "PeopleCount")),
    status: mapReservationStatus(getValue(item, "status", "Status")),
  };
}

function mapReservationStatus(status: unknown): ReservationStatus {
  const value = normalizeText(String(status ?? ""));

  if (value === "1" || value.includes("pending") || value.includes("pendiente")) {
    return "Pendiente";
  }

  if (value === "2" || value.includes("confirm") || value.includes("confirmada")) {
    return "Confirmada";
  }

  if (value === "3" || value.includes("cancel")) {
    return "Cancelada";
  }

  if (value === "4" || value.includes("attend") || value.includes("atendida")) {
    return "Atendida";
  }

  return "Otro";
}

function statusColor(status: ReservationStatus) {
  if (status === "Confirmada") return "bg-emerald-500/20 text-emerald-300";
  if (status === "Pendiente") return "bg-amber-500/20 text-amber-200";
  if (status === "Cancelada") return "bg-red-500/20 text-red-300";
  if (status === "Atendida") return "bg-sky-500/20 text-sky-300";
  return "bg-stone-500/20 text-stone-300";
}

function formatDateTime(value: string) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function countByRestaurant(reservations: ReservationRow[], restaurantId: number) {
  return reservations.filter((reservation) => reservation.restaurantId === restaurantId).length;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <span className={`font-mono text-lg font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function AccessState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120904] px-5 text-stone-100">
      <section className="max-w-md rounded-2xl border border-[#2d180d] bg-[#180e08] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-stone-400">{text}</p>
        <Link
          href={href}
          className="mt-5 inline-flex rounded-lg bg-amber-500 px-5 py-3 text-xs font-bold uppercase text-neutral-950"
        >
          {action}
        </Link>
      </section>
    </main>
  );
}
