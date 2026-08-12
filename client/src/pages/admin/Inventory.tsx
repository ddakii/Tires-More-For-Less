import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import {
  Button,
  EmptyState,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  money,
} from "../../components/ui";

type Tire = {
  id: string;
  brand: string;
  model: string;
  width: number;
  aspectRatio: number;
  diameter: number;
  size: string;
  season: string;
  type: string;
  quantity: number;
  cost: number;
  price: number;
  profit: number;
  supplier?: string | null;
  sku: string;
  stockStatus: string;
  loadIndex?: string | null;
  speedRating?: string | null;
  warranty?: string | null;
  notes?: string | null;
};

const emptyForm = {
  brand: "",
  model: "",
  width: "",
  aspectRatio: "",
  diameter: "",
  season: "All-Season",
  type: "New",
  cost: "",
  price: "",
  quantity: "0",
  supplier: "",
  sku: "",
  loadIndex: "",
  speedRating: "",
  warranty: "",
  notes: "",
};

function fromTire(t: Tire) {
  return {
    brand: t.brand,
    model: t.model,
    width: String(t.width),
    aspectRatio: String(t.aspectRatio),
    diameter: String(t.diameter),
    season: t.season,
    type: t.type,
    cost: String(t.cost),
    price: String(t.price),
    quantity: String(t.quantity),
    supplier: t.supplier || "",
    sku: t.sku,
    loadIndex: t.loadIndex || "",
    speedRating: t.speedRating || "",
    warranty: t.warranty || "",
    notes: t.notes || "",
  };
}

export default function Inventory() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState<Tire | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<Tire[]>("/crm/tires"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setForm(emptyForm);
      setOpen(true);
    }
  }, [params]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((t) =>
      [t.brand, t.model, t.size, t.sku, t.supplier || "", t.season, t.type].join(" ").toLowerCase().includes(term)
    );
  }, [rows, q]);

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  function openEdit(t: Tire) {
    setEditing(t);
    setForm(fromTire(t));
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.width || !form.aspectRatio || !form.diameter || !form.sku.trim()) {
      toast("Brand, model, size dimensions, and SKU are required", "error");
      return;
    }
    if (form.cost === "" || form.price === "") {
      toast("Cost and price are required", "error");
      return;
    }
    setSaving(true);
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      width: Number(form.width),
      aspectRatio: Number(form.aspectRatio),
      diameter: Number(form.diameter),
      size: `${form.width}/${form.aspectRatio}R${form.diameter}`,
      season: form.season,
      type: form.type,
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity) || 0,
      supplier: form.supplier || null,
      sku: form.sku.trim(),
      loadIndex: form.loadIndex || null,
      speedRating: form.speedRating || null,
      warranty: form.warranty || null,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await api(`/crm/tires/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast("Tire updated");
      } else {
        await api("/crm/tires", { method: "POST", body: JSON.stringify(payload) });
        toast("Tire added");
      }
      closeModal();
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t: Tire) {
    if (!confirm(`Delete ${t.brand} ${t.model} (${t.sku})?`)) return;
    try {
      await api(`/crm/tires/${t.id}`, { method: "DELETE" });
      toast("Tire deleted");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tire Inventory"
        subtitle="Stock levels, pricing, and suppliers"
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            + Add Tire
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search brand, model, size, SKU..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="No tires found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3 font-semibold">Brand</th>
                <th className="px-3 py-3 font-semibold">Model</th>
                <th className="px-3 py-3 font-semibold">Size</th>
                <th className="px-3 py-3 font-semibold">Season</th>
                <th className="px-3 py-3 font-semibold">Type</th>
                <th className="px-3 py-3 font-semibold">Qty</th>
                <th className="px-3 py-3 font-semibold">Cost</th>
                <th className="px-3 py-3 font-semibold">Price</th>
                <th className="px-3 py-3 font-semibold">Profit</th>
                <th className="px-3 py-3 font-semibold">Supplier</th>
                <th className="px-3 py-3 font-semibold">SKU</th>
                <th className="px-3 py-3 font-semibold">Stock</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-fog/40">
                  <td className="px-3 py-2.5 font-medium">{t.brand}</td>
                  <td className="px-3 py-2.5">{t.model}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{t.size}</td>
                  <td className="px-3 py-2.5">{t.season}</td>
                  <td className="px-3 py-2.5">{t.type}</td>
                  <td className="px-3 py-2.5">{t.quantity}</td>
                  <td className="px-3 py-2.5">{money(t.cost)}</td>
                  <td className="px-3 py-2.5">{money(t.price)}</td>
                  <td className="px-3 py-2.5">{money(t.profit)}</td>
                  <td className="px-3 py-2.5">{t.supplier || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{t.sku}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={t.stockStatus} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <button type="button" className="mr-2 text-accent font-semibold hover:underline" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button type="button" className="text-danger font-semibold hover:underline" onClick={() => onDelete(t)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={closeModal} title={editing ? "Edit Tire" : "Add Tire"} wide>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Width" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} required />
            <Input label="Aspect" type="number" value={form.aspectRatio} onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })} required />
            <Input label="Diameter" type="number" value={form.diameter} onChange={(e) => setForm({ ...form, diameter: e.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
              <option>All-Season</option>
              <option>Winter</option>
              <option>Summer</option>
              <option>All-Terrain</option>
            </Select>
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>New</option>
              <option>Used</option>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Cost" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required />
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Load index" value={form.loadIndex} onChange={(e) => setForm({ ...form, loadIndex: e.target.value })} />
            <Input label="Speed rating" value={form.speedRating} onChange={(e) => setForm({ ...form, speedRating: e.target.value })} />
            <Input label="Warranty" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
