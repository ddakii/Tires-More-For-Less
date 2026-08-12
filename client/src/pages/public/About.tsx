import { Link } from "react-router-dom";
import { Quote as QuoteIcon } from "lucide-react";
import { Button } from "../../components/ui";
import { ADDRESS, BUSINESS_NAME, GALLERY, MICHAEL_REVIEW, PHONE, SHOP_IMAGES } from "../../lib/constants";

export default function About() {
  return (
    <div>
      <section className="relative isolate overflow-hidden text-white">
        <img
          src={SHOP_IMAGES.showroomWide}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-brand/85" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-14 lg:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">About</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
            Local Minneapolis tire service that puts customers first
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">
            {BUSINESS_NAME} is a tire shop at {ADDRESS.short} focused on fair pricing, helpful
            service, and getting drivers back on the road with the right tires.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <img
            src={SHOP_IMAGES.counter}
            alt="Service counter and tire inventory inside Tires & More For Less"
            className="h-80 w-full rounded-lg object-cover"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Local Minneapolis focus",
                body: "We’re here for drivers in Minneapolis and nearby neighborhoods who need reliable tire work without the big-box runaround.",
              },
              {
                title: "Fair pricing",
                body: "We keep pricing straightforward so you can compare options — new or used — and choose what fits your budget.",
              },
              {
                title: "Helpful customer service",
                body: "Clear answers, practical recommendations, and a team that works to help when timing is tight during business hours.",
              },
              {
                title: "Tire expertise",
                body: "From size matching and installs to rotations, balancing, and flat repairs, we focus on the tire services drivers need most.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-lg border border-slate/10 bg-white p-5 shadow-sm">
                <h2 className="font-display text-xl font-bold tracking-wide">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-wide">Our shop</h2>
            <p className="mt-2 text-muted">Showroom, rims, and service bays — this is the real storefront.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GALLERY.slice(0, 4).map((img) => (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                className="h-48 w-full rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Social proof</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-wide">What customers say</h2>
            <p className="mt-3 text-muted">
              We don’t invent reviews. Here’s feedback from {MICHAEL_REVIEW.name} about the service he
              received.
            </p>
            <Link to="/reviews" className="mt-5 inline-flex text-sm font-semibold text-brand hover:underline">
              View reviews
            </Link>
          </div>
          <blockquote className="rounded-lg border border-slate/10 bg-paper p-6 sm:p-8">
            <QuoteIcon className="h-6 w-6 text-brand" />
            <p className="mt-4 text-sm leading-relaxed text-ink/90 sm:text-base">“{MICHAEL_REVIEW.body}”</p>
            <footer className="mt-6 border-t border-slate/10 pt-4">
              <p className="font-semibold">{MICHAEL_REVIEW.name}</p>
              <p className="text-sm text-muted">
                Service: {MICHAEL_REVIEW.service} · Price: {MICHAEL_REVIEW.price}
              </p>
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 lg:px-6">
        <div className="rounded-lg bg-brand px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-wide">Talk with the shop</h2>
            <p className="mt-2 text-white/85">Call {PHONE.display} or send a message from our contact page.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 sm:mt-0">
            <a href={PHONE.href}>
              <Button>Call Now</Button>
            </a>
            <Link to="/contact">
              <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                Contact
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
