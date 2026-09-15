import { Keybed } from "@/components/brand/keybed";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

/**
 * Product demo video section for the welcome page.
 *
 * Renders the shipped Workshop demo with visible native controls — no
 * autoplay, so no reduced-motion path is needed (WCAG 2.2.2). The video sits
 * on a small "stage": raised frame, keybed along the bottom edge.
 */
export function DemoVideoSection() {
  const { config } = useWelcomeConfig();
  const demo = config.demoVideo;
  if (!demo.videoSrc) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-center lg:gap-14 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-heading text-sm font-semibold text-primary">
              {demo.number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {demo.label}
            </span>
          </div>
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {demo.title}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
            {demo.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-raised sm:p-3">
          <video
            className="aspect-[16/10] w-full rounded-2xl border border-border bg-background"
            src={demo.videoSrc}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={demo.videoLabel}
          />
          <Keybed octaves={6} className="mt-2 h-6 w-full rounded-b-2xl sm:mt-3 sm:h-8" />
        </div>
      </div>
    </section>
  );
}
