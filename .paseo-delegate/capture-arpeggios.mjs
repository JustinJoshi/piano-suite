import { chromium } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import fs from "node:fs";

// Unique test user per run (same pattern as e2e/global.setup.ts).
const email = (process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com")
  .replace("@", `+arp${Date.now()}@`);
const password = process.env.E2E_CLERK_USER_PASSWORD;
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
await client.users.createUser({ emailAddress: [email], password, firstName: "Demo", lastName: "User" });
console.log("created user:", email);

const OUT = process.env.HOME + "/piano-content/public/footage-arpeggios";
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

// SHOT=<name> re-runs a single shot (warmup always runs).
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

// Warm-up context (unrecorded): compiles /tools/arpeggios and /tools/tracking
// so the recorded contexts don't spend their first seconds cold-compiling.
{
  const { ctx, p } = await newPage(false);
  try {
    await p.goto(BASE + "/tools/arpeggios", { waitUntil: "networkidle", timeout: 120000 });
    await p.waitForSelector('[data-testid="arpeggios-drill"]', { timeout: 60000 });
    await p.goto(BASE + "/tools/tracking", { waitUntil: "networkidle", timeout: 120000 });
    await p.waitForSelector('[data-testid="tracking-tab-arpeggios"]', { timeout: 60000 });
    console.log("ok: warmup");
  } catch (e) {
    console.error("FAIL: warmup", e.message);
  }
  await ctx.close();
}

// ---- Warm up the drill page in each recorded context, then shoot. ----
const openDrill = async (p) => {
  await p.goto(BASE + "/tools/arpeggios", { waitUntil: "networkidle" });
  await p.waitForSelector('[data-testid="arpeggio-chord-name"]', { timeout: 60000 });
  await sleep(2500); // settings load, drill arms, page settles
};

const connectMidi = async (p) => {
  await p.getByTestId("connect-midi-btn").click();
  await sleep(1500);
};

// Bbm11 cell (the default first chord): LH pedal Bb + F + Ab,
// RH sequence C Db Eb F Ab C Eb (pitch classes 0 1 3 5 8 0 3).
const LH = [70, 65, 68]; // Bb3 F3 Ab3
const SEQ = [72, 73, 75, 77, 80, 84, 87]; // C4 Db4 Eb4 F4 Ab4 C5 Eb5
const OFF_NOTE = 71; // B3 — not part of the cell, counts as a miss

// ---- Beat 1: intro — the drill page at rest, chord armed, LH prompt ----
await shoot("drill-intro", async (p) => {
  await openDrill(p);
  await sleep(7000);
});

// ---- Beat 2: root phase — hold the LH pedal, the sequence wakes up ----
await shoot("drill-root", async (p) => {
  await openDrill(p);
  await connectMidi(p);
  await sleep(2000);
  // Hold the pedal one note at a time so the "Holding:" line fills up.
  for (const n of LH) {
    await p.evaluate((note) => window.__mockNoteOn(note), n);
    await sleep(900);
  }
  await sleep(4500); // sequence phase: first target lit, timer running
});

// ---- Beat 3: sequence phase — play the full 7-note cell, lap completes ----
await shoot("drill-sequence", async (p) => {
  await openDrill(p);
  await connectMidi(p);
  await sleep(1500);
  for (const n of LH) await p.evaluate((note) => window.__mockNoteOn(note), n);
  await sleep(1500); // armed + in sequence, first target shown
  // One full lap, then two notes into the next lap (Laps counter ticks to 1).
  const lap = [...SEQ, ...SEQ.slice(0, 2)];
  for (const n of lap) {
    await p.evaluate((note) => window.__mockNoteOn(note), n);
    await sleep(450);
    await p.evaluate((note) => window.__mockNoteOff(note), n);
    await sleep(550);
  }
  await sleep(5000); // success flash, stats card, recent-history line
});

// ---- Beat 5+6: miss, then filter — wrong note flashes; filtered, it doesn't ----
// One continuous take: the miss happens with the drill card in view, then the
// filter click scrolls to settings, then we scroll back and replay the note.
await shoot("drill-miss-filter", async (p) => {
  await openDrill(p);
  await connectMidi(p);
  await sleep(1500);
  for (const n of LH) await p.evaluate((note) => window.__mockNoteOn(note), n);
  await sleep(1500); // sequence running, first target lit
  // Play the first target (advances the strip), then a wrong note: red flash
  // and the miss counter ticks to 1. B natural is not part of the Bbm11 cell,
  // so it counts as a miss even with auto-filter on.
  await p.evaluate((note) => window.__mockNoteOn(note), SEQ[0]);
  await sleep(500);
  await p.evaluate((note) => window.__mockNoteOff(note), SEQ[0]);
  await sleep(900);
  await p.evaluate((note) => window.__mockNoteOn(note), OFF_NOTE);
  await sleep(500);
  await p.evaluate((note) => window.__mockNoteOff(note), OFF_NOTE);
  await sleep(2500); // miss flash + counter visible at the top of the page
  // Add B to the miss filter (auto-scrolls to the settings card).
  await p.getByTestId("miss-filter-pc-11").click();
  await sleep(1500);
  // Back to the top; replay B: no flash, miss counter unchanged.
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(1200);
  await p.evaluate((note) => window.__mockNoteOn(note), OFF_NOTE);
  await sleep(500);
  await p.evaluate((note) => window.__mockNoteOff(note), OFF_NOTE);
  await sleep(3500);
});

// ---- Beat 5: controls — next chord, restart, customize panel ----
await shoot("drill-controls", async (p) => {
  await openDrill(p);
  await sleep(1500);
  await p.getByTestId("next-chord-btn").click();
  await sleep(3000); // Fm11 armed
  await p.getByTestId("restart-chord-btn").click();
  await sleep(2500);
  await p.getByTestId("customize-sequence-btn").click();
  await sleep(3000); // customize panel with the 12 cells
  await p.getByTestId("customize-sequence-btn").click();
  await sleep(2500);
});

// ---- Beat 6: tracking — seeded multi-day history, Arpeggios tab ----
await shoot("tracking", async (p) => {
  // Seed plausible multi-day arpeggio history (Free tier reads localStorage).
  // Transition labels match the drill: first note after arm is "Root", later
  // notes use the previous degree. Bbm11 gets the most recent entries so it
  // sorts to the top of the transitions list.
  await p.evaluate(() => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const chords = ["Am11", "Dm11", "Em11", "Cm11", "Gm11", "Bbm11"];
    const degs = ["Root", "9", "b3", "11", "5", "b7"];
    const events = [];
    const misses = [];
    let id = 0;
    for (let d = 9; d >= 1; d--) {
      const base = 1350 - (9 - d) * 85; // improving: ~1.35s -> ~0.6s
      for (const chord of chords) {
        for (let i = 0; i < degs.length; i++) {
          const from = degs[i];
          const to = degs[(i + 1) % degs.length];
          const ts = now - d * DAY + (i * 7 + (id % 5)) * 60 * 1000;
          events.push({
            chord,
            fromDeg: from,
            toDeg: to,
            ms: Math.round(base + ((id * 37) % 160) - 60),
            ts,
          });
          // A couple of misses early in the week, none late (improving).
          if (d >= 6 && id % 11 === 0) {
            misses.push({ chord, fromDeg: from, toDeg: to, played: "B", ts });
          }
          id++;
        }
      }
    }
    // Fresh Bbm11 entries "earlier today" so the live drill reads as continuous.
    const todayBase = 640;
    for (let i = 0; i < degs.length; i++) {
      events.push({
        chord: "Bbm11",
        fromDeg: degs[i],
        toDeg: degs[(i + 1) % degs.length],
        ms: Math.round(todayBase + i * 25 + ((i * 53) % 90)),
        ts: now - 40 * 60 * 1000 + i * 3 * 60 * 1000,
      });
    }
    localStorage.setItem("blocked-drill-arpeggio-log", JSON.stringify(events));
    localStorage.setItem("blocked-drill-arpeggio-miss-log", JSON.stringify(misses));
  });
  await p.goto(BASE + "/tools/tracking", { waitUntil: "networkidle" });
  await p.waitForSelector('[data-testid="tracking-tab-arpeggios"]', { timeout: 60000 });
  await p.getByTestId("tracking-tab-arpeggios").click();
  await p.waitForSelector('[data-testid="tracking-panel"]', { timeout: 60000 });
  await sleep(6000); // list + chart mount and settle
  // Switch to another transition so the second tracking beat shows the chart
  // responding to a click.
  await p.getByRole("button", { name: /Bbm11 · Root→9/ }).click();
  await sleep(10000); // chart re-renders for the selected transition
});

await browser.close();
console.log("done");
