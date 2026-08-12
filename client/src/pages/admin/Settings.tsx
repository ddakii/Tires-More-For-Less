import { type FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../../api";
import { useToast } from "../../toast";
import { Button, EmptyState, Input, Loading, PageHeader, Textarea } from "../../components/ui";

type HoursDay = { open: string | null; close: string | null; closed: boolean };
type Settings = {
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email?: string | null;
  taxRate: number;
  invoicePrefix: string;
  quotePrefix: string;
  servicePrefix: string;
  appointmentPrefix: string;
  notifyEmail: boolean;
  notifySms: boolean;
  hours: Record<string, HoursDay>;
  servicePrices: Record<string, number>;
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricesText, setPricesText] = useState("");

  useEffect(() => {
    api<Settings>("/crm/settings")
      .then((s) => {
        setSettings(s);
        setPricesText(JSON.stringify(s.servicePrices, null, 2));
      })
      .catch((err) => toast(err instanceof ApiError ? err.message : "Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    let servicePrices: Record<string, number>;
    try {
      servicePrices = JSON.parse(pricesText);
    } catch {
      toast("Service prices must be valid JSON", "error");
      return;
    }
    if (!settings.name.trim() || !settings.phone.trim() || !settings.addressLine1.trim()) {
      toast("Business name, phone, and address are required", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await api<Settings>("/crm/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          taxRate: Number(settings.taxRate),
          servicePrices,
          hours: settings.hours,
        }),
      });
      setSettings(updated);
      setPricesText(JSON.stringify(updated.servicePrices, null, 2));
      toast("Settings saved");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (!settings) return <EmptyState title="Settings unavailable" />;

  function updateHour(day: string, patch: Partial<HoursDay>) {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, hours: { ...prev.hours, [day]: { ...prev.hours[day], ...patch } } };
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="Business info, hours, tax, and notifications" />

      <form onSubmit={onSave} className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-fog bg-white p-5 space-y-3">
          <h2 className="font-display text-xl font-bold">Business Info</h2>
          <Input label="Business name" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} required />
          <Input label="Address" value={settings.addressLine1} onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="City" value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} />
            <Input label="State" value={settings.state} onChange={(e) => setSettings({ ...settings, state: e.target.value })} />
            <Input label="ZIP" value={settings.zip} onChange={(e) => setSettings({ ...settings, zip: e.target.value })} />
          </div>
          <Input label="Country" value={settings.country} onChange={(e) => setSettings({ ...settings, country: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} required />
            <Input label="Email" type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </div>
          <Input
            label="Tax rate (e.g. 0.07875 for 7.875%)"
            type="number"
            step="0.00001"
            value={settings.taxRate}
            onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
          />
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 space-y-3">
          <h2 className="font-display text-xl font-bold">Number Prefixes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Invoice" value={settings.invoicePrefix} onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })} />
            <Input label="Quote" value={settings.quotePrefix} onChange={(e) => setSettings({ ...settings, quotePrefix: e.target.value })} />
            <Input label="Service order" value={settings.servicePrefix} onChange={(e) => setSettings({ ...settings, servicePrefix: e.target.value })} />
            <Input label="Appointment" value={settings.appointmentPrefix} onChange={(e) => setSettings({ ...settings, appointmentPrefix: e.target.value })} />
          </div>
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 space-y-3">
          <h2 className="font-display text-xl font-bold">Business Hours</h2>
          {DAY_ORDER.map((day) => {
            const h = settings.hours[day] || { open: "9:00 AM", close: "6:30 PM", closed: false };
            return (
              <div key={day} className="grid gap-2 sm:grid-cols-[120px_1fr_1fr_auto] items-end">
                <p className="text-sm font-semibold capitalize pb-2">{day}</p>
                <Input
                  label="Open"
                  value={h.open || ""}
                  disabled={h.closed}
                  onChange={(e) => updateHour(day, { open: e.target.value })}
                />
                <Input
                  label="Close"
                  value={h.close || ""}
                  disabled={h.closed}
                  onChange={(e) => updateHour(day, { close: e.target.value })}
                />
                <label className="flex items-center gap-2 pb-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={h.closed}
                    onChange={(e) => updateHour(day, { closed: e.target.checked, open: e.target.checked ? null : h.open, close: e.target.checked ? null : h.close })}
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 space-y-3">
          <h2 className="font-display text-xl font-bold">Service Prices</h2>
          <p className="text-sm text-muted">JSON map of service name → price. Used as defaults when quoting.</p>
          <Textarea rows={10} value={pricesText} onChange={(e) => setPricesText(e.target.value)} className="font-mono text-xs" />
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 space-y-3">
          <h2 className="font-display text-xl font-bold">Notifications</h2>
          <p className="rounded-md border border-accent/20 bg-accent-soft px-3 py-2 text-sm text-accent-dark">
            Email and SMS toggles are mock until a provider is connected. Notifications are logged in-app as Mock.
          </p>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={settings.notifyEmail}
              onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.checked })}
            />
            Enable email notifications (mock)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={settings.notifySms}
              onChange={(e) => setSettings({ ...settings, notifySms: e.target.checked })}
            />
            Enable SMS notifications (mock)
          </label>
        </section>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
