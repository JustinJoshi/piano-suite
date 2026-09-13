import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

/**
 * Product demo video section for the welcome page.
 *
 * Renders the shipped Workshop demo (`/demo-web2.mp4`) with visible native
 * controls — no autoplay, so no reduced-motion path is needed (WCAG 2.2.2).
 * All copy comes from the welcome config.
 */
export function DemoVideoSection() {
  const { config } = useWelcomeConfig();
  const demo = config.demoVideo;
  if (!demo.videoSrc) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {demo.number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {demo.label}
            </span>
          </div>
          <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {demo.title}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {demo.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <video
            className="mt-6 aspect-[16/10] w-full rounded-xl border border-border bg-background"
            src={demo.videoSrc}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={demo.videoLabel}
          />
        </div>
      </div>
    </section>
  );
}
