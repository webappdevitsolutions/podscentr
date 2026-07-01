import Link from "next/link";

export default function OtpPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <div className="rounded-3xl bg-white p-8 shadow-luxury dark:bg-white/5">
        <h1 className="text-4xl font-black">OTP verification</h1>
        <div className="mt-8 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <input key={item} maxLength={1} className="focus-ring h-14 rounded-2xl border border-black/10 bg-transparent text-center text-2xl font-black dark:border-white/10" />
          ))}
        </div>
        <Link href="/profile" className="focus-ring mt-6 flex min-h-12 items-center justify-center rounded-full bg-accent font-bold text-white">Verify</Link>
      </div>
    </section>
  );
}
