import { chromium } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import fs from "node:fs";

// Unique test user per run (same pattern as e2e/global.setup.ts).
const email = (process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com")
  .replace("@", `+pg${Date.now()}@`);
const password = process.env.E2E_CLERK_USER_PASSWORD;
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
await client.users.createUser({ emailAddress: [email], password, firstName: "Demo", lastName: "User" });
console.log("created user:", email);

const OUT = process.env.HOME + "/piano-content/public/footage-progression";
const BASE = process.env.BASE_URL ?? "http://localhost:3002";
fs.mkdirSync(OUT, { recursive: true });

// Mock Web MIDI: one fake input. The app calls requestMIDIAccess on connect;
// we stash the input on window so the capture can send note-on/off events.
const MOCK_MIDI = `
  (() => {
    const listeners = { onmidimessage: null };
    const input = {
      id: "mock-keys", name: "Demo Keyboard", manufacturer: "Mock",
      state: "connected", type: "input", connection: "open",
      get onmidimessage() { return listeners.onmidimessage; },
      set onmidimessage(fn) { listeners.onmidimessage = fn; },
      open: () => Promise.resolve(), close: () => Promise.resolve(),
      addEventListener: () => {}, removeEventListener: () => {},
    };
    const access = {
      inputs: new Map([["mock-keys", input]]),
      outputs: new Map(),
      onstatechange: null,
      sysexEnabled: false,
    };
    Object.defineProperty(navigator, "requestMIDIAccess", {
      value: () => Promise.resolve(access),
      configurable: true,
    });
    window.__mockMidiInput = input;
    window.__mockNoteOn = (note, vel = 100) => {
      const fn = listeners.onmidimessage;
      if (fn) fn({ data: new Uint8Array([0x90, note, vel]) });
    };
    window.__mockNoteOff = (note) => {
      const fn = listeners.onmidimessage;
      if (fn) fn({ data: new Uint8Array([0x80, note, 0]) });
    };
  })();
`;

const browser = await chromium.launch();
await clerkSetup();

const newPage = async (record = true) => {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: record ? { dir: OUT, size: { width: 1440, height: 900 } } : undefined,
  });
  const p = await ctx.newPage();
  await p.addInitScript(MOCK_MIDI);
  await setupClerkTestingToken({ page: p });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await clerk.signIn({ page: p, emailAddress: email, password });
  await p.waitForFunction(() => window.Clerk?.user !== null, { timeout: 20000 });
  await p.evaluate(() => localStorage.setItem("piano-suite:onboarding-completed", "true"));
  return { ctx, p };
};

// SHOT=<name> re-runs a single shot (settings-restore beat always available).
const ONLY = process.env.SHOT;

const shoot = async (name, fn) => {
  if (ONLY && name !== ONLY) return;
  const { ctx, p } = await newPage();
  try {
    await fn(p);
    console.log("ok:", name);
  } catch (e) {
    console.error("FAIL:", name, e.message);
  }
  await ctx.close(); // flushes the video file
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Warm-up context (unrecorded): compiles /tools/progression so the recorded
// contexts don't spend their first seconds cold-compiling.
{
  const { ctx, p } = await newPage(false);
  try {
    await p.goto(BASE + "/tools/progression", { waitUntil: "networkidle", timeout: 120000 });
    await p.waitForSelector('[data-testid="progression-drill"]', { timeout: 60000 });
    console.log("ok: warmup");
  } catch (e) {
    console.error("FAIL: warmup", e.message);
  }
  await ctx.close();
}

const openDrill = async (p) => {
  await p.goto(BASE + "/tools/progression", { waitUntil: "networkidle" });
  await p.waitForSelector('[data-testid="progression-drill"]', { timeout: 60000 });
  await sleep(3000); // settings load from Convex, page settles
};

const restoreDefaults = async (p) => {
  // Settings persist per Convex user across shots; keep every shot on the
  // default ii-V-I in C unless the shot itself changes them.
  await p.getByTestId("progression-type-ii-V-I").click();
  await sleep(400);
  await p.getByTestId("progression-key-C").click();
  await sleep(800);
};

const scrollToShow = async (p, testid) => {
  await p.evaluate((tid) => {
    const el = document.querySelector(`[data-testid="${tid}"]`);
    if (el) el.scrollIntoView({ block: "center" });
  }, testid);
  await sleep(1200);
};

const connectMidi = async (p) => {
  await p.getByTestId("connect-midi-btn").click();
  await sleep(1500);
};

// Quality tone maps (semitones above the root). Progression uses these three.
const TONES = {
  m7: [0, 3, 7, 10],
  7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
};
const PC = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

// Parse "Dm7" / "G7" / "Cmaj7" -> pitch classes to hold for an exact match.
const chordPcs = (symbol) => {
  const m = symbol.match(/^(.*?)(maj7|m7|7)$/);
  const root = PC[m[1].trim()] ?? 0;
  return TONES[m[2]].map((iv) => (root + iv) % 12);
};

// Read the current chord prompt and hold its exact pitch classes.
const playCurrent = async (p, holdMs = 1000) => {
  const symbol = await p.evaluate(
    () => document.querySelector('[data-testid="progression-current-chord"]')?.textContent?.trim() ?? "Cmaj7"
  );
  const chord = chordPcs(symbol).map((c) => 60 + c);
  console.log("playing", symbol, chord.join(","));
  await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOn(n)), chord);
  await sleep(holdMs);
  await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOff(n)), chord);
  await sleep(400); // full release registers before the next timing phase
};

