"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default function NewProductPage() {
  return (
    <AdminShell>
      <ProductEditor mode="new" />
    </AdminShell>
  );
}
