import { LogOut, MapPin, Package, Settings, User } from "lucide-react";

export default function ProfilePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-black">Profile dashboard</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-3xl bg-white p-5 dark:bg-white/5">
          {[User, Package, MapPin, Settings, LogOut].map((Icon, index) => (
            <button key={index} className="focus-ring flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold hover:bg-neutral-100 dark:hover:bg-white/10">
              <Icon size={18} /> {["Profile info", "Order history", "Saved addresses", "Settings", "Logout"][index]}
            </button>
          ))}
        </aside>
        <div className="grid gap-5 md:grid-cols-2">
          {["Aditi Sharma", "12 orders", "2 saved addresses", "Account active"].map((item) => (
            <div key={item} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-accent">Account</p>
              <h2 className="mt-4 text-3xl font-black">{item}</h2>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
