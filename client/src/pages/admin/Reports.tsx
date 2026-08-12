import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { EmptyState, Loading, PageHeader, StatusBadge, money } from "../../components/ui";

type ReportsData = {
  period: string;
  revenue: number;
  tireRevenue: number;
  serviceRevenue: number;
  tireCost: number;
  profit: number;
  appointmentCount: number;
  serviceOrderCount: number;
  bestSellingBrands: { brand: string; qty: number }[];
  topServices: { name: string; qty: number }[];
  customers: { new: number; returning: number };
  inventory: {
    lowStock: { id: string; brand: string; model: string; size: string; quantity: number; stockStatus: string }[];
    outOfStock: { id: string; brand: string; model: string; size: string; quantity: number; stockStatus: string }[];
  };
};

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const COLORS = ["#e35b0d", "#1e2429", "#1f7a4d", "#b45309", "#2a3238"];

export default function Reports() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<ReportsData>(`/crm/reports?period=${period}`)
      .then(setData)
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load reports", "error"))
      .finally(() => setLoading(false));
  }, [period, toast]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Revenue, inventory, and customer insights" />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${period === p.value ? "bg-ink text-white" : "bg-white border border-fog text-muted"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : !data ? (
        <EmptyState title="No report data" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: money(data.revenue) },
              { label: "Profit", value: money(data.profit) },
              { label: "Tire Revenue", value: money(data.tireRevenue) },
              { label: "Service Revenue", value: money(data.serviceRevenue) },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-fog bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m.label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-fog bg-white p-4">
              <p className="text-xs font-semibold uppercase text-muted">Tire Cost</p>
              <p className="mt-1 font-display text-2xl font-bold">{money(data.tireCost)}</p>
            </div>
            <div className="rounded-lg border border-fog bg-white p-4">
              <p className="text-xs font-semibold uppercase text-muted">Appointments</p>
              <p className="mt-1 font-display text-2xl font-bold">{data.appointmentCount}</p>
            </div>
            <div className="rounded-lg border border-fog bg-white p-4">
              <p className="text-xs font-semibold uppercase text-muted">Service Orders</p>
              <p className="mt-1 font-display text-2xl font-bold">{data.serviceOrderCount}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-fog bg-white p-4">
              <h2 className="mb-4 font-display text-xl font-bold">Best Selling Brands</h2>
              {data.bestSellingBrands.length === 0 ? (
                <EmptyState title="No tire sales in period" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bestSellingBrands}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8ecef" />
                      <XAxis dataKey="brand" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#e35b0d" name="Qty sold" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-fog bg-white p-4">
              <h2 className="mb-4 font-display text-xl font-bold">Top Services</h2>
              {data.topServices.length === 0 ? (
                <EmptyState title="No services in period" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topServices} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8ecef" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#1e2429" name="Qty" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-fog bg-white p-4">
              <h2 className="mb-4 font-display text-xl font-bold">New vs Returning</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "New", value: data.customers.new },
                        { name: "Returning", value: data.customers.returning },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-sm text-muted">
                New {data.customers.new} · Returning {data.customers.returning}
              </p>
            </div>

            <div className="rounded-lg border border-fog bg-white p-4 space-y-4">
              <h2 className="font-display text-xl font-bold">Inventory Alerts</h2>
              <div>
                <p className="mb-2 text-sm font-semibold text-warn">Low stock</p>
                {data.inventory.lowStock.length === 0 ? (
                  <p className="text-sm text-muted">None</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.inventory.lowStock.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span>
                          {t.brand} {t.model} {t.size} · qty {t.quantity}
                        </span>
                        <StatusBadge status={t.stockStatus} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-danger">Out of stock</p>
                {data.inventory.outOfStock.length === 0 ? (
                  <p className="text-sm text-muted">None</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.inventory.outOfStock.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span>
                          {t.brand} {t.model} {t.size}
                        </span>
                        <StatusBadge status={t.stockStatus} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
