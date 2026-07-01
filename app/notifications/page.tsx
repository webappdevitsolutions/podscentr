import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Account</p>
      <h1 className="mt-3 text-5xl font-black sm:text-7xl">Notifications</h1>
      <div className="mt-8 grid gap-4">
        {["Your order has been packed.", "New polo colors just dropped.", "A saved address was updated."].map((item) => (
          <div key={item} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm dark:bg-white/5">
            <Bell className="shrink-0 text-accent" />
            <div>
              <p className="font-black">{item}</p>
              <p className="mt-1 text-sm text-neutral-500">Just now</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
