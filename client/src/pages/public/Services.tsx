import { Link } from "react-router-dom";
import { CalendarClock, Clock3 } from "lucide-react";
import { Button } from "../../components/ui";
import { BUSINESS_NAME, HOURS_SUMMARY, PHONE, SERVICES, SHOP_IMAGES } from "../../lib/constants";

export default function Services() {
  return (
    <div>
      <section className="relative isolate overflow-hidden text-white">
        <img
          src={SHOP_IMAGES.serviceBay}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-brand/85" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Services</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
            Dependable tire service in Minneapolis
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            {BUSINESS_NAME} helps with installs, repairs, rotations, balancing, and inspections —
            with clear communication and fair pricing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book">
              <Button>
                <CalendarClock className="h-4 w-4" />
                Book Service
              </Button>
            </Link>
            <a href={PHONE.href}>
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                Call {PHONE.display}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-accent-dark">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Same-day tire help is available <strong>during business hours</strong> when our schedule
            allows ({HOURS_SUMMARY}). We do not offer 24/7 emergency service.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((svc, i) => (
            <article
              key={svc.id}
              className={`rounded-lg border border-slate/10 bg-white p-6 shadow-sm animate-fade-up delay-${(i % 3) + 1}`}
            >
              <h2 className="font-display text-2xl font-bold tracking-wide">{svc.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{svc.description}</p>
              <Link
                to={`/book?service=${encodeURIComponent(
                  svc.name === "Same-Day Tire Help" ? "Other" : svc.name
                )}`}
                className="mt-5 inline-flex"
              >
                <Button variant="outline">Book this service</Button>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
