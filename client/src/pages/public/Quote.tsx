import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "../../api";
import { Button, Input, Select, Textarea } from "../../components/ui";
import { useToast } from "../../toast";
import { BUSINESS_NAME, PHONE } from "../../lib/constants";

export default function Quote() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    year: "",
    make: "",
    model: "",
    vehicleInfo: "",
    tireSize: searchParams.get("tireSize") || "",
    quantity: "4",
    preference: "Either",
    preferredBrand: searchParams.get("brand") || "",
    budget: "",
    notes: "",
  });

  useEffect(() => {
    const tireSize = searchParams.get("tireSize");
    const brand = searchParams.get("brand");
    setForm((f) => ({
      ...f,
      ...(tireSize ? { tireSize } : {}),
      ...(brand ? { preferredBrand: brand } : {}),
    }));
  }, [searchParams]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast("Name and phone are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const vehicleParts = [form.year, form.make, form.model].filter(Boolean).join(" ");
      await api("/quote-requests", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          year: form.year ? Number(form.year) : undefined,
          make: form.make.trim() || undefined,
          model: form.model.trim() || undefined,
          vehicleInfo: form.vehicleInfo.trim() || vehicleParts || undefined,
          tireSize: form.tireSize.trim() || undefined,
          quantity: Number(form.quantity) || 4,
          preference: form.preference || undefined,
          preferredBrand: form.preferredBrand.trim() || undefined,
          budget: form.budget.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      setSubmitted(true);
      toast("Quote request sent", "success");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to submit quote request";
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
            Quote Request Received
          </h1>
          <p className="mt-3 text-muted leading-relaxed">
            Thanks — {BUSINESS_NAME} received your tire quote request and will follow up with pricing
            options.
          </p>
          <p className="mt-2 text-sm text-muted">
            Need something sooner? Call{" "}
            <a href={PHONE.href} className="font-semibold text-accent hover:underline">
              {PHONE.display}
            </a>
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/tires">
              <Button>Browse Tires</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
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
          Request a Tire Quote
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Tell us what you need — for example, “I need 4 tires for my 2019 Honda CR-V.” We’ll review
          inventory and get back to you.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6 rounded-lg border border-slate/10 bg-white p-5 shadow-sm sm:p-8 animate-fade-up delay-1"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name *"
            name="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
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
          <Input
            label="Tire size"
            name="tireSize"
            placeholder="225/65R17"
            value={form.tireSize}
            onChange={(e) => update("tireSize", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Vehicle year"
            name="year"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => update("year", e.target.value)}
          />
          <Input
            label="Make"
            name="make"
            value={form.make}
            onChange={(e) => update("make", e.target.value)}
          />
          <Input
            label="Model"
            name="model"
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
          />
        </div>

        <Input
          label="Vehicle (optional free text)"
          name="vehicleInfo"
          placeholder="2019 Honda CR-V"
          value={form.vehicleInfo}
          onChange={(e) => update("vehicleInfo", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Quantity"
            name="quantity"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <Select
            label="New / Used preference"
            name="preference"
            value={form.preference}
            onChange={(e) => update("preference", e.target.value)}
          >
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Either">Either</option>
          </Select>
          <Input
            label="Preferred brand"
            name="preferredBrand"
            placeholder="Michelin, Goodyear…"
            value={form.preferredBrand}
            onChange={(e) => update("preferredBrand", e.target.value)}
          />
        </div>

        <Input
          label="Budget"
          name="budget"
          placeholder="Around $600 for a set of 4"
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
        />

        <Textarea
          label="Additional notes"
          name="notes"
          rows={4}
          placeholder="Tell us about wear, winter needs, or timing."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />

        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Quote Request"}
        </Button>
      </form>
    </div>
  );
}
