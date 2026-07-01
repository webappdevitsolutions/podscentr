"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductEditor } from "@/components/admin/ProductEditor";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell>
      <ProductEditor mode="edit" productId={params.id} />
    </AdminShell>
  );
}
