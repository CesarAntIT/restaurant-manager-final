"use client";

import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import Link from "next/link";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useParams } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
//import WorkdayToast from "@/components/WorkdayToast";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7188";

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
};

export default function WorkDayPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const { user, token, isAuthenticated } = useAuthStore();
  const isOwner = Boolean(user && user.role == "Dueño" && !user.isAdmin);
  const [Dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchVal, setSearchVal] = useState("");
  const [isOwnerRestaurant, setIsOwnerRestaurant] = useState(false)
  const [isWorkdayActive, setIsWorkdayActive] = useState<boolean | null>(null)
  const [isCheckingActive, setIsCheckingActive] = useState(false)
  const [pendingAction, setPendingAction] = useState<"start" | "end" | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [workdayNotification, setWorkdayNotification] = useState<string | null>(null)
  const [workdayNotificationType, setWorkdayNotificationType] = useState<'success' | 'error' | null>(null)

  const filteredDishes = Dishes.filter((d) =>
      d.name.toLowerCase().includes(searchVal.toLowerCase().trim())
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
    getDishes();
  }

  //API calling Functions
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
        return Error(`${res}`);
      }

      const data = await res.json();
      const dishes: Dish[] = (data as any[]).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
      }));

      setDishes(dishes);
    } catch (e) {
      console.error(e);
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
        return Error(data)
      }
      const data = await res.json();
      if (data.data.ownerId == user.id) {
        setIsOwnerRestaurant(true)
      } else {
        setIsOwnerRestaurant(false)
      }
      
    } catch (e) {
      console.log(e)
    }
  }
  async function activateWorkDay(bool:boolean) {
    try {
      let res
      if (bool) {
        res = await fetch(`${API_URL}/api/workdays/open/${restaurantId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      } else {
        res = await fetch(`${API_URL}/api/workdays/close/${restaurantId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }

      const data = await res.json()
      if (res.ok != true) {
        console.error(data)
        return false
      }

      console.log(data)
      // refresh active state after toggling workday
      try { await getActiveWorkDay(); } catch (err) { console.error(err) }
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function getActiveWorkDay() {
    if (!restaurantId) return;
    try {
      setIsCheckingActive(true)
      const res = await fetch(`${API_URL}/api/workdays/active/${restaurantId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // treat non-ok as no active workday, but keep null if token missing
        setIsWorkdayActive(false);
        setIsCheckingActive(false)
        return;
      }

      const json = await res.json();
      // API returns success boolean; if success true => active exists
      if (json && typeof json.success !== "undefined") {
        setIsWorkdayActive(Boolean(json.success));
      } else {
        // fallback: if message says no active
        setIsWorkdayActive(!(json && (json.message || json.Message) && String(json.message).toLowerCase().includes("no hay jornada")));
      }
      setIsCheckingActive(false)
    } catch (e) {
      console.error(e);
      setIsWorkdayActive(false);
      setIsCheckingActive(false)
    }
  }

  useEffect(() => {
    if (restaurantId && token) {
      getDishes();
      checkRestaurant();
      getActiveWorkDay();
    }
  },[restaurantId, token]);

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
                Work Day
              </h1>
              <Link
                href={`/owner/restaurants/${restaurantId}/workdays/history`}
                className="bg-amber-500 p-2 rounded-2xl font-bold mr-3 hover:bg-amber-800"
              >
                Work Day History
              </Link>
            </div>

            {/*Eventually this Div will become a single button instead of 2*/}
            <div className="justify-between mb-2">
              <button
                className={`p-2 rounded-2xl font-bold mr-3 ${isWorkdayActive || isCheckingActive || actionLoading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-500 hover:bg-blue-800"}`}
                onClick={() => { setPendingAction("start"); setShowConfirmModal(true); }}
                disabled={Boolean(isWorkdayActive) || isCheckingActive || actionLoading}
                aria-disabled={Boolean(isWorkdayActive) || isCheckingActive || actionLoading}
              >
                {actionLoading && pendingAction === "start" ? (
                  <span className="inline-flex items-center"><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-2"/>Procesando...</span>
                ) : (
                  "Start Work Day"
                )}
              </button>
              <button
                className={`p-2 rounded-2xl font-bold ${isWorkdayActive && !isCheckingActive && !actionLoading ? "bg-red-500 hover:bg-red-800" : "bg-gray-400 cursor-not-allowed text-white"}`}
                onClick={() => { setPendingAction("end"); setShowConfirmModal(true); }}
                disabled={!isWorkdayActive || isCheckingActive || actionLoading}
                aria-disabled={!isWorkdayActive || isCheckingActive || actionLoading}
              >
                {actionLoading && pendingAction === "end" ? (
                  <span className="inline-flex items-center"><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 mr-2"/>Procesando...</span>
                ) : (
                  "End Work Day"
                )}
              </button>
            </div>
            {isCheckingActive && (
              <p className="text-sm text-stone-400">Comprobando estado de jornada...</p>
            )}

            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-2xl bg-[#0b0b0b] p-6">
                  <h3 className="text-lg font-semibold text-white">Confirmar acción</h3>
                  <p className="mt-3 text-sm text-stone-300">{pendingAction === "start" ? "¿Iniciar la jornada de trabajo?" : "¿Terminar la jornada de trabajo?"}</p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-stone-200"
                      onClick={() => { setShowConfirmModal(false); setPendingAction(null); }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
                      onClick={async () => {
                        if (!pendingAction) return;
                        setActionLoading(true);
                        const success = await activateWorkDay(pendingAction === "start");
                        setActionLoading(false);
                        setShowConfirmModal(false);
                        // show toast notification (WorkdayToast will auto-dismiss)
                        if (success) {
                          const msg = pendingAction === "start" ? "Jornada iniciada." : "Jornada finalizada.";
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
            )}
            <p>Current Started: 31/07/2026</p>
          </div>
          <hr className="mt-5 mb-5 " />
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Historial de ventas</h2>
                <p className="text-sm text-stone-400">Ver ventas detalladas por workday.</p>
              </div>
              <Link
                href={`/owner/restaurants/${restaurantId}/workdays/history`}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Ver historial de ventas
              </Link>
            </div>
          </div>
          <div>
            <h2>Add Work Day Sales</h2>
            <div>
              <div>
                <div className="flex items-center">
                  <input
                    className="p-3 border-amber-400 border rounded-xl w-150 m-3"
                    placeholder="Search Dishes by Name"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                  />
                  <button
                    className="rounded-xl bg-blue-700 hover:bg-blue-800 pl-3 pr-5 h-13"
                    onClick={RefreshPage}
                  >
                    Refresh &#8635;
                  </button>
                </div>
                <ul className="overflow-y-auto max-h-100 divide-y divide-[#2d180d]/70 rounded-md border border-[#2d180d]/70 bg-[#120a05] p-7">
                  {filteredDishes.map((r, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center mb-5 mt-3 p-3 rounded-lg ${
                        selectedDish === r ? "bg-amber-900 text-white" : ""
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-xl">{r.name}</h3>
                        <p>{r.description}</p>
                        <p className="font-bold text-xl">${r.price}</p>
                      </div>

                      <input
                        type="checkbox"
                        name="selectedDishGroup"
                        className="border-amber-600 accent-amber-600 size-10 ml-5 cursor-pointer"
                        checked={selectedDish === r}
                        onChange={() => setSelectedDish(r)}
                      />
                    </div>
                  ))}
                </ul>
              </div>
              <div className="mt-10">
                <p className="text-2xl">
                  Plato Seleccionado: <b>{selectedDish?.name}</b>
                </p>
                <br></br>
                <div className="flex text-xl items-center">
                  <p>Cantidad de Venta:</p>
                  <input
                    className="ml-5 w-18 text-center bg-white text-black font-bold rounded-xl pl-3"
                    type="number"
                    value={quantity}
                    onChange={changeQuantity}
                  />
                  <p className="ml-10">
                    Precio Total: $
                    <b className="text-3xl">
                      {selectedDish ? selectedDish.price * quantity : 0}
                    </b>
                  </p>
                </div>
                {selectedDish != null ? (
                  <button className="text-2xl mt-3 p-3 bg-green-700 hover:bg-green-950 font-bold rounded-2xl" onClick={handleConfirmSale}>
                    Confirmar Venta
                  </button>
                ) : (
                  <button
                    className="text-2xl mt-3 p-3 bg-green-300/30 font-bold rounded-2xl"
                    disabled
                  >
                    Confirmar Venta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* <WorkdayToast
          message={workdayNotification}
          type={workdayNotificationType}
          onClose={() => {
            setWorkdayNotification(null);
            setWorkdayNotificationType(null);
          }}
        /> */}
    </div>
  );
}
