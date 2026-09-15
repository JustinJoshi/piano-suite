import Link from "next/link";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Keybed } from "@/components/brand/keybed";

/**
 * Shared stage for the Clerk sign-in / sign-up pages: brand mark, a short
 * line of copy, staff lines, and a keybed along the bottom edge. Clerk's
 * component itself is themed through `@clerk/ui/themes/shadcn.css`, which
 * reads the same tokens as the rest of the app.
 */
export function AuthStage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        aria-hidden="true"
        className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--primary-glow),transparent_65%)] opacity-30"
      />
      <header className="relative z-10 flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <AppliedLogoMark className="h-5 w-5" title="Piano Suite" />
          </span>
          <span className="font-heading text-base font-semibold tracking-tight text-foreground">
            Piano Suite
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-16">
        <div className="text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        {children}
      </main>

      <Keybed
        octaves={7}
        lit={[0, 4, 7, 11]}
        className="relative z-10 h-10 w-full opacity-90"
      />
    </div>
  );
}
