# wire-tool-videos — phase summary

Agent-Id: 070a69c5-e4cb-4808-a195-427076c7cf74

Wired the five published demo videos into their tool pages via a small
shared primitive.

## Files
- `lib/demo-videos.ts` — typed registry: tool href → { mp4, title,
  ariaLabel } for /tools/chord-drill, /tools/arpeggios,
  /tools/root-cycling, /tools/progression, /tools/workshop.
  Beginner-first copy, no hype. Welcome page (`/demo-web2.mp4`) untouched.
- `components/drills/tool-demo-video.tsx` — client component: collapsed
  `<details>` ("Watch the demo") expanding to
  `<video controls muted playsInline preload="metadata">` with
  aria-label from the registry, `aspect-[16/10] w-full`, theme tokens
  only, no autoplay.
- Five one-line mounts in `app/tools/{chord-drill,arpeggios,root-cycling,
  progression,workshop}/page.tsx`, below the main drill card (workshop:
  bottom of page content so the collapsed details stays clear of the
  editor grid).
- `lib/__tests__/demo-videos.test.ts` — every registry entry maps to an
  existing file in `public/` (fs check), href under /tools/, non-empty
  title/ariaLabel.

## Verification
- vitest `lib/__tests__/demo-videos.test.ts`: 3 passed.
- Dev server curl on ports 3002/3004: all five pages render
  `Watch the demo` summary + `<video … controls muted playsInline
  preload="metadata" aria-label=…>` with the correct mp4 src.
- `npm run lint`: 0 errors (12 pre-existing warnings).
- `npm run test:unit:run`: 145 files / 1337 tests passed.
- `npm run build`: exit 0.
- Axe gate `npx playwright test e2e/a11y.spec.ts` (E2E_PORT=3004):
  4 passed — /tools/workshop, /tools/workshop/blocks, /marketplace
  report zero serious/critical violations.

## Tooling notes
- Shared `node_modules` was missing `@axe-core/playwright` (declared in
  package.json/lockfile). Ran incremental `npm install` — lockfile
  unchanged — then the axe gate ran green.
- First post-install dev-server runs hit a stale Turbopack
  `.next` cache ("Could not find module … React Client Manifest");
  cleared `.next` and let Playwright's webServer spawn a fresh server.
