import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

type CustomerDetailData = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  notes: string | null;
  totalSpent: number;
  vehicles: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim?: string | null;
    vin?: string | null;
    licensePlate?: string | null;
    tireSize?: string | null;
    mileage?: number | null;
  }[];
  appointments: {
    id: string;
    number: string;
    date: string;
    time: string;
    serviceType: string;
    status: string;
    vehicle?: { year: number; make: string; model: string } | null;
  }[];
  serviceOrders: {
    id: string;
    number: string;
    status: string;
    createdAt: string;
    vehicle?: { year: number; make: string; model: string } | null;
  }[];
  purchasedTires: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    serviceOrderNumber: string;
    date: string;
  }[];
  quotes: { id: string; number: string; status: string; createdAt: string }[];
  invoices: { id: string; number: string; status: string; createdAt: string; payments: { amount: number }[] }[];
  notesList: { id: string; content: string; createdBy?: string | null; createdAt: string }[];
  communications: {
    id: string;
    channel: string;
    direction: string;
    subject?: string | null;
    body: string;
    createdAt: string;
  }[];
};

const TABS = ["Contact", "Vehicles", "Appointments", "Service History", "Purchased Tires", "Quotes", "Invoices", "Notes", "Communications"] as const;

const emptyVehicle = {
  year: new Date().getFullYear(),
  make: "",
  model: "",
  trim: "",
  vin: "",
  licensePlate: "",
  tireSize: "",
  mileage: "",
  notes: "",
};

