"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-5 z-40">
      {open ? (
        <div className="mb-3 w-72 rounded-3xl border border-black/10 bg-white p-4 shadow-luxury dark:border-white/10 dark:bg-neutral-950">
          <p className="text-sm font-bold">Podscentra Concierge</p>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Ask about sizing, delivery, or styling. Average response under two minutes.</p>
          <button className="mt-4 w-full rounded-full bg-accent px-4 py-2 text-sm font-bold text-white">Start chat</button>
        </div>
      ) : null}
      <button onClick={() => setOpen((value) => !value)} className="focus-ring flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-luxury" aria-label="Open support chat">
        <MessageCircle />
      </button>
    </div>
  );
}
