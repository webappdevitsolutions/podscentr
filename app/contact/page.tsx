"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

const contactDetails = [
  { Icon: Phone, label: "Phone", value: "+91 0120 421 7372", href: "tel:+9101204217372" },
  { Icon: Mail, label: "Email", value: "support@podscentra.com", href: "mailto:support@podscentra.com" },
  { Icon: Clock, label: "Business hours", value: "Monday to Saturday, 10:00 AM - 6:00 PM" },
  { Icon: MapPin, label: "Address", value: "Business address will be updated here once finalized." }
];

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitContactForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      message: String(formData.get("message") || "")
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Could not send your message.");
      }
      event.currentTarget.reset();
      setStatus("sent");
      setMessage("Thanks, your message has been sent. We also emailed you a confirmation.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send your message. Please try again.");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">Contact Us</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Contact Podscentra</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-600 dark:text-neutral-300">
        Business name: <span className="font-bold text-ink dark:text-white">Podscentra</span>. For order support, delivery questions, returns, refunds, or payment help, reach our support team during business hours.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <form onSubmit={submitContactForm} className="rounded-3xl bg-white p-6 shadow-sm dark:bg-white/5">
          <h2 className="text-2xl font-black">Send us a message</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input name="name" placeholder="Name" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
            <input name="email" type="email" placeholder="Email" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10" />
            <input name="phone" inputMode="tel" placeholder="Phone" className="focus-ring min-h-12 rounded-2xl border border-black/10 bg-transparent px-4 dark:border-white/10 sm:col-span-2" />
            <textarea name="message" placeholder="Message" className="focus-ring min-h-36 rounded-2xl border border-black/10 bg-transparent p-4 dark:border-white/10 sm:col-span-2" />
          </div>
          <button type="submit" disabled={status === "sending"} className="focus-ring mt-4 rounded-full bg-accent px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
          {message ? (
            <p className={`mt-3 text-sm font-semibold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p>
          ) : null}
          <p className="mt-3 text-xs leading-6 text-neutral-500">For urgent support, call or email us directly.</p>
        </form>

        <div className="grid gap-4">
          {contactDetails.map(({ Icon, label, value, href }) => (
            <div key={label} className="rounded-3xl bg-white p-6 dark:bg-white/5">
              <Icon className="text-accent" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-neutral-500">{label}</p>
              {href ? (
                <a href={href} className="mt-2 block text-lg font-black hover:text-accent">{value}</a>
              ) : (
                <p className="mt-2 text-lg font-black">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
