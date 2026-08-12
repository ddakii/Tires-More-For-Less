import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

type Totals = { subtotal: number; discount: number; tax: number; total: number };
type Invoice = {
  id: string;
  number: string;
  status: string;
  issuedAt: string;
  notes?: string | null;
  customerId: string;
  customer: { firstName: string; lastName: string; phone?: string; email?: string | null };
  vehicle?: { year: number; make: string; model: string } | null;
  items: { id: string; description: string; quantity: number; unitPrice: number; itemType: string }[];
  payments: { id: string; amount: number; method: string; paidAt: string; notes?: string | null }[];
  totals: Totals;
  amountPaid: number;
  balance: number;
  business?: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email?: string | null;
  };
};

type Customer = { id: string; firstName: string; lastName: string };

export default function Invoices() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [payOpen, setPayOpen] = useState(false);
  const [pay, setPay] = useState({ amount: "", method: "Cash", notes: "" });
  const [form, setForm] = useState({
    customerId: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<Invoice[]>("/crm/invoices"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api<Customer[]>("/crm/customers").then(setCustomers).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  useEffect(() => {
    const id = params.get("id");
    if (!id) return;
    api<Invoice>(`/crm/invoices/${id}`)
      .then(setSelected)
      .catch(() => undefined);
  }, [params, rows]);

  function closeDetail() {
    setSelected(null);
    setPayOpen(false);
    if (params.get("id")) {
      params.delete("id");
      setParams(params, { replace: true });
    }
  }

  function closeNew() {
    setNewOpen(false);
    setForm({ customerId: "", description: "", quantity: "1", unitPrice: "", notes: "" });
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  async function openDetail(id: string) {
    try {
      const inv = await api<Invoice>(`/crm/invoices/${id}`);
      setSelected(inv);
      params.set("id", id);
      setParams(params, { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load invoice", "error");
    }
  }

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.description.trim() || form.unitPrice === "") {
      toast("Customer, description, and price are required", "error");
      return;
    }
    setBusy(true);
    try {
      const inv = await api<Invoice>("/crm/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          notes: form.notes || null,
          items: [
            {
              description: form.description.trim(),
              quantity: Number(form.quantity) || 1,
              unitPrice: Number(form.unitPrice),
              itemType: "service",
            },
          ],
        }),
      });
      toast("Invoice created");
      closeNew();
      await load();
      await openDetail(inv.id);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Create failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const amount = Number(pay.amount);
    if (!amount || amount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    setBusy(true);
    try {
      const updated = await api<Invoice>(`/crm/invoices/${selected.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount, method: pay.method, notes: pay.notes || null }),
      });
      toast("Payment recorded");
      setSelected({ ...selected, ...updated, business: selected.business });
      setPayOpen(false);
      setPay({ amount: "", method: "Cash", notes: "" });
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Payment failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    if (!selected || !confirm("Mark this invoice as fully paid?")) return;
    setBusy(true);
    try {
      const updated = await api<Invoice>(`/crm/invoices/${selected.id}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ method: "Card" }),
      });
      toast("Marked paid");
      setSelected({ ...selected, ...updated, business: selected.business });
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const unpaidCount = useMemo(() => rows.filter((r) => r.status !== "Paid").length, [rows]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Invoices"
        subtitle={`${unpaidCount} open balance${unpaidCount === 1 ? "" : "s"}`}
        actions={
          <Button type="button" onClick={() => setNewOpen(true)}>
            + Create Invoice
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No invoices" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {rows.map((inv) => (
                <tr key={inv.id} className="cursor-pointer hover:bg-fog/50" onClick={() => openDetail(inv.id)}>
                  <td className="px-4 py-3 font-medium">{inv.number}</td>
                  <td className="px-4 py-3">
                    {inv.customer.firstName} {inv.customer.lastName}
                  </td>
                  <td className="px-4 py-3">{format(new Date(inv.issuedAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{money(inv.totals.total)}</td>
                  <td className="px-4 py-3">{money(inv.amountPaid)}</td>
                  <td className="px-4 py-3">{money(inv.balance)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={closeDetail} title={selected ? `Invoice ${selected.number}` : "Invoice"} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="text-sm">
                {selected.business ? (
                  <>
                    <p className="font-display text-lg font-bold">{selected.business.name}</p>
                    <p>{selected.business.addressLine1}</p>
                    <p>
                      {selected.business.city}, {selected.business.state} {selected.business.zip}
                    </p>
                    <p>{selected.business.phone}</p>
                  </>
                ) : (
                  <p className="font-display text-lg font-bold">Tires & More For Less</p>
                )}
              </div>
              <div className="text-sm text-right">
                <StatusBadge status={selected.status} />
                <p className="mt-2">Issued {format(new Date(selected.issuedAt), "MMM d, yyyy")}</p>
              </div>
            </div>

            <div className="rounded-md bg-paper p-3 text-sm">
              <p className="font-semibold">Bill to</p>
              <p>
                <Link to={`/admin/customers/${selected.customerId}`} className="text-accent hover:underline">
                  {selected.customer.firstName} {selected.customer.lastName}
                </Link>
              </p>
              {selected.vehicle && (
                <p className="text-muted">
                  {selected.vehicle.year} {selected.vehicle.make} {selected.vehicle.model}
                </p>
              )}
            </div>

            <div className="overflow-x-auto rounded border border-fog">
              <table className="min-w-full text-sm">
                <thead className="bg-paper text-xs uppercase text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fog">
                  {selected.items.map((item) => (
                    <tr key={item.id}>
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
              <p className="font-display text-2xl font-bold">Total: {money(selected.totals.total)}</p>
              <p>Paid: {money(selected.amountPaid)}</p>
              <p className="font-semibold">Balance: {money(selected.balance)}</p>
            </div>

            {selected.payments.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Payments</p>
                <ul className="divide-y divide-fog rounded border border-fog text-sm">
                  {selected.payments.map((p) => (
                    <li key={p.id} className="flex justify-between px-3 py-2">
                      <span>
                        {p.method} · {format(new Date(p.paidAt), "MMM d, yyyy")}
                        {p.notes ? ` · ${p.notes}` : ""}
                      </span>
                      <span className="font-semibold">{money(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.status !== "Paid" && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setPayOpen(true)}>
                  Record Payment
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={markPaid}>
                  Mark Paid
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment">
        <form onSubmit={recordPayment} className="space-y-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={pay.amount}
            onChange={(e) => setPay({ ...pay, amount: e.target.value })}
            placeholder={selected ? String(selected.balance) : ""}
            required
          />
          <Select label="Method" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
            <option>Cash</option>
            <option>Card</option>
            <option>Check</option>
            <option>Other</option>
          </Select>
          <Input label="Notes" value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={newOpen} onClose={closeNew} title="Create Invoice">
        <form onSubmit={createInvoice} className="space-y-3">
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
            <option value="">Select</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
          <Input label="Line description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Unit price" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeNew}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
