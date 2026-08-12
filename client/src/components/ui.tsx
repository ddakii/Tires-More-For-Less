import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-accent text-ink hover:bg-accent-dark",
    secondary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "bg-transparent text-ink hover:bg-fog",
    danger: "bg-danger text-white hover:opacity-90",
    outline: "border border-slate/20 bg-white text-ink hover:bg-fog",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Input({ className = "", label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink/80">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-md border border-slate/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ className = "", label, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink/80">{label}</span>}
      <select
        id={inputId}
        className={`w-full rounded-md border border-slate/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Textarea({ className = "", label, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink/80">{label}</span>}
      <textarea
        id={inputId}
        className={`w-full rounded-md border border-slate/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${className}`}
        {...props}
      />
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "In Stock": "bg-ok/10 text-ok",
    "Low Stock": "bg-warn/10 text-warn",
    "Out of Stock": "bg-danger/10 text-danger",
    Requested: "bg-warn/10 text-warn",
    Confirmed: "bg-ok/10 text-ok",
    "Checked In": "bg-accent-soft text-brand-dark",
    "In Service": "bg-accent-soft text-brand-dark",
    Completed: "bg-ok/10 text-ok",
    Cancelled: "bg-fog text-muted",
    "No Show": "bg-danger/10 text-danger",
    Draft: "bg-fog text-muted",
    Sent: "bg-accent-soft text-brand-dark",
    Accepted: "bg-ok/10 text-ok",
    Declined: "bg-danger/10 text-danger",
    Expired: "bg-fog text-muted",
    Converted: "bg-ok/10 text-ok",
    Open: "bg-accent-soft text-brand-dark",
    "In Progress": "bg-warn/10 text-warn",
    Invoiced: "bg-ok/10 text-ok",
    Unpaid: "bg-danger/10 text-danger",
    "Partially Paid": "bg-warn/10 text-warn",
    Paid: "bg-ok/10 text-ok",
    Refunded: "bg-fog text-muted",
    New: "bg-accent-soft text-brand-dark",
    Reviewed: "bg-warn/10 text-warn",
    Quoted: "bg-ok/10 text-ok",
    Closed: "bg-fog text-muted",
    Active: "bg-ok/10 text-ok",
    Inactive: "bg-fog text-muted",
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${map[status] || "bg-fog text-muted"}`}>
      {status}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-ink/50" aria-label="Close dialog" onClick={onClose} />
      <div className={`relative max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-fog bg-white px-5 py-4">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate/20 bg-white px-6 py-12 text-center">
      <p className="font-display text-xl font-semibold text-ink">{title}</p>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function Loading({ label = "Loading..." }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-muted">{label}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}
