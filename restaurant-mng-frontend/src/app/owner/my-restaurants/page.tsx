"use client";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface restaurantReq {
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
interface UpdateRestaurantProps {
  restaurant: restaurantReq;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  setError: (msg: string | null) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL!

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

  async function removeRestaurant(id: number) {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`, {
        method: "DELETE", 
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const result = await res.json();
      console.log(result);

      if (!res.ok) {
        return Error("Could not remove the restaurant")
      }

      if ( result.success == false) {
        return Error( result.error.code + " " + result.error.message)
      }

      setRestaurantes(restaurantes.filter(r => r.id !== id));
      setToRemove(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

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
        throw new Error(json.Error ?? "Could not obtain data from the server");
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
            href="/"
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            Restaurants
          </Link>
          <Link
            href="/restaurants"
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            My Restaurants
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
        <div className="w-full rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-5 flex justify-between">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Mis Restaurantes
              </h1>
              <button onClick={() => setShowCreate(true)} className="bg-green-500/50 p-2 rounded-xl font-bold hover:bg-green-400/75"> Añadir un Restaurante &#10798;</button>
            </div>
            <div className="flex">
              <input
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                placeholder="Escriba el nombre del restaurante"
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
              {toRemove == null ? null : <RemoveRestaurantCard/>}
              {showCreate ? <CreateRestaurant /> : null}
              {toEdit == null ? null :
                <EditRestaurant onClose={() => setToEdit(null)}
                onSuccess={getMyRestaurants}
                restaurant={toEdit}
                setError={setError}
                token={token} />}
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );

  function RemoveRestaurantCard() {
    return (
      <div className="w-full absolute z-40 rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8 mb-5">
            <h1>
              Eliminar el Restaurante?
            </h1>
            <br/>
            <p>
              Desea eliminar el restaurante <b><i>{toRemove ? toRemove.name : ""}</i></b><br/>
              el cual se encuentra en la dirección <b>{toRemove ? toRemove.address : ""}?</b>
            </p>
      
            <button onClick={ toRemove != null ? () => removeRestaurant(toRemove.id) : () => null} className="mr-5 bg-red-500 text-white w-30 h-10 rounded-xl hover:bg-red-500/50 hover:font-bold active:bg-red-400">Eliminar</button>
            <button onClick={() => setToRemove(null)}>Cancelar</button>
          </div>  
    )

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

          {r.images && r.images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3 mt-3">
              {r.images.map((imgSrc, i) => (
                <div key={i} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <img 
                    src={`${API_URL}${imgSrc}`} 
                    alt={`${r.name}-img-${i}`} 
                    className="h-36 w-full object-cover" 
                  />
                </div>
              ))}
            </div>
        )}
  
        </div>
        <div className="">  
        <button className="mb-2 bg-blue-500/50 p-1.5 rounded-xl hover:bg-blue-500 hover:font-bold w-20">Detalles</button> <br/>
        <button className="mb-2 bg-yellow-600/70 p-1.5 rounded-xl hover:bg-yellow-500 hover:font-bold w-20" onClick={() => setToEdit(r)} >Editar</button> <br/>
        <button className="mt-5 bg-red-500/50 p-1.5 rounded-xl hover:bg-red-500 hover:font-bold w-20" onClick={() => setToRemove(r)}>Eliminar</button> <br/>
        </div>
    </article> 
    )
  }
  function CreateRestaurant() {

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        address: "",
        phoneNumber: ""
      });
      const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
    
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
        };
      
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) {
            setSelectedImages(e.target.files);
          }
        };
      
        async function handleSubmit(e: React.FormEvent) {
          e.preventDefault();
          if (!user || !token) return;
      
          try {
            setIsSubmitting(true);
            
            
            const data = new FormData();
            data.append("ownerId", user.id || "");
            data.append("name", formData.name);
            data.append("category", formData.category);
            data.append("address", formData.address);
            data.append("phoneNumber", formData.phoneNumber);
      
            if (selectedImages) {
              Array.from(selectedImages).forEach((file) => {
                data.append("images", file);
              });
            }
      
            const res = await fetch(`${API_URL}/api/restaurants`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: data,
            });
      
            if (!res.ok) {
              throw new Error("Error al intentar crear el restaurante");
            }
      
            const result = await res.json();
      

            if (result.data) {
              setRestaurantes((prev) => [result.data, ...prev]);
            } else {
              getMyRestaurants();
            }
      
            setShowCreate(false);
      
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setIsSubmitting(false);
          }
        }
    
    return(<div className="w-full absolute z-50 rounded-4xl border border-white/10 bg-[#0f0906]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-3xl sm:p-8 mb-5 left-0 top-20">
          <h2 className="text-2xl font-bold text-white mb-4">Registrar Nuevo Restaurante</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="El Gran Encuentro...."
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Categoría</label>
              <input
                type="text"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Ej. Sushi, Carnes Finas, Mariscos "
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Dirección</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="Ej. Calle Falsa 123"
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Teléfono</label>
              <input
                type="text"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder="809-000-000"
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Imágenes del local</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-200 hover:file:bg-amber-500/30 cursor-pointer"
              />
            </div>
    
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-500 px-5 py-2 text-sm font-bold text-black transition hover:bg-green-400 active:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar Restaurante"}
              </button>
            </div>
          </form>
        </div>)
    
  }

  function EditRestaurant({ restaurant, onClose, onSuccess, token, setError }: UpdateRestaurantProps) {
    
      const [formData, setFormData] = useState({
        name: restaurant.name,
        category: restaurant.category,
        address: restaurant.address,
        phoneNumber: restaurant.phoneNumber
      });
    
      const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
    
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };
    
      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          setSelectedImages(e.target.files);
        }
      };
    
      async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
    
        try {
          setIsSubmitting(true);
          setError(null);
          
          const data = new FormData();
          
          data.append("name", formData.name.trim() || restaurant.name);
          data.append("category", formData.category.trim() || restaurant.category);
          data.append("address", formData.address.trim() || restaurant.address);
          data.append("phoneNumber", formData.phoneNumber.trim() || restaurant.phoneNumber);
    
          if (selectedImages && selectedImages.length > 0) {
            Array.from(selectedImages).forEach((file) => {
              data.append("images", file);
            });
          } else {
            data.append("images", "string");
          }
    
          const res = await fetch(`${API_URL}/api/restaurants/${restaurant.id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: data,
          });
    
          if (!res.ok) {
            throw new Error("Error al intentar actualizar el restaurante en el servidor.");
          }
    
          onSuccess(); // Refresca la lista de restaurantes
          onClose();   // Cierra el formulario
    
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setIsSubmitting(false);
        }
      }
    
      return (
        <div className="w-full absolute z-50 rounded-[2rem] border border-white/10 bg-[#0f0906]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-3xl sm:p-8 mb-5 left-0 top-0">
          <h2 className="text-2xl font-bold text-white mb-1">Editar Restaurante</h2>
          <p className="text-sm text-stone-400 mb-4">Modificando los datos de: <span className="text-amber-400 font-semibold">{restaurant.name}</span></p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder={restaurant.name}
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Categoría</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder={restaurant.category}
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Dirección</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder={restaurant.address}
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Teléfono</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                placeholder={restaurant.phoneNumber == null ? "809-000-0000" : restaurant.phoneNumber.trim() }
              />
            </div>
    
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">Actualizar imágenes (Opcional)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-200 hover:file:bg-amber-500/30 cursor-pointer"
              />
            </div>
    
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50"
              >
                {isSubmitting ? "Actualizando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      );
  }
  
  }


