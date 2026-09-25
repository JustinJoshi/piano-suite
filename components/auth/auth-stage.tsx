import Link from "next/link";

/**
 * Clerk appearance for the auth pages. The shadcn theme fills Clerk's
 * primary button with `--primary` (the brand hue); in this app a button you
 * press is the *action* colour — ivory on a dark stage, ebony on Ivory — so
 * the Continue button reads as the same piano key as every other CTA.
 * Trailing `!` beats Clerk's unlayered CSS-in-JS.
 */
export const authAppearance = {
  elements: {
    formButtonPrimary:
      "bg-action! bg-none! text-action-foreground! shadow-key! hover:bg-action-hover! key-press",
  },
};

/**
 * Shared stage for the Clerk sign-in / sign-up pages: the dark case of the
 * instrument, the wordmark, a line of copy, Clerk's card laid on it like a
 * sheet of roll paper, and the key slip's red felt along the bottom. Clerk
 * reads the roll's tokens through `@clerk/ui/themes/shadcn.css`.
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
    <div className="tone-roll roll-case roll-auth roll-on-case">
      <header className="roll-sheet roll-auth-top">
        <Link href="/" className="roll-wordmark" aria-label="Piano Suite home">
          <span className="roll-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Piano Suite</span>
        </Link>
      </header>
      <main id="main-content" tabIndex={-1} className="roll-auth-main outline-none">
        <div>
          <p className="roll-label">{eyebrow}</p>
          <h1 className="roll-auth-title">{title}</h1>
        </div>
        {children}
      </main>
      <div className="roll-felt" aria-hidden="true" />
    </div>
  );
}
