import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { Button, EmptyState, Input, Loading, Modal, PageHeader, Select, StatusBadge, Textarea, money } from "../../components/ui";

type ServiceOrder = {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string };
  vehicle?: { year: number; make: string; model: string } | null;
  totals: { total: number };
};

type Customer = { id: string; firstName: string; lastName: string; vehicles?: Vehicle[] };
type Vehicle = { id: string; year: number; make: string; model: string };

export default function ServiceOrders() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState({ customerId: "", vehicleId: "", mileage: "", complaint: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<ServiceOrder[]>("/crm/service-orders"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load service orders", "error");
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

  const vehicles = useMemo(() => customers.find((c) => c.id === form.customerId)?.vehicles || [], [customers, form.customerId]);

  function closeNew() {
    setNewOpen(false);
    setForm({ customerId: "", vehicleId: "", mileage: "", complaint: "" });
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.customerId) {
      toast("Customer is required", "error");
      return;
    }
    setBusy(true);
    try {
      const so = await api<{ id: string }>("/crm/service-orders", {
        method: "POST",
        body: JSON.stringify({
          customerId: form.customerId,
          vehicleId: form.vehicleId || null,
          mileage: form.mileage ? Number(form.mileage) : null,
          complaint: form.complaint || null,
        }),
      });
      toast("Service order created");
      closeNew();
      navigate(`/admin/service-orders/${so.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Create failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Service Orders"
        subtitle="Shop floor work orders"
        actions={
          <Button type="button" onClick={() => setNewOpen(true)}>
            + New Service Order
          </Button>
        }
      />

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="No service orders" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Number</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {rows.map((so) => (
                <tr key={so.id} className="cursor-pointer hover:bg-fog/50" onClick={() => navigate(`/admin/service-orders/${so.id}`)}>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/admin/service-orders/${so.id}`} className="hover:text-accent" onClick={(e) => e.stopPropagation()}>
                      {so.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {so.customer.firstName} {so.customer.lastName}
                  </td>
                  <td className="px-4 py-3">{so.vehicle ? `${so.vehicle.year} ${so.vehicle.make} ${so.vehicle.model}` : "—"}</td>
                  <td className="px-4 py-3">{format(new Date(so.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{money(so.totals.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={so.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={newOpen} onClose={closeNew} title="New Service Order">
        <form onSubmit={onCreate} className="space-y-3">
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, vehicleId: "" })} required>
            <option value="">Select</option>
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
          <Input label="Mileage" type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          <Textarea label="Complaint / concern" rows={3} value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} />
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
