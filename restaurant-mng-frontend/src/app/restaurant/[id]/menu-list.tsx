import { useEffect, useState } from "react";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7188";
export default function MenuList({ restaurantId }: { restaurantId: number }) {
  const [Menus, setMenuList] = useState<Menu[]>([]);
  const [currentMenu, setCurrentMenu] = useState<Menu>();
  const [Dishes, setDishes] = useState<Dish[]>([]);
  const [show, setShow] = useState(true);

  async function getMenuList() {
    try {
      const res = await fetch(
        `${API_URL}/api/menus/restaurant/${restaurantId}`,
        {
          headers: {},
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

      const activeMenus = menus.filter((m) => m.status === "Active");

      setMenuList(activeMenus);
      setCurrentMenu(activeMenus[0]);
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
          headers: {},
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

  useEffect(() => {
    getMenuList();
  }, [restaurantId]);

  useEffect(() => {
    if (currentMenu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getDishesPerMenu();
    }
  }, [currentMenu]);

  if (Menus.length < 1) {
    return ""
  }
  return (
    <div className="grid gap-8 lg:grid-cols-3 w-full">
      <div className="col-span-3 space-y-6">
        <div className="rounded-2xl bg-[#2f1f12]/40 p-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <h1 className="text-2xl font-bold ">Menus:</h1>
                          {!show ? <MenuSelect /> : ""}
            </div>
            <button
              onClick={() => setShow(!show)}
              className="px-2 py-1 rounded-lg font-bold mr-3 bg-amber-500 hover:bg-amber-400"
            >
              {show ? "Mostrar" : "Ocultar"}
            </button>
          </div>
          {!show ? (
            <div>
              <p className="ps-5 py-1">{currentMenu?.description}</p>
              <hr className="py-1"/>
              <ul className=" max-h-100 h-75 overflow-y-auto divide-y divide-[#2d180d]/70 flex gap-5 flex-wrap rounded-md border border-[#2d180d]/70 bg-[#120a05] p-7">
                            {Dishes.map((m, i) => (
                              <div
                                key={i}
                                className={`flex justify-between items-center w-full mb-2 mt-2 p-1 rounded-lg`}
                              >
                                <div className="w-100 shrink-0">
                                  <h3 className="font-bold text-lg">{m.name}</h3>
                                  <p className="text-xs">{m.description}</p>
                                </div>
                                <p className="font-bold text-xl text-white text ps-10">
                                  ${m.price}
                                </p>
                              </div>
                            ))}
                          </ul>  
            </div>
            
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );

  function MenuSelect() {
    return (
      <div className="flex mb-2 gap-2">
        <select
          onChange={(e) => handleChangeMenu(Number(e.target.value))}
          value={currentMenu?.id}
          className="font-bold text-xl italic bg-[#0f0906]/80 border-white/10 py-1 rounded-lg"
        >
          {Menus.length < 1 ? (
            <option>Sin menús</option>
          ) : (
            Menus.map((m, i) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
        </select>
      </div>
    );
  }
}