// ---- Beat 1: intro — ii-V-I in C at rest, prompt card visible ----
await shoot("drill-intro", async (p) => {
  await openDrill(p);
  await restoreDefaults(p);
  await scrollToShow(p, "progression-current-chord");
  await sleep(7000);
});

// ---- Beat 2: run the loop — start, Dm7 -> G7 -> Cmaj7, loop 1 completes ----
await shoot("drill-loop", async (p) => {
  await openDrill(p);
  await restoreDefaults(p);
  await scrollToShow(p, "progression-current-chord");
  await connectMidi(p);
  await sleep(1000);
  await p.getByTestId("start-drill-btn").click();
  await sleep(2000); // timing phase, live timer running on the first chord
  // Loop 1: Dm7, G7, Cmaj7 — each graded, hands lifted between chords.
  await playCurrent(p);
  await sleep(1500); // "✓ Nice" flash, next chord armed
  await playCurrent(p);
  await sleep(1500);
  await playCurrent(p); // last step: finishLoop -> loop counter 1, loop chime
  await sleep(2500); // armed for loop 2
  await playCurrent(p); // loop 2 begins, Step resets to 1 / 3
  await sleep(4000); // timer running on the repeat loop
});

// ---- Beat 3: 12-bar blues — type switch, step strip grows to 12 bars ----
await shoot("drill-blues", async (p) => {
  await openDrill(p);
  await scrollToShow(p, "progression-current-chord");
  await p.getByTestId("progression-type-blues12").click();
  await sleep(2500); // 12-bar strip visible, C7 prompt, idle
  await connectMidi(p);
  await sleep(1000);
  await p.getByTestId("start-drill-btn").click();
  await sleep(1800); // timing on bar 1
  await playCurrent(p); // bar 1: C7
  await sleep(1300);
  await playCurrent(p); // bar 2: C7 again (blues is I I I I at the top)
  await sleep(1300);
  await playCurrent(p); // bar 3: C7 — strip advances 3 / 12
  await sleep(2500); // timer running on bar 4
});

// ---- Beat 4: key change — move to G, back to ii-V-I, numerals follow ----
await shoot("drill-keys", async (p) => {
  await openDrill(p);
  await scrollToShow(p, "progression-current-chord");
  await p.getByTestId("progression-type-ii-V-I").click();
  await sleep(1200);
  await p.getByTestId("progression-key-G").click();
  await sleep(2500); // Am7 / D7 / Gmaj7 strip, Gmaj7 prompt (phase idle resets to step 0)
  await connectMidi(p);
  await sleep(1000);
  await p.getByTestId("start-drill-btn").click();
  await sleep(1800);
  await playCurrent(p); // Am7
  await sleep(1800); // timer running on D7
});

// ---- Beat 5: personal bests — a resource that fills as soon as a loop is ----
// ---- completed, so the beat plays a live loop before settling on the card ----
await shoot("drill-stats", async (p) => {
  await openDrill(p);
  await restoreDefaults(p); // stats card is per type·key: back to ii-V-I · C
  await connectMidi(p);
  await sleep(1000);
  await p.getByTestId("start-drill-btn").click();
  await sleep(1500);
  await playCurrent(p); // Dm7
  await sleep(1300);
  await playCurrent(p); // G7
  await sleep(1300);
  await playCurrent(p); // Cmaj7 -> finishLoop writes personal bests
  await sleep(2500);
  await scrollToShow(p, "reset-stats-btn");
  await sleep(12000); // bests card settles (closing script line hosts this clip)
});

await browser.close();
console.log("done");
