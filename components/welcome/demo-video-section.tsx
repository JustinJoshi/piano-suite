import { KeybedStrip } from "@/components/brand/keybed-strip";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { MovementMark } from "./movement-mark";

/**
 * Keep a number glued to the word it's hyphenated to ("46-second"), so a
 * narrow column never strands "46-" at the end of a line.
 */
function keepNumbersTogether(text: string) {
  return text.split(/(\d+-[A-Za-z]+)/).map((part, index) =>
    /^\d+-[A-Za-z]+$/.test(part) ? (
      <span key={index} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    )
  );
}

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
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,25rem)_1fr] lg:items-center lg:gap-14 lg:px-8">
        <div>
          <MovementMark number={demo.number} label={demo.label} />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {keepNumbersTogether(demo.title)}
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
            {demo.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-raised sm:p-3">
          {/* A music-stand lamp: a soft warm pool on the frame's top edge. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-12 -top-10 h-20 rounded-full bg-primary/12 blur-2xl"
          />
          <video
            className="relative aspect-[16/10] w-full rounded-2xl border border-border bg-background"
            src={demo.videoSrc}
            controls
            muted
            playsInline
            preload="metadata"
            aria-label={demo.videoLabel}
          />
          <div className="mt-2 overflow-hidden rounded-b-2xl rounded-t-sm sm:mt-3">
            <KeybedStrip keyWidth={15} className="h-6 sm:h-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
