import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../../api";
import { Button, Input, Loading, Select, StatusBadge, money } from "../../components/ui";
import {
  ASPECTS,
  DIAMETERS,
  SEASONS,
  TIRE_TYPES,
  WIDTHS,
  type Tire,
} from "../../lib/constants";

export default function Tires() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      width: searchParams.get("width") || "",
      aspectRatio: searchParams.get("aspectRatio") || "",
      diameter: searchParams.get("diameter") || "",
      season: searchParams.get("season") || "",
      type: searchParams.get("type") || "",
      brand: searchParams.get("brand") || searchParams.get("q") || "",
    }),
    [searchParams]
  );

  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams();
        if (filters.width) qs.set("width", filters.width);
        if (filters.aspectRatio) qs.set("aspectRatio", filters.aspectRatio);
        if (filters.diameter) qs.set("diameter", filters.diameter);
        if (filters.season) qs.set("season", filters.season);
        if (filters.type) qs.set("type", filters.type);
        if (filters.brand) qs.set("q", filters.brand);
        const data = await api<Tire[]>(`/tires?${qs.toString()}`);
        if (!cancelled) setTires(data);
      } catch (err) {
        if (!cancelled) {
          setTires([]);
          setError(err instanceof Error ? err.message : "Unable to load tires");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (draft.width) next.set("width", draft.width);
    if (draft.aspectRatio) next.set("aspectRatio", draft.aspectRatio);
    if (draft.diameter) next.set("diameter", draft.diameter);
    if (draft.season) next.set("season", draft.season);
    if (draft.type) next.set("type", draft.type);
    if (draft.brand.trim()) next.set("q", draft.brand.trim());
    setSearchParams(next);
  }

  function clearFilters() {
    setDraft({ width: "", aspectRatio: "", diameter: "", season: "", type: "", brand: "" });
    setSearchParams({});
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-14">
      <div className="max-w-2xl animate-fade-up">
        <h1 className="font-display text-4xl font-extrabold tracking-wide sm:text-5xl">Shop Tires</h1>
        <p className="mt-3 text-muted">
          Search by size, season, type, or brand. Demo inventory — prices and stock update from the shop CRM.
        </p>
      </div>

      <form
        onSubmit={applyFilters}
        className="mt-8 grid gap-3 rounded-lg border border-slate/10 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <Select
          label="Width"
          value={draft.width}
          onChange={(e) => setDraft((d) => ({ ...d, width: e.target.value }))}
        >
          <option value="">Any</option>
          {WIDTHS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Select>
        <Select
          label="Aspect"
          value={draft.aspectRatio}
          onChange={(e) => setDraft((d) => ({ ...d, aspectRatio: e.target.value }))}
        >
          <option value="">Any</option>
          {ASPECTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select
          label="Diameter"
          value={draft.diameter}
          onChange={(e) => setDraft((d) => ({ ...d, diameter: e.target.value }))}
        >
          <option value="">Any</option>
          {DIAMETERS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select
          label="Season"
          value={draft.season}
          onChange={(e) => setDraft((d) => ({ ...d, season: e.target.value }))}
        >
          <option value="">Any</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          label="Type"
          value={draft.type}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
        >
          <option value="">Any</option>
          {TIRE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Input
          label="Brand / search"
          placeholder="Michelin, 225/65…"
          value={draft.brand}
          onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
        />
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-6">
          <Button type="submit">
            <Search className="h-4 w-4" />
            Search Tires
          </Button>
          <Button type="button" variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </form>

      {loading ? (
        <Loading label="Searching inventory..." />
      ) : error ? (
        <p className="mt-10 text-sm text-danger">{error}</p>
      ) : tires.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-slate/20 bg-white px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">No tires matched</p>
          <p className="mt-2 text-sm text-muted">Try a different size or clear your filters.</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            Showing {tires.length} tire{tires.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tires.map((tire) => (
              <article
                key={tire.id}
                className="flex flex-col rounded-lg border border-slate/10 bg-white p-5 shadow-sm animate-fade-up"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tire.brand}</p>
                    <h2 className="font-display text-2xl font-bold tracking-wide">{tire.model}</h2>
                  </div>
                  <StatusBadge status={tire.stockStatus} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Size</dt>
                    <dd className="font-semibold">{tire.size}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Type</dt>
                    <dd className="font-semibold">{tire.type}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Season</dt>
                    <dd className="font-semibold">{tire.season}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Price</dt>
                    <dd className="font-display text-xl font-bold text-accent">{money(tire.price)}</dd>
                  </div>
                </dl>
                {tire.warranty && (
                  <p className="mt-3 text-xs text-muted">Warranty: {tire.warranty}</p>
                )}
                <div className="mt-auto grid gap-2 pt-5">
                  <Link to={`/tires/${tire.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link
                    to={`/quote?tireSize=${encodeURIComponent(tire.size)}&brand=${encodeURIComponent(tire.brand)}`}
                  >
                    <Button variant="secondary" className="w-full">
                      Request Quote
                    </Button>
                  </Link>
                  <Link
                    to={`/book?service=${encodeURIComponent("Tire Installation")}&tireSize=${encodeURIComponent(tire.size)}`}
                  >
                    <Button className="w-full">Book Installation</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
