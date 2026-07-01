import { Search } from "lucide-react";
import { LinkButton } from "@/components/Button";

export default function SearchEmptyPage() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <Search size={58} className="text-accent" />
      <h1 className="mt-6 text-5xl font-black">No results found</h1>
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">Try a different search term or browse the full Podscentra collection.</p>
      <LinkButton href="/shop" className="mt-7">Browse products</LinkButton>
    </section>
  );
}
