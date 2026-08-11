"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  LoadingScreen,
  PersonalInfoCard,
  ProfileHeader,
  ProfileHero,
  ProfileSidebar,
  RestaurantDraft,
  RestaurantRow,
  StatusBanner,
  TableCell,
  apiRequest,
  handleProfileSubmit as sharedHandleProfileSubmit,
  imagePresets,
  mapRestaurantFromApi,
  useProfileSession,
} from "../_shared";
type ApiRecord = Record<string, unknown>;

type OwnerReservation = {
  id: number;
  restaurantId?: number;
  restaurantName: string;
  table: string;
  date: string;
  guests: number;
  status: "Pendiente" | "Confirmada" | "Cancelada" | "Atendida" | "Otro";
};

type OwnerReviewSummary = {
  restaurantId?: number;
  restaurantName: string;
  averageRating: number;
  totalReviews: number;
  latestComment?: string;
};

export default function OwnerProfilePage() {
  const {
    router,
    token,
    sessionLoaded,
    isAuthenticated,
    user,
    updateUser,
    loadingApi,
    apiMessage,
    setApiMessage,
    setLoadingApi,
    userView,
    handleLogout,
  } = useProfileSession();

  const [saved, setSaved] = useState(false);
  const [ownerMessage, setOwnerMessage] = useState(
    "Restaurante listo para revisar antes de enviar a aprobacion.",
  );
  const [restaurant, setRestaurant] = useState<RestaurantDraft>({
    name: "TableUp Bistro",
    category: "Italiana",
    phone: "+1 (809) 555-0190",
    address: "Av. Principal #45, Santo Domingo",
    hours: "12:00 PM - 11:00 PM",
    capacity: "50 mesas / 120 personas",
    image: imagePresets[0].url,
    description:
      "Experiencia gastronomica moderna, servicio cercano y platos preparados para destacar en TableUp.",
  });
  const [restaurantRows, setRestaurantRows] = useState<RestaurantRow[]>([
    {
      name: "TableUp Bistro",
      category: "Italiana",
      phone: "+1 (809) 555-0190",
      address: "Av. Principal #45, Santo Domingo",
      hours: "12:00 PM - 11:00 PM",
      capacity: "50 mesas / 120 personas",
      image: imagePresets[0].url,
      description:
        "Experiencia gastronomica moderna, servicio cercano y platos preparados para destacar en TableUp.",
      status: "Pendiente",
      updatedAt: "Hoy",
    },
  ]);
  const [toEdit, setToEdit] = useState(false);
  const [reservationRows, setReservationRows] = useState<OwnerReservation[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<OwnerReviewSummary[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsMessage, setInsightsMessage] = useState("");

  const restaurantIdsKey = useMemo(
    () => restaurantRows.map((item) => item.id).filter(Boolean).join(","),
    [restaurantRows],
  );

  // Redirect clients that land on this route to their own page.
  useEffect(() => {
    if (sessionLoaded && isAuthenticated && user && !userView.isOwner) {
      router.replace("/profile/client");
    }
  }, [isAuthenticated, router, sessionLoaded, user, userView.isOwner]);

  useEffect(() => {
    if (!sessionLoaded || !isAuthenticated || !token || !userView.isOwner)
      return;

    const controller = new AbortController();

    async function loadRestaurants() {
      setLoadingApi(true);
      setApiMessage("");

      try {
        const restaurantsJson = await apiRequest(
          "/api/restaurants/my-restaurants",
          token as string,
          {
            signal: controller.signal,
          },
        );
        const rows = Array.isArray(restaurantsJson?.data)
          ? restaurantsJson.data.map(mapRestaurantFromApi)
          : [];

        setRestaurantRows(rows);
        if (rows[0]) {
          setRestaurant(rows[0]);
          setOwnerMessage("Restaurantes cargados desde la API.");
        } else {
          setOwnerMessage(
            "No tienes restaurantes registrados en la API todavia.",
          );
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setApiMessage(
            error instanceof Error
              ? error.message
              : "No se pudo conectar el perfil con la API.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingApi(false);
        }
      }
    }
    loadRestaurants();

    return () => controller.abort();
  }, [
    isAuthenticated,
    sessionLoaded,
    setApiMessage,
    setLoadingApi,
    token,
    userView.isOwner,
  ]);

  useEffect(() => {
    if (!sessionLoaded || !isAuthenticated || !token || !userView.isOwner) {
      return;
    }

    const restaurantsWithId = restaurantRows.filter(
      (item): item is RestaurantRow & { id: number } => typeof item.id === "number",
    );

    if (restaurantsWithId.length === 0) {
      Promise.resolve().then(() => {
        setReservationRows([]);
        setReviewSummaries([]);
        setInsightsMessage("Agrega o carga un restaurante para ver reservas y ratings.");
      });
      return;
    }

    const controller = new AbortController();

    async function loadOwnerInsights() {
      setInsightsLoading(true);
      setInsightsMessage("");

      const reservationResults = await Promise.allSettled(
        restaurantsWithId.map(async (item) => {
          const json = await apiRequest(
            `/api/reservations/restaurant/${item.id}`,
            token as string,
            { signal: controller.signal },
          );
          return extractApiList(json).map((reservation) =>
            mapReservationFromApi(reservation, item),
          );
        }),
      );

      const reviewResults = await Promise.allSettled(
        restaurantsWithId.map(async (item) => {
          const json = await apiRequest(
            `/api/reviews/restaurant/${item.id}`,
            token as string,
            { signal: controller.signal },
          );
          return mapReviewSummaryFromApi(json, item);
        }),
      );

      if (controller.signal.aborted) return;

      setReservationRows(
        reservationResults.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        ),
      );
      setReviewSummaries(
        reviewResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        ),
      );

      const hasRejected = [...reservationResults, ...reviewResults].some(
        (result) => result.status === "rejected",
      );
      setInsightsMessage(
        hasRejected
          ? "Algunas metricas no estan disponibles desde la API todavia."
          : "Resumen actualizado desde la API.",
      );
      setInsightsLoading(false);
    }

    loadOwnerInsights().catch(() => {
      if (!controller.signal.aborted) {
        setInsightsMessage("No se pudieron cargar las metricas del dashboard.");
        setInsightsLoading(false);
      }
    });

    return () => controller.abort();
  }, [
    isAuthenticated,
    restaurantIdsKey,
    restaurantRows,
    sessionLoaded,
    token,
    userView.isOwner,
  ]);

  if (!sessionLoaded || !isAuthenticated || !user || !userView.isOwner) {
    return <LoadingScreen />;
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    await sharedHandleProfileSubmit({
      event,
      token,
      updateUser,
      onSuccessMessage: setApiMessage,
      onErrorMessage: setApiMessage,
      onSaved: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      },
    });
  }

  async function handleRestaurantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setOwnerMessage(
        "No hay token de sesion para guardar el restaurante en la API.",
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Name", restaurant.name);
      formData.append("Category", restaurant.category);
      formData.append("Address", restaurant.address);
      formData.append("PhoneNumber", restaurant.phone);

      const endpoint = restaurant.id
        ? `/api/restaurants/${restaurant.id}`
        : "/api/restaurants";
      const method = restaurant.id ? "PUT" : "POST";
      const json = await apiRequest(endpoint, token, {
        method,
        body: formData,
      });
      const savedRestaurant = mapRestaurantFromApi(json?.data);

      setRestaurantRows((current) => {
        const existingIndex = current.findIndex(
          (item) => item.id === savedRestaurant.id,
        );
        if (existingIndex >= 0) {
          return current.map((item, index) =>
            index === existingIndex ? savedRestaurant : item,
          );
        }

        return [savedRestaurant, ...current];
      });
      setRestaurant(savedRestaurant);
      setOwnerMessage(json?.message ?? "Restaurante guardado en la API.");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setOwnerMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el restaurante en la API.",
      );
    }
  }

  function handleCreateRestaurant() {
    setRestaurant({
      id: undefined,
      name: "",
      category: "Italiana",
      phone: "",
      address: "",
      hours: "",
      capacity: "",
      image: imagePresets[0].url,
      description: "",
    });
    setOwnerMessage(
      "Completa el formulario de restaurante y presiona guardar para agregarlo a la tabla.",
    );
  }

  function handleEditRestaurant(item: RestaurantRow) {
    setRestaurant({
      id: item.id,
      name: item.name,
      category: item.category,
      phone: item.phone,
      address: item.address,
      hours: item.hours,
      capacity: item.capacity,
      image: item.image,
      description: item.description,
    });
    setOwnerMessage(
      `Editando ${item.name}. Guarda los cambios cuando termines.`,
    );
  }

  async function handleDeleteRestaurant(restaurantToDelete: RestaurantRow) {
    if (!restaurantToDelete.id) {
      setRestaurantRows((current) =>
        current.filter((item) => item.name !== restaurantToDelete.name),
      );
      setOwnerMessage("Restaurante eliminado de esta vista de perfil.");
      return;
    }

    if (!token) {
      setOwnerMessage(
        "No hay token de sesion para eliminar el restaurante en la API.",
      );
      return;
    }

    try {
      const json = await apiRequest(
        `/api/restaurants/${restaurantToDelete.id}`,
        token,
        { method: "DELETE" },
      );
      setRestaurantRows((current) =>
        current.filter((item) => item.id !== restaurantToDelete.id),
      );
      setOwnerMessage(json?.message ?? "Restaurante eliminado correctamente.");
    } catch (error) {
      setOwnerMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el restaurante en la API.",
      );
    }
  }

  const stats = [
    {
      label: "Restaurantes",
      value: String(restaurantRows.length),
      tone: "text-amber-400",
    },
    {
      label: "Pendientes",
      value: String(
        restaurantRows.filter((item) => item.status === "Pendiente").length,
      ),
      tone: "text-sky-400",
    },
    {
      label: "Aprobados",
      value: String(
        restaurantRows.filter((item) => item.status === "Aprobado").length,
      ),
      tone: "text-emerald-400",
    },
  ];

  return (
    <main className="min-h-screen bg-[#120904] text-stone-100">
      <ProfileHeader
        displayName={userView.displayName}
        isOwner
        initials={userView.initials}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 transition hover:bg-white/10"
        >
          ← Back
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ProfileSidebar
          displayName={userView.displayName}
          email={userView.email}
          initials={userView.initials}
          isOwner
          stats={stats}
          onEdit={() => setToEdit(true)}
        />

        <section className="z-10 ms-76 absolute grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          { toEdit ? <PersonalInfoCard
                        email={userView.email}
                        name={userView.name}
                        username={userView.username}
                        onSubmit={handleProfileSubmit}
                        onCancel={() => setToEdit(false)}
                      /> : null}

          {/*<RestaurantFormCard
            restaurant={restaurant}
            onRestaurantChange={setRestaurant}
            onSubmit={handleRestaurantSubmit}
          />*/}

        </section>

        <div className="min-w-0 space-y-6">
          <ProfileHero isOwner />

          <StatusBanner
            saved={saved}
            loadingApi={loadingApi}
            apiMessage=""
          />
          <OwnerDashboardSummary
            restaurants={restaurantRows}
            reservations={reservationRows}
            reviews={reviewSummaries}
            loading={insightsLoading}
            message={insightsMessage}
          />

          {/*<OwnerManagementPanel
            message={ownerMessage}
            restaurants={restaurantRows}
            onCreate={handleCreateRestaurant}
            onEdit={handleEditRestaurant}
            onDelete={handleDeleteRestaurant}
          />*/}

          <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
            <div className="flex flex-col gap-3 border-[#2d180d]/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
                        Mis Restaurantes
                      </p>
                <h2 className="mt-1 text-4xl font-bold text-white">
                  VER TODOS MIS RESTAURANTES
                </h2>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => router.push("/owner/my-restaurants")}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-xl font-extrabold italic uppercase text-neutral-950 transition hover:bg-amber-400"
                      >
                        Ir ahora!
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/owner/ingredients")}
                        className="rounded-lg border border-amber-500/50 px-4 py-2 text-xl font-extrabold italic uppercase text-amber-300 transition hover:border-amber-400 hover:text-amber-200"
                      >
                        Ingredientes
                      </button>
                    </div>
                  </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function OwnerDashboardSummary({
  restaurants,
  reservations,
  reviews,
  loading,
  message,
}: {
  restaurants: RestaurantRow[];
  reservations: OwnerReservation[];
  reviews: OwnerReviewSummary[];
  loading: boolean;
  message: string;
}) {
  const pendingRestaurants = restaurants.filter(
    (item) => item.status === "Pendiente",
  ).length;
  const approvedRestaurants = restaurants.filter(
    (item) => item.status === "Aprobado",
  ).length;
  const pendingReservations = reservations.filter(
    (item) => item.status === "Pendiente",
  ).length;
  const confirmedReservations = reservations.filter(
    (item) => item.status === "Confirmada",
  ).length;
  const cancelledReservations = reservations.filter(
    (item) => item.status === "Cancelada",
  ).length;
  const attendedReservations = reservations.filter(
    (item) => item.status === "Atendida",
  ).length;
  const totalReviews = reviews.reduce((sum, item) => sum + item.totalReviews, 0);
  const averageRating = totalReviews
    ? reviews.reduce(
        (sum, item) => sum + item.averageRating * item.totalReviews,
        0,
      ) / totalReviews
    : 0;
  const topRestaurants = [...reviews]
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 3);
  const nextReservations = [...reservations]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#2d180d]/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
            Dashboard del dueno
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Resumen de reservas, estados y ratings
          </h2>
          <p className="mt-2 text-xs leading-5 text-stone-400">
            Vista rapida de actividad conectada a la API por restaurante.
          </p>
        </div>
        <span className="rounded-lg border border-amber-700/40 bg-[#120904] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
          {loading ? "Cargando..." : message || "Listo"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryMetric
          label="Reservas totales"
          value={String(reservations.length)}
          detail={`${confirmedReservations} confirmadas`}
          tone="text-amber-300"
        />
        <SummaryMetric
          label="Rating promedio"
          value={averageRating ? averageRating.toFixed(1) : "0.0"}
          detail={`${totalReviews} resenas`}
          tone="text-emerald-300"
        />
        <SummaryMetric
          label="Restaurantes activos"
          value={String(approvedRestaurants)}
          detail={`${pendingRestaurants} pendientes`}
          tone="text-sky-300"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
            Estados de reservas
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <StatusPill label="Pendientes" value={pendingReservations} />
            <StatusPill label="Confirmadas" value={confirmedReservations} />
            <StatusPill label="Canceladas" value={cancelledReservations} />
            <StatusPill label="Atendidas" value={attendedReservations} />
          </div>
        </div>

        <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
            Proximas reservas
          </p>
          <div className="mt-4 grid gap-2">
            {nextReservations.length > 0 ? (
              nextReservations.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 rounded-lg border border-[#2d180d] bg-[#180e08] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {item.restaurantName}
                    </p>
                    <p className="text-xs text-stone-400">
                      Mesa {item.table} - {formatDashboardDate(item.date)} - {item.guests} personas
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-700/40 px-3 py-1 text-xs font-bold text-amber-300">
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-[#2d180d] bg-[#180e08] p-3 text-xs text-stone-400">
                Aun no hay reservas registradas para tus restaurantes.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
            Estados de restaurantes
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <StatusPill label="Total" value={restaurants.length} />
            <StatusPill label="Aprobados" value={approvedRestaurants} />
            <StatusPill label="Pendientes" value={pendingRestaurants} />
          </div>
        </div>

        <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
            Ratings por restaurante
          </p>
          <div className="mt-4 grid gap-2">
            {topRestaurants.length > 0 ? (
              topRestaurants.map((item) => (
                <div
                  key={`${item.restaurantId}-${item.restaurantName}`}
                  className="rounded-lg border border-[#2d180d] bg-[#180e08] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">
                      {item.restaurantName}
                    </p>
                    <span className="font-mono text-sm font-bold text-emerald-300">
                      {item.averageRating.toFixed(1)}/5
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {item.totalReviews} resenas
                    {item.latestComment ? ` - ${item.latestComment}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-[#2d180d] bg-[#180e08] p-3 text-xs text-stone-400">
                Aun no hay ratings disponibles para tus restaurantes.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-stone-400">{detail}</p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#2d180d] bg-[#180e08] px-3 py-2">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <span className="text-lg font-black text-amber-300">{value}</span>
    </div>
  );
}

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null;
}

function toApiRecord(value: unknown): ApiRecord {
  return isApiRecord(value) ? value : {};
}

function getApiValue(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function getApiString(value: unknown, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

function getApiNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function extractApiList(payload: unknown): ApiRecord[] {
  const record = toApiRecord(payload);
  const data = record.data;
  const dataRecord = toApiRecord(data);
  const reservations = dataRecord.reservations;
  const directReservations = record.reservations;

  if (Array.isArray(payload)) return payload.filter(isApiRecord);
  if (Array.isArray(data)) return data.filter(isApiRecord);
  if (Array.isArray(reservations)) return reservations.filter(isApiRecord);
  if (Array.isArray(directReservations)) return directReservations.filter(isApiRecord);
  return [];
}

function mapReservationFromApi(
  item: unknown,
  restaurant: RestaurantRow,
): OwnerReservation {
  const record = toApiRecord(item);

  return {
    id: getApiNumber(getApiValue(record, "id", "Id"), Date.now()),
    restaurantId: getApiNumber(
      getApiValue(record, "restaurantId", "RestaurantId"),
      restaurant.id ?? 0,
    ),
    restaurantName: restaurant.name,
    table: getApiString(
      getApiValue(record, "numberMesa", "NumberMesa", "tableId", "TableId"),
      "N/A",
    ),
    date: getApiString(
      getApiValue(
        record,
        "dateTimeReservation",
        "DateTimeReservation",
        "createdAt",
        "CreatedAt",
      ),
    ),
    guests: getApiNumber(getApiValue(record, "peopleCount", "PeopleCount")),
    status: mapReservationStatus(getApiValue(record, "status", "Status")),
  };
}

function mapReservationStatus(status: unknown): OwnerReservation["status"] {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "1" || normalized.includes("pending")) return "Pendiente";
  if (normalized === "2" || normalized.includes("confirm")) return "Confirmada";
  if (normalized === "3" || normalized.includes("cancel")) return "Cancelada";
  if (normalized === "4" || normalized.includes("attend")) return "Atendida";
  return "Otro";
}

function mapReviewSummaryFromApi(
  payload: unknown,
  restaurant: RestaurantRow,
): OwnerReviewSummary {
  const record = toApiRecord(payload);
  const data = toApiRecord(record.data ?? payload);
  const rawReviews = data.reviews ?? data.Reviews;
  const reviews = Array.isArray(rawReviews) ? rawReviews.filter(isApiRecord) : [];
  const averageRating = getApiNumber(
    getApiValue(data, "averageRating", "AverageRating"),
  );
  const totalReviews = getApiNumber(
    getApiValue(data, "totalReviews", "TotalReviews"),
    reviews.length,
  );
  const latestComment = reviews.find((item) =>
    Boolean(getApiValue(item, "comment", "Comment")),
  );

  return {
    restaurantId: getApiNumber(
      getApiValue(data, "restaurantId", "RestaurantId"),
      restaurant.id ?? 0,
    ),
    restaurantName: getApiString(
      getApiValue(data, "restaurantName", "RestaurantName"),
      restaurant.name,
    ),
    averageRating,
    totalReviews,
    latestComment: latestComment
      ? getApiString(getApiValue(latestComment, "comment", "Comment"))
      : undefined,
  };
}

function formatDashboardDate(value: string) {
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha pendiente";
  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function RestaurantFormCard({
  restaurant,
  onRestaurantChange,
  onSubmit,
}: {
  restaurant: RestaurantDraft;
  onRestaurantChange: (restaurant: RestaurantDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function updateRestaurant(field: keyof RestaurantDraft, value: string) {
    onRestaurantChange({ ...restaurant, [field]: value });
  }

  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 flex items-center gap-2 border-b border-[#2d180d]/70 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-700/50 bg-[#120904] text-amber-400">
          RS
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Editar datos del restaurante
          </h2>
          <p className="text-xs text-stone-400">
            Informacion comercial del local.
          </p>
        </div>
      </div>

      <div
        className="relative mb-4 h-40 overflow-hidden rounded-lg border border-[#2d180d] bg-cover bg-center"
        style={{ backgroundImage: `url(${restaurant.image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="rounded bg-amber-500 px-2 py-1 font-mono text-[10px] font-bold uppercase text-black">
            {restaurant.category}
          </span>
          <h3 className="mt-2 font-serif text-xl font-bold italic text-white">
            {restaurant.name}
          </h3>
          <p className="truncate font-mono text-[11px] text-stone-300">
            {restaurant.address}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {imagePresets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => updateRestaurant("image", preset.url)}
            className={`relative h-14 overflow-hidden rounded-lg border bg-cover bg-center ${
              restaurant.image === preset.url
                ? "border-amber-500"
                : "border-[#2d180d]"
            }`}
            style={{ backgroundImage: `url(${preset.url})` }}
            title={preset.name}
          >
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 font-mono text-[9px] font-bold text-white">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
        <DashboardInput
          label="Nombre del restaurante"
          value={restaurant.name}
          onChange={(value) => updateRestaurant("name", value)}
        />
        <DashboardInput
          label="Categoria"
          value={restaurant.category}
          onChange={(value) => updateRestaurant("category", value)}
        />
        <DashboardInput
          label="Telefono comercial"
          value={restaurant.phone}
          onChange={(value) => updateRestaurant("phone", value)}
        />
        <DashboardInput
          label="Horario"
          value={restaurant.hours}
          onChange={(value) => updateRestaurant("hours", value)}
        />
        <DashboardInput
          label="Direccion"
          value={restaurant.address}
          onChange={(value) => updateRestaurant("address", value)}
          wide
        />
        <DashboardInput
          label="Capacidad"
          value={restaurant.capacity}
          onChange={(value) => updateRestaurant("capacity", value)}
          wide
        />
        <label className="block space-y-1 sm:col-span-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
            Descripcion
          </span>
          <textarea
            rows={3}
            value={restaurant.description}
            onChange={(event) =>
              updateRestaurant("description", event.target.value)
            }
            className="w-full resize-none rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs leading-5 text-stone-200 outline-none transition focus:border-amber-500"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-400 sm:col-span-2"
        >
          Guardar datos del restaurante
        </button>
      </form>
    </section>
  );
}

function OwnerManagementPanel({
  message,
  restaurants,
  onCreate,
  onEdit,
  onDelete,
}: {
  message: string;
  restaurants: RestaurantRow[];
  onCreate: () => void;
  onEdit: (restaurant: RestaurantRow) => void;
  onDelete: (restaurant: RestaurantRow) => void;
}) {
  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 flex flex-col gap-3 border-b border-[#2d180d]/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
            Modulo de mis restaurantes
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">
            Crear, editar, eliminar y revisar aprobacion
          </h2>
          <p className="mt-2 text-xs leading-5 text-stone-400">{message}</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase text-neutral-950 transition hover:bg-amber-400"
        >
          Crear restaurante
        </button>
      </div>

      {/*<div className="grid gap-4 lg:grid-cols-3">
        <ActionCard title="Crear restaurante" text="Registra el local con datos comerciales, imagen y descripcion." />
        <ActionCard title="Editar restaurante" text="Actualiza nombre, categoria, horario, telefono y direccion." />
        <ActionCard title="Eliminar restaurante" text="Retira locales que ya no deben aparecer en tu cuenta." danger />
      </div>*/}

      <div className="mt-5 overflow-hidden rounded-xl border border-[#2d180d]">
        {restaurants.length === 0 ? (
          <div className="bg-[#120904] p-6 text-center">
            <p className="text-sm font-semibold text-white">
              No tienes restaurantes en esta vista.
            </p>
            <p className="mt-2 text-xs text-stone-500">
              Presiona crear restaurante para preparar uno nuevo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#2d180d]">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.name}
                className="grid gap-px bg-[#2d180d] md:grid-cols-[1.4fr_1fr_1fr_1fr]"
              >
                <TableCell
                  label="Restaurante"
                  value={restaurant.name || "Sin nombre"}
                  helper={restaurant.address || "Direccion pendiente"}
                />
                <TableCell
                  label="Categoria"
                  value={restaurant.category || "Sin categoria"}
                />
                <TableCell
                  label="Estado"
                  value={restaurant.status}
                  helper={restaurant.updatedAt}
                  tone={
                    restaurant.status === "Aprobado"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }
                />
                <div className="bg-[#120904] p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Acciones
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(restaurant)}
                      className="rounded border border-[#2d180d] px-3 py-2 text-xs text-stone-300 hover:border-amber-500"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(restaurant)}
                      className="rounded border border-red-900/70 px-3 py-2 text-xs text-red-300 hover:border-red-500"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*<div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ApprovalStep title="1. Solicitud" text="El dueno crea o edita el restaurante." active />
        <ApprovalStep title="2. Revision" text="El administrador revisa la informacion." active />
        <ApprovalStep title="3. Publicacion" text="El restaurante aprobado queda visible." />
      </div>*/}
    </section>
  );
}

function DashboardInput({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`block space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-200 outline-none transition focus:border-amber-500"
      />
    </label>
  );
}

function ActionCard({
  title,
  text,
  danger = false,
}: {
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#2d180d] bg-[#120904] p-4">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border font-bold ${
          danger
            ? "border-red-900/70 text-red-300"
            : "border-amber-700/50 text-amber-400"
        }`}
      >
        {danger ? "!" : "+"}
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}

function ApprovalStep({
  title,
  text,
  active = false,
}: {
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${active ? "border-amber-700/50 bg-amber-950/20" : "border-[#2d180d] bg-[#120904]"}`}
    >
      <p
        className={`text-sm font-semibold ${active ? "text-amber-300" : "text-stone-300"}`}
      >
        {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}
