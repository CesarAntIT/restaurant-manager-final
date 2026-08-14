"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7188";

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
};
type Menu = {
  id: number;
  name: string;
  description: string;
  status: string;
};

export default function MenuPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const { user, token, isAuthenticated } = useAuthStore();
  const [isOwnerRestaurant, setIsOwnerRestaurant] = useState(false);

  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [currentMenu, setCurrentMenu] = useState<Menu>();

  const [currentDishes, setCurrentDishes] = useState<Dish[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [toEdit, setToEdit] = useState(false);
  const [toRemove, setToRemove] = useState(false);

  async function checkRestaurant() {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}`);
      if (res.ok != true) {
        const data = await res.json();
        return Error(data);
      }
      const data = await res.json();
      if (data.data.ownerId == user.id) {
        setIsOwnerRestaurant(true);
      } else {
        setIsOwnerRestaurant(false);
      }
    } catch (e) {
      console.log(e);
    }
  }
  async function getMenuList() {
    try {
      const res = await fetch(
        `${API_URL}/api/menus/restaurant/${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`${res}`);
      }

      const data = await res.json();
      const menus: Menu[] = data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
      }));

      setMenuList(menus);
      setCurrentMenu(menus[0]);
    } catch (e) {
      console.error(e);
    }
  }
  async function getDishesPerMenu() {
    try {
      const res = await fetch(
        `${API_URL}/api/menudishes/menu/${currentMenu?.id}/dishes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`${res}`);
      }

      const data = await res.json();
      const dish: Dish[] = data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
      }));

      setCurrentDishes(dish);
    } catch (e) {
      console.log("Dishes Not Found");
      setCurrentDishes([]);
    }
  }
  async function getDishes() {
    try {
      const res = await fetch(
        `${API_URL}/api/restaurants/${restaurantId}/dishes`,
        {
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok != true) {
        throw new Error(`${res}`);
      }

      const data = await res.json();
      const dishes: Dish[] = (data as any[]).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
      }));

      setAllDishes(dishes);
    } catch (e) {
      console.error(e);
    }
  }

  async function ManageMenuDish(Method: string, dishId: number) {
    try {
      const res = await fetch(
        `${API_URL}/api/menudishes/${currentMenu?.id}/dishes/${dishId}`,
        {
          method: Method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("404: Dish not found in Menú");
      }

      getDishesPerMenu();
    } catch (e) {
      console.error(e);
    }
  }
  async function createMenu(menuData: {
    restaurantId: number;
    name: string;
    description: string;
  }) {
    try {
      const res = await fetch(`${API_URL}/api/menus`, {
        method: "POST",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menuData),
      });

      if (!res.ok) {
        throw new Error(`Error al crear el menú: ${res.status}`);
      }

      const data = await res.json();
      getMenuList();     
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  }
  async function deleteMenu(menuId: number) {
    try {
      const res = await fetch(`${API_URL}/api/menus/${menuId}`, {
        method: "DELETE",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error al eliminar el menú: ${res.status}`);
      }

      getMenuList();
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  }
  async function updateMenu(
    menuId: number,
    menuData: { name: string; description: string; status: string },
  ) {
    try {
      const res = await fetch(`${API_URL}/api/menus/${menuId}`, {
        method: "PUT",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(menuData),
      });

      if (!res.ok) {
        throw new Error(`Error al actualizar el menú: ${res.status}`);
      }

      const data = await res.json();
      getMenuList();
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleChangeMenu(id: number) {
    setCurrentMenu(menuList.filter((m) => m.id === id)[0]);
  }

  useEffect(() => {
    if (token && restaurantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      checkRestaurant();
      getMenuList();
      getDishes();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (currentMenu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getDishesPerMenu();
    }
  }, [currentMenu]);

  //Authentications and Roles Checks
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
  if (!isOwnerRestaurant) {
    {
      return (
        <div className="text-center">
          <div className="p-8 text-center text-stone-100">
            ACCESSO DENEGADO <br />
            USTED NO TIENE PERMISOS PARA ENTRAR A ESTA PÁGINA
          </div>
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition bg-amber-300 font-bold text-black hover:bg-amber-500"
          >
            VOLVER A HOME
          </Link>
        </div>
      );
    }
  }
return (
    <div className="min-h-screen bg-[#0d0705] text-stone-200">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#2d180d]/60 bg-[#120804]/60 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full border border-amber-900/40 bg-amber-950/20 px-3.5 py-1.5 shadow-inner sm:flex">
            <Image
              src="/tableup-logo.png"
              alt="TableUp logo"
              width={34}
              height={34}
              className="rounded-full ring-2 ring-amber-600/30"
            />
            <span className="text-sm font-semibold tracking-wide text-amber-100">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-2 text-sm text-stone-300">
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200"
          >
            Home
          </Link>
          <Link
            href="/owner/my-restaurants"
            className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200"
          >
            My Restaurants
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/workdays`}
            className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200"
          >
            Work Days
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/menus`}
            className="rounded-full border border-amber-600/40 bg-gradient-to-r from-amber-700/30 to-amber-600/20 px-4 py-2 font-medium text-amber-200 shadow-sm transition-all hover:border-amber-500/60 hover:from-amber-700/40 hover:to-amber-600/30"
          >
            Menus
          </Link>
          <Link
            href="/owner/ingredients"
            className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200"
          >
            Ingredients
          </Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-[#3a2013]/60 bg-gradient-to-b from-[#180d07]/90 via-[#120804]/90 to-[#0c0503]/90 p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-center">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="bg-gradient-to-r from-amber-100 via-stone-200 to-amber-300 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
                Menus
              </h1>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-600/50 bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-2.5 text-sm font-bold text-emerald-50 shadow-lg shadow-emerald-950/40 transition-all hover:border-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95"
                onClick={() => {
                  setShowForm(true);
                  setToEdit(false);
                }}
              >
                Add New Menu <span className="text-lg">✚</span>
              </button>
            </div>

            <MenuSelect />
            
            <div className="mt-2 mb-4">
              <span
                className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase backdrop-blur-md transition-all ${
                  currentMenu?.status == "Active"
                    ? "border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 shadow-sm shadow-emerald-950/50"
                    : "border border-rose-500/40 bg-rose-950/60 text-rose-300 shadow-sm shadow-rose-950/50"
                }`}
              >
                ● {currentMenu?.status == "Active" ? "Active" : "Inactive"}
              </span>
            </div>

            {showForm ? <MenuForm toEdit={toEdit} /> : ""}

            <hr className="my-6 border-t border-[#3a2013]/50" />
            
            <div className="flex flex-wrap gap-6 justify-evenly">
              <CurrentDishesList />
              <AvailableDishesList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function RemoveMenuCard() {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md z-50 rounded-3xl border border-rose-900/50 bg-[#160905]/95 p-6 shadow-2xl shadow-black/90 backdrop-blur-2xl sm:p-8">
        <h1 className="text-xl font-bold text-rose-200">¿Eliminar el Menú?</h1>
        <br />
        <p className="text-stone-300 text-sm leading-relaxed">
          Desea eliminar el Menú{" "}
          <b className="text-amber-200">
            <i>{toRemove ? currentMenu!.name : ""}</i>
          </b>
          <br />
          El cual tiene{" "}
          <b className="text-amber-200">{toRemove ? currentDishes.length : ""} </b>
          platillos?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setToRemove(false)}
            className="rounded-xl border border-stone-700/60 bg-stone-800/80 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 hover:text-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={
              toRemove != null ? () => deleteMenu(currentMenu!.id) : () => null
            }
            className="rounded-xl border border-rose-600/50 bg-gradient-to-r from-rose-700 to-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-600 hover:to-red-500 active:scale-95 transition-all"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  function MenuForm({ toEdit }: { toEdit: boolean }) {
    const [name, setName] = useState(
      toEdit && currentMenu != undefined ? currentMenu.name : "",
    );
    const [desc, setDesc] = useState(
      toEdit && currentMenu != undefined ? currentMenu.description : "",
    );
    const [status, setStatus] = useState(
      toEdit && currentMenu != undefined ? currentMenu.status : "",
    );

    return (
      <div className="relative w-full rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a0e08] to-[#120804] p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl sm:p-8 my-6">
        <h1 className="font-bold text-xl text-amber-100 tracking-wide">
          {toEdit ? "Edit Menu" : "Add a new Menu"}
        </h1>
        <br />
        <div className="space-y-4">
          <div>
            <p className="ps-1 text-xs font-semibold uppercase text-amber-200/70 tracking-wider mb-1">Title</p>
            <input
              className="w-full max-w-lg rounded-xl border border-[#3a2013] bg-[#0c0503] py-2.5 px-3 text-stone-100 placeholder-stone-600 focus:border-amber-600/80 focus:outline-none focus:ring-1 focus:ring-amber-600/80 transition-all text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <p className="ps-1 text-xs font-semibold uppercase text-amber-200/70 tracking-wider mb-1">Description</p>
            <textarea
              className="w-full max-w-lg rounded-xl border border-[#3a2013] bg-[#0c0503] py-2.5 px-3 text-stone-100 placeholder-stone-600 focus:border-amber-600/80 focus:outline-none focus:ring-1 focus:ring-amber-600/80 transition-all text-sm min-h-[80px]"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          {toEdit && (
            <div>
              <p className="ps-1 text-xs font-semibold uppercase text-amber-200/70 tracking-wider mb-1">Status</p>
              <select
                onChange={(e) => setStatus(e.target.value)}
                value={status}
                className="rounded-xl border border-[#3a2013] bg-[#0c0503] px-3 py-2 text-sm font-semibold text-amber-100 outline-none focus:border-amber-600/80 transition-all cursor-pointer"
              >
                <option value={"Active"}>Active</option>
                <option value={"Inactive"}>Inactive</option>
              </select>
            </div>
          )}
        </div>

        { toRemove ? <RemoveMenuCard/> : ""}
        
        <div className="mt-6 flex items-center justify-between border-t border-[#2d180d]/60 pt-4">
          <div className="flex gap-3">
            {toEdit ? (
              <button
                onClick={() =>
                  updateMenu(currentMenu!.id, {
                    description: desc,
                    name: name,
                    status: status,
                  })
                }
                className="rounded-xl border border-amber-600/50 bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2 text-sm font-bold text-stone-100 shadow-md shadow-amber-950/40 hover:from-amber-600 hover:to-amber-500 transition-all active:scale-95"
              >
                Save Changes
              </button>
            ) : (
              <button 
                className="rounded-xl border border-emerald-600/50 bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-2 text-sm font-bold text-emerald-100 shadow-md shadow-emerald-950/40 hover:from-emerald-700 hover:to-emerald-600 transition-all active:scale-95"
                onClick={() => createMenu({description:desc, name: name, restaurantId: Number(restaurantId)})}
              >
                Add Menu
              </button>
            )}

            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-stone-800 bg-stone-900/80 px-5 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
          {toEdit ? (
            <button
              onClick={() => setToRemove(true)}
              className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-5 py-2 text-sm font-bold text-rose-300 hover:bg-rose-900/60 hover:text-rose-100 transition-all"
            >
              DELETE
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }

  function MenuSelect() {
    return (
      <div className="flex items-center mb-2 gap-3">
        <select
          onChange={(e) => handleChangeMenu(Number(e.target.value))}
          value={currentMenu?.id}
          className="rounded-xl border border-[#3a2013] bg-[#160b06] px-4 py-2 text-sm font-bold italic text-amber-100 outline-none focus:border-amber-600/80 shadow-inner cursor-pointer"
        >
          {menuList.length < 1 ? (
            <option>Sin menús</option>
          ) : (
            menuList.map((m, i) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
        </select>
        {menuList.length >= 1 ? (
          <button
            onClick={() => {
              setShowForm(true);
              setToEdit(true);
            }}
            className="rounded-xl border border-amber-600/40 bg-gradient-to-r from-amber-600/30 to-amber-700/20 px-3.5 py-2 text-xs font-bold text-amber-200 shadow-sm hover:border-amber-500/60 hover:bg-amber-600/40 transition-all active:scale-95"
          >
            Manage Menu ⚙
          </button>
        ) : (
          ""
        )}
      </div>
    );
  }

  function CurrentDishesList() {
    const [searchVal, setSearchVal] = useState("");
    const filteredDishes = useMemo(
      () =>
        currentDishes.filter((d) =>
          d.name.toLowerCase().includes(searchVal.toLowerCase()),
        ),
      [searchVal],
    );

    return (
      <div className="flex-1 min-w-[300px]">
        <h2 className="font-bold text-xl italic text-amber-100 mb-2">Platillos Activos</h2>
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] py-2 px-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-600/80 focus:outline-none transition-all mb-3"
          placeholder="Buscar platillo..."
        />
        <ul className="overflow-y-auto max-h-100 w-full divide-y divide-[#2d180d]/60 rounded-2xl border border-[#3a2013]/80 bg-[#120704]/90 p-3 shadow-inner">
          {filteredDishes.length < 1 ? (
            <div className="flex justify-between items-center my-4 p-4 rounded-xl bg-amber-950/10 border border-amber-900/20 text-stone-400">
              <div>
                <h3 className="font-medium text-sm">
                  No se encontraron platillos...
                </h3>
              </div>
            </div>
          ) : (
            filteredDishes.map((r, i) => (
              <div
                key={i}
                className="flex justify-between items-center my-1.5 p-2.5 rounded-xl bg-[#1a0c06]/50 hover:bg-[#221109] transition-all border border-transparent hover:border-amber-900/30"
              >
                <div className="max-w-[60%]">
                  <h3 className="font-bold text-base text-stone-200">{r.name}</h3>
                  <p className="text-xs text-stone-400 line-clamp-2">{r.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-base text-amber-300">${r.price}</p>
                  <button
                    onClick={() => ManageMenuDish("DELETE", r.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-xl border border-rose-800/60 bg-rose-950/30 text-rose-400 hover:bg-rose-700 hover:text-white transition-all font-bold text-lg active:scale-90"
                    title="Remover del menú"
                  >
                    -
                  </button>
                </div>
              </div>
            ))
          )}
        </ul>
      </div>
    );
  }
 function AvailableDishesList() {
    const [searchVal, setSearchVal] = useState("");
    const availableDishes = useMemo(
      () =>
        allDishes.filter((d) => !currentDishes.some((cd) => cd.id === d.id)),
      [allDishes, currentDishes],
    );
    const filteredDishes = useMemo(
      () =>
        availableDishes.filter((d) =>
          d.name.toLowerCase().includes(searchVal.toLowerCase()),
        ),
      [searchVal],
    );

    return (
      <div className="flex-1 min-w-[300px]">
        <h2 className="font-bold text-xl italic text-amber-100 mb-2">Platillos Disponibles</h2>
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] py-2 px-3 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-600/80 focus:outline-none transition-all mb-3"
          placeholder="Buscar platillo..."
        />
        <ul className="overflow-y-auto max-h-100 w-full divide-y divide-[#2d180d]/60 rounded-2xl border border-[#3a2013]/80 bg-[#120704]/90 p-3 shadow-inner">
          {filteredDishes.length < 1 ? (
            <div className="flex justify-between items-center my-4 p-4 rounded-xl bg-amber-950/10 border border-amber-900/20 text-stone-400">
              <div>
                <h3 className="font-medium text-sm">
                  No se encontraron platillos...
                </h3>
              </div>
            </div>
          ) : (
            filteredDishes.map((r, i) => (
              <div
                key={i}
                className="flex justify-between items-center my-1.5 p-2.5 rounded-xl bg-[#1a0c06]/50 hover:bg-[#221109] transition-all border border-transparent hover:border-amber-900/30"
              >
                <div className="max-w-[60%]">
                  <h3 className="font-bold text-base text-stone-200">{r.name}</h3>
                  <p className="text-xs text-stone-400 line-clamp-2">{r.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-extrabold text-base text-amber-300">${r.price}</p>
                  <button
                    onClick={() => ManageMenuDish("POST", r.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-xl border border-emerald-600/60 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all font-bold text-lg active:scale-90"
                    title="Agregar al menú"
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </ul>
      </div>
    );
  }}