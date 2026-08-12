import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "../../api";
import { Button, Input, Loading, Select, Textarea } from "../../components/ui";
import { useToast } from "../../toast";
import { BOOKABLE_SERVICES, BUSINESS_NAME, PHONE } from "../../lib/constants";

type SlotsResponse = { slots: string[]; closed?: boolean; message?: string };

export default function Book() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closedDay, setClosedDay] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    year: "",
    make: "",
    model: "",
    tireSize: searchParams.get("tireSize") || "",
    serviceType: searchParams.get("service") || "Tire Installation",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    const service = searchParams.get("service");
    const tireSize = searchParams.get("tireSize");
    setForm((f) => ({
      ...f,
      ...(service ? { serviceType: service } : {}),
      ...(tireSize ? { tireSize } : {}),
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!form.date) {
      setSlots([]);
      setClosedDay(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const data = await api<SlotsResponse>(`/appointment-slots?date=${encodeURIComponent(form.date)}`);
        if (cancelled) return;
        setClosedDay(Boolean(data.closed));
        setSlots(data.slots || []);
        setForm((f) => ({ ...f, time: data.slots?.includes(f.time) ? f.time : "" }));
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setClosedDay(false);
          toast(err instanceof Error ? err.message : "Could not load time slots", "error");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.date, toast]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      toast("Please fill in your name and phone number", "error");
      return;
    }
    if (!form.serviceType || !form.date || !form.time) {
      toast("Please choose a service, date, and time", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api("/appointments", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          year: form.year ? Number(form.year) : undefined,
          make: form.make.trim() || undefined,
          model: form.model.trim() || undefined,
          tireSize: form.tireSize.trim() || undefined,
          serviceType: form.serviceType,
          date: form.date,
          time: form.time,
          notes: form.notes.trim() || undefined,
        }),
      });
      setSubmitted(true);
      toast("Appointment request sent", "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to submit request";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-lg border border-ok/20 bg-white px-6 py-12 shadow-sm animate-fade-up">
          <CheckCircle2 className="mx-auto h-12 w-12 text-ok" />
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-wide">
            Appointment Request Received
          </h1>
          <p className="mt-3 text-muted leading-relaxed">
            We’ve received your service request. {BUSINESS_NAME} will contact you to confirm your
            appointment.
          </p>
          <p className="mt-2 text-sm text-muted">
            Questions? Call{" "}
            <a href={PHONE.href} className="font-semibold text-accent hover:underline">
              {PHONE.display}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
            <Link to="/services">
              <Button variant="outline">View Services</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
      <div className="animate-fade-up">
        <h1 className="font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
          Book Tire Service
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Request an appointment online. This submits a request — the shop will contact you to
          confirm.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-8 rounded-lg border border-slate/10 bg-white p-5 shadow-sm sm:p-8 animate-fade-up delay-1"
      >
        <fieldset className="space-y-4">
          <legend className="font-display text-2xl font-bold tracking-wide">Your information</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name *"
              name="firstName"
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
            <Input
              label="Last name *"
              name="lastName"
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
            <Input
              label="Phone *"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl font-bold tracking-wide">Vehicle</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Year"
              name="year"
              inputMode="numeric"
              placeholder="2019"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
            />
            <Input
              label="Make"
              name="make"
              placeholder="Honda"
              value={form.make}
              onChange={(e) => update("make", e.target.value)}
            />
            <Input
              label="Model"
              name="model"
              placeholder="CR-V"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
            />
            <Input
              label="Tire size"
              name="tireSize"
              placeholder="225/65R17"
              value={form.tireSize}
              onChange={(e) => update("tireSize", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl font-bold tracking-wide">Appointment</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Service type *"
              name="serviceType"
              required
              value={form.serviceType}
              onChange={(e) => update("serviceType", e.target.value)}
            >
              {BOOKABLE_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Preferred date *"
              name="date"
              type="date"
              required
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
            <div className="sm:col-span-2">
              {slotsLoading ? (
                <Loading label="Loading available times..." />
              ) : (
                <Select
                  label="Available time *"
                  name="time"
                  required
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  disabled={!form.date || closedDay || slots.length === 0}
                >
                  <option value="">
                    {!form.date
                      ? "Select a date first"
                      : closedDay
                        ? "Closed on Sunday"
                        : slots.length === 0
                          ? "No open slots"
                          : "Choose a time"}
                  </option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {formatSlot(slot)}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Notes"
                name="notes"
                rows={4}
                placeholder="Tell us anything that helps — flat tire, preferred brand, etc."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Submitting..." : "Request Appointment"}
        </Button>
      </form>
    </div>
  );
}

function formatSlot(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
