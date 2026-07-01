"use client";

import { useState } from "react";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";

const faqs = ["How fast is delivery?", "Can I change my order?", "Do you ship internationally?"];
const supportItems = [
  { Icon: Mail, text: "support@podscentra.com" },
  { Icon: Phone, text: "+1 800 555 0199" },
  { Icon: MapPin, text: "SoHo, New York" }
];

export default function ContactPage() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-black sm:text-7xl">Contact Podscentra</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <form className="rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
          <div className="grid gap-3 sm:grid-cols-2">
            {["Name", "Email", "Subject"].map((field) => (
              <input key={field} placeholder={field} className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
            ))}
            <textarea placeholder="Message" className="focus-ring min-h-36 rounded-2xl border border-black/10 bg-transparent p-4 dark:border-white/10 sm:col-span-2" />
          </div>
          <button className="focus-ring mt-4 rounded-full bg-accent px-6 py-3 font-bold text-white">Send message</button>
        </form>
        <div className="grid gap-4">
          {supportItems.map(({ Icon, text }) => (
            <div key={text} className="rounded-3xl bg-white p-6 dark:bg-white/5">
              <Icon className="text-accent" />
              <p className="mt-3 font-black">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="flex min-h-80 items-center justify-center rounded-[2rem] bg-neutral-200 text-xl font-black text-neutral-500 dark:bg-white/10">
          Interactive map preview
        </div>
        <div className="rounded-3xl bg-white p-6 dark:bg-white/5">
          <h2 className="text-3xl font-black">Support FAQ</h2>
          <div className="mt-5 grid gap-3">
            {faqs.map((faq, index) => (
              <button key={faq} onClick={() => setOpen(index)} className="rounded-2xl border border-black/10 p-4 text-left dark:border-white/10">
                <span className="flex items-center justify-between font-bold">{faq}<ChevronDown /></span>
                {open === index ? <p className="mt-3 text-sm text-neutral-500">Most requests are handled within one business day by the concierge team.</p> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
