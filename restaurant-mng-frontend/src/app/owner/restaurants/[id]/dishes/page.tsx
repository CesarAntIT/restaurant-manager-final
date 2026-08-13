"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type Ingredient = {
  id: number;
  restaurantId: number;
  name: string;
  weightUnit: string;
};

type DishIngredient = {
  ingredientId: number;
  ingredientName: string;
  quantityNeeded: number;
  weightUnit: string;
};

type Dish = {
  id: number;
  restaurantId: number;
  name: string;
  description: string;
  price: number;
  ingredients: DishIngredient[];
};

type IngredientRow = {
  ingredientId: string;
  quantityNeeded: string;
};

type DishForm = {
  name: string;
  description: string;
  price: string;
  ingredients: IngredientRow[];
};

const emptyForm: DishForm = { name: "", description: "", price: "", ingredients: [] };

const currencyFormatter = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" });

async function readApiError(res: Response) {
  try {
    const json = await res.json();
    return json?.message ?? json?.error?.message ?? "No se pudo procesar la solicitud.";
  } catch {
    return "No se pudo procesar la solicitud.";
  }
}

export default function DishesPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const { token, isAuthenticated, user } = useAuthStore();
  const isOwner = Boolean(user && user.role === "Dueño");

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [ingredientsCatalog, setIngredientsCatalog] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [toEdit, setToEdit] = useState<Dish | null>(null);
  const [toDelete, setToDelete] = useState<Dish | null>(null);

  const [createForm, setCreateForm] = useState<DishForm>(emptyForm);
  const [editForm, setEditForm] = useState<DishForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    fetchDishes();
    fetchIngredients();
  }, [isAuthenticated, isOwner]);

  async function fetchDishes() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/dishes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const json = await res.json();
      setDishes(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los platos.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchIngredients() {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/ingredients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setIngredientsCatalog(Array.isArray(json) ? json : json.data ?? []);
    } catch {
    }
  }

  function addIngredientRow(setForm: React.Dispatch<React.SetStateAction<DishForm>>) {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ingredientId: "", quantityNeeded: "" }] }));
  }

  function updateIngredientRow(
    setForm: React.Dispatch<React.SetStateAction<DishForm>>,
    index: number,
    field: keyof IngredientRow,
    value: string
  ) {
    setForm((f) => {
      const next = [...f.ingredients];
      next[index] = { ...next[index], [field]: value };
      return { ...f, ingredients: next };
    });
  }

  function removeIngredientRow(setForm: React.Dispatch<React.SetStateAction<DishForm>>, index: number) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== index) }));
  }

  function buildIngredientsPayload(rows: IngredientRow[]) {
    return rows
      .filter((r) => r.ingredientId && r.quantityNeeded)
      .map((r) => ({ ingredientId: Number(r.ingredientId), quantityNeeded: Number(r.quantityNeeded) }));
  }

  async function createDish() {
    if (!createForm.name.trim() || !createForm.price) {
      setError("Por favor completa nombre y precio.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/dishes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          price: Number(createForm.price),
          ingredients: buildIngredientsPayload(createForm.ingredients),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setSuccess("Plato creado correctamente.");
      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchDishes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el plato.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateDish() {
    if (!toEdit) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/dishes/${toEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          price: Number(editForm.price),
          ingredients: buildIngredientsPayload(editForm.ingredients),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setSuccess("Plato actualizado correctamente.");
      setToEdit(null);
      fetchDishes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar el plato.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteDish(id: number) {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/dishes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await readApiError(res));
      setSuccess("Plato eliminado correctamente.");
      setToDelete(null);
      fetchDishes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el plato.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(dish: Dish) {
    setToEdit(dish);
    setEditForm({
      name: dish.name,
      description: dish.description ?? "",
      price: String(dish.price),
      ingredients: dish.ingredients.map((i) => ({
        ingredientId: String(i.ingredientId),
        quantityNeeded: String(i.quantityNeeded),
      })),
    });
  }

  if (!isAuthenticated || !isOwner) {
    return (
      <div className="min-h-screen bg-[#120904] flex items-center justify-center text-stone-100 text-center p-8">
        <div>
          <p className="mb-4">Necesitas iniciar sesión como dueño para ver esta página.</p>
          <Link href="/login" className="rounded-full px-4 py-2 bg-amber-600 text-black font-bold hover:bg-amber-500">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-black/55" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full" />
            <span className="text-sm font-semibold tracking-wide">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-3 text-sm text-stone-200">
          <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">Home</Link>
          <Link href="/owner/my-restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">Mis Restaurantes</Link>
          <Link href={`/owner/restaurants/${restaurantId}/tables`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Mesas</Link>
          <Link href={`/owner/restaurants/${restaurantId}/dishes`} className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Platos</Link>
          <Link href={`/owner/restaurants/${restaurantId}/dashboard`} className="rounded-full px-4 py-2 transition hover:bg-white/10">Ventas</Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <button onClick={() => router.back()} className="text-xs text-stone-400 hover:text-white mb-2 flex items-center gap-1">
                ← Volver
              </button>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Gestión de Platos</h1>
              <p className="text-sm text-stone-400 mt-1">Administra el menú de tu restaurante</p>
            </div>
            <button
              onClick={() => { setShowCreate(true); setError(null); }}
              className="bg-green-500/50 px-4 py-2 rounded-xl font-bold hover:bg-green-400/75 text-white"
            >
              + Agregar Plato
            </button>
          </div>

          {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">{success}</div>}

          {showCreate && (
            <DishFormPanel
              title="Nuevo Plato"
              form={createForm}
              setForm={setCreateForm}
              ingredientsCatalog={ingredientsCatalog}
              onCancel={() => { setShowCreate(false); setCreateForm(emptyForm); }}
              onSubmit={createDish}
              submitting={submitting}
              submitLabel="Guardar Plato"
              addRow={() => addIngredientRow(setCreateForm)}
              updateRow={(i, field, value) => updateIngredientRow(setCreateForm, i, field, value)}
              removeRow={(i) => removeIngredientRow(setCreateForm, i)}
            />
          )}

          {toEdit && (
            <DishFormPanel
              title={`Editando: ${toEdit.name}`}
              form={editForm}
              setForm={setEditForm}
              ingredientsCatalog={ingredientsCatalog}
              onCancel={() => setToEdit(null)}
              onSubmit={updateDish}
              submitting={submitting}
              submitLabel="Guardar Cambios"
              addRow={() => addIngredientRow(setEditForm)}
              updateRow={(i, field, value) => updateIngredientRow(setEditForm, i, field, value)}
              removeRow={(i) => removeIngredientRow(setEditForm, i)}
            />
          )}

          {toDelete && (
            <div className="mb-6 rounded-2xl border border-red-800/50 bg-red-950/20 p-6">
              <h2 className="text-lg font-bold text-white mb-2">¿Eliminar plato?</h2>
              <p className="text-sm text-stone-300 mb-4">
                ¿Deseas eliminar el plato <strong className="text-white">{toDelete.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => deleteDish(toDelete.id)} disabled={submitting} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50">
                  {submitting ? "Eliminando..." : "Eliminar"}
                </button>
                <button onClick={() => setToDelete(null)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancelar</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">Cargando platos...</div>
          ) : dishes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">
              No hay platos registrados. Agrega uno con el botón de arriba.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish) => (
                <article key={dish.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-lg font-semibold text-white">{dish.name}</h2>
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                      {currencyFormatter.format(dish.price)}
                    </span>
                  </div>
                  {dish.description && <p className="text-sm text-stone-400 mb-3">{dish.description}</p>}
                  {dish.ingredients.length > 0 && (
                    <ul className="mb-3 space-y-1">
                      {dish.ingredients.map((ing) => (
                        <li key={ing.ingredientId} className="text-xs text-stone-500">
                          • {ing.ingredientName}: {ing.quantityNeeded} {ing.weightUnit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(dish)} className="flex-1 rounded-xl bg-yellow-600/70 py-1.5 text-sm font-bold hover:bg-yellow-500 text-white">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(dish)} className="flex-1 rounded-xl bg-red-500/50 py-1.5 text-sm font-bold hover:bg-red-500 text-white">
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function DishFormPanel({
  title,
  form,
  setForm,
  ingredientsCatalog,
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
  addRow,
  updateRow,
  removeRow,
}: {
  title: string;
  form: DishForm;
  setForm: React.Dispatch<React.SetStateAction<DishForm>>;
  ingredientsCatalog: Ingredient[];
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  addRow: () => void;
  updateRow: (index: number, field: keyof IngredientRow, value: string) => void;
  removeRow: (index: number) => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Nombre del Plato</label>
          <input
            type="text"
            placeholder="Ej. Mofongo con camarones"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Precio</label>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Ej. 450"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Descripción</label>
          <textarea
            placeholder="Descripción del plato (opcional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-mono uppercase text-amber-400">Ingredientes</label>
          <button type="button" onClick={addRow} className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">
            + Agregar ingrediente
          </button>
        </div>

        {form.ingredients.length === 0 ? (
          <p className="text-xs text-stone-500">Este plato no tiene ingredientes asociados todavía.</p>
        ) : (
          <div className="space-y-2">
            {form.ingredients.map((row, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={row.ingredientId}
                  onChange={(e) => updateRow(index, "ingredientId", e.target.value)}
                  className="flex-1 rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                >
                  <option value="">Selecciona un ingrediente</option>
                  {ingredientsCatalog.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.weightUnit})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Cantidad"
                  value={row.quantityNeeded}
                  onChange={(e) => updateRow(index, "quantityNeeded", e.target.value)}
                  className="w-28 rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <button type="button" onClick={() => removeRow(index)} className="text-red-400 hover:text-red-300 text-sm px-2">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancelar</button>
        <button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-green-500 px-5 py-2 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50">
          {submitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </div>
  );
}