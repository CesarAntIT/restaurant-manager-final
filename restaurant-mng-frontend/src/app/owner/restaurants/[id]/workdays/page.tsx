"use client";

import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import WorkdayToast from "@/components/WorkdayToast";

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

export default function WorkDayPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const { user, token, isAuthenticated } = useAuthStore();
  const [Menus, setMenuList] = useState<Menu[]>([]);
  const [currentMenu, setCurrentMenu] = useState<Menu>();
  const [Dishes, setDishes] = useState<Dish[]>([]);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchVal, setSearchVal] = useState("");

  const [isOwnerRestaurant, setIsOwnerRestaurant] = useState(false);
  const [isWorkdayActive, setIsWorkdayActive] = useState<boolean | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(false);
  const [pendingAction, setPendingAction] = useState<"start" | "end" | null>(
    null,
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [workdayNotification, setWorkdayNotification] = useState<string | null>(
    null,
  );
  const [workdayNotificationType, setWorkdayNotificationType] = useState<
    "success" | "error" | null
  >(null);

  const filteredDishes = Dishes.filter((d) =>
    d.name.toLowerCase().includes(searchVal.toLowerCase().trim()),
  );

  //Client Side Functions
  function changeQuantity(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;

    if (val === "") {
      setQuantity(0);
      return;
    }
    if (Number(val) < 0) {
      setQuantity(0);
      return;
    }
    setQuantity(Number(val));
  }
  function RefreshPage() {
    setQuantity(0);
    setSelectedDish(null);
    setSearchVal("");
    getDishesPerMenu();
  }

  //API calling Functions
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
  async function handleChangeMenu(id: number) {
    setCurrentMenu(Menus.filter((m) => m.id === id)[0]);
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

      setDishes(dish);
    } catch (e) {
      console.log("Dishes Not Found");
      setDishes([]);
    }
  }
  async function postSale() {
    try {
      const res = await fetch(
        `${API_URL}/api/workdays/sale?dishId=${selectedDish?.id}&quantity=${quantity}`,
        {
          method: "POST",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok != true) {
        const data = await res.json();
        console.error(data.error);
        return false;
      }

      const data = await res.json();
      console.log(data.message);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async function handleConfirmSale() {
    const success = await postSale();
    if (success) {
      setWorkdayNotification("Venta registrada.");
      setWorkdayNotificationType("success");
      RefreshPage();
    } else {
      setWorkdayNotification("Error al registrar la venta");
      setWorkdayNotificationType("error");
    }
  }
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

  async function activateWorkDay(bool: boolean) {
    try {
      let res;
      if (bool) {
        res = await fetch(`${API_URL}/api/workdays/open/${restaurantId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        res = await fetch(`${API_URL}/api/workdays/close/${restaurantId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await res.json();
      if (res.ok != true) {
        console.error(data);
        return false;
      }

      console.log(data);
      // refresh active state after toggling workday
      try {
        await getActiveWorkDay();
      } catch (err) {
        console.error(err);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  async function getActiveWorkDay() {
    if (!restaurantId) return;
    try {
      setIsCheckingActive(true);
      const res = await fetch(
        `${API_URL}/api/workdays/active/${restaurantId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        // treat non-ok as no active workday, but keep null if token missing
        setIsWorkdayActive(false);
        setIsCheckingActive(false);
        return;
      }

      const json = await res.json();
      // API returns success boolean; if success true => active exists
      if (json && typeof json.success !== "undefined") {
        setIsWorkdayActive(Boolean(json.success));
      } else {
        // fallback: if message says no active
        setIsWorkdayActive(
          !(
            json &&
            (json.message || json.Message) &&
            String(json.message).toLowerCase().includes("no hay jornada")
          ),
        );
      }
      setIsCheckingActive(false);
    } catch (e) {
      console.error(e);
      setIsWorkdayActive(false);
      setIsCheckingActive(false);
    }
  }

  useEffect(() => {
    if (restaurantId && token) {
      getMenuList();
      checkRestaurant();
      getActiveWorkDay();
    }
  }, [restaurantId, token]);

  useEffect(() => {
    if (currentMenu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getDishesPerMenu();
    }
  }, [currentMenu]);

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
            href="/owner/restaurants"
            className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2"
          >
            Work Days
          </Link>
          <Link
            href={`/owner/restaurants/${restaurantId}/menus`}
            className="rounded-full px-4 py-2 transition hover:bg-white/10"
          >
            Menus
          </Link>
          <Link
            href="/owner/ingredients"
            className="rounded-full  px-4 py-2 transition hover:bg-white/10"
          >
            Ingredients
          </Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

<div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-4 py-8 sm:px-6 sm:py-10 animate-in fade-in duration-500">
  <div className="w-full rounded-3xl border border-[#57534e]/50 bg-gradient-to-b from-[#292524]/90 via-[#292524]/80 to-[#1c1917]/90 p-6 shadow-2xl shadow-black/70 backdrop-blur-2xl sm:p-10">
    <div className="mb-6 gap-2 sm:flex-row sm:items-center">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-serif font-medium tracking-tight bg-gradient-to-r from-[#f5f5f4] via-[#e7e5e4] to-[#d97706] bg-clip-text text-transparent sm:text-4xl">
          Work Day
        </h1>
        <Link
          href={`/owner/restaurants/${restaurantId}/workdays/history`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b45309]/50 bg-gradient-to-r from-[#b45309] to-[#d97706] px-5 py-2.5 text-sm font-semibold text-stone-100 shadow-md shadow-amber-950/40 transition-all duration-300 hover:brightness-110 hover:shadow-lg active:scale-95"
        >
          <span>Work Day History</span>
          <span className="text-amber-200">→</span>
        </Link>
      </div>

      <WorkdayStartButtons />
      {isCheckingActive && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#78350f]/30 bg-[#78350f]/10 px-3 py-2 text-xs font-medium text-amber-300/90 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <p>Comprobando estado de jornada...</p>
        </div>
      )}

      {showConfirmModal && <ConfirmModal />}
    </div>

    <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-[#57534e]/60 to-transparent" />

    <div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-serif font-medium text-[#f5f5f4] tracking-wide flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#d97706]" />
          Add Work Day Sales
        </h2>
        <MenuSelect />
      </div>

      <div>
        <div>
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto sm:flex-1">
              <input
                className="w-full rounded-2xl border border-[#57534e]/60 bg-[#1c1917]/80 px-4 py-3 text-sm text-stone-100 placeholder-stone-400 outline-none transition-all duration-300 focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 shadow-inner"
                placeholder="Search Dishes by Name..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-[#65a30d]/40 bg-gradient-to-r from-[#3f6212] to-[#4d7c0f] px-6 py-3 text-sm font-semibold text-[#ecfccb] shadow-md transition-all duration-300 hover:brightness-110 active:scale-95"
              onClick={RefreshPage}
            >
              <span>Refresh</span>
              <span className="text-lg leading-none">&#8635;</span>
            </button>
          </div>

          <ul className="overflow-y-auto max-h-[26rem] space-y-3 rounded-2xl border border-[#44403c]/60 bg-[#1c1917]/90 p-4 sm:p-6 shadow-inner scrollbar-thin scrollbar-thumb-[#57534e] scrollbar-track-transparent">
            {filteredDishes.map((r, i) => (
             
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 cursor-pointer ${
                  selectedDish === r
                    ? "border-[#d97706] bg-gradient-to-r from-[#78350f]/80 to-[#451a03]/80 text-white shadow-lg shadow-amber-950/30 scale-[1.01]"
                    : "border-[#44403c]/40 bg-[#292524]/60 text-stone-300 hover:border-[#57534e] hover:bg-[#292524]"
                }`}
                onClick={() => setSelectedDish(r)}
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-medium text-[#f5f5f4]">
                    {r.name}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-2">
                    {r.description}
                  </p>
                  <p className="pt-1 font-sans text-lg font-bold text-[#f59e0b]">
                    ${r.price}
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="selectedDishGroup"
                  className="h-6 w-6 rounded-md border-[#78716c] accent-[#d97706] cursor-pointer transition transform active:scale-90"
                  checked={selectedDish === r}
                  onChange={() => setSelectedDish(r)}
                />
              </div>
            ))}
          </ul>
          
          <CheckoutSection />
        </div>
      </div>
    </div>
  </div>

  <WorkdayToast
    message={workdayNotification}
    type={workdayNotificationType}
    onClose={() => {
      setWorkdayNotification(null);
      setWorkdayNotificationType(null);
    }}
  />
</div></div>);

function WorkdayStartButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      
      <button
        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 shadow-md ${
          isWorkdayActive || isCheckingActive || actionLoading
            ? "border border-[#44403c] bg-[#292524]/50 text-stone-500 cursor-not-allowed shadow-none"
            : "border border-[#65a30d]/40 bg-gradient-to-r from-[#3f6212] to-[#4d7c0f] text-[#ecfccb] hover:brightness-110 hover:shadow-lg active:scale-95"
        }`}
        onClick={() => {
          setPendingAction("start");
          setShowConfirmModal(true);
        }}
        disabled={
          Boolean(isWorkdayActive) || isCheckingActive || actionLoading
        }
        aria-disabled={
          Boolean(isWorkdayActive) || isCheckingActive || actionLoading
        }
      >
        {actionLoading && pendingAction === "start" ? (
          <span className="inline-flex items-center">
            <span className="animate-spin border-2 border-[#ecfccb]/30 border-t-[#ecfccb] rounded-full w-4 h-4 mr-2" />
            Procesando...
          </span>
        ) : (
          "Start Work Day"
        )}
      </button>

      
      <button
        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 shadow-md ${
          isWorkdayActive && !isCheckingActive && !actionLoading
            ? "border border-rose-900/60 bg-gradient-to-r from-rose-950 to-rose-900 text-rose-200 hover:brightness-110 hover:shadow-lg active:scale-95"
            : "border border-[#44403c] bg-[#292524]/50 text-stone-500 cursor-not-allowed shadow-none"
        }`}
        onClick={() => {
          setPendingAction("end");
          setShowConfirmModal(true);
        }}
        disabled={!isWorkdayActive || isCheckingActive || actionLoading}
        aria-disabled={!isWorkdayActive || isCheckingActive || actionLoading}
      >
        {actionLoading && pendingAction === "end" ? (
          <span className="inline-flex items-center">

            <span className="animate-spin border-2 border-rose-200/30 border-t-rose-200 rounded-full w-4 h-4 mr-2" />
            Procesando...
          </span>
        ) : (
          "End Work Day"
        )}
      </button>
    </div>
  );
}

function CheckoutSection() {
  return (
    
    <div className="mt-8 rounded-2xl border border-[#57534e]/50 bg-gradient-to-b from-[#292524]/90 to-[#1c1917]/90 p-6 shadow-xl backdrop-blur-md">
     
      <p className="text-lg font-serif text-stone-300">
        Plato Seleccionado:{" "}
        <b className="font-sans font-semibold text-[#f59e0b]">
          {selectedDish?.name ? selectedDish.name : "Ninguno"}
        </b>
      </p>


      <div className="mt-5 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-stone-400">Cantidad:</span>
          
          <input
            className="w-20 rounded-xl border border-[#57534e]/60 bg-[#1c1917] px-3 py-2 text-center text-base font-semibold text-stone-100 outline-none transition-all focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 shadow-inner"
            type="number"
            value={quantity}
            onChange={changeQuantity}
          />
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-stone-400">Precio Total:</span>
          <span className="text-2xl font-bold text-[#f59e0b]">
            ${selectedDish ? selectedDish.price * quantity : 0}
          </span>
        </div>
      </div>


      <div className="mt-6">
        {selectedDish != null ? (
          <button
            className="w-full sm:w-auto rounded-xl border border-[#65a30d]/40 bg-gradient-to-r from-[#3f6212] to-[#4d7c0f] px-6 py-3 text-base font-semibold text-[#ecfccb] shadow-md transition-all duration-300 hover:brightness-110 hover:shadow-lg active:scale-95"
            onClick={handleConfirmSale}
          >
            Confirmar Venta
          </button>
        ) : (
          <button
            className="w-full sm:w-auto rounded-xl border border-[#44403c] bg-[#292524]/50 px-6 py-3 text-base font-medium text-stone-500 cursor-not-allowed"
            disabled
          >
            Confirmar Venta
          </button>
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
        className="rounded-xl border border-[#57534e]/60 bg-[#1c1917] px-4 py-2 font-serif text-lg italic text-[#f5f5f4] outline-none transition duration-300 focus:border-[#d97706] cursor-pointer shadow-sm"
      >
        {Menus.length < 1 ? (
          <option className="bg-[#1c1917] text-stone-400">Sin menús</option>
        ) : (
          Menus.map((m) => (
            <option key={m.id} value={m.id} className="bg-[#1c1917] text-stone-200">
              {m.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
function ConfirmModal() {
  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1917]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
     
      <div className="w-full max-w-md rounded-3xl border border-[#57534e]/60 bg-gradient-to-b from-[#292524] to-[#1c1917] p-6 sm:p-8 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-200">

        <h3 className="text-xl font-serif font-medium text-[#f5f5f4] tracking-tight">
          Confirmar acción
        </h3>

        <p className="mt-3 text-sm text-stone-300 leading-relaxed">
          {pendingAction === "start"
            ? "¿Desea iniciar la jornada de trabajo?"
            : "¿Desea terminar la jornada de trabajo?"}
        </p>


        <div className="mt-8 flex justify-end gap-3">

          <button
            className="rounded-xl border border-[#57534e]/50 bg-[#1c1917]/50 px-5 py-2.5 text-sm font-medium text-stone-300 transition-all duration-200 hover:bg-[#292524] hover:text-stone-100 active:scale-95"
            onClick={() => {
              setShowConfirmModal(false);
              setPendingAction(null);
            }}
          >
            Cancelar
          </button>

          <button
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all duration-300 active:scale-95 ${
              pendingAction === "start"
                ? "border border-[#65a30d]/40 bg-gradient-to-r from-[#3f6212] to-[#4d7c0f] text-[#ecfccb] hover:brightness-110 hover:shadow-lg"
                : "border border-rose-900/60 bg-gradient-to-r from-rose-950 to-rose-900 text-rose-200 hover:brightness-110 hover:shadow-lg"
            }`}
            onClick={async () => {
              if (!pendingAction) return;
              setActionLoading(true);
              const success = await activateWorkDay(
                pendingAction === "start",
              );
              setActionLoading(false);
              setShowConfirmModal(false);
              if (success) {
                const msg =
                  pendingAction === "start"
                    ? "Jornada iniciada."
                    : "Jornada finalizada.";
                setWorkdayNotification(msg);
                setWorkdayNotificationType("success");
              } else {
                const msg = "Error al completar la acción";
                setWorkdayNotification(msg);
                setWorkdayNotificationType("error");
              }
              setPendingAction(null);
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}}
