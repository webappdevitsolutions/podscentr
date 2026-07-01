import Link from "next/link";

export function AuthCard({ title, cta, extra, footer }: { title: string; cta: string; extra?: string; footer: React.ReactNode }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-3xl bg-white p-8 shadow-luxury dark:bg-white/5">
        <h1 className="text-4xl font-black">{title}</h1>
        <div className="mt-7 grid gap-3">
          {extra ? <input placeholder={extra} className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" /> : null}
          <input placeholder="Email" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
          <input placeholder="Password" type="password" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
          <Link href="/profile" className="focus-ring mt-2 flex min-h-12 items-center justify-center rounded-full bg-accent font-bold text-white">{cta}</Link>
        </div>
        <div className="mt-6 flex justify-between text-sm font-bold text-accent">{footer}</div>
      </div>
    </section>
  );
}
