"use client";

import { usePathname } from "next/navigation";
import { FloatingChat } from "@/components/FloatingChat";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen bg-neutral-100 text-ink dark:bg-neutral-950 dark:text-white">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">{children}</main>
      <Footer />
      <FloatingChat />
    </>
  );
}
