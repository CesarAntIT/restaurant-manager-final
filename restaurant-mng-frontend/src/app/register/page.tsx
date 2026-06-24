"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Role = "Cliente" | "Dueño";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurada");
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("Cliente");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => {
    if (!password) return { label: "Sin ingresar", score: 0, color: "bg-stone-800" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-ZÁÉÍÓÚÑ]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Muy débil", score: 25, color: "bg-red-500" };
    if (score === 2) return { label: "Débil", score: 50, color: "bg-amber-500" };
    if (score === 3) return { label: "Media", score: 75, color: "bg-yellow-500" };
    return { label: "Fuerte", score: 100, color: "bg-emerald-500" };
  }, [password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) return setError("Ingresa tu nombre completo.");
    if (!email.includes("@")) return setError("Ingresa un correo electrónico válido.");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden.");
    if (!acceptedTerms) return setError("Debes aceptar los términos para continuar.");

    setIsLoading(true);

    

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name.trim(),
          Email: email.trim().toLowerCase(),
          Password: password,
          ConfirmPassword: confirmPassword,
          Role: role,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No se pudo crear la cuenta.");
      }

      setSuccess("Cuenta creada correctamente. Te llevaremos al inicio de sesión.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message.replaceAll('"', "") : "Error al registrar.");
    } finally {
      setIsLoading(false);
    }
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
            <Image
            src="/tableup-logo.png"
            alt="TableUp logo"
            width={80}
            height={80}
            className="object-contain"
            />
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
              <Image
              src="/tableup-logo.png"
              alt="TableUp logo"
              width={100}
              height={100}
              className="object-contain"
              />
              </div>
            <h1 className="font-serif text-4xl font-semibold italic text-white">TableUp</h1>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-500">
              Gestión gastronómica inteligente
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-white">Crear nueva cuenta</h2>
            <p className="text-sm text-stone-400">Regístrate en TableUp en unos rápidos pasos.</p>
          </div>

          {error && <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nombre completo" value={name} setValue={setName} placeholder="Ej. Nombre " type="text" />
            <Input label="Correo electrónico" value={email} setValue={setEmail} placeholder="correo@ejemplo.com" type="email" />

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-bold uppercase text-amber-400">Selecciona tu rol</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Cliente", "Dueño"] as Role[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`rounded-lg border p-3 text-xs font-semibold transition ${
                      role === item
                        ? "border-amber-600 bg-amber-600/15 text-amber-500"
                        : "border-[#2e1910] bg-[#180e08] text-stone-400 hover:border-[#4d2d1d]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <Password label="Contraseña" value={password} setValue={setPassword} visible={showPassword} setVisible={setShowPassword} />
            <Password label="Confirmar contraseña" value={confirmPassword} setValue={setConfirmPassword} visible={showConfirmPassword} setVisible={setShowConfirmPassword} />

            {password.length > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-stone-400">
                  <span>Fuerza: <strong className="text-white">{strength.label}</strong></span>
                  <span>{strength.score}%</span>
                </div>
                <div className="h-1 rounded-full bg-stone-800">
                  <div className={`h-full rounded-full ${strength.color}`} style={{ width: `${strength.score}%` }} />
                </div>
              </div>
            )}

            <label className="flex gap-2 text-xs text-stone-400">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="accent-amber-600" />
              Acepto los términos de servicio y las políticas de privacidad.
            </label>

            <button disabled={isLoading} className="w-full rounded-lg bg-amber-600 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 hover:bg-amber-500 disabled:opacity-60">
              {isLoading ? "Procesando registro..." : "Crear cuenta"}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login" className="text-xs text-stone-400 hover:text-white">
              ¿Ya tienes una cuenta? <span className="font-semibold text-amber-600">Inicia sesión aquí</span>
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
      <input className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500" type={type} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}

function Password({ label, value, setValue, visible, setVisible }: any) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-xs font-bold uppercase text-amber-400">{label}</span>
      <div className="relative">
        <input className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 pr-16 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500" type={visible ? "text" : "password"} placeholder="••••••••" value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-2.5 text-xs text-stone-400">
          {visible ? "Ocultar" : "Ver"}
        </button>
      </div>
    </label>
  );
}