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

Right now this repository contains the foundation of that platform:

- A **Next.js 14+ App Router** application with TypeScript.
- A **Lunar.dev-inspired landing page** that ports the original Reflex Drill EXT welcome content into a polished, modern marketing layout.
- A complete **design system** built on Tailwind CSS, shadcn/ui components, and warm gold/dark tokens carried over from the original styling work.
- Scaffolding for **Clerk authentication**, **Convex data persistence**, and a **Vercel AI SDK** streaming chat endpoint.
- The original Anki deck exports (`chord-symbols-CGDAE.txt` and `chord-symbols-CGDAEno11.txt`) preserved for download.

The actual interactive drills are not migrated yet; this repo establishes the architecture, landing experience, and toolchain first.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Clerk |
| Database | Convex |
| AI / Chat | Vercel AI SDK |
| Icons | Lucide React |
| Fonts | Inter, Fraunces, Geist Mono |

## Getting Started

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   Fill in real Clerk and Convex credentials when you are ready to enable auth and persistence.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Roadmap

- [x] Scaffold Next.js + Tailwind + shadcn/ui
- [x] Port welcome-page content with Lunar-style layout
- [x] Add Clerk and Convex scaffolding
- [x] Add stub AI chat route
- [ ] Wire real Clerk credentials and route protection (`middleware.ts`)
- [ ] Deploy Convex project and connect `NEXT_PUBLIC_CONVEX_URL`
- [ ] Implement real LLM + RAG against article embeddings
- [ ] Migrate chord drill, progression drill, and technique tracker as Next.js routes
- [ ] Add article pages under `/learn/[slug]`
- [ ] Add user dashboard for practice stats and history

## License

MIT
