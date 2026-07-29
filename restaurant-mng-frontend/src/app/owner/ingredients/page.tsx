"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";

type RestaurantOption = {
  id: number;
  name: string;
  category?: string;
};

type Ingredient = {
  id: string;
  restaurantId: number;
  name: string;
  initialQuantity: number;
  quantity: number;
  stockMinimo: number;
  cost: number;
  weightUnit: string;
  updatedAt: string;
};

type IngredientForm = Omit<Ingredient, "id" | "restaurantId" | "updatedAt">;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const STORAGE_KEY = "tableup-owner-ingredients";
const currencyFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
});

const fallbackRestaurants: RestaurantOption[] = [
  { id: 1, name: "TableUp Bistro", category: "Italiana" },
];

const initialForm: IngredientForm = {
  name: "",
  initialQuantity: 0,
  quantity: 0,
  stockMinimo: 0,
  cost: 0,
  weightUnit: "kg",
};

const seedIngredients: Ingredient[] = [
  {
    id: "seed-1",
    restaurantId: 1,
    name: "Harina premium",
    initialQuantity: 50,
    quantity: 36,
    stockMinimo: 12,
    cost: 28,
    weightUnit: "kg",
    updatedAt: "Hoy",
  },
  {
    id: "seed-2",
    restaurantId: 1,
    name: "Tomate fresco",
    initialQuantity: 25,
    quantity: 7,
    stockMinimo: 10,
    cost: 18,
    weightUnit: "kg",
    updatedAt: "Hoy",
  },
  {
    id: "seed-3",
    restaurantId: 1,
    name: "Aceite de oliva",
    initialQuantity: 12,
    quantity: 9,
    stockMinimo: 4,
    cost: 42,
    weightUnit: "lt",
    updatedAt: "Hoy",
  },
];

