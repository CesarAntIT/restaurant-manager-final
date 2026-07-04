"use client";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { error } from "node:console";
import { useEffect, useState } from "react";

type restaurantReq = {
  id: number;
  ownerId: string;
  name: string;
  category: string;
  status: string;
  address: string;
  phoneNumber: string;
  createdAt: string;
  images: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function MyRestaurants() {
  const FALLBACK_BACKGROUND =
    "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [restaurantes, setRestaurantes] = useState<restaurantReq[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { user, token, isAuthenticated } = useAuthStore();
  const isOwner = Boolean(user && user.role == "Dueño" && !user.isAdmin);



  async function getMyRestaurants() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/restaurants/my-restaurants`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        return Error("Could not Get Information from the Server")
      }

      const json = await res.json()
      if (json.HasError == true) {
        throw error(json.Error)
      }

      const restaurantData = json.data
      setRestaurantes(restaurantData)

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    getMyRestaurants();
  }, [isAuthenticated, isOwner]);

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
    <main>
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100"
        style={{
          backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')`,
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-black/55" />

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
            href="/restaurants"
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            Restaurants
          </Link>
          <Link
            href="/about"
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            About Us
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
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-5 flex justify-between">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Mis Restaurantes
              </h1>
              <button className="bg-green-500/50 p-2 rounded-xl font-bold hover:bg-green-400/75"> Añadir un Restaurante &#10798;</button>
            </div>
            <div className="flex">
              <input
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                placeholder="Escribe nombre del Restaurante"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <button className="ml-5 w-35 bg-blue-500 rounded-xl font-bold active:bg-blue-500/20">
                Buscar
              </button>
            </div>
            <hr className="mt-5 mb-5 " />

            <div className="grid gap-4">
              {restaurantes.map((r) => RestaurantCard(r))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RestaurantCard(r: restaurantReq) {
  return (
  <article key={r.id} className="overflow-hidden flex justify-between rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
    <div>
      <h2 className="text-xl font-semibold text-white">
        {r.name}
      </h2>
      <div className="mt-1 space-y-1 text-sm text-stone-300">
        <p>Categoría: {r.category}</p>
        <p>
            Estado:{" "}
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold 
              ${r.status === "Approved" ? "bg-emerald-500/20"
                : r.status === "Rejected" ? "bg-rose-500/20 text-rose-300"
                : "bg-amber-500/20 text-amber-200"} bg-amber-500/20 text-amber-200`}>
            {r.status}
          </span>
        </p>
        <p>Teléfono: {r.phoneNumber}</p>
        <p>Dirección: {r.address}</p>
        </div>

      </div>
      <div className="">  
      <button className="mb-2 bg-blue-500/50 p-1.5 rounded-xl hover:bg-blue-500 hover:font-bold w-20">Detalles</button> <br/>
      <button className="mb-2 bg-yellow-600/70 p-1.5 rounded-xl hover:bg-yellow-500 hover:font-bold w-20">Editar</button> <br/>
      <button className="mt-5 bg-red-500/50 p-1.5 rounded-xl hover:bg-red-500 hover:font-bold w-20">Eliminar</button> <br/>
      </div>
  </article> 
  )
}
