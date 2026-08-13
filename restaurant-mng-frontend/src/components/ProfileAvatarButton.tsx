"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

type AuthState = {
  user?: {
    name?: string;
    Name?: string;
    username?: string;
    Username?: string;
  } | null;
};

export default function ProfileAvatarButton() {
  const user = useAuthStore((state: AuthState) => state.user);

  const displayName =
    user?.name ?? user?.Name ?? user?.username ?? user?.Username ?? "Usuario";

  const initials = displayName
    .toString()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href="/profile"
      className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-bold text-stone-100 transition hover:border-white/40 hover:bg-white/15"
    >
      {initials}
    </Link>
  );
}
