import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
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
} from "../../components/ui";

type Customer = { id: string; firstName: string; lastName: string; vehicles?: Vehicle[] };
type Vehicle = { id: string; year: number; make: string; model: string; customerId?: string };
type Appointment = {
  id: string;
  number: string;
  customerId: string;
  vehicleId?: string | null;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  notes?: string | null;
  tireSize?: string | null;
  customer: Customer;
  vehicle?: Vehicle | null;
  serviceOrder?: { id: string; number: string } | null;
};

type ViewMode = "day" | "week" | "month";

const SERVICES = [
  "Tire Installation",
  "Flat Tire Repair",
  "Tire Rotation",
  "Tire Balancing",
  "Tire Inspection",
  "Tire Replacement",
  "Wheel Alignment",
  "Other",
];

const emptyForm = {
  customerId: "",
  vehicleId: "",
  serviceType: "Tire Installation",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "09:00",
  notes: "",
  tireSize: "",
  status: "Confirmed",
};

export default function Appointments() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [rows, setRows] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState(emptyForm);
  const [reschedule, setReschedule] = useState({ date: "", time: "" });
  const [busy, setBusy] = useState(false);

  const range = useMemo(() => {
    if (view === "day") {
      const d = format(anchor, "yyyy-MM-dd");
      return { from: d, to: d, label: format(anchor, "EEEE, MMM d, yyyy") };
    }
    if (view === "week") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd"), label: `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}` };
    }
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    return { from: format(start, "yyyy-MM-dd"), to: format(end, "yyyy-MM-dd"), label: format(anchor, "MMMM yyyy") };
  }, [view, anchor]);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Appointment[]>(`/crm/appointments?from=${range.from}&to=${range.to}`);
      setRows(data);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [range.from, range.to]);

  useEffect(() => {
    api<Customer[]>("/crm/customers")
      .then((list) => setCustomers(list.map((c) => ({ ...c, vehicles: (c as Customer & { vehicles?: Vehicle[] }).vehicles || [] }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") setNewOpen(true);
  }, [params]);

  useEffect(() => {
    const id = params.get("id");
    if (!id || rows.length === 0) return;
    const found = rows.find((a) => a.id === id);
    if (found) {
      setSelected(found);
      setReschedule({ date: found.date, time: found.time });
    } else {
      api<Appointment>(`/crm/appointments/${id}`)
        .then((a) => {
          setSelected(a);
          setReschedule({ date: a.date, time: a.time });
        })
        .catch(() => undefined);
    }
  }, [params, rows]);

  const customerVehicles = useMemo(() => {
    const c = customers.find((x) => x.id === form.customerId);
    return c?.vehicles || [];
  }, [customers, form.customerId]);

  function shift(dir: number) {
    if (view === "day") setAnchor((d) => addDays(d, dir));
    else if (view === "week") setAnchor((d) => addDays(d, dir * 7));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  }

  function closeNew() {
    setNewOpen(false);
    setForm(emptyForm);
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

  async function createAppt(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.serviceType || !form.date || !form.time) {
      toast("Customer, service, date, and time are required", "error");
      return;
    }
    setBusy(true);
    try {
      const created = await api<Appointment>("/crm/appointments", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          vehicleId: form.vehicleId || null,
          serviceType: form.serviceType,
          date: form.date,
          time: form.time,
          notes: form.notes || null,
          tireSize: form.tireSize || null,
          status: form.status || "Confirmed",
        }),
      });
      toast("Appointment created");
      closeNew();
      await load();
      setSelected(created);
      setReschedule({ date: created.date, time: created.time });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create appointment", "error");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      const updated = await api<Appointment>(`/crm/appointments/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast(msg);
      setSelected(updated);
      setReschedule({ date: updated.date, time: updated.time });
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function checkIn(id: string) {
    setBusy(true);
    try {
      const updated = await api<Appointment>(`/crm/appointments/${id}/check-in`, { method: "POST" });
      toast("Checked in");
      setSelected(updated);
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Check-in failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function createSO(id: string) {
    setBusy(true);
    try {
      const so = await api<{ id: string }>("/crm/appointments/" + id + "/create-service-order", { method: "POST" });
      toast("Service order created");
      navigate(`/admin/service-orders/${so.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create service order", "error");
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of rows) {
      (map[a.date] ||= []).push(a);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Appointments"
        subtitle={range.label}
        actions={
          <Button type="button" onClick={() => setNewOpen(true)}>
            + New Appointment
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-fog bg-white p-1">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-sm font-semibold capitalize ${view === v ? "bg-ink text-white" : "text-muted hover:bg-fog"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={() => shift(-1)}>
          Prev
        </Button>
        <Button type="button" variant="outline" onClick={() => setAnchor(new Date())}>
          Today
        </Button>
        <Button type="button" variant="outline" onClick={() => shift(1)}>
          Next
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No appointments in this range" />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, list]) => (
            <div key={date} className="rounded-lg border border-fog bg-white">
              <div className="border-b border-fog bg-paper px-4 py-2 text-sm font-semibold">
                {format(parseISO(date), "EEEE, MMM d")}
              </div>
              <ul className="divide-y divide-fog">
                {list.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-fog/50"
                      onClick={() => {
                        setSelected(a);
                        setReschedule({ date: a.date, time: a.time });
                        params.set("id", a.id);
                        setParams(params, { replace: true });
                      }}
                    >
                      <div>
                        <p className="font-semibold">
                          {a.time} · {a.serviceType}
                        </p>
                        <p className="text-sm text-muted">
                          {a.customer.firstName} {a.customer.lastName}
                          {a.vehicle ? ` · ${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : ""} · {a.number}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={newOpen} onClose={closeNew} title="New Appointment" wide>
        <form onSubmit={createAppt} className="space-y-3">
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
            {customerVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </Select>
          <Select label="Service" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </div>
          <Input label="Tire size" value={form.tireSize} onChange={(e) => setForm({ ...form, tireSize: e.target.value })} />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeNew}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={closeDetail} title={selected ? `Appointment ${selected.number}` : "Appointment"} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-sm text-muted">
                {selected.date} at {selected.time} · {selected.serviceType}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                Customer:{" "}
                <Link to={`/admin/customers/${selected.customerId}`} className="font-semibold text-accent hover:underline">
                  {selected.customer.firstName} {selected.customer.lastName}
                </Link>
              </p>
              <p>
                Vehicle:{" "}
                {selected.vehicle ? `${selected.vehicle.year} ${selected.vehicle.make} ${selected.vehicle.model}` : "—"}
              </p>
              {selected.notes && <p>Notes: {selected.notes}</p>}
              {selected.serviceOrder && (
                <p>
                  Service order:{" "}
                  <Link to={`/admin/service-orders/${selected.serviceOrder.id}`} className="text-accent hover:underline">
                    {selected.serviceOrder.number}
                  </Link>
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 rounded-md border border-fog bg-paper p-3">
              <Input label="Reschedule date" type="date" value={reschedule.date} onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })} />
              <Input label="Reschedule time" type="time" value={reschedule.time} onChange={(e) => setReschedule({ ...reschedule, time: e.target.value })} />
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch(selected.id, { date: reschedule.date, time: reschedule.time }, "Rescheduled")}
                >
                  Save Reschedule
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status === "Requested" && (
                <Button type="button" disabled={busy} onClick={() => patch(selected.id, { status: "Confirmed" }, "Confirmed")}>
                  Confirm
                </Button>
              )}
              {["Requested", "Confirmed"].includes(selected.status) && (
                <Button type="button" disabled={busy} onClick={() => checkIn(selected.id)}>
                  Check In
                </Button>
              )}
              {["Checked In", "Confirmed"].includes(selected.status) && !selected.serviceOrder && (
                <Button type="button" disabled={busy} onClick={() => createSO(selected.id)}>
                  Start Service / Create Service Order
                </Button>
              )}
              {selected.serviceOrder && (
                <Button type="button" variant="outline" onClick={() => navigate(`/admin/service-orders/${selected.serviceOrder!.id}`)}>
                  Open Service Order
                </Button>
              )}
              {!["Completed", "Cancelled", "No Show"].includes(selected.status) && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => patch(selected.id, { status: "Completed" }, "Marked completed")}>
                  Complete
                </Button>
              )}
              {!["Cancelled", "Completed"].includes(selected.status) && (
                <Button
                  type="button"
                  variant="danger"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Cancel this appointment?")) patch(selected.id, { status: "Cancelled" }, "Cancelled");
                  }}
                >
                  Cancel
                </Button>
              )}
              {selected.status === "Confirmed" && (
                <Button type="button" variant="ghost" disabled={busy} onClick={() => patch(selected.id, { status: "No Show" }, "Marked no show")}>
                  No Show
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
