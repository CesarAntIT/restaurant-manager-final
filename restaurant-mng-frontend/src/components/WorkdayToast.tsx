"use client";

import React, { useEffect } from "react";

type Props = {
  message: string | null;
  type?: "success" | "error" | null;
  onClose?: () => void;
};

export default function WorkdayToast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => {
      onClose && onClose();
    }, 8000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const containerClasses =
    type === "error"
      ? "border border-red-500/50 bg-red-950/80 text-red-200"
      : "border border-emerald-500/50 bg-emerald-950/80 text-emerald-200";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-4 rounded-3xl p-4 text-sm backdrop-blur-xl shadow-2xl ${containerClasses}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full p-2">
          {type === "error" ? (
            <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 13L10.5 16.5L17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div>
          <p className="font-semibold">{message}</p>
        </div>
      </div>
    </div>
  );
}
