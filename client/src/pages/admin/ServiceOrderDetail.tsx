import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
type Item = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: string;
  tireId?: string | null;
};
type ServiceOrder = {
  id: string;
  number: string;
  status: string;
  mileage?: number | null;
  complaint?: string | null;
  inspectionNotes?: string | null;
  technicianNotes?: string | null;
  recommendedServices?: string | null;
  discount: number;
  taxRate: number;
  customerId: string;
  customer: { id: string; firstName: string; lastName: string };
  vehicle?: { year: number; make: string; model: string } | null;
  appointment?: { id: string; number: string; status: string } | null;
  quote?: { id: string; number: string } | null;
  invoice?: { id: string; number: string } | null;
  items: Item[];
  totals: Totals;
};
type Tire = { id: string; brand: string; model: string; size: string; price: number; quantity: number; stockStatus: string };

const WORKFLOW = ["Appointment", "Check In", "Service Order", "Inspection", "Add Services/Tires", "Complete", "Invoice", "Payment", "Completed"];

function workflowIndex(so: ServiceOrder) {
  if (so.invoice) return so.status === "Invoiced" ? 7 : 8;
  if (so.status === "Completed") return 5;
  if (so.items.length > 0) return 4;
  if (so.inspectionNotes) return 3;
  if (so.appointment?.status === "Checked In") return 1;
  if (so.appointment) return 0;
  return 2;
}

