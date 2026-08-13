"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7188";

type Review = {
  id: number;
  author: string;
  date: string; // ISO
  food: number;
  ambience: number;
  service: number;
  personal: number;
  comment?: string;
  userId?: string | number | null;
  user?: {
    id?: string | number | null;
    name?: string;
    email?: string;
  } | null;
};

type Restaurant = {
  id: number;
  name: string;
  category: string;
  address: string;
  images?: string[];
  description: string;
};

function computeStars(r: Review) {
  const avg = (r.food + r.ambience + r.service + r.personal) / 4;
  return Math.round(avg * 10) / 10;
}

function getColorForScore(score: number) {
  if (score >= 4) {
    return { bg: "#064e3b", text: "#d1fae5" };
  }
  if (score >= 3) {
    return { bg: "#f59e0b", text: "#fffbeb" };
  }
  return { bg: "#7f1d1d", text: "#fee2e2" };
}

export default function RestaurantDetail() {
  const { id } = useParams() as { id: string };

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [filter, setFilter] = useState("all");

  const [food, setFood] = useState(5);
  const [ambience, setAmbience] = useState(5);
  const [service, setService] = useState(5);
  const [personal, setPersonal] = useState(5);
  const [comment, setComment] = useState("");
  const token = useAuthStore((state: any) => state.token);
  const currentUser = useAuthStore((state: any) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const computedStars = useMemo(() => {
    return reviews.map((r) => ({ ...r, stars: computeStars(r) }));
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (computedStars.length === 0) return 0;
    const sum = computedStars.reduce((s, r) => s + r.stars, 0);
    return Math.round((sum / computedStars.length) * 10) / 10;
  }, [computedStars]);

  const previewAvg = useMemo(() => {
    return Math.round(((food + ambience + service + personal) / 4) * 10) / 10;
  }, [food, ambience, service, personal]);

  const previewColor = getColorForScore(previewAvg);
  const avgColor = getColorForScore(avgRating);

  const distribution = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    computedStars.forEach((r) => {
      const rounded = Math.max(1, Math.min(5, Math.round(r.stars)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    return counts;
  }, [computedStars]);

  const maxCount = Math.max(...Object.values(distribution), 1);

  const filtered = useMemo(() => {
    let list = [...computedStars];
    if (filter === "newest") list.sort((a, b) => (a.date < b.date ? 1 : -1));
    if (filter === "worst") list.sort((a, b) => a.stars - b.stars);
    if (filter === "best") list.sort((a, b) => b.stars - a.stars);
    return list;
  }, [computedStars, filter]);

  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === "Admin" ||
      currentUser.Role === "Admin" ||
      currentUser.isAdmin === true ||
      currentUser.isAdmin === "true"
    )
  );

  async function LoadRestaurant() {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/${id}`)
      const resjson = await res.json()
      if (resjson.success != true) {
        console.error(resjson.error.code + '/n' + resjson.error.message)
      }

      const data = resjson.data
      setRestaurant(data)
      console.log(data)

    } catch (error) {
      console.error(error)
    }
  }

  function canDeleteReview(review: Review) {
    if (!currentUser) return false;
    if (isAdmin) return true;

    const currentUserId = currentUser.id ?? currentUser.userId ?? currentUser.UserId;
    const reviewUserId = review.userId ?? review.user?.id;
    if (currentUserId && reviewUserId && String(currentUserId) === String(reviewUserId)) {
      return true;
    }

    const currentEmail = currentUser.email ?? currentUser.username ?? currentUser.userName;
    const reviewEmail = review.user?.email;
    if (currentEmail && reviewEmail && String(currentEmail).toLowerCase() === String(reviewEmail).toLowerCase()) {
      return true;
    }

    return false;
  }

  async function loadReviews() {
    try {
      setIsLoadingReviews(true);
      setReviewsError(null);

      const response = await fetch(`${API_URL}/api/reviews/restaurant/${id}`, {
        headers: {
          accept: "*/*",
        },
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar las reseñas.");
      }

      const payload = await response.json();
      // const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.reviews ?? [];

      const mappedReviews: Review[] = payload.data.reviews.map((item: any, index: number) => {
        const baseRating = typeof item.rating === "number" ? item.rating : 5;
        const food = item.food ?? item.foodRating ?? baseRating;
        const ambience = item.ambience ?? item.ambienceRating ?? baseRating;
        const service = item.service ?? item.serviceRating ?? baseRating;
        const personal = item.personal ?? item.personalRating ?? baseRating;
        const rawDate = item.createdAt ?? item.date ?? item.updatedAt ?? new Date().toISOString();

        return {
          id: item.id ?? index + 1,
          author: item.author ?? item.userName ?? item.user?.name ?? item.customerName ?? "Usuario",
          date: rawDate ? new Date(rawDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          food,
          ambience,
          service,
          personal,
          comment: item.comment ?? item.text ?? "",
          userId: item.userId ?? item.user?.id ?? item.customerId ?? null,
          user: item.user ? {
            id: item.user.id ?? item.user.userId ?? null,
            name: item.user.name ?? item.user.fullName ?? null,
            email: item.user.email ?? item.user.mail ?? null,
          } : null,
        };
      });

      setReviews(mappedReviews);
    } catch (error) {
      setReviewsError(error instanceof Error ? error.message : "No se pudieron cargar las reseñas.");
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  }

  useEffect(() => {
    LoadRestaurant();
    loadReviews();
  }, [id]);

  async function deleteReview(reviewId: number) {
    if (!token) {
      setDeleteMessage("Debes iniciar sesión para eliminar una reseña.");
      return;
    }

    setDeletingReviewId(reviewId);
    setDeleteMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo eliminar la reseña.");
      }

      await loadReviews();
      setDeleteMessage("Reseña eliminada correctamente.");
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "No se pudo eliminar la reseña.");
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function submitReview() {
    if (!comment.trim()) {
      setSubmitError("Escribe un comentario antes de enviar la reseña.");
      return;
    }

    if (!token) {
      setSubmitError("Debes iniciar sesión para enviar una reseña.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const rating = Math.max(1, Math.min(5, Math.round((food + ambience + service + personal) / 4)));

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: Number(id),
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo enviar la reseña.");
      }

      setComment("");
      await loadReviews();
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo enviar la reseña.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#0f0b07] text-white flex items-center justify-center">
        <p>Loading restaurant...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0b07] text-white">
      <div className="bg-cover bg-center" style={{ backgroundImage: `url('${API_URL}${restaurant.images?.[0] ?? "/home_bg.png"}')`, height: 260 }} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-100 transition hover:bg-white/10"
          >
            ← Back
          </Link>
        </div>
        <div className="mb-8 flex items-start gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold">{restaurant.name}</h1>
            <p className="mt-2 text-sm" style={{ color: '#ffb900' }}>{restaurant.category} · {restaurant.address}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="rounded-full px-3 py-1" style={{ color: avgColor.text }}>
                <span className="font-semibold">{avgRating}</span>
                <span style={{ color: avgColor.text }}> ★</span>
              </div>
              <div className="text-sm text-stone-300">{computedStars.length} reviews</div>
            </div>
          </div>
          <div className="w-80">
            <div className="rounded-2xl bg-[#2f1f12]/80 p-4">
              <h3 className="text-sm font-semibold" style={{ color: '#ffb900' }}>Make a reservation</h3>
              <Link
                href={`/restaurant/${id}/reserve`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-3xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-neutral-950 transition hover:bg-amber-400"
              >
                Reservar
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="col-span-2 space-y-6">
            <div className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <p className="text-sm text-stone-300">{restaurant.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(restaurant.images ?? []).map((src, i) => (
                  <img key={i} src={API_URL + src} alt={`${restaurant.name}-${i}`} className="h-28 w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>

            <section className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <h3 className="text-lg font-semibold">Ratings & Reviews</h3>
              <div className="mt-4 grid gap-6 lg:grid-cols-3">
                <div className="col-span-1">
                  <div className="text-3xl font-bold" style={{ color: '#ffb900' }}>{avgRating}</div>
                  <div className="text-sm text-stone-300">Average rating</div>
                </div>
                <div className="col-span-2">
                  {([5, 4, 3, 2, 1] as number[]).map((star) => (
                    <div key={star} className="mb-3 flex items-center gap-3">
                      <div className="w-10 text-sm text-stone-300">{star}★</div>
                      <div className="flex-1 bg-white/10 h-4 rounded-full overflow-hidden">
                        <div
                          className="h-4 rounded-full"
                          style={{ width: `${(distribution[star] / maxCount) * 100}%`, backgroundColor: '#e17100' }}
                        />
                      </div>
                      <div className="w-8 text-sm text-stone-300 text-right">{distribution[star] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-stone-300">Filter:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-2xl bg-white/5 px-3 py-2 text-sm">
                      <option value="all">All</option>
                      <option value="newest">Newest</option>
                      <option value="worst">Worst reviews</option>
                      <option value="best">Best reviews</option>
                    </select>
                  </div>
                  <div className="text-sm text-stone-300">Showing {filtered.length} reviews</div>
                </div>

                <div className="mt-6 space-y-4">
                  {isLoadingReviews && <p className="text-sm text-stone-300">Cargando reseñas...</p>}
                  {!isLoadingReviews && reviewsError && <p className="text-sm text-red-300">{reviewsError}</p>}
                  {deleteMessage && <p className="text-sm text-amber-200">{deleteMessage}</p>}
                  {!isLoadingReviews && !reviewsError && filtered.length === 0 && (
                    <p className="text-sm text-stone-300">Aún no hay reseñas para este restaurante.</p>
                  )}
                  {filtered.map((r) => (
                    <div key={r.id} className="rounded-xl bg-[#1d1208]/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{r.author}</div>
                          <div className="text-xs text-stone-300">{r.date} · {computeStars(r)} ★</div>
                        </div>
                        <div className="text-sm text-stone-300">Food {r.food} · Amb {r.ambience} · Ser {r.service} · You {r.personal}</div>
                      </div>
                      {r.comment && <p className="mt-3 text-sm text-stone-200">{r.comment}</p>}
                      {canDeleteReview(r) && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteReview(r.id)}
                            disabled={deletingReviewId === r.id}
                            className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingReviewId === r.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <h3 className="text-lg font-semibold">Write a review</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-stone-300">Food</label>
                  <div className="mt-2 flex gap-2">{[1,2,3,4,5].map((n)=> {
                    const c = getColorForScore(n);
                    return (
                      <button key={n} onClick={() => setFood(n)} className="rounded-full px-3 py-2" style={food===n ? { backgroundColor: c.bg, color: c.text } : undefined}>{n}★</button>
                    );
                  })}</div>
                </div>
                <div>
                  <label className="block text-sm text-stone-300">Ambience</label>
                  <div className="mt-2 flex gap-2">{[1,2,3,4,5].map((n)=> {
                    const c = getColorForScore(n);
                    return (
                      <button key={n} onClick={() => setAmbience(n)} className="rounded-full px-3 py-2" style={ambience===n ? { backgroundColor: c.bg, color: c.text } : undefined}>{n}★</button>
                    );
                  })}</div>
                </div>
                <div>
                  <label className="block text-sm text-stone-300">Service</label>
                  <div className="mt-2 flex gap-2">{[1,2,3,4,5].map((n)=> {
                    const c = getColorForScore(n);
                    return (
                      <button key={n} onClick={() => setService(n)} className="rounded-full px-3 py-2" style={service===n ? { backgroundColor: c.bg, color: c.text } : undefined}>{n}★</button>
                    );
                  })}</div>
                </div>
                <div>
                  <label className="block text-sm text-stone-300">Your rating</label>
                  <div className="mt-2 flex gap-2">{[1,2,3,4,5].map((n)=> {
                    const c = getColorForScore(n);
                    return (
                      <button key={n} onClick={() => setPersonal(n)} className="rounded-full px-3 py-2" style={personal===n ? { backgroundColor: c.bg, color: c.text } : undefined}>{n}★</button>
                    );
                  })}</div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-stone-300">Comment</label>
                <textarea value={comment} onChange={(e)=>setComment(e.target.value)} className="mt-2 w-full rounded-lg bg-white/5 p-3 text-sm" rows={4} />
              </div>
              {submitError && <p className="mt-3 text-sm text-red-300">{submitError}</p>}
              {submitSuccess && <p className="mt-3 text-sm text-emerald-300">Reseña enviada correctamente.</p>}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm" style={{ color: previewColor.text }}>Preview: {Math.round(((food+ambience+service+personal)/4)*10)/10} ★</div>
                <div className="flex gap-2">
                  <button onClick={submitReview} disabled={isSubmitting} className="rounded-3xl bg-amber-400 px-4 py-2 font-semibold text-stone-900 disabled:cursor-not-allowed disabled:opacity-70">
                    {isSubmitting ? "Enviando..." : "Submit review"}
                  </button>
                  <Link href="/" className="rounded-3xl bg-white/5 px-4 py-2">Back</Link>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <h4 className="text-sm font-semibold" style={{ color: '#ffb900' }}>Restaurant info</h4>
              <p className="mt-2 text-sm text-stone-300">{restaurant.address}</p>
            </div>
            <div className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <h4 className="text-sm font-semibold text-amber-200">Photos</h4>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {(restaurant.images ?? []).map((s, i) => (
                  <img key={i} src={`${API_URL}${s}`} className="h-20 w-full rounded-md object-cover" alt="photo" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
