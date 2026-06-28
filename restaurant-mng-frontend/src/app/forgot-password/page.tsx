"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setSuccess("Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.");
      setIsLoading(false);
    }, 800);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#120904] text-stone-100 lg:grid-cols-2">
      <section
        className="relative hidden flex-col justify-between border-r border-[#2a170c] bg-cover bg-center p-12 lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18,9,4,.55), rgba(18,9,4,.88)), url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80')",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center">
            <Image src="/tableup-logo.png" alt="TableUp logo" width={80} height={80} className="object-contain" />
          </div>
          <span className="font-serif text-xl font-semibold italic text-white">TableUp</span>
        </div>

        <div className="max-w-md space-y-4">
          <p className="font-serif text-3xl italic leading-relaxed text-white">
            &quot;La excelencia no es un acto, es un hábito.&quot;
          </p>
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-8 bg-amber-600" />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-500">
              Gestión gastronómica
            </span>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-3 text-center lg:text-left">
            <div className="mx-auto flex h-20 w-20 items-center justify-center lg:mx-0">
              <Image src="/tableup-logo.png" alt="TableUp logo" width={100} height={100} className="object-contain" />
            </div>
            <h1 className="font-serif text-4xl font-semibold italic text-white">TableUp</h1>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-500">
              Gestión gastronómica inteligente
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-white">Restablecer contraseña</h2>
            <p className="text-sm text-stone-400">Ingresa tu correo y te enviaremos instrucciones para recuperar el acceso.</p>
          </div>

          {error && <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              value={email}
              setValue={setEmail}
              placeholder="correo@ejemplo.com"
              type="email"
            />

            <button
              disabled={isLoading}
              className="w-full rounded-lg bg-amber-600 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-500 disabled:opacity-60"
            >
              {isLoading ? "Enviando..." : "Enviar instrucciones"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login" className="text-xs text-stone-400 hover:text-white">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({ label, value, setValue, placeholder, type }: any) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-xs font-bold uppercase text-amber-400">{label}</span>
      <input
        className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
}
