"use client";

import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useCollections, type CollectionStatus, type StoreCollection } from "@/hooks/useCollections";

type CollectionForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: CollectionStatus;
  showInNavbar: boolean;
  sortOrder: string;
};

const emptyForm: CollectionForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  status: "Draft",
  showInNavbar: false,
  sortOrder: "0"
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function collectionToForm(collection: StoreCollection): CollectionForm {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image: collection.image,
    status: collection.status,
    showInNavbar: collection.showInNavbar,
    sortOrder: String(collection.sortOrder)
  };
}

export default function AdminCollectionsPage() {
  const { collections, addCollection, updateCollection, deleteCollection, isLoading, error } = useCollections();
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const sortedCollections = useMemo(() => [...collections].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)), [collections]);

  useEffect(() => {
    if (!form.id && form.name && !isEditing) {
      setForm((current) => ({ ...current, slug: slugify(current.name) }));
    }
  }, [form.id, form.name, isEditing]);

  function patch(updates: Partial<CollectionForm>) {
    setForm((current) => ({ ...current, ...updates }));
  }

  function startNew() {
    setForm(emptyForm);
    setIsEditing(true);
    setMessage("");
  }

  function startEdit(collection: StoreCollection) {
    setForm(collectionToForm(collection));
    setIsEditing(true);
    setMessage("");
  }

  async function saveCollection() {
    if (!form.name.trim()) {
      setMessage("Collection name is required.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description,
        image: form.image,
        status: form.status,
        showInNavbar: form.showInNavbar,
        sortOrder: Number(form.sortOrder || 0)
      };

      if (form.id) {
        await updateCollection(form.id, payload);
        setMessage("Collection updated.");
      } else {
        await addCollection(payload);
        setMessage("Collection created.");
      }

      setForm(emptyForm);
      setIsEditing(false);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Could not save collection.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCollection(collection: StoreCollection) {
    const confirmed = window.confirm(`Delete "${collection.name}"? Products will stay in your catalog, but this collection link will be removed.`);
    if (!confirmed) return;

    try {
      await deleteCollection(collection.id);
      setMessage("Collection deleted.");
      if (form.id === collection.id) {
        setForm(emptyForm);
        setIsEditing(false);
      }
    } catch (deleteError) {
      setMessage(deleteError instanceof Error ? deleteError.message : "Could not delete collection.");
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Admin</p>
            <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          </div>
          <button onClick={startNew} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800">
            <Plus size={17} /> Add collection
          </button>
        </div>

        {message || error ? <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700">{message || error}</p> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 p-4">
              <h2 className="font-bold">Collection list</h2>
            </div>
            {isLoading ? (
              <p className="p-8 text-center text-sm font-semibold text-neutral-500">Loading collections...</p>
            ) : sortedCollections.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Collection</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Navbar</th>
                      <th className="px-4 py-3">Sort</th>
                      <th className="px-4 py-3">Products</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {sortedCollections.map((collection) => (
                      <tr key={collection.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
                              {collection.image ? <img src={collection.image} alt="" className="h-full w-full object-cover" /> : null}
                            </div>
                            <div>
                              <p className="font-bold">{collection.name}</p>
                              <p className="line-clamp-1 text-xs text-neutral-500">{collection.description || "No description"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">/collections/{collection.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${collection.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                            {collection.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{collection.showInNavbar ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">{collection.sortOrder}</td>
                        <td className="px-4 py-3">{collection.productCount}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEdit(collection)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-black/10 px-3 text-xs font-bold hover:bg-neutral-50">
                              <Edit3 size={14} /> Edit
                            </button>
                            <button onClick={() => removeCollection(collection)} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-bold text-rose-600 hover:bg-rose-50">
                              <Trash2 size={14} /> Delete
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
                <h2 className="text-lg font-bold">No collections yet</h2>
                <p className="mt-2 text-sm text-neutral-500">Create collections like Polo T-Shirts, Combos, or Deals and publish them to the navbar.</p>
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="font-bold">{form.id ? "Edit collection" : isEditing ? "Add collection" : "Collection editor"}</h2>
            {isEditing ? (
              <div className="mt-4 space-y-4">
                <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                  Collection name
                  <input value={form.name} onChange={(event) => patch({ name: event.target.value })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none focus:border-neutral-950" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                  Slug
                  <input value={form.slug} onChange={(event) => patch({ slug: slugify(event.target.value) })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none focus:border-neutral-950" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                  Description
                  <textarea value={form.description} onChange={(event) => patch({ description: event.target.value })} rows={4} className="rounded-lg border border-black/15 p-3 outline-none focus:border-neutral-950" />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                  Image/banner URL
                  <input value={form.image} onChange={(event) => patch({ image: event.target.value })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none focus:border-neutral-950" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                    Status
                    <select value={form.status} onChange={(event) => patch({ status: event.target.value as CollectionStatus })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none">
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                    Sort order
                    <input type="number" value={form.sortOrder} onChange={(event) => patch({ sortOrder: event.target.value })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <input type="checkbox" checked={form.showInNavbar} onChange={(event) => patch({ showInNavbar: event.target.checked })} className="h-4 w-4 accent-neutral-950" />
                  Show in public navbar
                </label>
                <div className="flex gap-2">
                  <button onClick={saveCollection} disabled={isSaving} className="min-h-10 flex-1 rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
                    {isSaving ? "Saving..." : "Save collection"}
                  </button>
                  <button onClick={() => { setIsEditing(false); setForm(emptyForm); }} className="min-h-10 rounded-lg border border-black/10 px-4 text-sm font-bold hover:bg-neutral-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-neutral-500">Choose a collection to edit, or create a new one. Active collections with navbar enabled will appear on the storefront.</p>
            )}
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
