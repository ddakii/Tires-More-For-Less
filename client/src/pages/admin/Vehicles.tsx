import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { EmptyState, Input, Loading, PageHeader } from "../../components/ui";

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  tireSize?: string | null;
  mileage?: number | null;
  customerId: string;
  customer: { id: string; firstName: string; lastName: string };
};

export default function Vehicles() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<Vehicle[]>("/crm/vehicles")
      .then(setRows)
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load vehicles", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((v) =>
      [
        v.customer.firstName,
        v.customer.lastName,
        String(v.year),
        v.make,
        v.model,
        v.licensePlate || "",
        v.vin || "",
        v.tireSize || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, q]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Vehicles" subtitle="All vehicles on file" />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search customer, plate, VIN, size..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <EmptyState title="No vehicles found" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Plate</th>
                <th className="px-4 py-3 font-semibold">VIN</th>
                <th className="px-4 py-3 font-semibold">Tire Size</th>
                <th className="px-4 py-3 font-semibold">Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-fog/60">
                  <td className="px-4 py-3">
                    <Link to={`/admin/customers/${v.customerId}`} className="font-medium text-accent hover:underline">
                      {v.customer.firstName} {v.customer.lastName}
                    </Link>
                  </td>
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
      )}
    </div>
  );
}
