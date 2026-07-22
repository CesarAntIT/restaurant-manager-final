import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0b07] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#2f1f12]/80 p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p className="mt-4 text-sm text-stone-300">
          Para acceder a esta página, inicia sesión en tu cuenta.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-3xl bg-amber-400 px-5 py-2.5 font-semibold text-stone-900 transition hover:bg-amber-300"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
