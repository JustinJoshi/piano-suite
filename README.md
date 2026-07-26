# Piano Suite

A modern, full-stack platform for piano practice, music theory learning, and AI-assisted instruction.

## Purpose

Piano Suite is the next iteration of the Reflex Drill EXT practice tools. The original project was a collection of standalone HTML pages for targeted piano drills—chord recognition, progression fluency, and technique tracking. This repo re-architects those tools into a scalable, cloud-connected application where learners can practice, read articles, chat with an AI music tutor, and track progress across devices.

The goal is to give piano players a single place to:

- **Practice interactively** with Web MIDI and Web Audio drills.
- **Learn music theory** through articles and guided explainers.
- **Get personalized help** from an AI chatbot trained on the site’s own content.
- **Track progress** with saved history, settings, and stats tied to their account.
- **Sync across devices** instead of losing data to browser wipes.

## What it is

This repository now contains:

- A **Next.js 16+ App Router** application with TypeScript.
- A **Lunar.dev-inspired landing page** that ports the original Reflex Drill EXT welcome content into a polished, modern marketing layout.
- A **Vercel-dashboard-inspired Tools hub** (`/tools`) with a sidebar navigation drawn from the original Reflex Drill EXT tabs.
- A migrated **Tracking dashboard** (`/tools/tracking`) ported from Reflex Drill EXT, including:
  - Chord Drill first-chord timing history
  - Arpeggio transition and miss logging
  - Root Cycling recall stats
  - Recharts visualizations with grade colors, redo indicators, and good/hard threshold lines
  - A one-time client-side import for legacy localStorage data from Reflex Drill EXT
- **Clerk authentication** with route protection via `proxy.ts` and shadcn-themed sign-in/sign-up pages.
- **Convex data persistence** for users and tracking events, with Clerk JWT integration.
- A **Vercel AI SDK** streaming chat endpoint stub.
- **Playwright end-to-end tests**, including authenticated flows for the Tools hub and Tracking dashboard.
- The original Anki deck exports (`chord-symbols-CGDAE.txt` and `chord-symbols-CGDAEno11.txt`) preserved for download.

The remaining interactive drills (Chord Drill, Arpeggios, Root Cycling, Progression, Technique) are scaffolded in the Tools hub and will be migrated next.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Convex |
| AI / Chat | Vercel AI SDK |
| Charts | Recharts |
| E2E Tests | Playwright + @clerk/testing |
| Icons | Lucide React |
| Fonts | Inter, Fraunces, Geist Mono |

## Getting Started

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in real credentials:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from [Clerk](https://clerk.dev)
   - `CLERK_FRONTEND_API_URL` (e.g. `https://<your-app>.clerk.accounts.dev`)
   - `NEXT_PUBLIC_CONVEX_URL` from your Convex project

3. Configure Clerk authentication for email and password only:

   - In the Clerk Dashboard, go to **User & Authentication → Email, Phone, Username**.
   - Set **Email address** to **Required**.
   - Set **Phone number** to **Optional** or **Disabled**.
   - Under **Authentication strategies**, enable **Password**.

4. Make sure your Clerk app has a JWT template named `convex` with `aud: "convex"` so Convex can validate Clerk sessions. The template can be created in the Clerk Dashboard under **Sessions → JWT Templates** or via the Clerk Backend API.

5. Install dependencies:

   ```bash
   npm install
   ```

6. Start the Convex dev server:

   ```bash
   npx convex dev
   ```

7. In another terminal, run the Next.js development server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000).

## Testing

End-to-end tests run with Playwright. A deterministic test user is created automatically during global setup.

```bash
# Run all tests
npm run test:e2e

# Run with a single worker (useful for debugging)
npx playwright test --workers=1
```

Test credentials are stored in `.env.local` as `E2E_CLERK_USER_EMAIL` and `E2E_CLERK_USER_PASSWORD`.

## Taskbar launcher

A desktop launcher is included so you can start the dev server from your taskbar or app menu:

- Launcher script: `/home/justin/piano-suite/launch.sh`
- Desktop entry: `~/.local/share/applications/piano-suite.desktop`

Clicking the icon will:

1. Kill any existing dev server already running on port 3000.
2. Start a fresh `npm run dev` instance in the background.
3. Open the app in your default browser once the server is reachable.

To add the launcher to your taskbar:

- **GNOME / Ubuntu**: Open the Activities overview, search for "Piano Suite", right-click the icon, and select **Add to Favorites**.
- **KDE Plasma**: Open the app menu, search for "Piano Suite", right-click, and choose **Add to Panel / Task Manager**.
- **XFCE**: Right-click the panel → **Panel** → **Add New Items** → **Launcher**, then add Piano Suite from the applications list.

If the icon does not appear in the app menu immediately after creation, log out and log back in once to refresh the desktop database.

## Build

```bash
npm run build
```

## Roadmap

- [x] Scaffold Next.js + Tailwind + shadcn/ui
- [x] Port welcome-page content with Lunar-style layout
- [x] Add Clerk authentication and route protection
- [x] Add Convex data persistence and user sync
- [x] Add Vercel AI SDK streaming chat route stub
- [x] Add Vercel-dashboard-style Tools hub with sidebar
- [x] Port Reflex Drill EXT Tracking tab with Recharts visualizations
- [x] Add one-time localStorage import for legacy Reflex Drill EXT data
- [x] Add Playwright E2E tests with authenticated flows
- [ ] Migrate Chord Drill interactive page
- [ ] Migrate Arpeggios interactive page
- [ ] Migrate Root Cycling interactive page
- [ ] Migrate Progression interactive page
- [ ] Migrate Technique habit tracker
- [ ] Add article pages under `/learn/[slug]`
- [ ] Implement real LLM + RAG against article embeddings

## License

MIT
