"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";
const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

type TableStatus = "Available" | "Occupied" | "Reserved";

type TableItem = {
  id: number;
  restaurantId: number;
  numberMesa: string;
  seats: number;
  status: TableStatus;
};

type SaveTableForm = {
  numberMesa: string;
  seats: string;
};

type UpdateTableForm = {
  numberMesa: string;
  seats: string;
  status: TableStatus;
};

export default function TablesPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const { token, isAuthenticated, user } = useAuthStore();
  const isOwner = Boolean(user && user.role === "Dueño");

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [toEdit, setToEdit] = useState<TableItem | null>(null);
  const [toDelete, setToDelete] = useState<TableItem | null>(null);

  const [createForm, setCreateForm] = useState<SaveTableForm>({ numberMesa: "", seats: "" });
  const [editForm, setEditForm] = useState<UpdateTableForm>({ numberMesa: "", seats: "", status: "Available" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isOwner) return;
    fetchTables();
  }, [isAuthenticated, isOwner]);

  async function fetchTables() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar las mesas.");
      const json = await res.json();
      setTables(Array.isArray(json) ? json : json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las mesas.");
    } finally {
      setLoading(false);
    }
  }

  async function createTable() {
    if (!createForm.numberMesa.trim() || !createForm.seats) {
      setError("Por favor completa todos los campos.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ numberMesa: createForm.numberMesa.trim(), seats: Number(createForm.seats) }),
      });
      if (!res.ok) throw new Error("No se pudo crear la mesa.");
      setSuccess("Mesa creada correctamente.");
      setShowCreate(false);
      setCreateForm({ numberMesa: "", seats: "" });
      fetchTables();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la mesa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTable() {
    if (!toEdit) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/${toEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ numberMesa: editForm.numberMesa.trim(), seats: Number(editForm.seats), status: editForm.status }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la mesa.");
      setSuccess("Mesa actualizada correctamente.");
      setToEdit(null);
      fetchTables();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la mesa.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTable(id: number) {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/restaurants/${restaurantId}/tables/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar la mesa.");
      setSuccess("Mesa eliminada correctamente.");
      setToDelete(null);
      fetchTables();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la mesa.");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(table: TableItem) {
    setToEdit(table);
    setEditForm({ numberMesa: table.numberMesa, seats: String(table.seats), status: table.status });
  }

  function statusColor(status: TableStatus) {
    if (status === "Available") return "bg-emerald-500/20 text-emerald-300";
    if (status === "Occupied") return "bg-red-500/20 text-red-300";
    return "bg-amber-500/20 text-amber-300";
  }

  function statusLabel(status: TableStatus) {
    if (status === "Available") return "Disponible";
    if (status === "Occupied") return "Ocupada";
    return "Reservada";
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
    <main className="min-h-screen bg-[#0d0705] text-stone-200">
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-[#0d0705]/80 backdrop-blur-[2px]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-[#2d180d]/60 bg-[#120804]/60 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full border border-amber-900/40 bg-amber-950/20 px-3.5 py-1.5 shadow-inner sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full ring-2 ring-amber-600/30" />
            <span className="text-sm font-semibold tracking-wide text-amber-100">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-2 text-sm text-stone-300">
          <Link href="/" className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200">Home</Link>
          <Link href="/owner/my-restaurants" className="rounded-full px-4 py-2 transition-all hover:bg-amber-900/20 hover:text-amber-200">My Restaurants</Link>
          <Link href="/owner/my-restaurants" className="rounded-full border border-amber-600/40 bg-gradient-to-r from-amber-700/30 to-amber-600/20 px-4 py-2 font-medium text-amber-200 shadow-sm transition-all hover:border-amber-500/60 hover:from-amber-700/40 hover:to-amber-600/30">Tables</Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <ProfileAvatarButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-4xl border border-[#3a2013]/60 bg-gradient-to-b from-[#180d07]/90 via-[#120804]/90 to-[#0c0503]/90 p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl sm:p-8">

          {/* Título */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button onClick={() => router.back()} className="text-xs text-amber-200/70 hover:text-amber-100 mb-2 flex items-center gap-1 transition-all">
                ← Volver
              </button>
              <h1 className="bg-gradient-to-r from-amber-100 via-stone-200 to-amber-300 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">Gestión de Mesas</h1>
              <p className="text-sm text-stone-400 mt-1">Administra las mesas de tu restaurante</p>
            </div>
            <button
              onClick={() => { setShowCreate(true); setError(null); }}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-600/50 bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-2.5 text-sm font-bold text-emerald-50 shadow-lg shadow-emerald-950/40 transition-all hover:border-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-95"
            >
              + Agregar Mesa
            </button>
          </div>

          {/* Mensajes */}
          {error && <div className="mb-6 rounded-2xl border border-rose-800/50 bg-rose-950/40 p-4 text-sm text-rose-200 backdrop-blur-md shadow-lg">{error}</div>}
          {success && <div className="mb-6 rounded-2xl border border-emerald-800/50 bg-emerald-950/40 p-4 text-sm text-emerald-200 backdrop-blur-md shadow-lg">{success}</div>}

          {/* Modal Crear */}
          {showCreate && (
            <div className="mb-6 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a0e08] to-[#120804] p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl">
              <h2 className="text-lg font-bold text-amber-100 mb-4 tracking-wide">Nueva Mesa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Número / Nombre de Mesa</label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 1, VIP-A"
                    value={createForm.numberMesa}
                    onChange={(e) => setCreateForm({ ...createForm, numberMesa: e.target.value })}
                    className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Capacidad (personas)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ej. 4"
                    value={createForm.seats}
                    onChange={(e) => setCreateForm({ ...createForm, seats: e.target.value })}
                    className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-600 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#2d180d]/60 pt-4">
                <button onClick={() => { setShowCreate(false); setCreateForm({ numberMesa: "", seats: "" }); }} className="rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-all">Cancelar</button>
                <button onClick={createTable} disabled={submitting} className="rounded-xl border border-emerald-600/50 bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 py-2 text-sm font-bold text-emerald-100 shadow-md shadow-emerald-950/40 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 transition-all active:scale-95">
                  {submitting ? "Guardando..." : "Guardar Mesa"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Editar */}
          {toEdit && (
            <div className="mb-6 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#1a0e08] to-[#120804] p-6 shadow-2xl shadow-black/80 backdrop-blur-3xl">
              <h2 className="text-lg font-bold text-amber-100 mb-1 tracking-wide">Editar Mesa</h2>
              <p className="text-sm text-stone-400 mb-4">Modificando: <span className="text-amber-300 font-semibold">{toEdit.numberMesa}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Número / Nombre</label>
                  <input
                    type="text"
                    value={editForm.numberMesa}
                    onChange={(e) => setEditForm({ ...editForm, numberMesa: e.target.value })}
                    className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Capacidad</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.seats}
                    onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })}
                    className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-stone-100 outline-none focus:border-amber-600/80 focus:ring-1 focus:ring-amber-600/80 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/70 mb-1">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TableStatus })}
                    className="w-full rounded-xl border border-[#3a2013] bg-[#0c0503] px-3.5 py-2.5 text-sm text-amber-100 outline-none focus:border-amber-600/80 transition-all cursor-pointer"
                  >
                    <option value="Available">Disponible</option>
                    <option value="Occupied">Ocupada</option>
                    <option value="Reserved">Reservada</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#2d180d]/60 pt-4">
                <button onClick={() => setToEdit(null)} className="rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-white transition-all">Cancelar</button>
                <button onClick={updateTable} disabled={submitting} className="rounded-xl border border-amber-600/50 bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2 text-sm font-bold text-stone-100 shadow-md shadow-amber-950/40 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 transition-all active:scale-95">
                  {submitting ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Eliminar */}
          {toDelete && (
            <div className="mb-6 rounded-2xl border border-rose-900/50 bg-[#160905]/95 p-6 shadow-2xl shadow-black/90 backdrop-blur-2xl">
              <h2 className="text-lg font-bold text-rose-200 mb-2">¿Eliminar mesa?</h2>
              <p className="text-sm text-stone-300 mb-4 leading-relaxed">
                ¿Deseas eliminar la mesa <strong className="text-amber-200">{toDelete.numberMesa}</strong> con capacidad de <strong className="text-amber-200">{toDelete.seats} personas</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => deleteTable(toDelete.id)} disabled={submitting} className="rounded-xl border border-rose-600/50 bg-gradient-to-r from-rose-700 to-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-600 hover:to-red-500 disabled:opacity-50 transition-all active:scale-95">
                  {submitting ? "Eliminando..." : "Eliminar"}
                </button>
                <button onClick={() => setToDelete(null)} className="rounded-xl border border-stone-700/60 bg-stone-800/80 px-4 py-2 text-sm font-medium text-stone-300 hover:bg-stone-700 hover:text-white transition-all">Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista de mesas */}
          {loading ? (
            <div className="rounded-2xl border border-[#3a2013]/60 bg-[#120704]/60 p-10 text-center text-sm text-stone-400">Cargando mesas...</div>
          ) : tables.length === 0 ? (
            <div className="rounded-2xl border border-[#3a2013]/60 bg-[#120704]/60 p-10 text-center text-sm text-stone-400">
              No hay mesas registradas. Agrega una con el botón de arriba.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <article key={table.id} className="rounded-2xl border border-[#3a2013]/80 bg-[#120704]/90 p-5 shadow-xl transition-all hover:border-amber-900/40 backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-amber-100">{table.numberMesa}</h2>
                      <p className="text-xs text-stone-400 mt-0.5">{table.seats} personas</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-md ${statusColor(table.status)}`}>
                      {statusLabel(table.status)}
                    </span>
                  </div>
                  <div className="flex gap-2.5 mt-5">
                    <button onClick={() => openEdit(table)} className="flex-1 rounded-xl border border-amber-700/50 bg-amber-950/40 py-2 text-xs font-bold text-amber-200 hover:bg-amber-800/50 hover:text-amber-100 transition-all active:scale-95">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(table)} className="flex-1 rounded-xl border border-rose-900/50 bg-rose-950/30 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/50 hover:text-rose-100 transition-all active:scale-95">
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