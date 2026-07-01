import { ProductRail } from "@/components/Sections";

export default function DealsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-ink p-8 text-white shadow-luxury dark:bg-white dark:text-ink lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-300 dark:text-accent">Deals</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">Buy 1 Get 1 on every polo, all week long.</h1>
          <p className="mt-5 max-w-2xl text-white/70 dark:text-neutral-600">Mix and match colors across our classic and premium polos — limited-time pricing on everyday essentials.</p>
        </div>
      </section>
      <ProductRail title="Sale edit" />
    </>
  );
}
