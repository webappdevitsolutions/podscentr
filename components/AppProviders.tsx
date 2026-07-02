"use client";

import { CartProvider, useCart } from "@/hooks/useCart";
import { CatalogProvider } from "@/hooks/useCatalog";
import { AnimatePresence, motion } from "framer-motion";
import { MetaPageView } from "@/components/MetaPageView";

function Toast() {
  const { toast } = useCart();
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-luxury dark:bg-white dark:text-ink"
          role="status"
        >
          {toast.message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CatalogProvider>
      <CartProvider>
        {children}
        <MetaPageView />
        <Toast />
      </CartProvider>
    </CatalogProvider>
  );
}
