import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { Button, EmptyState, Input, Loading, Modal, PageHeader, Select, StatusBadge, money } from "../../components/ui";

type CustomerRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  status: string;
  vehicleCount: number;
  lastVisit: string | null;
  totalSpent: number;
};

const emptyForm = { firstName: "", lastName: "", phone: "", email: "", status: "Active", notes: "" };

export default function Customers() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(params.get("new") === "1");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await api<CustomerRow[]>("/crm/customers"));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") setOpen(true);
  }, [params]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((c) =>
      [c.firstName, c.lastName, c.phone, c.email || ""].join(" ").toLowerCase().includes(term)
    );
  }, [rows, q]);

  function closeModal() {
    setOpen(false);
    setForm(emptyForm);
    if (params.get("new")) {
      params.delete("new");
      setParams(params, { replace: true });
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast("First name, last name, and phone are required", "error");
      return;
    }
    setSaving(true);
    try {
      const created = await api<{ id: string }>("/crm/customers", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          status: form.status,
          notes: form.notes.trim() || null,
        }),
      });
      toast("Customer created");
      closeModal();
      navigate(`/admin/customers/${created.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create customer", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle="Customer records and visit history"
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            + Add Customer
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search name, phone, email..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="No customers found" description={q ? "Try a different search." : "Add your first customer."} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Vehicles</th>
                <th className="px-4 py-3 font-semibold">Last Visit</th>
                <th className="px-4 py-3 font-semibold">Total Spent</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-fog/60"
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                >
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/admin/customers/${c.id}`} className="hover:text-accent" onClick={(e) => e.stopPropagation()}>
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3 text-muted">{c.email || "—"}</td>
                  <td className="px-4 py-3">{c.vehicleCount}</td>
                  <td className="px-4 py-3">{c.lastVisit || "—"}</td>
                  <td className="px-4 py-3">{money(c.totalSpent)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={closeModal} title="Add Customer">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
