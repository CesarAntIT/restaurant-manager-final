"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type restaurant_object = {
  id: number;
  ownerId: string;
  name: string;
  category: string;
  status: string;
  address: string;
  phoneNumber: string;
  createdAt: string;
  images: string[];
}

export default function Restaurants() {
  const FALLBACK_BACKGROUND = "https://images.unsplash.com/photo-1541544181069-3ede9f8b9500?auto=format&fit=crop&w=1600&q=80";

  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(false);
  
  
  return <main>
    
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
                <Link href="/restaurants" className="rounded-full bg-emerald-500/20 text-emerald-200 transition hover:bg-emerald-500/30 px-4 py-2">Restaurants</Link>
                <Link href="/about" className="rounded-full px-4 py-2 transition hover:bg-white/10">About Us</Link>
              </nav>

              <div className="relative z-10 flex items-center gap-3">
                <Image src="/tableup-logo.png" alt="Profile" width={40} height={40} className="rounded-full border border-white/20 bg-white/10" />
              </div>
    </header>


    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start justify-center px-6 py-8">
      <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f0906]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-3xl sm:p-8">
      <div className="mb-6 gap-2 sm:flex-row sm:items-center">
          <div className="mb-5">
                    <h1 className="text-3xl font-semibold text-white sm:text-4xl">Restaurantes</h1>
          </div>
          <div className="flex">
            <input className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              placeholder="Escribe nombre del Restaurante"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}/>
            <button className="ml-5 w-35 bg-green-800 rounded-xl font-bold">Buscar</button>
          </div>
          <hr className="mt-5 mb-5 " />

          

          
        </div>
      </div>
    </div>
    
  </main>;
}
