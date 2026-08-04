# Piano Suite

**A free practice community for self-taught pianists.**

Piano Suite is a welcoming place for anyone learning piano on their own. Whether you just bought your first MIDI keyboard or you are rebuilding your practice routine, the goal here is simple: give you the tools, guidance, and community support to learn piano in a healthy, sustainable way — without paying for expensive lessons.

The core experience is free and runs in your browser. Sign in to sync progress across devices, or practice locally without an account.

## What you get

- **A friendly first-time onboarding** that introduces the pillars of healthy piano learning: active recall & spaced repetition, taking care of your hands, and managing practice frustration with focused/diffuse thinking.
- **Practice tools** ported from real self-taught routines: Chord Drill, Arpeggios, Progressions, Root Cycling, Technique tracking, and Visualization Labs.
- **Evidence-based articles** that explain *how* to practice, not just *what* to play.
- **Progress tracking** so you can see improvement over time.
- **A community direction**: the project is open source and built in public. Questions, feedback, and contributions are welcome.

## Who this is for

- Complete beginners teaching themselves piano.
- Self-taught pianists who want a structured, research-backed practice loop.
- Anyone who wants to avoid injury, burnout, and ineffective cramming.

## Our philosophy

- **Free core.** The practice tools, articles, and local progress tracking are free. Paid features only cover things that cost real money to run, like cross-device sync.
- **Healthy practice.** Learning piano is as much about resting, stretching, and thinking clearly as it is about drilling.
- **Community-driven.** Piano Suite is built in the open. The best way to improve it is to learn alongside other self-taught pianists.

## Getting started

1. Clone the repo:
   ```bash
   git clone https://github.com/JustinJoshi/piano-suite.git
   cd piano-suite
   ```
2. Copy the environment template and fill in the required credentials:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Convex dev server:
   ```bash
   npx convex dev
   ```
5. In another terminal, start Next.js:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000).

For full setup details, deployment notes, and the technical history of the project, see [`docs/PROJECT_HISTORY.md`](docs/PROJECT_HISTORY.md).

## Contributing

The project is open source under the MIT license. If you are learning piano too, your perspective matters. Open an issue, suggest a feature, or submit a PR.

## License

MIT
