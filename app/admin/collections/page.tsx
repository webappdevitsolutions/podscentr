"use client";

import { Edit3, GripVertical, Plus, Search, Trash2, Upload } from "lucide-react";
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
  featured: boolean;
  isAutomatic: boolean;
  ruleType: string;
  ruleValue: string;
  sortOrder: string;
};

const emptyForm: CollectionForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  status: "Draft",
  showInNavbar: false,
  featured: false,
  isAutomatic: false,
  ruleType: "",
  ruleValue: "",
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
    featured: collection.featured,
    isAutomatic: collection.isAutomatic,
    ruleType: collection.rules?.type || "",
    ruleValue: collection.rules?.value || "",
    sortOrder: String(collection.sortOrder)
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminCollectionsPage() {
  const { collections, addCollection, updateCollection, deleteCollection, isLoading, error } = useCollections();
  const [form, setForm] = useState<CollectionForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState("");
  const sortedCollections = useMemo(
    () =>
      [...collections]
        .filter((collection) => [collection.name, collection.slug, collection.description].join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [collections, query]
  );

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
        featured: form.featured,
        isAutomatic: form.isAutomatic,
        rules: form.isAutomatic ? { type: form.ruleType, value: form.ruleValue } : {},
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

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    const confirmed = window.confirm(`Delete ${selectedIds.length} selected collection${selectedIds.length === 1 ? "" : "s"}? Products will remain in your catalog.`);
    if (!confirmed) return;
    await Promise.all(selectedIds.map((id) => deleteCollection(id)));
    setSelectedIds([]);
    setMessage("Selected collections deleted.");
  }

  async function bulkStatus(status: CollectionStatus) {
    if (!selectedIds.length) return;
    await Promise.all(selectedIds.map((id) => updateCollection(id, { status })));
    setSelectedIds([]);
    setMessage(`Selected collections changed to ${status}.`);
  }

  async function uploadBanner(file?: File) {
    if (!file) return;
    if (file.size > 900 * 1024) {
      setMessage("Banner image is too large. Please use an image under 900 KB or paste an image URL.");
      return;
    }
    patch({ image: await readFileAsDataUrl(file) });
    setMessage("Banner uploaded.");
  }

  async function dropSort(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const current = [...sortedCollections];
    const fromIndex = current.findIndex((item) => item.id === draggedId);
    const toIndex = current.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    await Promise.all(current.map((collection, index) => updateCollection(collection.id, { sortOrder: index + 1 })));
    setDraggedId("");
    setMessage("Collection sort order updated.");
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
          <div className="space-y-3 border-b border-black/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold">Collection list</h2>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => bulkStatus("Active")} disabled={!selectedIds.length} className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold disabled:opacity-40">Bulk Active</button>
                  <button onClick={() => bulkStatus("Draft")} disabled={!selectedIds.length} className="min-h-9 rounded-lg border border-black/10 px-3 text-xs font-bold disabled:opacity-40">Bulk Draft</button>
                  <button onClick={bulkDelete} disabled={!selectedIds.length} className="min-h-9 rounded-lg px-3 text-xs font-bold text-rose-600 disabled:opacity-40">Bulk Delete</button>
                </div>
              </div>
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-black/15 px-3 text-sm text-neutral-500">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search collections" className="w-full bg-transparent outline-none" />
              </label>
            </div>
            {isLoading ? (
              <p className="p-8 text-center text-sm font-semibold text-neutral-500">Loading collections...</p>
            ) : sortedCollections.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Sort</th>
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Collection</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Navbar</th>
                      <th className="px-4 py-3">Featured</th>
                      <th className="px-4 py-3">Products</th>
                      <th className="px-4 py-3">Analytics</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {sortedCollections.map((collection) => (
                      <tr
                        key={collection.id}
                        draggable
                        onDragStart={() => setDraggedId(collection.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => void dropSort(collection.id)}
                        className="hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3 text-neutral-400"><GripVertical size={16} /></td>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.includes(collection.id)} onChange={() => toggleSelected(collection.id)} className="h-4 w-4 accent-neutral-950" />
                        </td>
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
                        <td className="px-4 py-3">{collection.featured ? "Yes" : "No"} · {collection.sortOrder}</td>
                        <td className="px-4 py-3">{collection.productCount}</td>
                        <td className="px-4 py-3 text-xs text-neutral-600">
                          <p>{collection.views || 0} views</p>
                          <p>{collection.productsSold || 0} sold · ₹{Math.round(collection.revenue || 0)}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-500">{new Date(collection.updatedAt).toLocaleDateString("en-IN")}</td>
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
                <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-bold hover:bg-neutral-50">
                  <Upload size={16} /> Upload banner
                  <input type="file" accept="image/*" onChange={(event) => void uploadBanner(event.target.files?.[0])} className="hidden" />
                </label>
                {form.image ? <img src={form.image} alt="" className="h-28 w-full rounded-lg object-cover" /> : null}
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
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <input type="checkbox" checked={form.featured} onChange={(event) => patch({ featured: event.target.checked })} className="h-4 w-4 accent-neutral-950" />
                  Featured Collection
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <input type="checkbox" checked={form.isAutomatic} onChange={(event) => patch({ isAutomatic: event.target.checked })} className="h-4 w-4 accent-neutral-950" />
                  Automatic rule-based collection
                </label>
                {form.isAutomatic ? (
                  <div className="grid gap-3 rounded-lg border border-black/10 p-3">
                    <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                      Rule
                      <select value={form.ruleType} onChange={(event) => patch({ ruleType: event.target.value })} className="min-h-10 rounded-lg border border-black/15 px-3 outline-none">
                        <option value="">Choose rule</option>
                        <option value="price_gt">Price greater than</option>
                        <option value="category_eq">Category equals</option>
                        <option value="status_active">Status is Active</option>
                        <option value="stock_gt">Stock greater than</option>
                        <option value="discount_gt">Discount greater than %</option>
                        <option value="new_arrivals">New arrivals</option>
                        <option value="best_sellers">Best sellers by reviews</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-neutral-700">
                      Rule value
                      <input value={form.ruleValue} onChange={(event) => patch({ ruleValue: event.target.value })} placeholder="999, Polo, 0, 50..." className="min-h-10 rounded-lg border border-black/15 px-3 outline-none" />
                    </label>
                  </div>
                ) : null}
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
