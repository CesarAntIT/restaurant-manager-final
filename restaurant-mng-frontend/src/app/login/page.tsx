'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5155';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state: any) => state.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailVal = email.trim();
    const passwordVal = password.trim();

    if (!emailVal && !passwordVal) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (!emailVal) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!emailVal.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!passwordVal) {
      setError('La contraseña es obligatoria.');
      return;
    }
    if (passwordVal.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: emailVal, Password: passwordVal }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json?.error?.message ?? 'Credenciales incorrectas.');
        return;
      }

      const { accessToken, expiresIn, user } = json.data;

      login(user, accessToken);
      localStorage.setItem('tableup_token_type', 'Bearer');
      localStorage.setItem('tableup_expires_in', String(expiresIn));
      if (remember) sessionStorage.setItem('tableup_remember', 'true');

      switch (user.role) {
        case 'Admin':   router.push('/admin'); break;
        case 'Dueño':   router.push('/owner'); break;
        case 'Cliente': router.push('/client'); break;
        default:        router.push('/');
      }

    } catch (err) {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#120904] text-stone-100 lg:grid-cols-2">

      {/* LEFT PANEL — imagen restaurante */}
      <section className="relative hidden flex-col justify-between border-r border-[#2a170c] p-12 lg:flex overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85"
          alt="Restaurante elegante"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#4a7934]/50 via-[#1c1107]/40 to-[#562e1f]/70" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center">
              <Image src="/Logo.png" alt="TableUp Logo" width={80} height={80} className="object-contain" />
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
        </div>
      </section>

      {/* RIGHT PANEL — formulario */}
      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-6">

          <div className="space-y-3 text-center lg:text-left">
            <div className="mx-auto flex h-20 w-20 items-center justify-center lg:mx-0">
              <Image src="/Logo.png" alt="TableUp Logo" width={100} height={100} className="object-contain" />
            </div>
            <h1 className="font-serif text-4xl font-semibold italic text-white">TableUp</h1>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber-500">
              Gestión gastronómica inteligente
            </p>
          </div>

          <div>
            <h2 className="text-xl font-medium text-white">Bienvenido de vuelta</h2>
            <p className="text-sm text-stone-400">Por favor ingresa tus credenciales.</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            <label className="block space-y-1.5">
              <span className="block font-mono text-xs font-bold uppercase text-amber-400">Correo electrónico</span>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold uppercase text-amber-400">Contraseña</span>
                <Link href="/forgot-password" className="text-xs text-stone-400 hover:text-white transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2.5 text-sm text-white placeholder-stone-600 outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-amber-600 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-stone-400 cursor-pointer select-none">Recordarme</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-600 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition hover:bg-amber-500 disabled:opacity-60"
            >
              {loading ? 'Validando...' : 'Iniciar sesión'}
            </button>

            <div className="text-center">
              <Link href="/register" className="text-xs text-stone-400 hover:text-white">
                ¿No tienes una cuenta?{' '}
                <span className="font-semibold text-amber-600">Regístrate aquí</span>
              </Link>
            </div>

          </form>
        </div>
      </section>

    </main>
  );
}