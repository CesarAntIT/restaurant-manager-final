"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, FormEvent, RefCallback, SetStateAction, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserData = {
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

export type RestaurantDraft = {
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

export type RestaurantRow = RestaurantDraft & {
  id?: number;
  status: "Borrador" | "Pendiente" | "Aprobado";
  updatedAt: string;
};

export type ReservationItem = {
  id?: number;
  restaurantId?: number;
  tableId?: number;
  numberMesa?: string;
  dateTimeReservation?: string;
  peopleCount?: number;
  status?: string | number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";

export const ownerRoles = ["owner", "dueno", "due\u00f1o", "due\u00c3\u00b1o"];

export const imagePresets = [
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

export const foodCategories = [
  "Italiana",
  "Carnes & Parrilla",
  "Fusion Asiatica",
  "Mariscos",
  "Bistro",
  "Gourmet",
  "Postres",
  "Cafe",
];

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

export async function apiRequest(endpoint: string, token: string, options: RequestInit = {}) {
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

export function mapRestaurantFromApi(item: any): RestaurantRow {
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

export function mapRestaurantStatus(status: string | number | undefined): RestaurantRow["status"] {
  const value = String(status ?? "").toLowerCase();

  if (value === "1" || value.includes("approved") || value.includes("aprob")) return "Aprobado";
  if (value === "2" || value.includes("rejected") || value.includes("rechaz")) return "Borrador";

  return "Pendiente";
}

export function mapReservationStatus(status: string | number | undefined) {
  const value = String(status ?? "").toLowerCase();

  if (value === "1" || value.includes("confirm")) return "Confirmada";
  if (value === "2" || value.includes("cancel")) return "Cancelada";

  return "Pendiente";
}

export function formatApiDate(value: string | undefined) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatReservationDate(value: string | undefined) {
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

export function normalizeRole(role: string) {
  return role
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function useProfileSession() {
  const router = useRouter();
  const { user, token, isAuthenticated, updateUser, logout } = useAuthStore() as {
    user: UserData | null;
    token: string | null;
    isAuthenticated: boolean;
    updateUser: (data: Partial<UserData>) => void;
    logout: () => void;
  };

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

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

    async function loadProfile() {
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

    loadProfile();

    return () => controller.abort();
  }, [isAuthenticated, sessionLoaded, token, updateUser]);

  const userView = useMemo(() => {
    const role = user?.role ?? "Client";
    const isOwner = ownerRoles.includes(normalizeRole(role));
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

  function handleProfileFieldsSubmit(name: string, username: string) {
    updateUser({ name, username });
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return {
    router,
    user,
    token,
    isAuthenticated,
    updateUser,
    sessionLoaded,
    loadingApi,
    apiMessage,
    setApiMessage,
    setLoadingApi,
    userView,
    handleProfileFieldsSubmit,
    handleLogout,
  };
}

// ---------------------------------------------------------------------------
// Layout pieces shared by both pages
// ---------------------------------------------------------------------------

export function ProfileHeader({
  displayName,
  isOwner,
  initials,
  onLogout,
}: {
  displayName: string;
  isOwner: boolean;
  initials: string;
  onLogout: () => void;
}) {
  return (
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
              <p className="text-xs font-bold text-white">{displayName}</p>
              <p
                className={`mt-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                  isOwner
                    ? "border-amber-800/50 bg-amber-950/80 text-amber-400"
                    : "border-emerald-800/50 bg-emerald-950/80 text-emerald-400"
                }`}
              >
                {isOwner ? "Propietario" : "Cliente"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-600/50 bg-[#2d180d] text-sm font-bold text-amber-400">
              {isOwner ? "CH" : "US"}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:border-red-500"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export function ProfileHero({ isOwner }: { isOwner: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#2d180d] bg-[#180e08]/90">
      <div className="relative min-h-52 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-[#120904] via-[#120904]/80 to-black/20" />
        <div className="relative p-6 sm:p-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-[#f59e0b]">
            {isOwner ? "Panel de propietario" : "Perfil de cliente"}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            {isOwner ? "Gestiona tu restaurante con estilo profesional." : "Tu experiencia gastronomica en un solo lugar."}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
            {isOwner
              ? "Revisa datos comerciales, estado de aprobacion, acciones principales y vista previa de tu restaurante."
              : "Consulta tu informacion, tus preferencias, reservas recientes y recomendaciones de TableUp."}
          </p>
        </div>
      </div>
    </section>
  );
}


export function ProfileSidebar({
  displayName,
  email,
  initials,
  isOwner,
  stats,
  onEdit
}: {
  displayName: string;
  email: string;
  initials: string;
  isOwner: boolean;
    stats: { label: string; value: string; tone: string }[];
    onEdit: () => void;
}) {
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5 shadow-2xl shadow-black/20">
        <button className="bg-amber border border-amber-500/40 rounded-full p-1 pe-2 ps-2 hover:border-amber-500" onClick={onEdit}>Editar</button>
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-amber-500/40 bg-[#2d180d] text-3xl font-bold text-amber-400">
          {initials}
          <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#180e08] bg-emerald-400" />
        </div>
        <div className="mt-4 text-center">
          <h1 className="break-words text-xl font-bold text-white">{displayName}</h1>
          <p className="mt-1 break-all text-xs text-stone-400">{email}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <ProfileMeta label="Estado" value="Cuenta activa" />
          <ProfileMeta label="Rol" value={isOwner ? "Dueno / Propietario" : "Cliente"} />
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
  );
}

export function StatusBanner({ saved, loadingApi, apiMessage }: { saved: boolean; loadingApi: boolean; apiMessage: string }) {
  return (
    <>
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
    </>
  );
}

export function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120904] text-stone-300">
      Cargando perfil...
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small reusable form / display pieces
// ---------------------------------------------------------------------------

export function ProfileMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2d180d] bg-[#120904]/80 px-3 py-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-stone-200">{value}</p>
    </div>
  );
}

export function ProfileInput({
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

export function PersonalInfoCard({
  email,
  name,
  username,
  onSubmit,
  onCancel
}: {
  email: string;
  name: string;
  username: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5 shadow-xl shadow-black">
      <button className="bg-amber border border-amber-500/40 rounded-full p-1 m-5 ms-120 right-0 pe-2 ps-2 hover:border-amber-500" onClick={onCancel}>Cancelar</button>
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

export function TableCell({
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

export async function handleProfileSubmit({
  event,
  token,
  updateUser,
  onSuccessMessage,
  onErrorMessage,
  onSaved,
}: {
  event: FormEvent<HTMLFormElement>;
  token: string | null;
  updateUser: (data: Partial<UserData>) => void;
  onSuccessMessage: (message: string) => void;
  onErrorMessage: (message: string) => void;
  onSaved: () => void;
}) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password || confirmPassword) {
    if (!token) {
      onErrorMessage("No hay token de sesion para actualizar el perfil.");
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
      onSuccessMessage("Perfil actualizado en la API.");
    } catch (error) {
      onErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el perfil en la API.");
      return;
    }
  } else {
    onSuccessMessage("Nombre actualizado en esta sesion. Para guardar en API, completa nueva contrasena y confirmacion.");
  }

  updateUser({
    name,
    username: String(formData.get("username") ?? "").trim(),
  });
  onSaved();
}
