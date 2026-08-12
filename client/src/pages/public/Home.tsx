import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CircleDot,
  MapPin,
  Phone,
  Quote as QuoteIcon,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { api } from "../../api";
import { Button, Loading, Select, StatusBadge, money } from "../../components/ui";
import {
  ADDRESS,
  ASPECTS,
  BUSINESS_NAME,
  DIAMETERS,
  GALLERY,
  MICHAEL_REVIEW,
  PHONE,
  QUICK_SERVICES,
  SHOP_IMAGES,
  WIDTHS,
  type Tire,
} from "../../lib/constants";

export default function Home() {
  const navigate = useNavigate();
  const [width, setWidth] = useState("225");
  const [aspect, setAspect] = useState("65");
  const [diameter, setDiameter] = useState("17");
  const [featured, setFeatured] = useState<Tire[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Tire[]>("/tires?width=225&aspectRatio=65&diameter=17");
        if (!cancelled) setFeatured(data.slice(0, 4));
      } catch {
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoadingFeatured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onFindTires(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      width,
      aspectRatio: aspect,
      diameter,
    });
    navigate(`/tires?${params.toString()}`);
  }

  return (
    <div>
      <section className="relative isolate min-h-[88vh] overflow-hidden text-white">
        <img
          src={SHOP_IMAGES.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,58,116,0.92)_0%,rgba(11,79,156,0.78)_48%,rgba(15,23,32,0.55)_100%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-20 lg:px-6">
          <p className="animate-fade-up font-display text-3xl font-extrabold uppercase tracking-wide text-accent sm:text-4xl md:text-5xl">
            {BUSINESS_NAME}
          </p>
          <h1 className="animate-fade-up delay-1 mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[0.95] tracking-wide sm:text-5xl md:text-6xl">
            Quality Tires. Fair Prices. Fast Service.
          </h1>
          <p className="animate-fade-up delay-2 mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Tires & More For Less is your local Minneapolis tire shop for quality tires, affordable
            pricing, and dependable tire service.
          </p>
          <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
            <Link to="/tires">
              <Button className="px-6 py-3 text-base">Shop Tires</Button>
            </Link>
            <Link to="/book">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20"
              >
                Book Tire Service
              </Button>
            </Link>
          </div>
          <div className="animate-fade-up delay-3 mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
            <a href={PHONE.href} className="inline-flex items-center gap-2 font-semibold text-white hover:text-accent">
              <Phone className="h-4 w-4 text-accent" />
              Call {PHONE.display}
            </a>
            <p className="inline-flex items-start gap-2 text-white/80 sm:items-center">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent sm:mt-0" />
              {ADDRESS.short}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-wide sm:text-4xl">Quick Services</h2>
          <p className="mt-2 text-muted">
            New & used tires, installs, repairs, rotations — and more at 1708 Central Ave NE.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_SERVICES.map((svc, i) => (
            <Link
              key={svc.name}
              to={svc.href}
              className={`group rounded-lg border border-slate/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md animate-fade-up delay-${(i % 3) + 1}`}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent-soft text-brand">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-wide group-hover:text-brand">
                {svc.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{svc.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                Learn more <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-wide sm:text-4xl">Find Your Tire Size</h2>
              <p className="mt-2 max-w-xl text-muted">
                Enter your width, aspect ratio, and wheel diameter to browse matching tires in our
                inventory.
              </p>
              <form onSubmit={onFindTires} className="mt-8 grid gap-4 sm:grid-cols-3">
                <Select label="Width" value={width} onChange={(e) => setWidth(e.target.value)} required>
                  {WIDTHS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
                <Select label="Aspect Ratio" value={aspect} onChange={(e) => setAspect(e.target.value)} required>
                  {ASPECTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
                <Select label="Wheel Diameter" value={diameter} onChange={(e) => setDiameter(e.target.value)} required>
                  {DIAMETERS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
                <div className="sm:col-span-3">
                  <Button type="submit" className="w-full sm:w-auto">
                    <CircleDot className="h-4 w-4" />
                    Find Tires
                  </Button>
                </div>
              </form>
            </div>
            <div className="overflow-hidden rounded-lg">
              <img
                src={SHOP_IMAGES.rims}
                alt="Custom wheels and Bridgestone tires in the showroom"
                className="h-72 w-full object-cover sm:h-80"
              />
              <div className="bg-brand p-6 text-white">
                <ShieldCheck className="h-7 w-7 text-accent" />
                <h3 className="mt-3 font-display text-2xl font-bold tracking-wide">
                  New & used tires and rims in stock
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Not sure about your size? Call or stop by with your vehicle — we’ll match you up and
                  get installation scheduled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-wide sm:text-4xl">
              Featured: 225/65R17
            </h2>
            <p className="mt-2 text-muted">Popular sizes ready for Minneapolis drivers.</p>
          </div>
          <Link
            to="/tires?width=225&aspectRatio=65&diameter=17"
            className="text-sm font-semibold text-brand hover:underline"
          >
            View all matches
          </Link>
        </div>
        {loadingFeatured ? (
          <Loading label="Loading featured tires..." />
        ) : featured.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No featured tires available right now. Browse the full inventory.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((tire) => (
              <article
                key={tire.id}
                className="flex flex-col rounded-lg border border-slate/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{tire.brand}</p>
                    <h3 className="font-display text-xl font-bold tracking-wide">{tire.model}</h3>
                  </div>
                  <StatusBadge status={tire.stockStatus} />
                </div>
                <p className="mt-3 text-sm text-muted">
                  {tire.size} · {tire.type} · {tire.season}
                </p>
                <p className="mt-4 font-display text-2xl font-bold text-ink">{money(tire.price)}</p>
                {tire.warranty && <p className="mt-1 text-xs text-muted">{tire.warranty}</p>}
                <div className="mt-auto flex flex-col gap-2 pt-5">
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-brand text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-wide sm:text-4xl">Inside the shop</h2>
            <p className="mt-2 text-white/75">
              Real photos from our showroom and service bays at 1708 Central Ave NE.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.slice(0, 6).map((img, i) => (
              <figure
                key={img.src}
                className={`overflow-hidden rounded-lg ${i === 0 ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className={`w-full object-cover transition duration-500 hover:scale-[1.03] ${
                    i === 0 ? "h-64 sm:h-full min-h-[16rem]" : "h-52 sm:h-56"
                  }`}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Customer Story</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-wide sm:text-4xl">
                Real help when other shops said no
              </h2>
              <Link to="/reviews" className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline">
                Read the full review
              </Link>
            </div>
            <blockquote className="rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8">
              <QuoteIcon className="h-6 w-6 text-accent" />
              <p className="mt-4 text-base leading-relaxed text-white/85">
                “{MICHAEL_REVIEW.body.slice(0, 280)}…”
              </p>
              <footer className="mt-6">
                <p className="font-semibold">{MICHAEL_REVIEW.name}</p>
                <p className="text-sm text-white/55">
                  Service: {MICHAEL_REVIEW.service} · Price: {MICHAEL_REVIEW.price}
                </p>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-8 overflow-hidden rounded-lg lg:grid-cols-2">
          <img
            src={SHOP_IMAGES.serviceBay}
            alt="Service bay with a truck on the lift at Tires & More For Less"
            className="h-72 w-full object-cover lg:h-full"
          />
          <div className="flex flex-col justify-center bg-white p-6 sm:p-10">
            <h2 className="font-display text-3xl font-bold tracking-wide sm:text-4xl">
              Your local Minneapolis tire shop
            </h2>
            <p className="mt-3 text-muted leading-relaxed">
              At {BUSINESS_NAME}, we focus on fair pricing, helpful service, and tire expertise for
              drivers across Minneapolis — plus rims, installs, and the services you see on our
              windows every day.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/about">
                <Button variant="secondary">About us</Button>
              </Link>
              <Link to="/contact">
                <Button>Contact Us</Button>
              </Link>
              <a href={PHONE.href}>
                <Button variant="outline">Call Now</Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
