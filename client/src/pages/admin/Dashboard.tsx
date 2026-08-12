import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { Button, EmptyState, Loading, PageHeader, StatusBadge, money } from "../../components/ui";

type DashboardData = {
  metrics: {
    todaysAppointments: number;
    pendingQuoteRequests: number;
    tiresSoldThisMonth: number;
    openServiceOrders: number;
    revenueThisMonth: number;
    lowStock: number;
    outOfStock: number;
  };
  todaysSchedule: {
    id: string;
    number: string;
    time: string;
    serviceType: string;
    status: string;
    customer: { id: string; firstName: string; lastName: string };
    vehicle?: { year: number; make: string; model: string } | null;
  }[];
  revenueByDay: { date: string; revenue: number; tireSales: number; appointments: number; serviceOrders: number }[];
  notifications: { id: string; title: string; message: string; type: string; createdAt: string; status: string }[];
  demoNotice: string;
};

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardData>("/crm/dashboard")
      .then(setData)
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load dashboard", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Could not load dashboard" description="Try refreshing the page." />;

  const chartData = data.revenueByDay.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d"),
  }));

  const metrics = [
    { label: "Today's Appointments", value: data.metrics.todaysAppointments, to: "/admin/appointments" },
    { label: "Pending Quote Requests", value: data.metrics.pendingQuoteRequests, to: "/admin/quote-requests" },
    { label: "Tires Sold This Month", value: data.metrics.tiresSoldThisMonth, to: "/admin/inventory" },
    { label: "Open Service Orders", value: data.metrics.openServiceOrders, to: "/admin/service-orders" },
    { label: "Revenue This Month", value: money(data.metrics.revenueThisMonth), to: "/admin/reports" },
  ];

  const quick = [
    { label: "+ New Customer", to: "/admin/customers?new=1" },
    { label: "+ New Appointment", to: "/admin/appointments?new=1" },
    { label: "+ New Quote", to: "/admin/quotes?new=1" },
    { label: "+ New Service Order", to: "/admin/service-orders?new=1" },
    { label: "+ Add Tire", to: "/admin/inventory?new=1" },
    { label: "+ Create Invoice", to: "/admin/invoices?new=1" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Tires & More For Less — operations overview" />

      <div className="rounded-md border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-accent-dark">
        {data.demoNotice}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => navigate(m.to)}
            className="rounded-lg border border-fog bg-white p-4 text-left shadow-sm transition hover:border-accent/30"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{m.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-ink">{m.value}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <Button key={q.to} variant="outline" onClick={() => navigate(q.to)}>
            {q.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-fog bg-white p-4">
          <h2 className="mb-4 font-display text-xl font-bold">Revenue (7 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecef" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Bar dataKey="revenue" fill="#e35b0d" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-fog bg-white p-4">
          <h2 className="mb-4 font-display text-xl font-bold">Activity (7 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecef" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tireSales" stroke="#e35b0d" name="Tire sales" strokeWidth={2} />
                <Line type="monotone" dataKey="appointments" stroke="#1e2429" name="Appointments" strokeWidth={2} />
                <Line type="monotone" dataKey="serviceOrders" stroke="#1f7a4d" name="Service orders" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-fog bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Today&apos;s Schedule</h2>
            <Link to="/admin/appointments" className="text-sm font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>
          {data.todaysSchedule.length === 0 ? (
            <EmptyState title="No appointments today" />
          ) : (
            <ul className="divide-y divide-fog">
              {data.todaysSchedule.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <Link to={`/admin/appointments?id=${a.id}`} className="font-semibold text-ink hover:text-accent">
                      {a.time} · {a.serviceType}
                    </Link>
                    <p className="text-sm text-muted">
                      <Link to={`/admin/customers/${a.customer.id}`} className="hover:underline">
                        {a.customer.firstName} {a.customer.lastName}
                      </Link>
                      {a.vehicle ? ` · ${a.vehicle.year} ${a.vehicle.make} ${a.vehicle.model}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-fog bg-white p-4">
          <h2 className="mb-3 font-display text-xl font-bold">Recent Notifications</h2>
          {data.notifications.length === 0 ? (
            <EmptyState title="No notifications" />
          ) : (
            <ul className="divide-y divide-fog">
              {data.notifications.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">{format(new Date(n.createdAt), "MMM d, h:mm a")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
