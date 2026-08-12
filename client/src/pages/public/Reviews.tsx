import { Quote as QuoteIcon, Star } from "lucide-react";
import { MICHAEL_REVIEW } from "../../lib/constants";

export default function Reviews() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6 lg:py-14">
      <div className="animate-fade-up text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Reviews</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-wide sm:text-5xl">
          Customer feedback
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          We only publish reviews we can verify for this business. Currently featuring one customer
          story.
        </p>
      </div>

      <article className="mt-10 animate-fade-up delay-1 overflow-hidden rounded-lg border border-slate/10 bg-white shadow-sm">
        <div className="border-b border-fog bg-ink px-6 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-wide">{MICHAEL_REVIEW.name}</h2>
              <p className="mt-1 text-sm text-white/65">
                Service: {MICHAEL_REVIEW.service} · Price: {MICHAEL_REVIEW.price}
              </p>
            </div>
            <div className="flex gap-1 text-accent" aria-label="5 star feedback">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent" />
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-8 sm:px-8">
          <QuoteIcon className="h-7 w-7 text-accent" />
          <p className="mt-4 text-base leading-relaxed text-ink/90 whitespace-pre-wrap">
            “{MICHAEL_REVIEW.body}”
          </p>
        </div>
      </article>
    </div>
  );
}
