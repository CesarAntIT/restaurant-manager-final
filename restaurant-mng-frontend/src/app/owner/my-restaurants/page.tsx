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
            href="/owner/my-restaurants"
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            My Restaurants
          </Link>
          <Link
            href="/owner/reservations"
            className="rounded-full  px-4 py-2 transition hover:bg-white/10"
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

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-5 flex justify-between">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Mis Restaurantes
              </h1>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-500/50 p-2 rounded-xl font-bold hover:bg-green-400/75"
              >
                {" "}
                Añadir un Restaurante &#10798;
              </button>
            </div>
            <div className="flex">
              <input
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                placeholder="Escriba el nombre del restaurante"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <button
                className="ml-5 w-35 bg-blue-500 rounded-xl font-bold active:bg-blue-500/20"
                onClick={filterMyRestaurants}
              >
                Buscar
              </button>
            </div>
            <hr className="mt-5 mb-5 " />

            <div className="grid gap-4">
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-40 rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8 mb-5">
        <h1>Eliminar el Restaurante?</h1>
        <br />
        <p>
          Desea eliminar el restaurante{" "}
          <b>
            <i>{toRemove ? toRemove.name : ""}</i>
          </b>
          <br />
          el cual se encuentra en la dirección{" "}
          <b>{toRemove ? toRemove.address : ""}?</b>
        </p>

        <button
          onClick={
            toRemove != null ? () => removeRestaurant(toRemove.id) : () => null
          }
          className="mr-5 bg-red-500 text-white w-30 h-10 rounded-xl hover:bg-red-500/50 hover:font-bold active:bg-red-400"
        >
          Eliminar
        </button>
        <button onClick={() => setToRemove(null)}>Cancelar</button>
      </div>
    );
  }
  function RestaurantCard({ r }: { r: restaurantReq }) {
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    return (
      <article
        className={`${toRemove == r || toEdit == r ? "z-20" : ""} flex justify-between rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20 backdrop-blur-xl`}
      >
        <div>
          <h2 className="text-xl font-semibold text-white">{r.name}</h2>
          <div className="mt-1 space-y-1 text-sm text-stone-300">
            <p>Categoría: {r.category}</p>
            <p>
              Estado:{" "}
              <span
                className={`inline-block rounded-full px-2 py-1 text-xs font-semibold
                ${
                  r.status === "Approved"
                    ? "bg-emerald-500/20"
                    : r.status === "Rejected"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-amber-500/20 text-amber-200"
                } bg-amber-500/20 text-amber-200`}
              >
                {r.status}
              </span>
            </p>
            <p>Teléfono: {r.phoneNumber}</p>
            <p>Dirección: {r.address}</p>
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
            <div className="grid gap-3 sm:grid-cols-3 mt-3">
              {r.images.map((imgSrc, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 cursor-pointer transition hover:opacity-80"
                  onClick={() => setExpandedImage(`${API_URL}${imgSrc}`)}
                >
                  <img
                    src={`${API_URL}${imgSrc}`}
                    alt={`${r.name}-img-${i}`}
                    className="h-36 w-full object-cover"
                    width={100}
                    height={100}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="">
          <div className="flex flex-col gap-2">
          <Link href={`/owner/restaurants/${r.id}/workdays`} className="mb-2 bg-emerald-500/50 p-1.5 rounded-xl hover:bg-emerald-500 hover:font-bold w-20 text-center block">
            Jornadas
          </Link>
          <Link href={`/owner/restaurants/${r.id}/tables`} className="mb-2 bg-blue-500/50 p-1.5 rounded-xl hover:bg-blue-500 hover:font-bold w-20 text-center block">
            Mesas
          </Link>
          <Link href={`/owner/restaurants/${r.id}/reservations`} className="mb-2 bg-amber-500/50 p-1.5 rounded-xl hover:bg-amber-500 hover:font-bold w-20 text-center block">
            Reservas
          </Link>
          <button
            className="mb-2 bg-yellow-600/70 p-1.5 rounded-xl hover:bg-yellow-500 hover:font-bold w-20"
            onClick={() => setToEdit(r)}
          >
            Editar
          </button>
        </div>
          <br />
          <button
            className="mt-5 bg-red-500/50 p-1.5 rounded-xl hover:bg-red-500 hover:font-bold w-20"
            onClick={() => setToRemove(r)}
          >
            Eliminar
          </button>{" "}
          <br />
        </div>

        {/*This part is used to expand an image from the Image list of the card*/}
        {expandedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setExpandedImage(null)}
          >
            <button
              className="absolute z-100 top-4 right-4 text-white text-3xl leading-none hover:text-stone-300"
              onClick={() => setExpandedImage(null)}
              aria-label="Cerrar"
            >
              &times;
            </button>
            <img
              src={expandedImage}
              alt="Imagen ampliada"
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </article>
    );
  }
}
