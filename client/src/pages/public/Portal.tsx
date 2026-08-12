import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { Loading, StatusBadge, money } from "../../components/ui";

type PortalVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  tireSize?: string | null;
  mileage?: number | null;
};

type PortalAppointment = {
  id: string;
  number: string;
  serviceType: string;
  date: string;
  time: string;
  status: string;
  tireSize?: string | null;
};

type PortalQuote = {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  items: { description: string; quantity: number; unitPrice: number }[];
};

type PortalInvoice = {
  id: string;
  number: string;
  status: string;
  issuedAt: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  payments: { amount: number }[];
};

type PortalServiceOrder = {
  id: string;
  number: string;
  status: string;
  createdAt: string;
  items: { description: string; quantity: number; unitPrice: number }[];
};

type PortalData = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  vehicles: PortalVehicle[];
  appointments: PortalAppointment[];
  quotes: PortalQuote[];
  invoices: PortalInvoice[];
  serviceOrders: PortalServiceOrder[];
};

export default function Portal() {
  const { token } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await api<PortalData>(`/portal/${encodeURIComponent(token)}`);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Portal not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <Loading label="Loading your portal..." />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Portal unavailable</h1>
        <p className="mt-3 text-muted">{error || "We couldn’t find this customer portal link."}</p>
        <p className="mt-2 text-sm text-muted">
          You can still{" "}
          <Link to="/book" className="font-semibold text-accent hover:underline">
            book service
          </Link>{" "}
          or{" "}
          <Link to="/quote" className="font-semibold text-accent hover:underline">
            request a quote
          </Link>{" "}
          without an account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-14">
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Customer portal</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-wide">
          Welcome, {data.firstName}
        </h1>
        <p className="mt-2 text-muted">
          Optional view of your appointments, services, quotes, invoices, and vehicles — no account
          required to book or request a quote.
        </p>
        <p className="mt-1 text-sm text-muted">
          {data.phone}
          {data.email ? ` · ${data.email}` : ""}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Section title="Vehicles">
          {data.vehicles.length === 0 ? (
            <Empty text="No vehicles on file." />
          ) : (
            <ul className="space-y-3">
              {data.vehicles.map((v) => (
                <li key={v.id} className="rounded-md border border-fog px-4 py-3">
                  <p className="font-semibold">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-sm text-muted">
                    {[v.tireSize, v.mileage != null ? `${v.mileage.toLocaleString()} mi` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Appointments">
          {data.appointments.length === 0 ? (
            <Empty text="No appointments yet." />
          ) : (
            <ul className="space-y-3">
              {data.appointments.map((a) => (
                <li key={a.id} className="rounded-md border border-fog px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{a.serviceType}</p>
                      <p className="text-sm text-muted">
                        {a.number} · {a.date} · {a.time}
                        {a.tireSize ? ` · ${a.tireSize}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Service history">
          {data.serviceOrders.length === 0 ? (
            <Empty text="No service orders yet." />
          ) : (
            <ul className="space-y-3">
              {data.serviceOrders.map((so) => (
                <li key={so.id} className="rounded-md border border-fog px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{so.number}</p>
                      <p className="text-sm text-muted">
                        {new Date(so.createdAt).toLocaleDateString()} ·{" "}
                        {so.items.map((i) => i.description).join(", ") || "Service order"}
                      </p>
                    </div>
                    <StatusBadge status={so.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Quotes">
          {data.quotes.length === 0 ? (
            <Empty text="No quotes yet." />
          ) : (
            <ul className="space-y-3">
              {data.quotes.map((q) => {
                const total = q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                return (
                  <li key={q.id} className="rounded-md border border-fog px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{q.number}</p>
                        <p className="text-sm text-muted">
                          {new Date(q.createdAt).toLocaleDateString()} · {money(total)}
                        </p>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Invoices" className="lg:col-span-2">
          {data.invoices.length === 0 ? (
            <Empty text="No invoices yet." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.invoices.map((inv) => {
                const total = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                return (
                  <li key={inv.id} className="rounded-md border border-fog px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{inv.number}</p>
                        <p className="text-sm text-muted">
                          {new Date(inv.issuedAt).toLocaleDateString()} · Total {money(total)} · Paid{" "}
                          {money(paid)}
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate/10 bg-white p-5 shadow-sm ${className}`}>
      <h2 className="font-display text-2xl font-bold tracking-wide">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}
