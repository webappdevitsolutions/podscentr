export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-3xl bg-white p-4 dark:bg-white/5">
          <div className="aspect-[4/5] rounded-2xl bg-neutral-200 dark:bg-white/10" />
          <div className="mt-4 h-4 w-2/3 rounded bg-neutral-200 dark:bg-white/10" />
          <div className="mt-3 h-4 w-1/3 rounded bg-neutral-200 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
