import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  Users,
  Car,
  MessageSquareQuote,
  Wrench,
  BarChart3,
  X,
} from "lucide-react";
import { api } from "../../api";
import { useAuth } from "../../auth";
import { Loading } from "../ui";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/appointments", label: "Appointments", icon: Calendar },
  { to: "/admin/inventory", label: "Tire Inventory", icon: Package },
  { to: "/admin/quote-requests", label: "Quote Requests", icon: MessageSquareQuote },
  { to: "/admin/quotes", label: "Quotes", icon: FileText },
  { to: "/admin/service-orders", label: "Service Orders", icon: Wrench },
  { to: "/admin/invoices", label: "Invoices", icon: Receipt },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

type SearchResult = {
  customers: { id: string; firstName: string; lastName: string; phone: string }[];
  vehicles: { id: string; year: number; make: string; model: string; customerId: string; customer?: { firstName: string; lastName: string } }[];
  invoices: { id: string; number: string }[];
  quotes: { id: string; number: string }[];
  serviceOrders: { id: string; number: string }[];
  appointments: { id: string; number: string }[];
};

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<SearchResult>(`/crm/search?q=${encodeURIComponent(q.trim())}`);
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper">
        <Loading label="Checking session..." />
      </div>
    );
  }

  function go(path: string) {
    setQ("");
    setResults(null);
    setSidebarOpen(false);
    navigate(path);
  }

  const hasResults =
    results &&
    (results.customers.length ||
      results.vehicles.length ||
      results.invoices.length ||
      results.quotes.length ||
      results.serviceOrders.length ||
      results.appointments.length);

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-brand text-white">
      <div className="border-b border-white/10 px-4 py-5">
        <Link to="/admin" className="block" onClick={() => setSidebarOpen(false)}>
          <p className="font-display text-xl font-bold tracking-wide leading-tight">Tires & More</p>
          <p className="font-display text-lg font-semibold text-accent">For Less</p>
          <p className="mt-1 text-xs text-white/50">Admin CRM</p>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(({ to, end, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-accent text-ink" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-white/50">{user.email}</p>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/admin/login");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/50" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 z-50 shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="rounded-md p-2 text-ink hover:bg-fog lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1 max-w-xl" ref={searchRef}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customers, plates, invoices..."
                className="w-full rounded-md border border-slate/20 bg-paper py-2 pl-9 pr-9 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {q && (
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted" onClick={() => setQ("")}>
                  <X className="h-4 w-4" />
                </button>
              )}
              {(results || searching) && q.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-fog bg-white shadow-lg">
                  {searching && <p className="px-4 py-3 text-sm text-muted">Searching...</p>}
                  {!searching && !hasResults && <p className="px-4 py-3 text-sm text-muted">No results</p>}
                  {!searching && hasResults && (
                    <div className="py-2 text-sm">
                      {results!.customers.map((c) => (
                        <button key={c.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/customers/${c.id}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Customer</span>
                          <p className="font-medium">{c.firstName} {c.lastName} · {c.phone}</p>
                        </button>
                      ))}
                      {results!.vehicles.map((v) => (
                        <button key={v.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/customers/${v.customerId}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Vehicle</span>
                          <p className="font-medium">
                            {v.year} {v.make} {v.model}
                            {v.customer ? ` · ${v.customer.firstName} ${v.customer.lastName}` : ""}
                          </p>
                        </button>
                      ))}
                      {results!.appointments.map((a) => (
                        <button key={a.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/appointments?id=${a.id}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Appointment</span>
                          <p className="font-medium">{a.number}</p>
                        </button>
                      ))}
                      {results!.quotes.map((qte) => (
                        <button key={qte.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/quotes?id=${qte.id}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Quote</span>
                          <p className="font-medium">{qte.number}</p>
                        </button>
                      ))}
                      {results!.serviceOrders.map((so) => (
                        <button key={so.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/service-orders/${so.id}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Service Order</span>
                          <p className="font-medium">{so.number}</p>
                        </button>
                      ))}
                      {results!.invoices.map((inv) => (
                        <button key={inv.id} type="button" className="block w-full px-4 py-2 text-left hover:bg-fog" onClick={() => go(`/admin/invoices?id=${inv.id}`)}>
                          <span className="text-xs font-semibold uppercase text-muted">Invoice</span>
                          <p className="font-medium">{inv.number}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/admin/appointments?new=1" className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-dark">
                + Appointment
              </Link>
              <Link to="/admin/customers?new=1" className="rounded-md border border-slate/20 bg-white px-3 py-2 text-xs font-semibold hover:bg-fog">
                + Customer
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
