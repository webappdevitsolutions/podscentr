import { ProductRail } from "@/components/Sections";

export default function HotItemsPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-white via-slate-50 to-violet-50 p-8 shadow-luxury lg:p-12">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Curated luxury collection</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">Hot Items</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600">Most wanted luxury essentials.</p>
        </div>
      </section>
      <ProductRail title="Limited edition essentials" />
    </>
  );
}
