"use client";

import { FormEvent, useEffect, useState } from "react";
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
