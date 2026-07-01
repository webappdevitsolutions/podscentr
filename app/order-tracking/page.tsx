export default function OrderTrackingPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-black sm:text-7xl">Track order</h1>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-luxury dark:bg-white/5">
        <input placeholder="Enter tracking number" className="focus-ring min-h-12 w-full rounded-full border border-black/10 bg-transparent px-5 dark:border-white/10" />
        <div className="mt-8">
          {["Confirmed", "Packed", "Departed warehouse", "Out for delivery", "Delivered"].map((stage, index) => (
            <div key={stage} className="relative flex gap-4 pb-8 last:pb-0">
              {index < 4 ? <span className="absolute left-[9px] top-6 h-full w-px bg-neutral-200 dark:bg-white/10" /> : null}
              <span className={`relative z-10 mt-1 h-5 w-5 rounded-full ${index < 3 ? "bg-accent" : "bg-neutral-300"}`} />
              <div>
                <p className="font-black">{stage}</p>
                <p className="text-sm text-neutral-500">Delivery stage timeline update.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
