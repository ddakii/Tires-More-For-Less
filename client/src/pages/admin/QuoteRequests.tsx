import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  money,
} from "../../components/ui";

type QuoteRequest = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  vehicleInfo?: string | null;
  tireSize?: string | null;
  quantity: number;
  preference?: string | null;
  preferredBrand?: string | null;
  budget?: string | null;
  notes?: string | null;
  status: string;
  createdAt: string;
  customerId?: string | null;
  customer?: { id: string; firstName: string; lastName: string } | null;
  quote?: { id: string; number: string } | null;
};

type Tire = { id: string; brand: string; model: string; size: string; price: number; type: string };

type LineItem = { tireId?: string; description: string; quantity: number; unitPrice: number; itemType: string };

const SERVICES = [
  { description: "Tire Installation", unitPrice: 25 },
  { description: "Tire Balancing", unitPrice: 20 },
  { description: "Tire Rotation", unitPrice: 25 },
  { description: "Flat Tire Repair", unitPrice: 35 },
];

export default function QuoteRequests() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<QuoteRequest[]>([]);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [createFor, setCreateFor] = useState<QuoteRequest | null>(null);
  const [tireId, setTireId] = useState("");
  const [qty, setQty] = useState(4);
  const [selectedServices, setSelectedServices] = useState<string[]>(["Tire Installation"]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [list, tireList] = await Promise.all([api<QuoteRequest[]>("/crm/quote-requests"), api<Tire[]>("/crm/tires")]);
      setRows(list);
      setTires(tireList);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load quote requests", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/crm/quote-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast(`Marked ${status}`);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    }
  }

  function openCreate(qr: QuoteRequest) {
    if (!qr.customerId) {
      toast("Link a customer before creating a quote", "error");
      return;
    }
    setCreateFor(qr);
    setQty(qr.quantity || 4);
    setTireId("");
    setSelectedServices(["Tire Installation"]);
  }

  async function createQuote(e: FormEvent) {
    e.preventDefault();
    if (!createFor) return;
    if (!tireId && selectedServices.length === 0) {
      toast("Select at least one tire or service", "error");
      return;
    }
    const items: LineItem[] = [];
    if (tireId) {
      const tire = tires.find((t) => t.id === tireId);
      if (!tire) {
        toast("Select a valid tire", "error");
        return;
      }
      items.push({
        tireId: tire.id,
        description: `${tire.brand} ${tire.model} ${tire.size}`,
        quantity: qty,
        unitPrice: tire.price,
        itemType: "tire",
      });
    }
    for (const name of selectedServices) {
      const svc = SERVICES.find((s) => s.description === name);
      if (svc) {
        items.push({
          description: svc.description,
          quantity: tireId ? qty : 1,
          unitPrice: svc.unitPrice,
          itemType: "service",
        });
      }
    }
    setBusy(true);
    try {
      const quote = await api<{ id: string }>(`/crm/quote-requests/${createFor.id}/create-quote`, {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      toast("Quote created");
      setCreateFor(null);
      navigate(`/admin/quotes?id=${quote.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create quote", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Quote Requests" subtitle="Inbound tire quote inquiries" />

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", "New", "Reviewed", "Quoted", "Closed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${filter === s ? "bg-ink text-white" : "bg-white border border-fog text-muted"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="No quote requests" />
      ) : (
        <div className="space-y-3">
          {filtered.map((qr) => (
            <div key={qr.id} className="rounded-lg border border-fog bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-xl font-bold">{qr.name}</p>
                    <StatusBadge status={qr.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {qr.phone}
                    {qr.email ? ` · ${qr.email}` : ""} · {format(new Date(qr.createdAt), "MMM d, yyyy")}
                  </p>
                  <p className="mt-2 text-sm">
                    {qr.vehicleInfo || "Vehicle n/a"} · Size {qr.tireSize || "—"} · Qty {qr.quantity}
                    {qr.preference ? ` · ${qr.preference}` : ""}
                    {qr.preferredBrand ? ` · Pref ${qr.preferredBrand}` : ""}
                    {qr.budget ? ` · Budget ${qr.budget}` : ""}
                  </p>
                  {qr.notes && <p className="mt-1 text-sm text-muted">{qr.notes}</p>}
                  {qr.customer && (
                    <p className="mt-1 text-sm">
                      Customer:{" "}
                      <Link to={`/admin/customers/${qr.customer.id}`} className="text-accent hover:underline">
                        {qr.customer.firstName} {qr.customer.lastName}
                      </Link>
                    </p>
                  )}
                  {qr.quote && (
                    <p className="mt-1 text-sm">
                      Quote:{" "}
                      <Link to={`/admin/quotes?id=${qr.quote.id}`} className="text-accent hover:underline">
                        {qr.quote.number}
                      </Link>
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {qr.status === "New" && (
                    <Button type="button" variant="outline" onClick={() => updateStatus(qr.id, "Reviewed")}>
                      Mark Reviewed
                    </Button>
                  )}
                  {!qr.quote && (
                    <Button type="button" onClick={() => openCreate(qr)} disabled={!qr.customerId}>
                      Create Quote
                    </Button>
                  )}
                  {qr.status !== "Closed" && (
                    <Button type="button" variant="ghost" onClick={() => updateStatus(qr.id, "Closed")}>
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!createFor} onClose={() => setCreateFor(null)} title="Create Quote from Request" wide>
        {createFor && (
          <form onSubmit={createQuote} className="space-y-3">
            <p className="text-sm text-muted">
              For {createFor.name} · size {createFor.tireSize || "any"} · qty {createFor.quantity}
            </p>
            <Select label="Tire" value={tireId} onChange={(e) => setTireId(e.target.value)}>
              <option value="">Select tire (optional)</option>
              {tires.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.brand} {t.model} {t.size} — {money(t.price)} ({t.type})
                </option>
              ))}
            </Select>
            <Input label="Tire quantity" type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} />
            <div>
              <p className="mb-2 text-sm font-medium text-ink/80">Services</p>
              <div className="space-y-2">
                {SERVICES.map((s) => (
                  <label key={s.description} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.description)}
                      onChange={(e) => {
                        setSelectedServices((prev) =>
                          e.target.checked ? [...prev, s.description] : prev.filter((x) => x !== s.description)
                        );
                      }}
                    />
                    {s.description} ({money(s.unitPrice)})
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateFor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Creating..." : "Create Quote"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
