import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarClock, Menu, Phone, X } from "lucide-react";
import { Button } from "../ui";
import {
  ADDRESS,
  BUSINESS_NAME,
  HOURS,
  HOURS_SUMMARY,
  PHONE,
} from "../../lib/constants";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/tires", label: "Tires" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-semibold transition ${
    isActive ? "text-accent" : "text-white/80 hover:text-white"
  }`;
}

export default function PublicLayout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link to="/" className="group min-w-0 shrink">
            <span className="block font-display text-xl font-extrabold uppercase tracking-wide text-accent sm:text-2xl">
              {BUSINESS_NAME}
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-white/70">
              Minneapolis · New & Used Tires & Rims
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <a
              href={PHONE.href}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-accent"
            >
              <Phone className="h-4 w-4 text-accent" />
              {PHONE.display}
            </a>
            <Link to="/quote">
              <Button
                variant="outline"
                className="!border-white !bg-transparent !text-white hover:!bg-white/15"
              >
                Get a Tire Quote
              </Button>
            </Link>
            <Link to="/book">
              <Button>
                <CalendarClock className="h-4 w-4" />
                Book Service
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <a
              href={PHONE.href}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent text-white"
              aria-label={`Call ${PHONE.display}`}
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-white/10 bg-brand-dark px-4 py-4 lg:hidden animate-fade-in">
            <nav className="flex flex-col gap-3">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <a href={PHONE.href} className="text-sm font-semibold text-accent">
                Call {PHONE.display}
              </a>
              <Link to="/quote">
                <Button
                  variant="outline"
                  className="w-full !border-white !bg-transparent !text-white hover:!bg-white/15"
                >
                  Get a Tire Quote
                </Button>
              </Link>
              <Link to="/book">
                <Button className="w-full">Book Service</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>{children ?? <Outlet />}</main>

      <footer className="border-t border-slate/20 bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-accent">{BUSINESS_NAME}</p>
            <p className="mt-2 text-sm text-white/70">
              Quality tires, fair prices, and dependable tire service in Minneapolis.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Visit</p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {ADDRESS.line1}
              <br />
              {ADDRESS.city}, {ADDRESS.state} {ADDRESS.zip}
              <br />
              {ADDRESS.country}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Hours</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/80">
              {HOURS.map((h) => (
                <li key={h.label} className="flex justify-between gap-4">
                  <span>{h.label}</span>
                  <span className="text-white/60">{h.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/45 lg:hidden">{HOURS_SUMMARY}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Contact</p>
            <a href={PHONE.href} className="mt-3 block text-lg font-semibold text-white hover:text-accent">
              {PHONE.display}
            </a>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/book">
                <Button>Book Service</Button>
              </Link>
              <Link to="/quote">
                <Button
                  variant="outline"
                  className="!border-white !bg-transparent !text-white hover:!bg-white/15"
                >
                  Get a Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <p>© {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.</p>
            <Link to="/admin/login" className="hover:text-white/80">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate/15 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
          <a href={PHONE.href} className="flex-1">
            <Button variant="secondary" className="w-full">
              <Phone className="h-4 w-4" />
              Call
            </Button>
          </a>
          <Link to="/book" className="flex-1">
            <Button className="w-full">
              <CalendarClock className="h-4 w-4" />
              Book
            </Button>
          </Link>
        </div>
      </div>
      <div className="h-20 xl:hidden" aria-hidden />
    </div>
  );
}
