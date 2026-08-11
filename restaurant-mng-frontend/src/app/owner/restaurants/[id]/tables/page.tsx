"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

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
    <main>
      <div className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-100" style={{ backgroundImage: `url('/restaurant_bg.jpg'), url('${FALLBACK_BACKGROUND}')` }} />
      <div className="pointer-events-none fixed inset-0 bg-black/55" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 text-stone-100">
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 sm:flex">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={34} height={34} className="rounded-full" />
            <span className="text-sm font-semibold tracking-wide">TableUp</span>
          </div>
        </div>
        <nav className="relative z-10 flex items-center gap-3 text-sm text-stone-200">
          <Link href="/" className="rounded-full px-4 py-2 transition hover:bg-white/10">Home</Link>
          <Link href="/owner/my-restaurants" className="rounded-full px-4 py-2 transition hover:bg-white/10">My Restaurants</Link>
          <Link href="/owner/restaurants" className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Tables</Link>
        </nav>
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">

          {/* Título */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button onClick={() => router.back()} className="text-xs text-stone-400 hover:text-white mb-2 flex items-center gap-1">
                ← Volver
              </button>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Gestión de Mesas</h1>
              <p className="text-sm text-stone-400 mt-1">Administra las mesas de tu restaurante</p>
            </div>
            <button
              onClick={() => { setShowCreate(true); setError(null); }}
              className="bg-green-500/50 px-4 py-2 rounded-xl font-bold hover:bg-green-400/75 text-white"
            >
              + Agregar Mesa
            </button>
          </div>

          {/* Mensajes */}
          {error && <div className="mb-4 rounded-xl border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>}
          {success && <div className="mb-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">{success}</div>}

          {/* Modal Crear */}
          {showCreate && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Nueva Mesa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Número / Nombre de Mesa</label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 1, VIP-A"
                    value={createForm.numberMesa}
                    onChange={(e) => setCreateForm({ ...createForm, numberMesa: e.target.value })}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Capacidad (personas)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ej. 4"
                    value={createForm.seats}
                    onChange={(e) => setCreateForm({ ...createForm, seats: e.target.value })}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowCreate(false); setCreateForm({ numberMesa: "", seats: "" }); }} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancelar</button>
                <button onClick={createTable} disabled={submitting} className="rounded-xl bg-green-500 px-5 py-2 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-50">
                  {submitting ? "Guardando..." : "Guardar Mesa"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Editar */}
          {toEdit && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-[#1a100a]/90 p-6">
              <h2 className="text-lg font-bold text-white mb-1">Editar Mesa</h2>
              <p className="text-sm text-stone-400 mb-4">Modificando: <span className="text-amber-400 font-semibold">{toEdit.numberMesa}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Número / Nombre</label>
                  <input
                    type="text"
                    value={editForm.numberMesa}
                    onChange={(e) => setEditForm({ ...editForm, numberMesa: e.target.value })}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Capacidad</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.seats}
                    onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-amber-400 mb-1">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TableStatus })}
                    className="w-full rounded-lg border border-[#2e1910] bg-[#0e0b04] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  >
                    <option value="Available">Disponible</option>
                    <option value="Occupied">Ocupada</option>
                    <option value="Reserved">Reservada</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setToEdit(null)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancelar</button>
                <button onClick={updateTable} disabled={submitting} className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 disabled:opacity-50">
                  {submitting ? "Actualizando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          )}

          {/* Modal Eliminar */}
          {toDelete && (
            <div className="mb-6 rounded-2xl border border-red-800/50 bg-red-950/20 p-6">
              <h2 className="text-lg font-bold text-white mb-2">¿Eliminar mesa?</h2>
              <p className="text-sm text-stone-300 mb-4">
                ¿Deseas eliminar la mesa <strong className="text-white">{toDelete.numberMesa}</strong> con capacidad de <strong className="text-white">{toDelete.seats} personas</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => deleteTable(toDelete.id)} disabled={submitting} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50">
                  {submitting ? "Eliminando..." : "Eliminar"}
                </button>
                <button onClick={() => setToDelete(null)} className="px-4 py-2 text-sm text-stone-400 hover:text-white">Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista de mesas */}
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">Cargando mesas...</div>
          ) : tables.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-sm text-stone-300">
              No hay mesas registradas. Agrega una con el botón de arriba.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => (
                <article key={table.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{table.numberMesa}</h2>
                      <p className="text-sm text-stone-400">{table.seats} personas</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(table.status)}`}>
                      {statusLabel(table.status)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(table)} className="flex-1 rounded-xl bg-yellow-600/70 py-1.5 text-sm font-bold hover:bg-yellow-500 text-white">
                      Editar
                    </button>
                    <button onClick={() => setToDelete(table)} className="flex-1 rounded-xl bg-red-500/50 py-1.5 text-sm font-bold hover:bg-red-500 text-white">
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