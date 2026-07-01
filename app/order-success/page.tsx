"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/Button";

export default function OrderSuccessPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={52} />
      </motion.div>
      <h1 className="mt-8 text-5xl font-black sm:text-7xl">Order confirmed</h1>
      <p className="mt-4 max-w-xl text-neutral-500 dark:text-neutral-400">Your Podscentra order is being prepared. Tracking updates will appear as each delivery stage completes.</p>
      <div className="mt-8 w-full rounded-3xl bg-white p-6 text-left dark:bg-white/5">
        {["Order placed", "Packed", "In transit", "Delivered"].map((stage, index) => (
          <div key={stage} className="flex gap-4 pb-5 last:pb-0">
            <span className={`mt-1 h-4 w-4 rounded-full ${index === 0 ? "bg-accent" : "bg-neutral-300"}`} />
            <div>
              <p className="font-black">{stage}</p>
              <p className="text-sm text-neutral-500">Estimated update {index + 1} business day{index ? "s" : ""}.</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 w-full rounded-3xl border border-dashed border-accent/40 bg-violet-50 p-6 text-left dark:bg-white/5">
        <h2 className="text-2xl font-black">Order confirmation email</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          A confirmation email has been prepared for your inbox with invoice, delivery address, tracking link, and support contact details.
        </p>
      </div>
      <LinkButton href="/shop" className="mt-8">Continue shopping</LinkButton>
    </section>
  );
}
