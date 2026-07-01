import { LinkButton } from "@/components/Button";

type PolicySection = {
  title: string;
  body: string[];
};

export function PolicyPage({
  eyebrow,
  title,
  description,
  sections
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-600 dark:text-neutral-300">{description}</p>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5 sm:p-7">
        <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          For support, contact Podscentra at <a className="font-bold text-accent" href="tel:+9101204217372">+91 0120 421 7372</a> or{" "}
          <a className="font-bold text-accent" href="mailto:support@podscentra.com">support@podscentra.com</a>.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-2xl font-black">{section.title}</h2>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <LinkButton href="/contact" className="mt-8">Contact support</LinkButton>
    </section>
  );
}
