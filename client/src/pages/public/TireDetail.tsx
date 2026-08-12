import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../../api";
import { Button, Loading, StatusBadge, money } from "../../components/ui";
import type { Tire } from "../../lib/constants";

export default function TireDetail() {
  const { id } = useParams();
  const [tire, setTire] = useState<Tire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const data = await api<Tire>(`/tires/${id}`);
        if (!cancelled) setTire(data);
      } catch (err) {
        if (!cancelled) {
          setTire(null);
          setError(err instanceof Error ? err.message : "Tire not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loading label="Loading tire details..." />;

  if (error || !tire) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-2xl font-bold">{error || "Tire not found"}</p>
        <Link to="/tires" className="mt-6 inline-flex">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to Tires
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6 lg:py-14">
      <Link to="/tires" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" />
        Back to tires
      </Link>

      <div className="mt-6 animate-fade-up overflow-hidden rounded-lg border border-slate/10 bg-white shadow-sm">
        <div className="border-b border-fog bg-ink px-6 py-8 text-white sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{tire.brand}</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
                {tire.model}
              </h1>
              <p className="mt-2 text-white/70">
                {tire.size} · {tire.type} · {tire.season}
              </p>
            </div>
            <StatusBadge status={tire.stockStatus} />
          </div>
          <p className="mt-6 font-display text-4xl font-bold text-accent">{money(tire.price)}</p>
        </div>

        <div className="grid gap-6 px-6 py-8 sm:grid-cols-2 sm:px-8">
          <Detail label="SKU" value={tire.sku} />
          <Detail label="Quantity available" value={String(tire.quantity)} />
          <Detail label="Load index" value={tire.loadIndex || "—"} />
          <Detail label="Speed rating" value={tire.speedRating || "—"} />
          <Detail label="Warranty" value={tire.warranty || "—"} />
          <Detail
            label="Width / Aspect / Diameter"
            value={`${tire.width} / ${tire.aspectRatio} / ${tire.diameter}`}
          />
          {tire.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Notes</p>
              <p className="mt-1 text-sm leading-relaxed">{tire.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-fog px-6 py-5 sm:flex-row sm:px-8">
          <Link
            to={`/quote?tireSize=${encodeURIComponent(tire.size)}&brand=${encodeURIComponent(tire.brand)}`}
            className="sm:flex-1"
          >
            <Button variant="secondary" className="w-full">
              Request Quote
            </Button>
          </Link>
          <Link
            to={`/book?service=${encodeURIComponent("Tire Installation")}&tireSize=${encodeURIComponent(tire.size)}`}
            className="sm:flex-1"
          >
            <Button className="w-full">Book Installation</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
