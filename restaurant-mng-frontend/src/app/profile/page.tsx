"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";

type UserData = {
  id?: string | number;
  Id?: string | number;
  name?: string;
  Name?: string;
  username?: string;
  Username?: string;
  email?: string;
  Email?: string;
  role?: string;
};

type RestaurantDraft = {
  id?: number;
  name: string;
  category: string;
  phone: string;
  address: string;
  hours: string;
  capacity: string;
  image: string;
  description: string;
};

type RestaurantRow = RestaurantDraft & {
  id?: number;
  status: "Borrador" | "Pendiente" | "Aprobado";
  updatedAt: string;
};

type ReservationItem = {
  id?: number;
  restaurantId?: number;
  tableId?: number;
  numberMesa?: string;
  dateTimeReservation?: string;
  peopleCount?: number;
  status?: string | number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";

const ownerRoles = ["owner", "dueno", "due\u00f1o", "due\u00c3\u00b1o"];

const imagePresets = [
  {
    name: "Italiana",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Parrilla",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sushi",
    url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Bistro",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
];

const foodCategories = [
  "Italiana",
  "Carnes & Parrilla",
  "Fusion Asiatica",
  "Mariscos",
  "Bistro",
  "Gourmet",
  "Postres",
  "Cafe",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, logout } = useAuthStore() as {
    user: UserData | null;
    token: string | null;
    isAuthenticated: boolean;
    updateUser: (data: Partial<UserData>) => void;
    logout: () => void;
  };

  const [saved, setSaved] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [favoriteCategories, setFavoriteCategories] = useState(["Italiana", "Postres"]);
  const [ownerMessage, setOwnerMessage] = useState("Restaurante listo para revisar antes de enviar a aprobacion.");
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantDraft>({
    name: "TableUp Bistro",
    category: "Italiana",
    phone: "+1 (809) 555-0190",
    address: "Av. Principal #45, Santo Domingo",
    hours: "12:00 PM - 11:00 PM",
    capacity: "50 mesas / 120 personas",
    image: imagePresets[0].url,
    description: "Experiencia gastronomica moderna, servicio cercano y platos preparados para destacar en TableUp.",
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
      description: "Experiencia gastronomica moderna, servicio cercano y platos preparados para destacar en TableUp.",
      status: "Pendiente",
      updatedAt: "Hoy",
    },
  ]);

  useEffect(() => setSessionLoaded(true), []);

  useEffect(() => {
    if (sessionLoaded && (!isAuthenticated || !user)) {
      router.replace("/login");
    }
  }, [isAuthenticated, router, sessionLoaded, user]);

  useEffect(() => {
    if (!sessionLoaded || !isAuthenticated || !token) return;

    const controller = new AbortController();
    const authToken = token;

    async function loadProfileData() {
      setLoadingApi(true);
      setApiMessage("");

      try {
        const profileJson = await apiRequest("/api/auth/me", authToken, { signal: controller.signal });
        const profile = profileJson?.data;

        if (profile) {
          updateUser({
            id: profile.id ?? profile.Id,
            name: profile.name ?? profile.Name,
            username: profile.username ?? profile.Username,
            email: profile.email ?? profile.Email,
            role: profile.role ?? profile.Role,
          });
        }

        const profileRole = String(profile?.role ?? profile?.Role ?? user?.role ?? "");
        const normalizedRole = profileRole
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const owner = ownerRoles.includes(normalizedRole);

        if (owner) {
          const restaurantsJson = await apiRequest("/api/restaurants/my-restaurants", authToken, {
            signal: controller.signal,
          });
          const rows = Array.isArray(restaurantsJson?.data)
            ? restaurantsJson.data.map(mapRestaurantFromApi)
            : [];

          setRestaurantRows(rows);
          if (rows[0]) {
            setRestaurant(rows[0]);
            setOwnerMessage("Restaurantes cargados desde la API.");
          } else {
            setOwnerMessage("No tienes restaurantes registrados en la API todavia.");
          }
        } else {
          const reservationsJson = await apiRequest("/api/reservations/me", authToken, {
            signal: controller.signal,
          });
          setReservations(Array.isArray(reservationsJson) ? reservationsJson : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setApiMessage(error instanceof Error ? error.message : "No se pudo conectar el perfil con la API.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingApi(false);
        }
      }
    }

    loadProfileData();

    return () => controller.abort();
  }, [isAuthenticated, sessionLoaded, token, updateUser, user?.role]);

  const userView = useMemo(() => {
    const role = user?.role ?? "Client";
    const normalizedRole = role
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const isOwner = ownerRoles.includes(normalizedRole);
    const email = user?.email ?? user?.Email ?? "Sin correo registrado";
    const name = user?.name ?? user?.Name ?? "";
    const username = user?.username ?? user?.Username ?? "";
    const displayName = name || username || "Usuario";
    const initials = displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return { displayName, email, username, name, isOwner, initials };
  }, [user]);

  if (!sessionLoaded || !isAuthenticated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#120904] text-stone-300">
        Cargando perfil...
      </main>
    );
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password || confirmPassword) {
      if (!token) {
        setApiMessage("No hay token de sesion para actualizar el perfil.");
        return;
      }

      try {
        const json = await apiRequest("/api/auth/me/profile", token, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Name: name,
            Password: password,
            ConfirmPassword: confirmPassword,
          }),
        });

        updateUser({
          name: json?.data?.name ?? json?.data?.Name ?? name,
        });
        setApiMessage("Perfil actualizado en la API.");
      } catch (error) {
        setApiMessage(error instanceof Error ? error.message : "No se pudo actualizar el perfil en la API.");
        return;
      }
    } else {
      setApiMessage("Nombre actualizado en esta sesion. Para guardar en API, completa nueva contrasena y confirmacion.");
    }

    updateUser({
      name,
      username: String(formData.get("username") ?? "").trim(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  async function handleRestaurantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setOwnerMessage("No hay token de sesion para guardar el restaurante en la API.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Name", restaurant.name);
      formData.append("Category", restaurant.category);
      formData.append("Address", restaurant.address);
      formData.append("PhoneNumber", restaurant.phone);

      const endpoint = restaurant.id ? `/api/restaurants/${restaurant.id}` : "/api/restaurants";
      const method = restaurant.id ? "PUT" : "POST";
      const json = await apiRequest(endpoint, token, { method, body: formData });
      const savedRestaurant = mapRestaurantFromApi(json?.data);

      setRestaurantRows((current) => {
        const existingIndex = current.findIndex((item) => item.id === savedRestaurant.id);
        if (existingIndex >= 0) {
          return current.map((item, index) => (index === existingIndex ? savedRestaurant : item));
        }

        return [savedRestaurant, ...current];
      });
      setRestaurant(savedRestaurant);
      setOwnerMessage(json?.message ?? "Restaurante guardado en la API.");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "No se pudo guardar el restaurante en la API.");
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
    setOwnerMessage("Completa el formulario de restaurante y presiona guardar para agregarlo a la tabla.");
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
    setOwnerMessage(`Editando ${item.name}. Guarda los cambios cuando termines.`);
  }

  async function handleDeleteRestaurant(restaurantToDelete: RestaurantRow) {
    if (!restaurantToDelete.id) {
      setRestaurantRows((current) => current.filter((item) => item.name !== restaurantToDelete.name));
      setOwnerMessage("Restaurante eliminado de esta vista de perfil.");
      return;
    }

    if (!token) {
      setOwnerMessage("No hay token de sesion para eliminar el restaurante en la API.");
      return;
    }

    try {
      const json = await apiRequest(`/api/restaurants/${restaurantToDelete.id}`, token, { method: "DELETE" });
      setRestaurantRows((current) => current.filter((item) => item.id !== restaurantToDelete.id));
      setOwnerMessage(json?.message ?? "Restaurante eliminado correctamente.");
    } catch (error) {
      setOwnerMessage(error instanceof Error ? error.message : "No se pudo eliminar el restaurante en la API.");
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function toggleCategory(category: string) {
    setFavoriteCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  }

  const stats = userView.isOwner
    ? [
        { label: "Restaurantes", value: String(restaurantRows.length), tone: "text-amber-400" },
        { label: "Pendientes", value: String(restaurantRows.filter((item) => item.status === "Pendiente").length), tone: "text-sky-400" },
        { label: "Aprobados", value: String(restaurantRows.filter((item) => item.status === "Aprobado").length), tone: "text-emerald-400" },
      ]
    : [
        { label: "Reservas", value: String(reservations.length), tone: "text-emerald-400" },
        { label: "Favoritos", value: String(favoriteCategories.length), tone: "text-amber-400" },
        { label: "Pendientes", value: String(reservations.filter((item) => mapReservationStatus(item.status) === "Pendiente").length), tone: "text-sky-400" },
      ];

  return (
    <main className="min-h-screen bg-[#120904] text-stone-100">
      <header className="sticky top-0 z-30 border-b border-[#2d180d] bg-[#120904]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-600/60 bg-[#180e08]">
              <Image src="/tableup-logo.png" alt="TableUp" width={30} height={30} className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-xl font-semibold italic text-white">TableUp</p>
                <span className="rounded-full border border-sky-800/40 bg-sky-950/70 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                  Perfil
                </span>
              </div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[2px] text-[#d97706]">
                Gestion gastronomica inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-3 rounded-lg border border-[#2d180d] bg-[#180e08] px-3 py-2 text-right">
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white">{userView.displayName}</p>
                <p
                  className={`mt-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                    userView.isOwner
                      ? "border-amber-800/50 bg-amber-950/80 text-amber-400"
                      : "border-emerald-800/50 bg-emerald-950/80 text-emerald-400"
                  }`}
                >
                  {userView.isOwner ? "Propietario" : "Cliente"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-600/50 bg-[#2d180d] text-sm font-bold text-amber-400">
                {userView.isOwner ? "CH" : "US"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:border-red-500"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5 shadow-2xl shadow-black/20">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-amber-500/40 bg-[#2d180d] text-3xl font-bold text-amber-400">
              {userView.initials}
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#180e08] bg-emerald-400" />
            </div>
            <div className="mt-4 text-center">
              <h1 className="break-words text-xl font-bold text-white">{userView.displayName}</h1>
              <p className="mt-1 break-all text-xs text-stone-400">{userView.email}</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2">
              <ProfileMeta label="Estado" value="Cuenta activa" />
              <ProfileMeta label="Rol" value={userView.isOwner ? "Dueno / Propietario" : "Cliente"} />
              <ProfileMeta label="Acceso" value="Panel TableUp" />
            </div>
          </section>

          <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/80 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">
              Resumen rapido
            </p>
            <div className="mt-3 space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-lg border border-[#2d180d] bg-[#120904] px-4 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">{stat.label}</span>
                  <span className={`font-mono text-lg font-bold ${stat.tone}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-xl border border-[#2d180d] bg-[#180e08]/90">
            <div className="relative min-h-52 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
              <div className="absolute inset-0 bg-gradient-to-r from-[#120904] via-[#120904]/80 to-black/20" />
              <div className="relative p-6 sm:p-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-[#f59e0b]">
                  {userView.isOwner ? "Panel de propietario" : "Perfil de cliente"}
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
                  {userView.isOwner ? "Gestiona tu restaurante con estilo profesional." : "Tu experiencia gastronomica en un solo lugar."}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
                  {userView.isOwner
                    ? "Revisa datos comerciales, estado de aprobacion, acciones principales y vista previa de tu restaurante."
                    : "Consulta tu informacion, tus preferencias, reservas recientes y recomendaciones de TableUp."}
                </p>
              </div>
            </div>
          </section>

          {saved && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
              Cambios guardados correctamente.
            </div>
          )}

          {(loadingApi || apiMessage) && (
            <div className="rounded-lg border border-sky-800/40 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
              {loadingApi ? "Conectando perfil con la API..." : apiMessage}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <PersonalInfoCard
              email={userView.email}
              name={userView.name}
              username={userView.username}
              onSubmit={handleProfileSubmit}
            />
            {userView.isOwner ? (
              <OwnerProfileCard
                restaurant={restaurant}
                onRestaurantChange={setRestaurant}
                onSubmit={handleRestaurantSubmit}
              />
            ) : (
              <ClientProfileCard favoriteCategories={favoriteCategories} onToggleCategory={toggleCategory} />
            )}
          </section>

          {userView.isOwner ? (
            <OwnerManagementPanel
              message={ownerMessage}
              restaurants={restaurantRows}
              onCreate={handleCreateRestaurant}
              onEdit={handleEditRestaurant}
              onDelete={handleDeleteRestaurant}
            />
          ) : (
            <ClientActivityPanel favoriteCategories={favoriteCategories} reservations={reservations} />
          )}
        </div>
      </div>
    </main>
  );
}

function ProfileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 px-3 py-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-stone-200">{value}</p>
    </div>
  );
}

function PersonalInfoCard({
  email,
  name,
  username,
  onSubmit,
}: {
  email: string;
  name: string;
  username: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
      <div className="mb-5 flex items-center gap-2 border-b border-[#2d180d]/70 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-700/50 bg-[#120904] text-amber-400">
          ID
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Informacion personal</h2>
          <p className="text-xs text-stone-400">Datos visibles de tu cuenta.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <ProfileInput name="name" label="Nombre completo" defaultValue={name} />
        <ProfileInput name="username" label="Nombre de usuario" defaultValue={username} />
        <label className="block space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">Correo electronico</span>
          <input
            value={email}
            disabled
            className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-500"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileInput name="password" label="Nueva contrasena" defaultValue="" type="password" />
          <ProfileInput name="confirmPassword" label="Confirmar contrasena" defaultValue="" type="password" />
        </div>
        <p className="text-[11px] leading-5 text-stone-500">
          La API del backend requiere nueva contrasena y confirmacion para guardar cambios de perfil.
        </p>
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-400"
        >
          Guardar perfil
        </button>
      </form>
    </section>
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Preferencias del cliente</h2>
          <p className="text-xs text-stone-400">Sabores y experiencias favoritas.</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2d180d] bg-[#120904]/70 p-4">
        <p className="text-xs leading-5 text-stone-400">
          Marca tus estilos gastronomicos favoritos para que el perfil se vea completo y personalizado.
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
        <MiniInfo title="Preferencia principal" value={favoriteCategories[0] ?? "Sin seleccionar"} />
        <MiniInfo title="Experiencia sugerida" value="Cena tranquila" />
      </div>
    </section>
  );
}

function OwnerProfileCard({
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Editar datos del restaurante</h2>
          <p className="text-xs text-stone-400">Informacion comercial del local.</p>
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
          <h3 className="mt-2 font-serif text-xl font-bold italic text-white">{restaurant.name}</h3>
          <p className="truncate font-mono text-[11px] text-stone-300">{restaurant.address}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {imagePresets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => updateRestaurant("image", preset.url)}
            className={`relative h-14 overflow-hidden rounded-lg border bg-cover bg-center ${
              restaurant.image === preset.url ? "border-amber-500" : "border-[#2d180d]"
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
        <DashboardInput label="Nombre del restaurante" value={restaurant.name} onChange={(value) => updateRestaurant("name", value)} />
        <DashboardInput label="Categoria" value={restaurant.category} onChange={(value) => updateRestaurant("category", value)} />
        <DashboardInput label="Telefono comercial" value={restaurant.phone} onChange={(value) => updateRestaurant("phone", value)} />
        <DashboardInput label="Horario" value={restaurant.hours} onChange={(value) => updateRestaurant("hours", value)} />
        <DashboardInput label="Direccion" value={restaurant.address} onChange={(value) => updateRestaurant("address", value)} wide />
        <DashboardInput label="Capacidad" value={restaurant.capacity} onChange={(value) => updateRestaurant("capacity", value)} wide />
        <label className="block space-y-1 sm:col-span-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">Descripcion</span>
          <textarea
            rows={3}
            value={restaurant.description}
            onChange={(event) => updateRestaurant("description", event.target.value)}
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
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Modulo de mis restaurantes</p>
          <h2 className="mt-1 text-lg font-bold text-white">Crear, editar, eliminar y revisar aprobacion</h2>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <ActionCard title="Crear restaurante" text="Registra el local con datos comerciales, imagen y descripcion." />
        <ActionCard title="Editar restaurante" text="Actualiza nombre, categoria, horario, telefono y direccion." />
        <ActionCard title="Eliminar restaurante" text="Retira locales que ya no deben aparecer en tu cuenta." danger />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[#2d180d]">
        {restaurants.length === 0 ? (
          <div className="bg-[#120904] p-6 text-center">
            <p className="text-sm font-semibold text-white">No tienes restaurantes en esta vista.</p>
            <p className="mt-2 text-xs text-stone-500">Presiona crear restaurante para preparar uno nuevo.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2d180d]">
            {restaurants.map((restaurant) => (
              <div key={restaurant.name} className="grid gap-px bg-[#2d180d] md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <TableCell label="Restaurante" value={restaurant.name || "Sin nombre"} helper={restaurant.address || "Direccion pendiente"} />
                <TableCell label="Categoria" value={restaurant.category || "Sin categoria"} />
                <TableCell
                  label="Estado"
                  value={restaurant.status}
                  helper={restaurant.updatedAt}
                  tone={restaurant.status === "Aprobado" ? "text-emerald-400" : "text-amber-400"}
                />
                <div className="bg-[#120904] p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">Acciones</p>
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

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ApprovalStep title="1. Solicitud" text="El dueno crea o edita el restaurante." active />
        <ApprovalStep title="2. Revision" text="El administrador revisa la informacion." active />
        <ApprovalStep title="3. Publicacion" text="El restaurante aprobado queda visible." />
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
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Actividad reciente</p>
        <h2 className="mt-1 text-lg font-bold text-white">Reservas y restaurantes guardados</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ClientStatus title="Confirmadas" value={String(reservations.filter((item) => mapReservationStatus(item.status) === "Confirmada").length)} tone="text-emerald-400" />
        <ClientStatus title="Pendientes" value={String(reservations.filter((item) => mapReservationStatus(item.status) === "Pendiente").length)} tone="text-amber-400" />
        <ClientStatus title="Canceladas" value={String(reservations.filter((item) => mapReservationStatus(item.status) === "Cancelada").length)} tone="text-stone-500" />
      </div>

      {reservations.length === 0 ? (
        <div className="mt-5 rounded-xl border border-[#2d180d] bg-[#120904] p-5 text-center">
          <p className="text-sm font-semibold text-stone-200">Aun no hay reservas cargadas desde la API.</p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Cuando existan reservas para este cliente, aqui apareceran fechas, mesas, personas y estados.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#2d180d]">
          <div className="divide-y divide-[#2d180d]">
            {reservations.slice(0, 4).map((reservation) => (
              <div key={reservation.id} className="grid gap-px bg-[#2d180d] md:grid-cols-4">
                <TableCell label="Restaurante" value={`ID ${reservation.restaurantId ?? "-"}`} helper={`Mesa ${reservation.numberMesa ?? reservation.tableId ?? "-"}`} />
                <TableCell label="Fecha" value={formatReservationDate(reservation.dateTimeReservation)} />
                <TableCell label="Personas" value={String(reservation.peopleCount ?? "-")} />
                <TableCell label="Estado" value={mapReservationStatus(reservation.status)} tone="text-amber-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {recommendedRestaurants.map((restaurant) => (
          <div key={restaurant.name} className="rounded-xl border border-[#2d180d] bg-[#120904] p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">{restaurant.category}</p>
            <h3 className="mt-2 text-sm font-bold text-white">{restaurant.name}</h3>
            <p className="mt-2 text-xs leading-5 text-stone-500">{restaurant.note}</p>
            <button
              type="button"
              className="mt-4 rounded-lg border border-[#2d180d] px-3 py-2 text-xs font-semibold text-stone-300 transition hover:border-amber-500"
            >
              Ver sugerencia
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniInfo({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2d180d] bg-[#120904] px-4 py-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">{title}</p>
      <p className="mt-1 text-xs font-semibold text-stone-200">{value}</p>
    </div>
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
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-200 outline-none transition focus:border-amber-500"
      />
    </label>
  );
}

function ProfileInput({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-200 outline-none transition focus:border-amber-500"
      />
    </label>
  );
}

function ActionCard({ title, text, danger = false }: { title: string; text: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-[#2d180d] bg-[#120904] p-4">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border font-bold ${
          danger ? "border-red-900/70 text-red-300" : "border-amber-700/50 text-amber-400"
        }`}
      >
        {danger ? "!" : "+"}
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}

function TableCell({
  label,
  value,
  helper,
  tone = "text-stone-200",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: string;
}) {
  return (
    <div className="bg-[#120904] p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${tone}`}>{value}</p>
      {helper && <p className="mt-1 text-xs text-stone-500">{helper}</p>}
    </div>
  );
}

function ApprovalStep({ title, text, active = false }: { title: string; text: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${active ? "border-amber-700/50 bg-amber-950/20" : "border-[#2d180d] bg-[#120904]"}`}>
      <p className={`text-sm font-semibold ${active ? "text-amber-300" : "text-stone-300"}`}>{title}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}

function ClientStatus({ title, value, tone }: { title: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-[#2d180d] bg-[#120904] p-4 text-center">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">{title}</p>
      <p className={`mt-2 font-mono text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

async function apiRequest(endpoint: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(json?.error?.message ?? json?.message ?? "La API no pudo procesar la solicitud.");
  }

  return json;
}

function mapRestaurantFromApi(item: any): RestaurantRow {
  const images = item?.images ?? item?.Images ?? [];
  const image = Array.isArray(images) && images.length > 0 ? images[0] : imagePresets[0].url;

  return {
    id: item?.id ?? item?.Id,
    name: item?.name ?? item?.Name ?? "",
    category: item?.category ?? item?.Category ?? "Italiana",
    phone: item?.phoneNumber ?? item?.PhoneNumber ?? "",
    address: item?.address ?? item?.Address ?? "",
    hours: "Horario pendiente",
    capacity: "Capacidad pendiente",
    image,
    description: "Restaurante registrado en la API de TableUp.",
    status: mapRestaurantStatus(item?.status ?? item?.Status),
    updatedAt: formatApiDate(item?.createdAt ?? item?.CreatedAt),
  };
}

function mapRestaurantStatus(status: string | number | undefined): RestaurantRow["status"] {
  const value = String(status ?? "").toLowerCase();

  if (value === "1" || value.includes("approved") || value.includes("aprob")) return "Aprobado";
  if (value === "2" || value.includes("rejected") || value.includes("rechaz")) return "Borrador";

  return "Pendiente";
}

function mapReservationStatus(status: string | number | undefined) {
  const value = String(status ?? "").toLowerCase();

  if (value === "1" || value.includes("confirm")) return "Confirmada";
  if (value === "2" || value.includes("cancel")) return "Cancelada";

  return "Pendiente";
}

function formatApiDate(value: string | undefined) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReservationDate(value: string | undefined) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
