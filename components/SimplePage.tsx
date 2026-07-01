import { LinkButton } from "@/components/Button";

export function SimplePage({
  eyebrow,
  title,
  description,
  items
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">{description}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
            <h2 className="text-2xl font-black">{item}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">
              Premium ecommerce details designed for a real polo t-shirt shopping flow.
            </p>
          </div>
        ))}
      </div>
      <LinkButton href="/shop" className="mt-10">Shop Podscentra</LinkButton>
    </section>
  );
}
