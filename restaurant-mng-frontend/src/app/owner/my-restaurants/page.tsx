"use client";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import RestaurantForm from "./_restaurantForm";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function MyRestaurants() {
  const FALLBACK_BACKGROUND =
    "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restaurantes, setRestaurantes] = useState<restaurantReq[]>([]);
  const [searchVal, setSearchVal] = useState("");
  const [toRemove, setToRemove] = useState<restaurantReq | null>(null);
  const [toEdit, setToEdit] = useState<restaurantReq | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { user, token, isAuthenticated } = useAuthStore();
  const isOwner = Boolean(user && user.role == "Dueño" && !user.isAdmin);

  //They Do as they Say
  async function removeRestaurant(id: number) {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const result = await res.json();
      console.log(result);

      if (!res.ok) {
        return Error("Could not remove the restaurant");
      }

      if (result.success == false) {
        return Error(result.error.code + " " + result.error.message);
      }

      setRestaurantes(restaurantes.filter((r) => r.id !== id));
      setToRemove(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  async function getMyRestaurants() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/restaurants/my-restaurants`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        return Error("Could not Get Information from the Server");
      }

      const json = await res.json();
      if (json.HasError == true) {
        throw new Error(json.Error ?? "Could not obtain data from the server");
      }

      const restaurantData = json.data;
      setRestaurantes(restaurantData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  //This function is temporary until backend adds search.
  function filterMyRestaurants() {
    if (searchVal.trim().length == 0) {
      getMyRestaurants();
    } else {
      setRestaurantes(restaurantes.filter((r) => r.name.includes(searchVal)));
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    getMyRestaurants();
  }, [isAuthenticated, isOwner]);

  //Authentication Errors Page
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

  //Main Page Code
  return (

    <main className="text-stone-200">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100"
        style={{
          backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')`,
        }}
      />

      <div className="pointer-events-none fixed inset-0 bg-[#1c1917]/75 backdrop-brightness-90" />


      <header className="relative z-10 flex items-center justify-between border-b border-[#44403c]/40 bg-[#1c1917]/40 px-8 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2.5 rounded-full border border-[#57534e]/50 bg-[#292524]/60 px-3.5 py-1.5 shadow-sm sm:flex">
            <Image
              src="/tableup-logo.png"
              alt="TableUp logo"
              width={34}
              height={34}
              className="rounded-full ring-1 ring-[#78716c]/30"
            />
            <span className="text-sm font-medium tracking-wider text-stone-200">TableUp</span>
          </div>
        </div>

        <nav className="relative z-10 flex items-center gap-1.5 text-sm font-medium text-stone-300">
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition hover:bg-[#44403c]/40 hover:text-stone-100"
          >
            Home
          </Link>
          <Link
            href="/owner/my-restaurants"
            className="rounded-full border border-[#a3e635]/20 bg-[#3f6212]/30 px-4 py-2 text-[#d9f99d] transition hover:bg-[#3f6212]/50 shadow-sm"
          >
            My Restaurants
          </Link>
          <Link
            href="/owner/reservations"
            className="rounded-full px-4 py-2 transition hover:bg-[#44403c]/40 hover:text-stone-100"
          >
            Reservas
          </Link>
          <Link
            href="/owner/ingredients"
            className="rounded-full px-4 py-2 transition hover:bg-[#44403c]/40 hover:text-stone-100"
          >
            Ingredientes
          </Link>
        </nav>

        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-10">
        
        <div className="w-full rounded-3xl border border-[#44403c]/60 bg-[#292524]/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-10">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-6 flex items-center justify-between">

              <h1 className="text-3xl font-serif font-medium tracking-tight text-[#f5f5f4] sm:text-4xl">
                Mis Restaurantes
              </h1>

              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-xl border border-[#a3e635]/30 bg-[#3f6212]/70 px-4 py-2.5 text-sm font-medium text-[#ecfccb] shadow-md transition hover:bg-[#4d7c0f] hover:shadow-lg active:scale-95"
              >
                Añadir un Restaurante &#10798;
              </button>
            </div>
            

            <div className="flex gap-3">
              <input
                className="w-full rounded-xl border border-[#57534e]/60 bg-[#1c1917]/70 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-400 outline-none transition focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706]"
                placeholder="Escriba el nombre del restaurante..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />

              <button
                className="w-32 rounded-xl border border-[#b45309]/50 bg-[#b45309]/80 text-sm font-medium text-stone-100 shadow-md transition hover:bg-[#d97706] active:scale-95"
                onClick={filterMyRestaurants}
              >
                Buscar
              </button>
            </div>


            <hr className="my-6 border-[#44403c]/60" />

            <div className="grid gap-5">
              {restaurantes.map((r) => (
                <RestaurantCard key={r.id} r={r} />
              ))}
              {showCreate ? (
                <RestaurantForm
                  mode="create"
                  user={user}
                  token={token}
                  onClose={() => setShowCreate(false)}
                  onSuccess={(newRestaurant) => {
                    if (newRestaurant)
                      setRestaurantes((prev) => [newRestaurant, ...prev]);
                    else getMyRestaurants();
                  }}
                  setError={setError}
                  API_URL={API_URL}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  //Auxiliary Components
  function RemoveRestaurantCard() {
    return (

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md z-40 rounded-3xl border border-[#57534e] bg-[#1c1917]/95 p-6 shadow-2xl shadow-black/80 backdrop-blur-xl sm:p-8">

        <h1 className="text-xl font-serif font-semibold text-[#f5f5f4]">¿Eliminar el Restaurante?</h1>
        <br />

        <p className="text-sm text-stone-300 leading-relaxed">
          ¿Desea eliminar el restaurante{" "}
          <b className="text-amber-200">
            <i>{toRemove ? toRemove.name : ""}</i>
          </b>
          <br />
          el cual se encuentra en la dirección{" "}
          <b className="text-stone-200">{toRemove ? toRemove.address : ""}</b>?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setToRemove(null)}
            className="rounded-xl border border-[#57534e]/50 px-4 py-2 text-sm font-medium text-stone-300 transition hover:bg-[#292524] hover:text-stone-100"
          >
            Cancelar
          </button>
          <button
            onClick={
              toRemove != null ? () => removeRestaurant(toRemove.id) : () => null
            }
            className="rounded-xl border border-rose-800/60 bg-rose-950/80 px-5 py-2 text-sm font-medium text-rose-200 shadow-md transition hover:bg-rose-900 active:scale-95"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }
  function RestaurantCard({ r }: { r: restaurantReq }) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    return (
      <article
        className={`${toRemove == r || toEdit == r ? "z-20" : ""} flex flex-col justify-between rounded-3xl border border-[#44403c]/60 bg-[#1c1917]/80 p-6 shadow-lg backdrop-blur-md transition hover:border-[#57534e] md:flex-row`}
      >
        <div className="flex-1">
          <h2 className="text-2xl font-serif font-medium text-[#f5f5f4]">{r.name}</h2>
        
          <div className="mt-2 space-y-1.5 text-sm text-stone-300">
            <p className="flex items-center gap-2">
              <span className="font-medium text-stone-400">Categoría:</span> 
              <span className="rounded-md bg-[#292524] px-2 py-0.5 text-xs text-amber-200/90 border border-[#44403c]">{r.category}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium text-stone-400">Estado:</span>{" "}
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  r.status === "Approved"
                    ? "border-[#a3e635]/30 bg-[#3f6212]/30 text-[#d9f99d]"
                    : r.status === "Rejected"
                      ? "border-rose-800/40 bg-rose-950/40 text-rose-300"
                      : "border-amber-700/40 bg-amber-950/40 text-amber-200"
                }`}
              >
                {r.status}
              </span>
            </p>
            <p><span className="font-medium text-stone-400">Teléfono:</span> {r.phoneNumber}</p>
            <p><span className="font-medium text-stone-400">Dirección:</span> {r.address}</p>
          </div>

          {toRemove != r ? null : <RemoveRestaurantCard />}
          {toEdit != r ? null : (
            <RestaurantForm
              mode="edit"
              restaurant={r}
              token={token}
              onClose={() => setToEdit(null)}
              onSuccess={() => setToEdit(null)}
              setError={setError}
              API_URL={API_URL}
            />
          )}

          {r.images && r.images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3 mt-4">
              {r.images.map((imgSrc, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-2xl border border-[#44403c]/60 bg-[#292524] cursor-pointer transition hover:border-[#78716c]"
                  onClick={() => setExpandedImage(`${API_URL}${imgSrc}`)}
                >
                  <img
                    src={`${API_URL}${imgSrc}`}
                    alt={`${r.name}-img-${i}`}
                    className="h-28 w-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    width={100}
                    height={100}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#44403c]/40 pt-4 md:mt-0 md:ml-6 md:flex-col md:border-t-0 md:pt-0">
          <div className="flex flex-wrap gap-2 md:flex-col">
            <Link
              href={`/owner/restaurants/${r.id}/workdays`}
              className="rounded-xl border border-[#65a30d]/30 bg-[#3f6212]/40 px-3 py-1.5 text-xs font-medium text-[#d9f99d] transition hover:bg-[#3f6212]/80 text-center block"
            >
              Jornadas
            </Link>
            <Link
              href={`/owner/restaurants/${r.id}/tables`}
              className="rounded-xl border border-[#78350f]/40 bg-[#78350f]/30 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-[#78350f]/60 text-center block"
            >
              Mesas
            </Link>
            <Link
              href={`/owner/restaurants/${r.id}/reservations`}
              className="rounded-xl border border-[#b45309]/40 bg-[#b45309]/30 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-[#b45309]/60 text-center block"
            >
              Reservas
            </Link>
            <button
              className="rounded-xl border border-[#d97706]/40 bg-[#d97706]/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-[#d97706]/40"
              onClick={() => setToEdit(r)}
            >
              Editar
            </button>
          </div>
          
          <button
            className="mt-auto rounded-xl border border-rose-900/40 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-900/60"
            onClick={() => setToRemove(r)}
          >
            Eliminar
          </button>
        </div>

        {expandedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1917]/90 backdrop-blur-md p-4"
            onClick={() => setExpandedImage(null)}
          >
            <button
              className="absolute z-100 top-6 right-6 text-stone-300 text-3xl leading-none transition hover:text-white"
              onClick={() => setExpandedImage(null)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <img
              src={expandedImage}
              alt="Imagen ampliada"
              className="max-h-[85vh] max-w-[90vw] rounded-3xl border border-[#57534e] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </article>
    );
  }
}