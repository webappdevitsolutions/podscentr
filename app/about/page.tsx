import Image from "next/image";

export default function AboutPage() {
  return (
    <section>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">About Us</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Podscentra is a modern ecommerce brand for everyday essentials.</h1>
          <p className="mt-6 text-base leading-8 text-neutral-600 dark:text-neutral-300">
            Podscentra offers curated apparel and lifestyle products through a simple, secure online shopping experience. We focus on clear product information, reliable checkout, responsive customer support, and transparent policies for shipping, returns, refunds, cancellations, and payments.
          </p>
          <p className="mt-4 text-base leading-8 text-neutral-600 dark:text-neutral-300">
            Payments are securely processed by Razorpay. Podscentra never stores card, UPI or netbanking details. Customers can also reach us at +91 0120 421 7372 or support@podscentra.com for order help.
          </p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-luxury">
          <Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop" alt="Podscentra retail studio" fill className="object-cover" />
        </div>
      </div>
      <div className="bg-white py-14 dark:bg-black">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            ["Secure payments", "Online payments are processed through Razorpay."],
            ["Customer support", "Support is available Monday to Saturday, 10:00 AM - 6:00 PM."],
            ["Transparent policies", "Shipping, return, refund, and cancellation terms are published clearly."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-neutral-100 p-6 dark:bg-white/5">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