export default function CustomerDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Contact");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [note, setNote] = useState("");
  const [comm, setComm] = useState({ channel: "phone", direction: "outbound", subject: "", body: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      setData(await api<CustomerDetailData>(`/crm/customers/${id}`));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load customer", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addVehicle(e: FormEvent) {
    e.preventDefault();
    if (!id || !vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      toast("Make and model are required", "error");
      return;
    }
    setSaving(true);
    try {
      await api("/crm/vehicles", {
        method: "POST",
        body: JSON.stringify({
          customerId: id,
          year: Number(vehicleForm.year),
          make: vehicleForm.make.trim(),
          model: vehicleForm.model.trim(),
          trim: vehicleForm.trim || null,
          vin: vehicleForm.vin || null,
          licensePlate: vehicleForm.licensePlate || null,
          tireSize: vehicleForm.tireSize || null,
          mileage: vehicleForm.mileage ? Number(vehicleForm.mileage) : null,
          notes: vehicleForm.notes || null,
        }),
      });
      toast("Vehicle added");
      setVehicleOpen(false);
      setVehicleForm(emptyVehicle);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not add vehicle", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!id || !note.trim()) {
      toast("Note content is required", "error");
      return;
    }
    setSaving(true);
    try {
      await api(`/crm/customers/${id}/notes`, { method: "POST", body: JSON.stringify({ content: note.trim() }) });
      toast("Note saved");
      setNote("");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save note", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addComm(e: FormEvent) {
    e.preventDefault();
    if (!id || !comm.body.trim()) {
      toast("Message body is required", "error");
      return;
    }
    setSaving(true);
    try {
      await api(`/crm/customers/${id}/communications`, {
        method: "POST",
        body: JSON.stringify({
          channel: comm.channel,
          direction: comm.direction,
          subject: comm.subject || null,
          body: comm.body.trim(),
        }),
      });
      toast("Communication logged");
      setComm({ channel: "phone", direction: "outbound", subject: "", body: "" });
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not log communication", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Customer not found" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={`${data.firstName} ${data.lastName}`}
        subtitle={`${data.phone}${data.email ? ` · ${data.email}` : ""} · Spent ${money(data.totalSpent)}`}
        actions={
          <>
            <StatusBadge status={data.status} />
            <Button type="button" variant="outline" onClick={() => setVehicleOpen(true)}>
              + Add Vehicle
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-fog pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${tab === t ? "bg-ink text-white" : "text-muted hover:bg-fog"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Contact" && (
        <div className="rounded-lg border border-fog bg-white p-5 space-y-2 text-sm">
          <p>
            <span className="text-muted">Name:</span> {data.firstName} {data.lastName}
          </p>
          <p>
            <span className="text-muted">Phone:</span> {data.phone}
          </p>
          <p>
            <span className="text-muted">Email:</span> {data.email || "—"}
          </p>
          <p>
            <span className="text-muted">Status:</span> {data.status}
          </p>
          <p>
            <span className="text-muted">Notes:</span> {data.notes || "—"}
          </p>
        </div>
      )}

      {tab === "Vehicles" &&
        (data.vehicles.length === 0 ? (
          <EmptyState title="No vehicles" description="Add a vehicle for this customer." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-fog bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Plate</th>
                  <th className="px-4 py-3 text-left">VIN</th>
                  <th className="px-4 py-3 text-left">Tire Size</th>
                  <th className="px-4 py-3 text-left">Mileage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {data.vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3 font-medium">
                      {v.year} {v.make} {v.model}
                      {v.trim ? ` ${v.trim}` : ""}
                    </td>
                    <td className="px-4 py-3">{v.licensePlate || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{v.vin || "—"}</td>
                    <td className="px-4 py-3">{v.tireSize || "—"}</td>
                    <td className="px-4 py-3">{v.mileage ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "Appointments" &&
        (data.appointments.length === 0 ? (
          <EmptyState title="No appointments" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-fog bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {data.appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <Link to={`/admin/appointments?id=${a.id}`} className="font-medium text-accent hover:underline">
                        {a.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {a.date} {a.time}
                    </td>
                    <td className="px-4 py-3">{a.serviceType}</td>
                    <td className="px-4 py-3">
                      {a.vehicle ? `${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "Service History" &&
        (data.serviceOrders.length === 0 ? (
          <EmptyState title="No service orders" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-fog bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {data.serviceOrders.map((so) => (
                  <tr key={so.id}>
                    <td className="px-4 py-3">
                      <Link to={`/admin/service-orders/${so.id}`} className="font-medium text-accent hover:underline">
                        {so.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{format(new Date(so.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3">
                      {so.vehicle ? `${so.vehicle.year} ${so.vehicle.make} ${so.vehicle.model}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={so.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "Purchased Tires" &&
        (data.purchasedTires.length === 0 ? (
          <EmptyState title="No purchased tires" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-fog bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fog">
                {data.purchasedTires.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">{t.description}</td>
                    <td className="px-4 py-3">{t.quantity}</td>
                    <td className="px-4 py-3">{money(t.unitPrice)}</td>
                    <td className="px-4 py-3">{t.serviceOrderNumber}</td>
                    <td className="px-4 py-3">{format(new Date(t.date), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "Quotes" &&
        (data.quotes.length === 0 ? (
          <EmptyState title="No quotes" />
        ) : (
          <ul className="divide-y divide-fog rounded-lg border border-fog bg-white">
            {data.quotes.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link to={`/admin/quotes?id=${q.id}`} className="font-medium text-accent hover:underline">
                  {q.number}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-muted">{format(new Date(q.createdAt), "MMM d, yyyy")}</span>
                  <StatusBadge status={q.status} />
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "Invoices" &&
        (data.invoices.length === 0 ? (
          <EmptyState title="No invoices" />
        ) : (
          <ul className="divide-y divide-fog rounded-lg border border-fog bg-white">
            {data.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link to={`/admin/invoices?id=${inv.id}`} className="font-medium text-accent hover:underline">
                  {inv.number}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-muted">
                    {money(inv.payments.reduce((s, p) => s + p.amount, 0))} · {format(new Date(inv.createdAt), "MMM d, yyyy")}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "Notes" && (
        <div className="space-y-4">
          <form onSubmit={addNote} className="rounded-lg border border-fog bg-white p-4 space-y-3">
            <Textarea label="Add note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" disabled={saving}>
              Save Note
            </Button>
          </form>
          {data.notesList.length === 0 ? (
            <EmptyState title="No notes yet" />
          ) : (
            <ul className="space-y-2">
              {data.notesList.map((n) => (
                <li key={n.id} className="rounded-lg border border-fog bg-white p-4 text-sm">
                  <p>{n.content}</p>
                  <p className="mt-2 text-xs text-muted">
                    {n.createdBy || "Staff"} · {format(new Date(n.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "Communications" && (
        <div className="space-y-4">
          <form onSubmit={addComm} className="rounded-lg border border-fog bg-white p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Channel" value={comm.channel} onChange={(e) => setComm({ ...comm, channel: e.target.value })}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in-person">In person</option>
                <option value="note">Note</option>
              </Select>
              <Select label="Direction" value={comm.direction} onChange={(e) => setComm({ ...comm, direction: e.target.value })}>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </Select>
            </div>
            <Input label="Subject" value={comm.subject} onChange={(e) => setComm({ ...comm, subject: e.target.value })} />
            <Textarea label="Body" rows={3} value={comm.body} onChange={(e) => setComm({ ...comm, body: e.target.value })} required />
            <Button type="submit" disabled={saving}>
              Log Communication
            </Button>
          </form>
          {data.communications.length === 0 ? (
            <EmptyState title="No communications logged" />
          ) : (
            <ul className="space-y-2">
              {data.communications.map((c) => (
                <li key={c.id} className="rounded-lg border border-fog bg-white p-4 text-sm">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase text-muted">
                    <span>{c.channel}</span>
                    <span>{c.direction}</span>
                    <span>{format(new Date(c.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  {c.subject && <p className="mt-1 font-semibold">{c.subject}</p>}
                  <p className="mt-1">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal open={vehicleOpen} onClose={() => setVehicleOpen(false)} title="Add Vehicle">
        <form onSubmit={addVehicle} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Year" type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required />
            <Input label="Make" value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })} required />
            <Input label="Model" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
          </div>
          <Input label="Trim" value={vehicleForm.trim} onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="License plate" value={vehicleForm.licensePlate} onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })} />
            <Input label="VIN" value={vehicleForm.vin} onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Tire size" value={vehicleForm.tireSize} onChange={(e) => setVehicleForm({ ...vehicleForm, tireSize: e.target.value })} />
            <Input label="Mileage" type="number" value={vehicleForm.mileage} onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setVehicleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
