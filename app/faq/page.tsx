"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";

const items = ["What payment methods are supported?", "How does sizing work?", "Can I return sale items?", "Where is my order?", "How do AI recommendations work?"];

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(0);
  const filtered = items.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-black sm:text-7xl">FAQ</h1>
      <label className="mt-8 flex min-h-12 items-center gap-2 rounded-full bg-white px-5 dark:bg-white/5">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FAQ" className="w-full bg-transparent outline-none" />
      </label>
      <div className="mt-6 grid gap-3">
        {filtered.map((item, index) => (
          <button key={item} onClick={() => setOpen(index)} className="rounded-3xl bg-white p-5 text-left dark:bg-white/5">
            <span className="flex items-center justify-between text-lg font-black">{item}<ChevronDown /></span>
            {open === index ? <p className="mt-3 leading-7 text-neutral-500 dark:text-neutral-400">Podscentra policies are designed to be simple, fast, and transparent across every order.</p> : null}
          </button>
        ))}
      </div>
    </section>
  );
}
