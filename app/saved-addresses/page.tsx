import { MapPin, Plus } from "lucide-react";

export default function SavedAddressesPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Account</p>
          <h1 className="mt-3 text-5xl font-black sm:text-7xl">Saved addresses</h1>
        </div>
        <button className="focus-ring flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white">
          <Plus size={18} /> Add address
        </button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {["Home", "Studio"].map((label) => (
          <div key={label} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
            <MapPin className="text-accent" />
            <h2 className="mt-4 text-2xl font-black">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">18 Mercer Street, SoHo, New York, NY 10013, USA</p>
            <button className="mt-4 text-sm font-bold text-accent">Use for checkout</button>
          </div>
        ))}
      </div>
    </section>
  );
}
