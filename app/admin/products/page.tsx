"use client";

import Link from "next/link";
import { ExternalLink, PackagePlus, Search, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCatalog, type ProductStatus } from "@/hooks/useCatalog";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

function statusClass(status: ProductStatus) {
  if (status === "Active") return "bg-emerald-50 text-emerald-700";
  if (status === "Draft") return "bg-amber-50 text-amber-700";
  return "bg-neutral-100 text-neutral-600";
}

export default function AdminProductsPage() {
  const { products, deleteProduct, setProductStatus, isLoading, error } = useCatalog();
  const [query, setQuery] = useState("");
  const filteredProducts = products.filter((product) =>
    [product.name, product.category, product.sku, product.vendor, product.marketplace].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Products</p>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          </div>
          <Link href="/admin/products/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
            <PackagePlus size={17} /> Add product
          </Link>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 p-4">
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-black/15 px-3 text-sm text-neutral-500">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="w-full bg-transparent outline-none" />
            </label>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-sm font-semibold text-neutral-500">Loading database products...</div>
          ) : error ? (
            <div className="p-10 text-center text-sm font-semibold text-rose-600">{error}</div>
          ) : filteredProducts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${product.id}/edit`} className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                          <span>
                            <span className="block font-semibold text-neutral-950">{product.name}</span>
                            <span className="block text-xs text-neutral-500">{product.category} · {product.sku || "No SKU"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={product.status}
                          onChange={(event) => void setProductStatus(product.id, event.target.value as ProductStatus)}
                          className={`rounded-full border-0 px-3 py-1 text-xs font-bold outline-none ${statusClass(product.status)}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 font-semibold">{product.stock}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3">
                        {product.sourceUrl ? (
                          <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">
                            {product.marketplace} <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="text-neutral-400">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/products/${product.id}/edit`} className="rounded-lg border border-black/10 px-3 py-2 text-xs font-bold hover:bg-white">
                            Edit
                          </Link>
                          <button onClick={() => void deleteProduct(product.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 text-rose-600 hover:bg-rose-50" aria-label="Delete product">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <ShoppingEmpty />
              <h2 className="mt-3 text-lg font-bold">No products found</h2>
              <p className="mt-1 text-sm text-neutral-500">{products.length ? "Try another search." : "Add your first product to publish it on the storefront."}</p>
              <Link href="/admin/products/new" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
                <PackagePlus size={17} /> Add product
              </Link>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function ShoppingEmpty() {
  return <PackagePlus className="mx-auto text-neutral-400" size={32} />;
}
