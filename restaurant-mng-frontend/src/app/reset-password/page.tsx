"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5155";

function EyeOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
      <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
    </svg>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password) {
      setError("La nueva contraseña es obligatoria.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!token || !email) {
      setError("El enlace de recuperación no es válido o ha expirado.");
      return;
    }

    setIsLoading(true);

    fetch(`${API_URL}/api/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: email,
        Token: token,
        Password: password,
        ConfirmPassword: confirmPassword,
      }),
    })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok || !json.success) {
          setError(json?.error?.message ?? "No se pudo restablecer la contraseña.");
          return;
        }
        setSuccess("Contraseña restablecida correctamente. Te redirigiremos al inicio de sesión.");
        setTimeout(() => router.push("/login"), 2000);
      })
      .catch(() => {
        setError("No se pudo conectar con el servidor.");
      })
      .finally(() => {
        setIsLoading(false);
      });
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
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber-500">Gestión gastronómica</span>
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
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-500">Gestión gastronómica inteligente</p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-white">Nueva contraseña</h2>
            <p className="text-sm text-stone-400">Ingresa y confirma tu nueva contraseña.</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{success}</div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div className="space-y-1.5">
              <p className="font-mono text-xs font-bold uppercase text-amber-400">Nueva contraseña</p>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 pr-10 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-xs font-bold uppercase text-amber-400">Confirmar contraseña</p>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 pr-10 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
                />
                <span
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeClosed /> : <EyeOpen />}
                </span>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-amber-600 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-500 disabled:opacity-60"
            >
              {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#120904]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}