export default function ServiceOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [so, setSo] = useState<ServiceOrder | null>(null);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    mileage: "",
    complaint: "",
    inspectionNotes: "",
    technicianNotes: "",
    recommendedServices: "",
  });
  const [itemOpen, setItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ itemType: "service", tireId: "", description: "", quantity: "1", unitPrice: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api<ServiceOrder>(`/crm/service-orders/${id}`);
      setSo(data);
      setForm({
        mileage: data.mileage != null ? String(data.mileage) : "",
        complaint: data.complaint || "",
        inspectionNotes: data.inspectionNotes || "",
        technicianNotes: data.technicianNotes || "",
        recommendedServices: data.recommendedServices || "",
      });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load service order", "error");
      setSo(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api<Tire[]>("/crm/tires").then(setTires).catch(() => undefined);
  }, [id]);

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!so) return;
    setBusy(true);
    try {
      const updated = await api<ServiceOrder>(`/crm/service-orders/${so.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          mileage: form.mileage ? Number(form.mileage) : null,
          complaint: form.complaint || null,
          inspectionNotes: form.inspectionNotes || null,
          technicianNotes: form.technicianNotes || null,
          recommendedServices: form.recommendedServices || null,
        }),
      });
      setSo(updated);
      toast("Saved");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!so) return;
    let payload: Record<string, unknown>;
    if (itemForm.itemType === "tire") {
      const tire = tires.find((t) => t.id === itemForm.tireId);
      if (!tire) {
        toast("Select a tire", "error");
        return;
      }
      payload = {
        tireId: tire.id,
        description: `${tire.brand} ${tire.model} ${tire.size}`,
        quantity: Number(itemForm.quantity) || 1,
        unitPrice: tire.price,
        itemType: "tire",
      };
    } else {
      if (!itemForm.description.trim() || itemForm.unitPrice === "") {
        toast("Description and price required", "error");
        return;
      }
      payload = {
        description: itemForm.description.trim(),
        quantity: Number(itemForm.quantity) || 1,
        unitPrice: Number(itemForm.unitPrice),
        itemType: "service",
      };
    }
    setBusy(true);
    try {
      const res = await api<{ order: ServiceOrder }>(`/crm/service-orders/${so.id}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSo(res.order);
      toast("Item added (inventory updated if tire)");
      setItemOpen(false);
      setItemForm({ itemType: "service", tireId: "", description: "", quantity: "1", unitPrice: "" });
      const refreshedTires = await api<Tire[]>("/crm/tires");
      setTires(refreshedTires);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add item", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!so || !confirm("Remove this item? Tire stock will be restored if deducted.")) return;
    setBusy(true);
    try {
      const updated = await api<ServiceOrder>(`/crm/service-orders/${so.id}/items/${itemId}`, { method: "DELETE" });
      setSo({ ...so, ...updated, customer: so.customer, vehicle: so.vehicle, appointment: so.appointment, quote: so.quote, invoice: so.invoice });
      toast("Item removed");
      setTires(await api<Tire[]>("/crm/tires"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Remove failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!so) return;
    setBusy(true);
    try {
      const updated = await api<ServiceOrder>(`/crm/service-orders/${so.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Completed" }),
      });
      setSo({ ...so, ...updated });
      toast("Service order completed");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function createInvoice() {
    if (!so) return;
    setBusy(true);
    try {
      const inv = await api<{ id: string }>(`/crm/service-orders/${so.id}/create-invoice`, { method: "POST" });
      toast("Invoice created");
      navigate(`/admin/invoices?id=${inv.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create invoice", "error");
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!so || !confirm("Cancel this service order? Tire inventory will be restored.")) return;
    setBusy(true);
    try {
      await api(`/crm/service-orders/${so.id}/cancel`, { method: "POST" });
      toast("Cancelled — inventory restored");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Cancel failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!so) return <EmptyState title="Service order not found" />;

  const step = workflowIndex(so);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={so.number}
        subtitle={
          `${so.customer.firstName} ${so.customer.lastName}` +
          (so.vehicle ? ` · ${so.vehicle.year} ${so.vehicle.make} ${so.vehicle.model}` : "")
        }
        actions={<StatusBadge status={so.status} />}
      />

      <div className="overflow-x-auto rounded-lg border border-fog bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-muted">Workflow</p>
        <div className="flex min-w-max gap-2">
          {WORKFLOW.map((label, i) => (
            <div
              key={label}
              className={`rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap ${
                i <= step ? "bg-accent text-white" : "bg-fog text-muted"
              }`}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveDetails} className="rounded-lg border border-fog bg-white p-4 space-y-3">
          <h2 className="font-display text-xl font-bold">Order Details</h2>
          <Input label="Mileage" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          <Textarea label="Complaint" rows={2} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} />
          <Textarea label="Inspection notes" rows={2} value={form.inspectionNotes} onChange={(e) => setForm({ ...form, inspectionNotes: e.target.value })} />
          <Textarea label="Technician notes" rows={2} value={form.technicianNotes} onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })} />
          <Textarea label="Recommended services" rows={2} value={form.recommendedServices} onChange={(e) => setForm({ ...form, recommendedServices: e.target.value })} />
          <Button type="submit" disabled={busy || so.status === "Cancelled" || so.status === "Invoiced"}>
            Save Details
          </Button>
          <div className="text-sm text-muted space-y-1 pt-2">
            {so.appointment && (
              <p>
                Appointment:{" "}
                <Link to={`/admin/appointments?id=${so.appointment.id}`} className="text-accent hover:underline">
                  {so.appointment.number}
                </Link>
              </p>
            )}
            {so.quote && (
              <p>
                Quote:{" "}
                <Link to={`/admin/quotes?id=${so.quote.id}`} className="text-accent hover:underline">
                  {so.quote.number}
                </Link>
              </p>
            )}
            {so.invoice && (
              <p>
                Invoice:{" "}
                <Link to={`/admin/invoices?id=${so.invoice.id}`} className="text-accent hover:underline">
                  {so.invoice.number}
                </Link>
              </p>
            )}
            <p>
              Customer:{" "}
              <Link to={`/admin/customers/${so.customerId}`} className="text-accent hover:underline">
                {so.customer.firstName} {so.customer.lastName}
              </Link>
            </p>
          </div>
        </form>

        <div className="rounded-lg border border-fog bg-white p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Line Items</h2>
            {so.status !== "Cancelled" && so.status !== "Invoiced" && (
              <Button type="button" variant="outline" onClick={() => setItemOpen(true)}>
                + Add Item
              </Button>
            )}
          </div>
          {so.items.length === 0 ? (
            <EmptyState title="No items yet" description="Add tires from inventory or services." />
          ) : (
            <ul className="divide-y divide-fog text-sm">
              {so.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted">
                      {item.itemType} · qty {item.quantity} · {money(item.unitPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{money(item.quantity * item.unitPrice)}</p>
                    {so.status !== "Cancelled" && so.status !== "Invoiced" && (
                      <button type="button" className="mt-1 text-xs font-semibold text-danger" onClick={() => removeItem(item.id)} disabled={busy}>
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-fog pt-3 text-sm space-y-1 text-right">
            <p>Subtotal: {money(so.totals.subtotal)}</p>
            <p>Tax: {money(so.totals.tax)}</p>
            <p className="font-display text-2xl font-bold">Total: {money(so.totals.total)}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {["Open", "In Progress"].includes(so.status) && (
              <Button type="button" disabled={busy} onClick={complete}>
                Complete
              </Button>
            )}
            {["Open", "In Progress", "Completed"].includes(so.status) && !so.invoice && (
              <Button type="button" disabled={busy} onClick={createInvoice}>
                Create Invoice
              </Button>
            )}
            {so.status !== "Cancelled" && so.status !== "Invoiced" && (
              <Button type="button" variant="danger" disabled={busy} onClick={cancelOrder}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={itemOpen} onClose={() => setItemOpen(false)} title="Add Item">
        <form onSubmit={addItem} className="space-y-3">
          <Select label="Type" value={itemForm.itemType} onChange={(e) => setItemForm({ ...itemForm, itemType: e.target.value })}>
            <option value="service">Service</option>
            <option value="tire">Tire (from inventory)</option>
          </Select>
          {itemForm.itemType === "tire" ? (
            <Select label="Tire" value={itemForm.tireId} onChange={(e) => setItemForm({ ...itemForm, tireId: e.target.value })} required>
              <option value="">Select tire</option>
              {tires.map((t) => (
                <option key={t.id} value={t.id} disabled={t.quantity <= 0}>
                  {t.brand} {t.model} {t.size} — {money(t.price)} · qty {t.quantity} ({t.stockStatus})
                </option>
              ))}
            </Select>
          ) : (
            <>
              <Input label="Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} required />
              <Input label="Unit price" type="number" step="0.01" value={itemForm.unitPrice} onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })} required />
            </>
          )}
          <Input label="Quantity" type="number" min={1} value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setItemOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
