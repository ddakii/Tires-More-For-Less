import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
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

type Totals = { subtotal: number; discount: number; tax: number; total: number; taxRate: number };
type QuoteItem = { id?: string; tireId?: string | null; description: string; quantity: number; unitPrice: number; itemType: string };
type Quote = {
  id: string;
  number: string;
  status: string;
  discount: number;
  taxRate: number;
  notes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  customerId: string;
  vehicleId?: string | null;
  customer: { id: string; firstName: string; lastName: string };
  vehicle?: { year: number; make: string; model: string } | null;
  items: QuoteItem[];
  totals: Totals;
  serviceOrder?: { id: string } | null;
};

type Customer = { id: string; firstName: string; lastName: string; vehicles?: Vehicle[] };
type Vehicle = { id: string; year: number; make: string; model: string };
type Tire = { id: string; brand: string; model: string; size: string; price: number };

const STATUSES = ["Draft", "Sent", "Accepted", "Declined", "Expired"];

const emptyNew = {
  customerId: "",
  vehicleId: "",
  notes: "",
  validUntil: "",
  discount: "0",
  description: "",
  quantity: "1",
  unitPrice: "",
  itemType: "service",
  tireId: "",
};

export default function Quotes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState(emptyNew);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<Quote[]>("/crm/quotes"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load quotes", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api<Customer[]>("/crm/customers").then(setCustomers).catch(() => undefined);
    api<Tire[]>("/crm/tires").then(setTires).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  useEffect(() => {
    const id = params.get("id");
    if (!id) return;
    const found = rows.find((q) => q.id === id);
    if (found) setSelected(found);
    else {
      api<Quote>(`/crm/quotes/${id}`)
        .then(setSelected)
        .catch(() => undefined);
    }
  }, [params, rows]);

  const vehicles = useMemo(() => {
    const c = customers.find((x) => x.id === form.customerId);
    return c?.vehicles || [];
  }, [customers, form.customerId]);

  function closeNew() {
    setNewOpen(false);
    setForm(emptyNew);
    setItems([]);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  function closeDetail() {
    setSelected(null);
    if (params.get("id")) {
      params.delete("id");
      setParams(params, { replace: true });
    }
  }

  function addItemLine() {
    if (form.itemType === "tire") {
      const tire = tires.find((t) => t.id === form.tireId);
      if (!tire) {
        toast("Select a tire", "error");
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          tireId: tire.id,
          description: `${tire.brand} ${tire.model} ${tire.size}`,
          quantity: Number(form.quantity) || 1,
          unitPrice: tire.price,
          itemType: "tire",
        },
      ]);
    } else {
      if (!form.description.trim() || form.unitPrice === "") {
        toast("Description and unit price required", "error");
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          description: form.description.trim(),
          quantity: Number(form.quantity) || 1,
          unitPrice: Number(form.unitPrice),
          itemType: "service",
        },
      ]);
    }
    setForm({ ...form, description: "", quantity: "1", unitPrice: "", tireId: "" });
  }

  async function createQuote(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || items.length === 0) {
      toast("Customer and at least one line item are required", "error");
      return;
    }
    setBusy(true);
    try {
      const created = await api<Quote>("/crm/quotes", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          vehicleId: form.vehicleId || null,
          notes: form.notes || null,
          validUntil: form.validUntil || null,
          discount: Number(form.discount) || 0,
          status: "Draft",
          items,
        }),
      });
      toast("Quote created");
      closeNew();
      await load();
      setSelected(created);
      params.set("id", created.id);
      setParams(params, { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create quote", "error");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string) {
    if (!selected) return;
    setBusy(true);
    try {
      const updated = await api<Quote>(`/crm/quotes/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(`Status: ${status}`);
      setSelected(updated);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!selected) return;
    if (selected.status !== "Accepted") {
      toast("Quote must be Accepted before converting", "error");
      return;
    }
    if (!confirm("Convert this accepted quote to a service order?")) return;
    setBusy(true);
    try {
      const so = await api<{ id: string }>(`/crm/quotes/${selected.id}/convert`, { method: "POST" });
      toast("Converted to service order");
      navigate(`/admin/service-orders/${so.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Convert failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quotes"
        subtitle="Draft, send, and convert quotes"
        actions={
          <Button type="button" onClick={() => setNewOpen(true)}>
            + New Quote
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No quotes yet" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {rows.map((q) => (
                <tr
                  key={q.id}
                  className="cursor-pointer hover:bg-fog/50"
                  onClick={() => {
                    setSelected(q);
                    params.set("id", q.id);
                    setParams(params, { replace: true });
                  }}
                >
                  <td className="px-4 py-3 font-medium">{q.number}</td>
                  <td className="px-4 py-3">
                    {q.customer.firstName} {q.customer.lastName}
                  </td>
                  <td className="px-4 py-3">{format(new Date(q.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{money(q.totals.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={closeDetail} title={selected ? `Quote ${selected.number}` : "Quote"} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-muted">Tax {(selected.taxRate * 100).toFixed(2)}%</span>
            </div>
            <p className="text-sm">
              Customer:{" "}
              <Link to={`/admin/customers/${selected.customerId}`} className="text-accent hover:underline">
                {selected.customer.firstName} {selected.customer.lastName}
              </Link>
              {selected.vehicle ? ` · ${selected.vehicle.year} ${selected.vehicle.make} ${selected.vehicle.model}` : ""}
            </p>
            <div className="overflow-x-auto rounded border border-fog">
              <table className="min-w-full text-sm">
                <thead className="bg-paper text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fog">
                  {selected.items.map((item, i) => (
                    <tr key={item.id || i}>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{money(item.unitPrice)}</td>
                      <td className="px-3 py-2">{money(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm space-y-1 text-right">
              <p>Subtotal: {money(selected.totals.subtotal)}</p>
              <p>Discount: {money(selected.totals.discount)}</p>
              <p>Tax: {money(selected.totals.tax)}</p>
              <p className="font-display text-xl font-bold">Total: {money(selected.totals.total)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                label="Change status"
                value={selected.status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={busy || selected.status === "Converted"}
              >
                {[...STATUSES, ...(selected.status === "Converted" ? ["Converted"] : [])].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.status === "Accepted" && !selected.serviceOrder && (
                <Button type="button" disabled={busy} onClick={convert}>
                  Convert to Service Order
                </Button>
              )}
              {selected.serviceOrder && (
                <Button type="button" variant="outline" onClick={() => navigate(`/admin/service-orders/${selected.serviceOrder!.id}`)}>
                  Open Service Order
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={newOpen} onClose={closeNew} title="New Quote" wide>
        <form onSubmit={createQuote} className="space-y-3">
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, vehicleId: "" })} required>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
          <Select label="Vehicle" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
            <option value="">Optional</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </Select>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Valid until" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            <Input label="Discount" type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="rounded-md border border-fog bg-paper p-3 space-y-3">
            <p className="text-sm font-semibold">Add line item</p>
            <Select label="Type" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>
              <option value="service">Service</option>
              <option value="tire">Tire</option>
            </Select>
            {form.itemType === "tire" ? (
              <Select label="Tire" value={form.tireId} onChange={(e) => setForm({ ...form, tireId: e.target.value })}>
                <option value="">Select</option>
                {tires.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.brand} {t.model} {t.size} — {money(t.price)}
                  </option>
                ))}
              </Select>
            ) : (
              <>
                <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Input label="Unit price" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
              </>
            )}
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Button type="button" variant="outline" onClick={addItemLine}>
              Add Item
            </Button>
            {items.length > 0 && (
              <ul className="text-sm divide-y divide-fog bg-white rounded border border-fog">
                {items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2 px-3 py-2">
                    <span>
                      {item.description} × {item.quantity}
                    </span>
                    <button type="button" className="text-danger text-xs font-semibold" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeNew}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Create Quote"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
