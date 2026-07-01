"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { BlogGrid } from "@/components/Sections";

export default function BlogPage() {
  const [query, setQuery] = useState("");
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Journal</p>
          <h1 className="mt-3 text-5xl font-black sm:text-7xl">Ideas in commerce, style, and AI.</h1>
        </div>
        <label className="flex min-h-12 items-center gap-2 rounded-full bg-white px-5 dark:bg-white/5">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles" className="bg-transparent outline-none" />
        </label>
      </div>
      <div className="mt-6 flex gap-2">
        {["All", "Style", "Commerce", "AI"].map((item) => (
          <button key={item} className="rounded-full bg-white px-4 py-2 text-sm font-bold dark:bg-white/5">{item}</button>
        ))}
      </div>
      <div className="mt-8"><BlogGrid /></div>
    </section>
  );
}
