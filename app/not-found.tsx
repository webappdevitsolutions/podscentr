import { LinkButton } from "@/components/Button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-accent">404</p>
      <h1 className="mt-4 text-5xl font-black">Page not found</h1>
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">The page you are looking for has moved or does not exist.</p>
      <LinkButton href="/" className="mt-7">Return home</LinkButton>
    </section>
  );
}
