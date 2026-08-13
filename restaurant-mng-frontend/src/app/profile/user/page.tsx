"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  API_URL,
  LoadingScreen,
  PersonalInfoCard,
  ProfileHeader,
  ProfileHero,
  ProfileSidebar,
  ReservationItem,
  StatusBanner,
  TableCell,
  apiRequest,
  foodCategories,
  formatReservationDate,
  handleProfileSubmit as sharedHandleProfileSubmit,
  mapReservationStatus,
  useProfileSession,
} from "../_shared";
import ProfileReviews from "./_profileReviews";

export default function ClientProfilePage() {
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
  const [toEdit, setToEdit] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [favoriteCategories, setFavoriteCategories] = useState([
    "Italiana",
    "Postres",
  ]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  

  // Redirect owners that land on this route to their own page.
  useEffect(() => {
    if (sessionLoaded && isAuthenticated && user && userView.isOwner) {
      router.replace("/profile/owner");
    }
  }, [isAuthenticated, router, sessionLoaded, user, userView.isOwner]);

  useEffect(() => {
    if (!sessionLoaded || !isAuthenticated || !token || userView.isOwner)
      return;

    const controller = new AbortController();

    async function GetMyReviews() {
      setLoadingApi(true);
      setApiMessage("");

      try {
        const res = await apiRequest(
          "/api/reviews/my-history",
          token as string,
          {
            signal: controller.signal,
          },
        );
        setMyReviews(res.data);
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
    async function loadReservations() {
      setLoadingApi(true);
      setApiMessage("");

      try {
        const reservationsJson = await apiRequest(
          "/api/reservations/me",
          token as string,
          {
            signal: controller.signal,
          },
        );
        const reservationsData = Array.isArray(reservationsJson) ? reservationsJson : [];
        setReservations(reservationsData);
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

    GetMyReviews();
    loadReservations();

    return () => controller.abort();
  }, [
    isAuthenticated,
    sessionLoaded,
    setApiMessage,
    setLoadingApi,
    token,
    userView.isOwner,
  ]);

  if (!sessionLoaded || !isAuthenticated || !user || userView.isOwner) {
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

  function toggleCategory(category: string) {
    setFavoriteCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  const stats = [
    {
      label: "Reservas",
      value: String(reservations.length),
      tone: "text-emerald-400",
    },
    {
      label: "Favoritos",
      value: String(favoriteCategories.length),
      tone: "text-amber-400",
    },
    {
      label: "Pendientes",
      value: String(
        reservations.filter(
          (item) => mapReservationStatus(item.status) === "Pendiente",
        ).length,
      ),
      tone: "text-sky-400",
    },
  ];

  return (
    <main className="min-h-screen bg-[#120904] text-stone-100">
      <ProfileHeader
        displayName={userView.displayName}
        isOwner={false}
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
          isOwner={false}
          stats={stats}
          onEdit={() => setToEdit(true)}
        />

        <section className="z-10 ms-76 absolute grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                          {toEdit ? (
                            <PersonalInfoCard
                              email={userView.email}
                              name={userView.name}
                              username={userView.username}
                              onSubmit={handleProfileSubmit}
                              onCancel={() => setToEdit(false)}
                            />
                          ) : null}
              
                          {/*
                            Currently is not functional
              
                            <ClientProfileCard
                            favoriteCategories={favoriteCategories}
                            onToggleCategory={toggleCategory}
                          />*/}
                        </section>

        <div className="min-w-0 space-y-6">
          <ProfileHero isOwner={false} />

          <StatusBanner
            saved={saved}
            loadingApi={loadingApi}
            apiMessage={apiMessage}
          />

          <ClientActivityPanel
            favoriteCategories={favoriteCategories}
            reservations={reservations}
          />

          {/* Sección de restaurantes guardados eliminada */}

          <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
            <div className="mb-5 border-b border-[#2d180d]/70 pb-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
                      Historial de Reseñas realizadas
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-white">
                Mis reseñas
              </h2>            
            </div>

            <ul className="max-h-1/3 overflow-y-auto divide-y divide-[#2d180d]/70 rounded-md border border-[#2d180d]/70 bg-[#120a05]">
              {myReviews.map((r, i) => (
                <ProfileReviews key={i} r={r} />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

function ClientProfileCard({
  favoriteCategories,
  onToggleCategory,
}: {
  favoriteCategories: string[];
  onToggleCategory: (category: string) => void;
}) {
  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 flex items-center gap-2 border-b border-[#2d180d]/70 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-700/50 bg-[#120904] text-emerald-400">
          FV
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Preferencias del cliente
          </h2>
          <p className="text-xs text-stone-400">
            Sabores y experiencias favoritas.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2d180d] bg-[#120904]/70 p-4">
        <p className="text-xs leading-5 text-stone-400">
          Marca tus estilos gastronomicos favoritos para que el perfil se vea
          completo y personalizado.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {foodCategories.map((category) => {
            const active = favoriteCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10px] transition ${
                  active
                    ? "border-amber-500/60 bg-amber-500/20 text-amber-300"
                    : "border-[#2d180d] bg-[#120904] text-stone-400 hover:border-stone-600"
                }`}
              >
                {active ? "* " : ""}
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniInfo
          title="Preferencia principal"
          value={favoriteCategories[0] ?? "Sin seleccionar"}
        />
        <MiniInfo title="Experiencia sugerida" value="Cena tranquila" />
      </div>
    </section>
  );
}

function ClientActivityPanel({
  favoriteCategories,
  reservations,
}: {
  favoriteCategories: string[];
  reservations: ReservationItem[];
}) {
  const recommendedRestaurants = [
    {
      name: "Bella Italia Trattoria",
      category: favoriteCategories[0] ?? "Italiana",
      note: "Ideal para cena familiar",
    },
    {
      name: "Mar de Plata",
      category: "Mariscos",
      note: "Buena opcion para reservas de fin de semana",
    },
  ];

  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 border-b border-[#2d180d]/70 pb-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
          Actividad reciente
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">
          Reservas
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ClientStatus
          title="Confirmadas"
          value={String(
            reservations.filter(
              (item) => mapReservationStatus(item.status) === "Confirmada",
            ).length,
          )}
          tone="text-emerald-400"
        />
        <ClientStatus
          title="Pendientes"
          value={String(
            reservations.filter(
              (item) => mapReservationStatus(item.status) === "Pendiente",
            ).length,
          )}
          tone="text-amber-400"
        />
        <ClientStatus
          title="Canceladas"
          value={String(
            reservations.filter(
              (item) => mapReservationStatus(item.status) === "Cancelada",
            ).length,
          )}
          tone="text-stone-500"
        />
      </div>

      {reservations.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#2d180d] bg-[#120904] p-5 text-center">
          <p className="text-sm font-semibold text-stone-200">
            Aun no hay reservas cargadas desde la API.
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Cuando existan reservas para este cliente, aqui apareceran fechas,
            mesas, personas y estados.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#2d180d]">
          <div className="divide-y divide-[#2d180d]">
            {reservations.slice(0, 4).map((reservation) => (
              <div
                key={reservation.id}
                className="grid gap-px bg-[#2d180d] md:grid-cols-4"
              >
                <TableCell
                  label="Restaurante"
                  value={`ID ${reservation.restaurantId ?? "-"}`}
                  helper={`Mesa ${reservation.numberMesa ?? reservation.tableId ?? "-"}`}
                />
                <TableCell
                  label="Fecha"
                  value={formatReservationDate(reservation.dateTimeReservation)}
                />
                <TableCell
                  label="Personas"
                  value={String(reservation.peopleCount ?? "-")}
                />
                <TableCell
                  label="Estado"
                  value={mapReservationStatus(reservation.status)}
                  tone="text-amber-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/*<div className="mt-5 grid gap-4 md:grid-cols-2">
        {recommendedRestaurants.map((restaurant) => (
          <div
            key={restaurant.name}
            className="rounded-xl border border-[#2d180d] bg-[#120904] p-4"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {restaurant.category}
            </p>
            <h3 className="mt-2 text-sm font-bold text-white">
              {restaurant.name}
            </h3>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {restaurant.note}
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg border border-[#2d180d] px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-amber-500"
            >
              Ver sugerencia
            </button>
          </div>
        ))}
      </div>*/}
    </section>
  );
}

function MiniInfo({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2d180d] bg-[#120904] px-4 py-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">
        {title}
      </p>
      <p className="mt-1 text-xs font-semibold text-stone-200">{value}</p>
    </div>
  );
}

function ClientStatus({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-[#2d180d] bg-[#120904] p-4 text-center">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {title}
      </p>
      <p className={`mt-2 font-mono text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
