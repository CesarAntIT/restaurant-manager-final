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

        case 'Admin':   router.push('/dashboard/admin'); break;

        case 'Dueño':   router.push('/dashboard/owner'); break;

        case 'Cliente': router.push('/dashboard/client'); break;

        default:        router.push('/dashboard');

      }

    } catch (err) {

      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen flex font-sans antialiased bg-[#0e0b04]">

      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">

        <img

          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85"

          alt="Restaurante elegante"

          className="absolute inset-0 w-full h-full object-cover opacity-50"

        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#4a7934]/50 via-[#1c1107]/40 to-[#562e1f]/70" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12">

          <div className="flex items-center gap-3">

            <Image src="/tableup-logo.png" alt="TableUp Logo" width={36} height={36} className="rounded-lg object-contain" />

            <span className="font-serif italic text-xl font-bold text-[#d4ceb6] tracking-wide">TableUp</span>

          </div>

          <div>

            <div className="w-10 h-[2px] bg-[#bc7629] mb-5" />

            <p className="font-serif italic text-2xl text-[#d4ceb6] leading-relaxed mb-3 max-w-xs">

              "La excelencia no es un acto,<br />es un hábito."

            </p>

            <p className="text-[10.5px] text-[#ce994b] tracking-[2.5px] uppercase font-medium">Gestión Gastronómica</p>

          </div>

        </div>

      </div>



      <div className="flex flex-1 items-center justify-center bg-[#1c1107] px-8 py-12 lg:px-16">

        <div className="w-full max-w-sm">



          <div className="mb-10">

            <Image src="/tableup-logo.png" alt="TableUp Logo" width={70} height={100} className="rounded-xl object-contain mb-5" />

            <h1 className="font-serif italic text-3xl font-bold text-[#d4ceb6] tracking-wide mb-1">TableUp</h1>

            <p className="text-[10px] text-[#bc7629] tracking-[2.5px] uppercase font-medium">Gestión Gastronómica Inteligente</p>

          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#d4ceb6] mb-1">Bienvenido de vuelta</h2>
            <p className="text-sm text-[#a08c60]">Por favor ingresa tus credenciales.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/70 border border-red-800/60 text-[#d4ceb6] text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-[11px] text-[#d4b87a] tracking-[1px] uppercase font-semibold mb-2">
                Correo electrónico
              </label>

              <input

                type="email"

                placeholder="correo@ejemplo.com"

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                className="w-full px-4 py-3 rounded-lg bg-[#0e0b04] border border-[#3a2c10] text-[#d4ceb6] placeholder-[#6a5838] text-sm focus:outline-none focus:border-[#bc7629] focus:ring-1 focus:ring-[#bc7629]/40 transition-all duration-200"

              />

            </div>

            <div>

              <div className="flex justify-between items-center mb-2">

                <label className="text-[11px] text-[#d4b87a] tracking-[1px] uppercase font-semibold">Contraseña</label>

                <Link href="/reset-password" className="text-[11px] text-[#bc7629] hover:text-[#ce994b] transition-colors">

                  ¿Olvidaste tu contraseña?

                </Link>

              </div>

              <input

                type="password"

                placeholder="••••••••"

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                className="w-full px-4 py-3 rounded-lg bg-[#0e0b04] border border-[#3a2c10] text-[#d4ceb6] placeholder-[#6a5838] text-sm focus:outline-none focus:border-[#bc7629] focus:ring-1 focus:ring-[#bc7629]/40 transition-all duration-200"

              />

            </div>

            <div className="flex items-center gap-2.5 pt-1">

              <input

                type="checkbox"

                id="remember"

                checked={remember}

                onChange={(e) => setRemember(e.target.checked)}

                className="w-3.5 h-3.5 rounded-sm border border-[#3a2c10] bg-[#0e0b04] accent-[#bc7629] cursor-pointer"

              />

              <label htmlFor="remember" className="text-xs text-[#a08c60] cursor-pointer select-none">Recordarme</label>

            </div>

            <button

              type="submit"

              disabled={loading}

              className="w-full py-3 mt-2 bg-[#bc7629] hover:bg-[#ce994b] active:scale-[0.98] text-[#1c1107] font-semibold text-[13px] tracking-[1.5px] uppercase rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"

            >
              {loading ? 'Validando...' : 'Iniciar sesión'}

            </button>

            <p className="text-center text-xs text-[#a08c60] pt-1">

              ¿No tienes una cuenta?{' '}

              <Link href="/register" className="text-[#ce994b] font-medium hover:underline transition-all">

                Regístrate aquí

              </Link>

            </p>

          </form>

        </div>

      </div>

    </div>

  );

} 

