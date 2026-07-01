import Image from "next/image";

export default function AboutPage() {
  return (
    <section>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Our story</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">Designed for less noise and better taste.</h1>
          <p className="mt-6 text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            Podscentra was built around a simple belief: ecommerce should feel intelligent, elegant, and deeply usable. We curate premium essentials across style, tech, travel, and daily rituals.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-luxury">
          <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop" alt="Podscentra retail studio" fill className="object-cover" />
        </div>
      </div>
      <div className="bg-white py-14 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {["92K customers", "38 countries", "4.9 rating", "2026 launch"].map((stat) => (
            <div key={stat} className="rounded-3xl bg-neutral-100 p-6 dark:bg-white/5">
              <h2 className="text-3xl font-black">{stat}</h2>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-black">Mission and timeline</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Curate fewer, better products.", "Make AI shopping feel human.", "Build a premium commerce operating system."].map((item) => (
            <div key={item} className="rounded-3xl bg-white p-6 dark:bg-white/5">
              <p className="text-xl font-black">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4">
          {["Concept studio formed", "Private beta opened", "Global launch collection", "Concierge AI rollout"].map((item, index) => (
            <div key={item} className="flex gap-4 rounded-3xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-white/5">
              <span className="text-2xl font-black text-accent">0{index + 1}</span>
              <p className="font-bold">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
