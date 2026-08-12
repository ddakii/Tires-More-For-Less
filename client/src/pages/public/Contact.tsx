import { Link } from "react-router-dom";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "../../components/ui";
import {
  ADDRESS,
  BUSINESS_NAME,
  HOURS,
  MAPS,
  PHONE,
  SHOP_IMAGES,
} from "../../lib/constants";

export default function Contact() {
  return (
    <div>
      <section className="relative isolate overflow-hidden text-white">
        <img
          src={SHOP_IMAGES.storefront}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-brand/80" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
            Visit {BUSINESS_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            Stop by the shop, call during business hours, or request service online.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="mb-8 overflow-hidden rounded-lg">
          <img
            src={SHOP_IMAGES.hero}
            alt="Exterior of Tires & More For Less at 1708 Central Ave NE"
            className="h-56 w-full object-cover sm:h-72"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="animate-fade-up space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide">{BUSINESS_NAME}</h2>
              <p className="mt-3 flex gap-2 text-sm leading-relaxed text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>
                  {ADDRESS.line1}
                  <br />
                  {ADDRESS.city}, {ADDRESS.state} {ADDRESS.zip}
                  <br />
                  {ADDRESS.country}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Phone</p>
              <a
                href={PHONE.href}
                className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-ink hover:text-brand"
              >
                <Phone className="h-5 w-5 text-brand" />
                {PHONE.display}
              </a>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Hours</p>
              <ul className="mt-3 max-w-sm space-y-2 text-sm">
                {HOURS.map((h) => (
                  <li key={h.label} className="flex justify-between gap-6 border-b border-fog py-2">
                    <span className="font-medium">{h.label}</span>
                    <span className="text-muted">{h.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={MAPS.directions} target="_blank" rel="noreferrer">
                <Button>
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
              </a>
              <a href={PHONE.href}>
                <Button variant="secondary">
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
              </a>
              <Link to="/book">
                <Button variant="outline">Book Service</Button>
              </Link>
            </div>
          </div>

          <div className="animate-fade-up delay-1 overflow-hidden rounded-lg border border-slate/10 bg-white shadow-sm">
            <iframe
              title={`Map to ${BUSINESS_NAME}`}
              src={MAPS.embed}
              className="h-[360px] w-full border-0 lg:h-full lg:min-h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
