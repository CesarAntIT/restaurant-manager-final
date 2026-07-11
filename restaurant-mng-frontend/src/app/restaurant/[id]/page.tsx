"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Review = {
  id: number;
  author: string;
  date: string; // ISO
  food: number;
  ambience: number;
  service: number;
  personal: number;
  comment?: string;
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

export default function RestaurantDetail({ params }: { params: { id: string } }) {
  const { id } = params;

  const restaurant = {
    id: Number(id),
    name: "Restaurante Esencia",
    category: "Restaurante Italiano",
    address: "Calle Mayor 125, Madrid, España",
    images: ["/home_bg.png", "/restaurant_bg.jpg"],
    description:
      "Ven a deleitar tus papilas gustativas con la epítome de las delicias: comida Italiana moderna con técnicas clásicas y producto local.",
  };

  const [reviews, setReviews] = useState<Review[]>([
    { id: 1, author: "Jessica", date: "2026-05-30", food: 4, ambience: 5, service: 4, personal: 4, comment: "Buen lugar, lo recomiendo." },
    { id: 2, author: "Jose", date: "2026-04-16", food: 5, ambience: 5, service: 5, personal: 5, comment: "Excelente experiencia." },
    { id: 3, author: "Anabel", date: "2026-04-08", food: 5, ambience: 4, service: 5, personal: 5, comment: "Gran servicio y ambiente." },
    { id: 4, author: "Carlos", date: "2026-06-02", food: 2, ambience: 2, service: 3, personal: 2, comment: "No fue lo esperado." },
  ]);

  const [filter, setFilter] = useState("all");

  const [food, setFood] = useState(5);
  const [ambience, setAmbience] = useState(5);
  const [service, setService] = useState(5);
  const [personal, setPersonal] = useState(5);
  const [comment, setComment] = useState("");

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

  function submitReview() {
    const next: Review = {
      id: Date.now(),
      author: "Usuario",
      date: new Date().toISOString().slice(0, 10),
      food,
      ambience,
      service,
      personal,
      comment,
    };
    setReviews((s) => [next, ...s]);
    setComment("");
  }

  return (
    <main className="min-h-screen bg-[#0f0b07] text-white">
      <div className="bg-cover bg-center" style={{ backgroundImage: `url('${restaurant.images[0]}')`, height: 260 }} />
      <div className="mx-auto max-w-6xl px-6 py-10">
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
              <p className="mt-4 text-sm text-stone-300">Reservation UI placeholder</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="col-span-2 space-y-6">
            <div className="rounded-2xl bg-[#2f1f12]/40 p-6">
              <p className="text-sm text-stone-300">{restaurant.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {restaurant.images.map((src, i) => (
                  <img key={i} src={src} alt={`${restaurant.name}-${i}`} className="h-28 w-full rounded-lg object-cover" />
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
                  {filtered.map((r) => (
                    <div key={r.id} className="rounded-xl bg-[#1d1208]/60 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold">{r.author}</div>
                          <div className="text-xs text-stone-300">{r.date} · {computeStars(r)} ★</div>
                        </div>
                        <div className="text-sm text-stone-300">Food {r.food} · Amb {r.ambience} · Ser {r.service} · You {r.personal}</div>
                      </div>
                      {r.comment && <p className="mt-3 text-sm text-stone-200">{r.comment}</p>}
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
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm" style={{ color: previewColor.text }}>Preview: {Math.round(((food+ambience+service+personal)/4)*10)/10} ★</div>
                <div className="flex gap-2">
                  <button onClick={submitReview} className="rounded-3xl bg-amber-400 px-4 py-2 font-semibold text-stone-900">Submit review</button>
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
                {restaurant.images.map((s,i)=>(<img key={i} src={s} className="h-20 w-full rounded-md object-cover" alt="photo"/>))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
