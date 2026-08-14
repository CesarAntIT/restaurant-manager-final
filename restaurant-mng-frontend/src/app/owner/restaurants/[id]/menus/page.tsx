"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { create } from "zustand";
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
    <div>
      {/* Header */}
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
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            My Restaurants
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/workdays`}
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            Work Days
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/menus`}
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            Menus
          </Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
          <div className="mb-6 gap-2 sm:flex-row sm:items-cente">
            <div className="mb-5 flex justify-between">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Menus
              </h1>
              <button
                className="bg-green-800 p-2 rounded-2xl font-bold mr-3 hover:bg-green-950"
                onClick={() => {
                  setShowForm(true);
                  setToEdit(false);
                }}
              >
                Add New Menu &#10798;
              </button>
            </div>

            <MenuSelect />
            <p
              className={`px-5 py-1 m-1 rounded font-bold ${currentMenu?.status == "Active" ? "bg-green-400/50 text-green-200" : "bg-red-400/50 text-red-200"}`}
            >
              {currentMenu?.status == "Active" ? "Active" : "Inactive"}
            </p>
            {showForm ? <MenuForm toEdit={toEdit} /> : ""}

            <hr className="mb-5"></hr>
            <div className="flex flex-wrap gap-3 justify-evenly">
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-40 rounded-4xl border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8 mb-5">
        <h1>Eliminar el Restaurante?</h1>
        <br />
        <p>
          Desea eliminar el Menú{" "}
          <b>
            <i>{toRemove ? currentMenu!.name : ""}</i>
          </b>
          <br />
          El cual tiene{" "}
          <b>{toRemove ? currentDishes.length : ""} </b>
          Platillos?
        </p>

        <button
          onClick={
            toRemove != null ? () => deleteMenu(currentMenu!.id) : () => null
          }
          className="mr-5 bg-red-500 text-white w-30 h-10 rounded-xl hover:bg-red-500/50 hover:font-bold active:bg-red-400"
        >
          Eliminar
        </button>
        <button onClick={() => setToRemove(false)}>Cancelar</button>
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
      <div className="w-full border rounded-xl border-white/10 bg-[#0f0906]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-3xl sm:p-8 mb-5 left-0">
        <h1 className="font-bold text-xl">
          {toEdit ? "Edit Menu" : "Add a new Menu"}
        </h1>
        <br />
        <div>
          <p className="ps-1 italic">Title</p>
          <input
            className="w-125 rounded-md border border-[#2d180d]/70 py-1 mb-3 px-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <p className="ps-1 italic">Description</p>
          <textarea
            className="w-125 rounded-md border border-[#2d180d]/70 py-1 mb-3 px-2"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        {toEdit && (
          <div>
            <p className="ps-1 italic">Status</p>
            <select
              onChange={(e) => setStatus(e.target.value)}
              value={status}
              className="font-bold italic bg-[#0f0906]/80 border-white/10"
            >
              <option value={"Active"}>Active</option>
              <option value={"Inactive"}>Inactive</option>
            </select>
          </div>
        )}

        { toRemove ? <RemoveMenuCard/> : ""}
        
        <div className="flex justify-between">
          <div className=" flex gap-3">
            {toEdit ? (
              <button
                onClick={() =>
                  updateMenu(currentMenu!.id, {
                    description: desc,
                    name: name,
                    status: status,
                  })
                }
                className="bg-amber-700 px-5 py-1 rounded-xl hover:bg-amber-700/75"
              >
                Edit
              </button>
            ) : (
                <button className="bg-green-700 px-5 py-1 rounded-xl hover:bg-amber-700/75"
                  onClick={() => createMenu({description:desc, name: name, restaurantId: Number(restaurantId)})}>
                Add
              </button>
            )}

            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-700 px-5 py-1 rounded-xl hover:bg-gray-700/75"
            >
              Cancel
            </button>
          </div>
          {toEdit ? (
            <button
              onClick={() => setToRemove(true)}
              className="bg-red-700 px-5 py-1 rounded-xl hover:bg-red-700/75 font-bold">
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
      <div className="flex mb-2 gap-2">
        <select
          onChange={(e) => handleChangeMenu(Number(e.target.value))}
          value={currentMenu?.id}
          className="font-bold italic bg-[#0f0906]/80 border-white/10"
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

            className="bg-amber-500 p-1 rounded-xl font-bold mr-3 hover:bg-amber-800"
          >
            {" "}
            Manage Menu
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
      <div>
        <h2 className="font-bold text-xl italic">Platillos Activos</h2>
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-125 rounded-md border border-[#2d180d]/70 py-1 mb-3 px-2"
          placeholder="Buscar"
        />
        <ul className="overflow-y-auto max-h-100 w-125 divide-y divide-[#2d180d]/70 rounded-md border border-[#2d180d]/70 bg-[#120a05] p-4">
          {filteredDishes.length < 1 ? (
            <div
              className={`flex justify-between items-center mb-5 mt-3 p-3 rounded-lg`}
            >
              <div>
                <h3 className="font-bold text-xl">
                  No se encontraron platillos...
                </h3>
              </div>
            </div>
          ) : (
            filteredDishes.map((r, i) => (
              <div
                key={i}
                className={`flex justify-between items-center mb-2 mt-2 p-1 rounded-lg`}
              >
                <div className="max-w-100">
                  <h3 className="font-bold text-lg">{r.name}</h3>
                  <p className="text-xs">{r.description}</p>
                </div>
                <p className="font-bold text-xl text-white text">${r.price}</p>
                <button
                  onClick={() => ManageMenuDish("DELETE", r.id)}
                  className="px-4 py-1 rounded-xl m-2 border-red-700 border-solid border text-red-700 hover:bg-red-700 hover:text-white hover:font-bold"
                >
                  -
                </button>
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
      <div>
        <h2 className="font-bold text-xl italic">Platillos Disponibles</h2>
        <input
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-125 rounded-md border border-[#2d180d]/70 py-1 mb-3 px-2"
          placeholder="Buscar"
        />
        <ul className="overflow-y-auto max-h-100 w-125 divide-y divide-[#2d180d]/70 rounded-md border border-[#2d180d]/70 bg-[#120a05] p-4">
          {filteredDishes.length < 1 ? (
            <div
              className={`flex justify-between items-center mb-5 mt-3 p-3 rounded-lg`}
            >
              <div>
                <h3 className="font-bold text-xl">
                  No se encontraron platillos...
                </h3>
              </div>
            </div>
          ) : (
            filteredDishes.map((r, i) => (
              <div
                key={i}
                className={`flex justify-between items-center mb-2 mt-2 p-1 rounded-lg`}
              >
                <div className="max-w-100">
                  <h3 className="font-bold wrap-normal text-lg">{r.name}</h3>
                  <p className="text-xs">{r.description}</p>
                </div>
                <p className="font-bold text-xl text-white text">${r.price}</p>
                <button
                  onClick={() => ManageMenuDish("POST", r.id)}
                  className="px-4 py-1 rounded-xl m-2 border-green-500 border-solid border text-green-500 hover:bg-green-500 hover:text-white hover:font-bold"
                >
                  {" "}
                  +{" "}
                </button>
              </div>
            ))
          )}
        </ul>
      </div>
    );
  }
}
