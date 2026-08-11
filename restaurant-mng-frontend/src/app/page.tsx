"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
}

type Restaurant = {
  id: number;
  name: string;
  category: string;
  status: string;
  address: string;
  phoneNumber?: string;
  images?: string[];
  cuisine?: string;
  city?: string;
  priceRange?: number;
};

export default function Home() {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  const isAdmin = Boolean(user && (user.role === "Admin" || user.isAdmin));
  const isOwner = Boolean(user && user.role === "Dueño" && !user.isAdmin);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [reservedIds, setReservedIds] = useState<number[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  function extractCity(address?: string) {
    if (!address) return "Desconocida";
    const parts = address.split(",");
    return parts.length > 1 ? parts[parts.length - 2].trim() : "Desconocida";
  }

  function getPriceSymbol(priceRange?: number) {
    if (!priceRange) return "$$";
    if (priceRange >= 1000) return "$$$$";
    if (priceRange >= 100) return "$$$";
    return "$$";
  }

  async function fetchRestaurants() {
      try {
        setLoading(true);
        setError(null);
        
        // RESTAURANTES FALSOS PARA PROBAR EL FRONT
        /*
        const testRestaurants: Restaurant[] = [
          {
            id: 1,
            name: "Restaurante Esencia",
            category: "Restaurante",
            status: "Approved",
            address: "Calle Mayor 125, Madrid, España",
            phoneNumber: "+34 912 345 678",
            images: ["/home_bg.png"],
            cuisine: "Mediterránea",
            city: "Madrid",
            priceRange: 250,
          },
          {
            id: 2,
            name: "Casa Gourmet",
            category: "Gastronomía",
            status: "Approved",
            address: "Av. de la Reina 45, Barcelona, España",
            phoneNumber: "+34 933 123 456",
            images: ["/restaurant_bg.jpg"],
            cuisine: "Internacional",
            city: "Barcelona",
            priceRange: 1200,
          },
          {
            id: 3,
            name: "Bistró Empanada Moderno",
            category: "Moderno",
            status: "Approved",
            address: "Paseo del Prado 8, Sevilla, España",
            phoneNumber: "+34 954 987 321",
            images: ["/home_bg2.png"],
            cuisine: "Contemporánea",
            city: "Sevilla",
            priceRange: 80,
          },
        ];
  
        setRestaurants(testRestaurants);
        return;
         //<-- */
  
        //COMENTAR DE AQUÍ HASTA LA "<--" PARA USAR RESTAURANTES FALSOS
        
        const res = await fetch(`${API_URL}/api/restaurants/public`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const restaurantData = json.data || json;
        const approvedRestaurants = Array.isArray(restaurantData)
          ? restaurantData.filter((item) => item.status === "Approved")
          : [];
        setRestaurants(
          approvedRestaurants.map((restaurant: any) => ({
            id: restaurant.id,
            name: restaurant.name,
            category: restaurant.category,
            status: restaurant.status,
            address: restaurant.address,
            phoneNumber: restaurant.phoneNumber,
            images: restaurant.images,
            cuisine: restaurant.cuisine || restaurant.category || "General",
            city: restaurant.city || extractCity(restaurant.address),
          }))
        );
        // <-- 
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/unauthorized");
      return;
    }

    fetchRestaurants();
  }, [isAuthenticated, router]);

  const cuisines = useMemo(
    () => Array.from(new Set(restaurants.map((item) => item.cuisine || "General"))),
    [restaurants]
  );

  const cities = useMemo(
    () => Array.from(new Set(restaurants.map((item) => item.city || "Desconocida"))),
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const matchesName = restaurant.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesCuisine = cuisineFilter ? restaurant.cuisine === cuisineFilter : true;
      const matchesCity = cityFilter ? restaurant.city === cityFilter : true;
      return matchesName && matchesCuisine && matchesCity;
    });
  }, [restaurants, nameFilter, cuisineFilter, cityFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("reservedRestaurantIds");
    if (stored) {
      try {
        setReservedIds(JSON.parse(stored));
      } catch {
        setReservedIds([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    async function loadReservations() {
      try {
        const res = await fetch(`${API_URL}/api/reservations/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          return;
        }

        const json = await res.json();
        const reservations: Array<{ restaurantId?: number | string; status?: string }> =
          Array.isArray(json) ? json : json.data ?? [];
        const reservedRestaurants = Array.from(
          new Set(
            reservations
              .filter(
                (item) =>
                  item.restaurantId != null &&
                  item.status !== "Cancelled" &&
                  item.status !== "cancelled",
              )
              .map((item) => Number(item.restaurantId)),
          ),
        );
        setReservedIds(reservedRestaurants);
      } catch {
        // ignore fetch failures and keep existing state
      }
    }

    loadReservations();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("reservedRestaurantIds", JSON.stringify(reservedIds));
  }, [reservedIds]);

  function toggleSave(id: number) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function handleReserveClick(id: number) {
    router.push(`/restaurant/${id}/reserve`);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/home_bg2.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-black/70" />

      <header className="relative z-10 border-b border-white/10 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/tableup-logo.png" alt="TableUp" className="h-13 w-auto object-contain" />
            <div>
              <p className="text-sm tracking-[0.35em] text-amber-300" style={{ fontFamily: "Times New Roman, serif" }}>TableUp</p>
              <p className="text-lg font-semibold">Descubre los mejores restaurantes</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm text-stone-100/80">
            <a href="#hero" className="rounded-full px-4 py-2 transition hover:bg-white/10">Home</a>
            <a href="#restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">Restaurants</a>
            {isOwner && (
              <Link href="/owner/my-restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">
                My Restaurants
              </Link>
            )}
            <a href="#about" className="rounded-full px-4 py-2 transition hover:bg-white/10">About Us</a>
            {isAdmin && (
              <Link href="/admin/approvals" className="rounded-full bg-amber-400/15 px-4 py-2 text-amber-200 transition hover:bg-amber-400/25">
                Approvals
              </Link>
            )}
            <ProfileAvatarButton />
          </nav>
        </div>
      </header>

      <section id="hero" className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-5xl space-y-8 text-center">
          <div className="mx-auto space-y-6 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.4em] text-amber-300">Descubre los Mejores Restaurantes</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Explora restaurantes de calidad y reserva tu mesa con estilo
            </h1>
            <p className="mx-auto max-w-2xl text-base text-stone-200 sm:text-lg">
              Mira restaurantes verificados, guarda tus favoritos y reserva directamente desde la comodidad de la página.
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="mx-auto w-full max-w-[960px] grid gap-4 sm:grid-cols-[2.5fr_1fr_1fr_auto_auto]">
            <input
              type="search"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Buscar Restaurante por Nombre..."
              className="w-full rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-sm text-white outline-none transition focus:border-amber-300"
            />
            <select
              value={cuisineFilter}
              onChange={(event) => setCuisineFilter(event.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white outline-none transition focus:border-amber-300"
            >
              <option value="">Cocina...</option>
              {cuisines.map((value) => (
                <option key={value} value={value} className="bg-slate-950 text-white">{value}</option>
              ))}
            </select>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-sm text-white outline-none transition focus:border-amber-300"
            >
              <option value="">Ciudad...</option>
              {cities.map((value) => (
                <option key={value} value={value} className="bg-slate-950 text-white">{value}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-3xl bg-amber-400 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              BUSCAR
            </button>
            <button
              type="button"
              onClick={() => {
                setNameFilter("");
                setCuisineFilter("");
                setCityFilter("");
              }}
              className="rounded-3xl bg-amber-400/80 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              LIMPIAR
            </button>
          </form>
        </div>
      </section>

      <section id="restaurants" className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Restaurantes aprobados</p>
            <h2 className="text-3xl font-semibold text-white">Explora y reserva tu próxima mesa</h2>
          </div>
          <p className="max-w-2xl text-sm text-stone-300 sm:text-right">
            Usa los filtros para encontrar el restaurante que se adapte a tu estilo y preferencias.
          </p>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-950/60 p-6 text-sm text-red-200">{error}</div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-200">Cargando restaurantes aprobados...</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-200">No se encontraron restaurantes con esos filtros.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <article key={restaurant.id} className="group overflow-hidden rounded-[2rem] border border-[#5b3f2a]/20 bg-[#1d1208]/85 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-[#2e1a0f]/95">
                <div className="relative h-48 overflow-hidden bg-[#1d1208]">
                  <Link href={`/restaurant/${restaurant.id}`} className="block h-full w-full">
                    <img
                    src={restaurant.images && restaurant.images.length > 0 ? `${API_URL}${restaurant.images[0]}` : "/home_bg.png"}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1a1209]/95 via-[#331f13]/85 to-transparent p-4 text-white">
                    <p className="text-sm uppercase tracking-[0.25em] text-amber-300">{restaurant.category}</p>
                    <h3 className="text-xl font-semibold">
                      <Link href={`/restaurant/${restaurant.id}`} className="hover:underline">{restaurant.name}</Link>
                    </h3>
                  </div>
                </div>
                <div className="space-y-4 rounded-[1.5rem] bg-[#2f1f12]/95 p-5 shadow-inner shadow-[#1a1209]/40">
                  <div className="space-y-2 text-sm text-stone-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-200">{restaurant.city || "Ciudad desconocida"}</span>
                      <span className="rounded-full bg-amber-400/10 px-3 py-1 text-amber-200">{getPriceSymbol(restaurant.priceRange)}</span>
                    </div>
                    <p className="text-sm leading-6 text-stone-200">{restaurant.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 justify-items-center">
                    <button
                      onClick={() => toggleSave(restaurant.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-3xl bg-[#2f1f12]/95 px-4 py-4 text-xs font-semibold text-amber-100 transition hover:bg-[#3f291d] ${savedIds.includes(restaurant.id) ? "bg-[#3f291d]/95 text-amber-100" : ""}`}
                    >
                      <img src={savedIds.includes(restaurant.id) ? "/icon-guardado.png" : "/icon-guardar.png"} alt={savedIds.includes(restaurant.id) ? "Guardado" : "Guardar"} className="h-7 w-7" />
                      <span>{savedIds.includes(restaurant.id) ? "Guardado" : "Guardar"}</span>
                    </button>
                    <button
                      onClick={() => handleReserveClick(restaurant.id)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-3xl bg-[#2f1f12]/95 px-4 py-4 text-xs font-semibold text-amber-100 transition hover:bg-[#3f291d] ${reservedIds.includes(restaurant.id) ? "bg-[#3f291d]/95 text-amber-100" : ""}`}
                    >
                      <img src="/icon-reservar.png" alt="Reservar" className="h-7 w-7" />
                      <span>{reservedIds.includes(restaurant.id) ? "Reservado" : "Reservar"}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="about" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2rem] border border-[#5b3f2a]/20 bg-[#2f1f12]/40 p-10 shadow-2xl shadow-black/20 backdrop-blur-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Sobre TableUp</p>
              <h2 className="text-3xl font-semibold text-white">Encuentra restaurantes buenos y verificados en un solo lugar</h2>
              <p className="mt-4 max-w-xl text-stone-300">
                TableUp te ofrece una selección de restaurantes aprobados, con una experiencia de usuario limpia y segura para clientes y dueños. Solo los lugares verificados aparecen en esta página.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#3f291d]/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Fácil</p>
                <p className="mt-3 text-sm text-stone-200">Busca, guarda y reserva en pocos clics.</p>
              </div>
              <div className="rounded-3xl bg-[#3f291d]/90 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Confiable</p>
                <p className="mt-3 text-sm text-stone-200">Solo restaurantes aprobados aparecen para tus reservas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