export default function IngredientsPanelPage() {
  const { user, token, isAuthenticated } = useAuthStore() as {
    user: { role?: string; name?: string; email?: string; isAdmin?: boolean } | null;
    token: string | null;
    isAuthenticated: boolean;
  };

  const [restaurants, setRestaurants] = useState<RestaurantOption[]>(fallbackRestaurants);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(1);
  const [ingredients, setIngredients] = useState<Ingredient[]>(seedIngredients);
  const [form, setForm] = useState<IngredientForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedRole = String(user?.role ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isOwner = normalizedRole === "owner" || normalizedRole === "dueno" || normalizedRole === "dueao" || normalizedRole === "dueño";

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setIngredients(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    if (!isAuthenticated || !token || !isOwner) return;

    async function loadRestaurants() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/restaurants/my-restaurants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const apiRestaurants = Array.isArray(json?.data) ? json.data : [];

        if (apiRestaurants.length > 0) {
          const mapped = apiRestaurants.map((item: any) => ({
            id: item.id ?? item.Id,
            name: item.name ?? item.Name,
            category: item.category ?? item.Category,
          }));
          setRestaurants(mapped);
          setSelectedRestaurantId(mapped[0].id);
        }
      } catch {
        setMessage("No se pudieron cargar restaurantes desde la API. Puedes trabajar con el restaurante de ejemplo.");
      } finally {
        setLoading(false);
      }
    }

    loadRestaurants();
  }, [isAuthenticated, isOwner, token]);

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0];
  const visibleIngredients = ingredients
    .filter((ingredient) => ingredient.restaurantId === selectedRestaurantId)
    .filter((ingredient) => ingredient.name.toLowerCase().includes(search.toLowerCase()));

  const totals = useMemo(() => {
    const inventory = ingredients.filter((ingredient) => ingredient.restaurantId === selectedRestaurantId);
    const lowStock = inventory.filter((ingredient) => ingredient.quantity <= ingredient.stockMinimo).length;
    const value = inventory.reduce((sum, ingredient) => sum + ingredient.quantity * ingredient.cost, 0);

    return {
      count: inventory.length,
      lowStock,
      value,
    };
  }, [ingredients, selectedRestaurantId]);

  function updateField(field: keyof IngredientForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: field === "name" || field === "weightUnit" ? value : Number(value),
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("El nombre del ingrediente es obligatorio.");
      return;
    }

    if (editingId) {
      setIngredients((current) =>
        current.map((ingredient) =>
          ingredient.id === editingId
            ? { ...ingredient, ...form, name: form.name.trim(), updatedAt: "Ahora" }
            : ingredient,
        ),
      );
      setMessage("Ingrediente actualizado correctamente.");
    } else {
      const newIngredient: Ingredient = {
        ...form,
        id: crypto.randomUUID(),
        restaurantId: selectedRestaurantId,
        name: form.name.trim(),
        updatedAt: "Ahora",
      };
      setIngredients((current) => [newIngredient, ...current]);
      setMessage("Ingrediente agregado al inventario.");
    }

    resetForm();
  }

  function editIngredient(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setForm({
      name: ingredient.name,
      initialQuantity: ingredient.initialQuantity,
      quantity: ingredient.quantity,
      stockMinimo: ingredient.stockMinimo,
      cost: ingredient.cost,
      weightUnit: ingredient.weightUnit,
    });
    setMessage(`Editando ${ingredient.name}.`);
  }

  function deleteIngredient(id: string) {
    setIngredients((current) => current.filter((ingredient) => ingredient.id !== id));
    setMessage("Ingrediente eliminado del inventario.");
  }

  if (!isAuthenticated) {
    return <AccessState title="Acceso requerido" text="Inicia sesion para administrar ingredientes." href="/login" action="Ir al login" />;
  }

  if (!isOwner) {
    return <AccessState title="Rol no permitido" text="Este panel es solo para cuentas de dueño." href="/profile" action="Volver al perfil" />;
  }

  return (
    <main className="min-h-screen bg-[#120904] text-stone-100">
      <header className="border-b border-[#2d180d] bg-[#120904]/95 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-600/60 bg-[#180e08]">
              <Image src="/tableup-logo.png" alt="TableUp" width={30} height={30} className="object-contain" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold italic text-white">TableUp</p>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[2px] text-[#d97706]">Gestion gastronomica inteligente</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
            <Link href="/profile" className="rounded-lg border border-[#2d180d] px-4 py-2 text-stone-300 hover:border-amber-500">Perfil</Link>
            <Link href="/owner/my-restaurants" className="rounded-lg border border-[#2d180d] px-4 py-2 text-stone-300 hover:border-amber-500">Mis restaurantes</Link>
            <span className="rounded-lg bg-amber-500 px-4 py-2 text-neutral-950">Ingredientes</span>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="overflow-hidden rounded-xl border border-[#2d180d] bg-[#180e08]/90">
          <div className="relative bg-[url('https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center">
            <div className="bg-gradient-to-r from-[#120904] via-[#120904]/85 to-black/20 p-6 sm:p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-[#f59e0b]">Panel de dueño</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold text-white sm:text-4xl">Gestion de ingredientes</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">Controla inventario, costo, unidad de medida y alerta de stock minimo por restaurante.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Restaurante</p>
              <select
                value={selectedRestaurantId}
                onChange={(event) => setSelectedRestaurantId(Number(event.target.value))}
                className="mt-3 w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                ))}
              </select>
              <p className="mt-3 text-xs leading-5 text-stone-500">{selectedRestaurant?.category ?? "Categoria pendiente"}</p>
              {loading && <p className="mt-3 text-xs text-sky-300">Cargando restaurantes...</p>}
            </section>

            <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Resumen rapido</p>
              <div className="mt-4 space-y-3">
                <Stat label="Ingredientes" value={String(totals.count)} tone="text-amber-400" />
                <Stat label="Stock bajo" value={String(totals.lowStock)} tone="text-red-300" />
                <Stat label="Valor inventario" value={formatCurrency(totals.value)} tone="text-emerald-400" />
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            {message && <div className="rounded-lg border border-sky-800/40 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">{message}</div>}

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleSubmit} className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
                <div className="mb-5 border-b border-[#2d180d] pb-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">{editingId ? "Editar ingrediente" : "Nuevo ingrediente"}</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Datos del inventario</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Nombre" value={form.name} onChange={(value) => updateField("name", value)} wide />
                  <Input label="Cantidad inicial" type="number" value={String(form.initialQuantity)} onChange={(value) => updateField("initialQuantity", value)} />
                  <Input label="Cantidad actual" type="number" value={String(form.quantity)} onChange={(value) => updateField("quantity", value)} />
                  <Input label="Stock minimo" type="number" value={String(form.stockMinimo)} onChange={(value) => updateField("stockMinimo", value)} />
                  <Input label="Costo unitario" type="number" value={String(form.cost)} onChange={(value) => updateField("cost", value)} />
                  <label className="block space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">Unidad</span>
                    <select
                      value={form.weightUnit}
                      onChange={(event) => updateField("weightUnit", event.target.value)}
                      className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lt">lt</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                      <option value="paquete">paquete</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="rounded-lg bg-amber-500 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 hover:bg-amber-400">
                    {editingId ? "Guardar cambios" : "Agregar ingrediente"}
                  </button>
                  {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-[#2d180d] px-5 py-3 text-xs font-bold uppercase text-stone-300 hover:border-amber-500">Cancelar</button>}
                </div>
              </form>

              <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
                <div className="mb-5 border-b border-[#2d180d] pb-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Control operativo</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Alertas de inventario</h2>
                </div>
                <div className="space-y-3">
                  {visibleIngredients.filter((ingredient) => ingredient.quantity <= ingredient.stockMinimo).length === 0 ? (
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-emerald-200">Todos los ingredientes estan por encima del stock minimo.</div>
                  ) : (
                    visibleIngredients
                      .filter((ingredient) => ingredient.quantity <= ingredient.stockMinimo)
                      .map((ingredient) => <LowStockAlert key={ingredient.id} ingredient={ingredient} />)
                  )}
                </div>
              </section>
            </section>

            <section className="rounded-xl border border-[#2d180d] bg-[#180e08]/90 p-5">
              <div className="mb-5 flex flex-col gap-3 border-b border-[#2d180d] pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#d97706]">Inventario</p>
                  <h2 className="mt-1 text-lg font-bold text-white">Ingredientes registrados</h2>
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar ingrediente"
                  className="rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-[#2d180d]">
                {visibleIngredients.length === 0 ? (
                  <div className="bg-[#120904] p-8 text-center text-sm text-stone-400">No hay ingredientes registrados para este restaurante.</div>
                ) : (
                  <div className="divide-y divide-[#2d180d]">
                    {visibleIngredients.map((ingredient) => <IngredientRow key={ingredient.id} ingredient={ingredient} onEdit={editIngredient} onDelete={deleteIngredient} />)}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function AccessState({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120904] px-5 text-stone-100">
      <section className="max-w-md rounded-xl border border-[#2d180d] bg-[#180e08] p-8 text-center">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-stone-400">{text}</p>
        <Link href={href} className="mt-5 inline-flex rounded-lg bg-amber-500 px-5 py-3 text-xs font-bold uppercase text-neutral-950">{action}</Link>
      </section>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#2d180d] bg-[#120904] px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-stone-400">{label}</span>
      <span className={`font-mono text-lg font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", wide = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return (
    <label className={`block space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">{label}</span>
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#2d180d] bg-[#120904] px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500"
      />
    </label>
  );
}

function LowStockAlert({ ingredient }: { ingredient: Ingredient }) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
      <p className="text-sm font-bold text-red-200">{ingredient.name}</p>
      <p className="mt-1 text-xs text-stone-400">Quedan {ingredient.quantity} {ingredient.weightUnit}. Minimo requerido: {ingredient.stockMinimo} {ingredient.weightUnit}.</p>
    </div>
  );
}

function IngredientRow({ ingredient, onEdit, onDelete }: { ingredient: Ingredient; onEdit: (ingredient: Ingredient) => void; onDelete: (id: string) => void }) {
  const stockLow = ingredient.quantity <= ingredient.stockMinimo;
  const usage = ingredient.initialQuantity > 0 ? Math.min(100, Math.round(((ingredient.initialQuantity - ingredient.quantity) / ingredient.initialQuantity) * 100)) : 0;

  return (
    <article className="grid gap-px bg-[#2d180d] lg:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]">
      <div className="bg-[#120904] p-4">
        <p className="text-sm font-bold text-white">{ingredient.name}</p>
        <p className="mt-1 text-xs text-stone-500">Actualizado: {ingredient.updatedAt}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2d180d]">
          <div className="h-full bg-amber-500" style={{ width: `${usage}%` }} />
        </div>
      </div>
      <Cell label="Cantidad" value={`${ingredient.quantity} ${ingredient.weightUnit}`} tone={stockLow ? "text-red-300" : "text-stone-200"} />
      <Cell label="Stock minimo" value={`${ingredient.stockMinimo} ${ingredient.weightUnit}`} />
      <div className="bg-[#120904] p-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">Acciones</p>
        <p className="mt-2 text-sm font-semibold text-emerald-400">{formatCurrency(ingredient.cost)}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => onEdit(ingredient)} className="rounded border border-[#2d180d] px-3 py-2 text-xs text-stone-300 hover:border-amber-500">Editar</button>
          <button type="button" onClick={() => onDelete(ingredient.id)} className="rounded border border-red-900/70 px-3 py-2 text-xs text-red-300 hover:border-red-500">Eliminar</button>
        </div>
      </div>
    </article>
  );
}

function Cell({ label, value, tone = "text-stone-200" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-[#120904] p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value).replace("DOP", "RD$");
}
