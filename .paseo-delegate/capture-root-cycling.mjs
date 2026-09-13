import { chromium } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import fs from "node:fs";

// Unique test user per run (same pattern as e2e/global.setup.ts).
const email = (process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com")
  .replace("@", `+rc${Date.now()}@`);
const password = process.env.E2E_CLERK_USER_PASSWORD;
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
await client.users.createUser({ emailAddress: [email], password, firstName: "Demo", lastName: "User" });
console.log("created user:", email);

const OUT = process.env.HOME + "/piano-content/public/footage-root-cycling";
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

// Warm-up context (unrecorded): compiles /tools/root-cycling and /tools/tracking
// so the recorded contexts don't spend their first seconds cold-compiling.
{
  const { ctx, p } = await newPage(false);
  try {
    await p.goto(BASE + "/tools/root-cycling", { waitUntil: "networkidle", timeout: 120000 });
    await p.waitForSelector('[data-testid="root-cycling-drill"]', { timeout: 60000 });
    await p.goto(BASE + "/tools/tracking", { waitUntil: "networkidle", timeout: 120000 });
    await p.waitForSelector('[data-testid="tracking-tab-rootcycle"]', { timeout: 60000 });
    console.log("ok: warmup");
  } catch (e) {
    console.error("FAIL: warmup", e.message);
  }
  await ctx.close();
}

const openDrill = async (p) => {
  await p.goto(BASE + "/tools/root-cycling", { waitUntil: "networkidle" });
  await p.waitForSelector('[data-testid="root-cycling-drill"]', { timeout: 60000 });
  await sleep(2500); // settings load, drill arms, page settles
};

const connectMidi = async (p) => {
  await p.getByTestId("connect-midi-btn").click();
  await sleep(1500);
};

// Chord mode, m7 (default quality, index 2): root + b3 + 5th + b7.
// Pitch-class scoring, so any octave works. Cm7 = C Eb G Bb.
const M7 = (rootPc) => [rootPc, (rootPc + 3) % 12, (rootPc + 7) % 12, (rootPc + 10) % 12];

// Arpeggio mode, canonical minor-11th shape at root R:
// LH pedal R + R+7 (held), RH sequence 9 b3 11 5 b7 9 11
// (intervals 2 3 5 7 10 2 5 above the root).
const ARP_LH = (rootPc) => [rootPc, (rootPc + 7) % 12];
const ARP_SEQ = (rootPc) => [2, 3, 5, 7, 10, 2, 5].map((iv) => (rootPc + iv) % 12);

// Wait for the Start button to become enabled (MIDI connected + roots on).
const waitStart = (p) =>
  p.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="rc-start-btn"]');
      return btn && !btn.disabled;
    },
    { timeout: 15000 }
  );

// ---- Beat 1: intro — chord mode at rest, m7 armed, prompt card ----
await shoot("drill-intro", async (p) => {
  await openDrill(p);
  await sleep(7000);
});

// ---- Beat 2: start + first chord — press start, play the m7, success flash ----
await shoot("drill-first-chord", async (p) => {
  await openDrill(p);
  await connectMidi(p);
  await sleep(1000);
  await waitStart(p);
  await p.getByTestId("rc-start-btn").click();
  await sleep(2000); // timing phase, prompt + live timer running
  // Play the m7 as a block chord (any octave, pitch-class scoring).
  const rootPc = await p.evaluate(() => {
    const el = document.querySelector('[data-testid="rc-prompt-symbol"]');
    return el ? el.textContent?.trim() : "";
  });
  console.log("prompt:", rootPc);
  // Prompt shows e.g. "Fm7" — map the root letter to a pitch class.
  const PC = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  const name = (rootPc || "Cm7").replace(/m?7.*$/, "");
  const pc = PC[name] ?? 0;
  const chord = M7(pc).map((c) => 60 + c);
  await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOn(n)), chord);
  await sleep(1200);
  await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOff(n)), chord);
  await sleep(4000); // success flash, "Next root" button, history line
});

// ---- Beat 3: skip + repeat — next root, play it again, counter ticks ----
await shoot("drill-skip-repeat", async (p) => {
  await openDrill(p);
  await connectMidi(p);
  await sleep(1000);
  await waitStart(p);
  await p.getByTestId("rc-start-btn").click();
  await sleep(1500);
  const PC = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  const playCurrent = async () => {
    const sym = await p.evaluate(
      () => document.querySelector('[data-testid="rc-prompt-symbol"]')?.textContent?.trim() ?? "Cm7"
    );
    const name = sym.replace(/m?7.*$/, "");
    const pc = PC[name] ?? 0;
    const chord = M7(pc).map((c) => 60 + c);
    await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOn(n)), chord);
    await sleep(900);
    await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOff(n)), chord);
  };
  await playCurrent();
  await sleep(2500); // success, "Roots completed" = 1
  await p.getByTestId("rc-next-btn").click();
  await sleep(2000); // new root armed, timer running again
  await playCurrent();
  await sleep(4500); // second success, counter = 2, history line grows
});

// ---- Beat 4: arpeggio mode — mode toggle, LH pedal, cell strip lights up ----
await shoot("drill-arpeggio", async (p) => {
  await openDrill(p);
  await p.getByTestId("rc-mode-arpeggio").click();
  await sleep(1500);
  await connectMidi(p);
  await sleep(1000);
  await waitStart(p);
  await p.getByTestId("rc-start-btn").click();
  await sleep(1500); // awaiting-root: LH pedal prompt visible
  // The prompt symbol is the LH pedal label ("E + B" style) — the root is the
  // first token. Parse it robustly instead of trusting one text shape.
  const pedalLabel = await p.evaluate(() => {
    const el = document.querySelector('[data-testid="rc-prompt-symbol"]');
    return el ? el.textContent?.trim() : "C";
  });
  console.log("arp pedal label:", pedalLabel);
  const PC = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
  const rootTok = pedalLabel.split("+")[0].trim();
  const pc = PC[rootTok] ?? 0;
  console.log("parsed root pc:", pc, "root:", rootTok);
  // Read back the Root stat tile to confirm the parsed root matches the drill.
  const rootTile = await p.evaluate(() => {
    const tiles = [...document.querySelectorAll(".font-mono.text-lg")];
    return tiles[0]?.textContent?.trim() ?? "";
  });
  console.log("root tile:", rootTile);
  const lh = ARP_LH(pc).map((c) => 55 + c);
  for (const n of lh) {
    await p.evaluate((note) => window.__mockNoteOn(note), n);
    await sleep(900); // pedal fills in one note at a time
  }
  await sleep(2000); // sequence wakes: strip visible, first target shown
  // Confirm the sequence phase actually started before playing notes.
  const phaseLabel = await p.evaluate(
    () => document.querySelector('[data-testid="root-cycling-drill"] .rounded-full')?.textContent?.trim() ?? ""
  );
  console.log("phase label after pedal:", phaseLabel);
  // Play a few sequence notes so cells light up and the "next" prompt moves.
  const seq = ARP_SEQ(pc).map((c) => 67 + c);
  for (let i = 0; i < 4; i++) {
    await p.evaluate((note) => window.__mockNoteOn(note), seq[i]);
    await sleep(500);
    await p.evaluate((note) => window.__mockNoteOff(note), seq[i]);
    await sleep(700);
  }
  await sleep(5000); // strip mid-sequence, target note + timer visible
});

// ---- Beat 5: root pool — customize roots, narrow to 3, reset ----
await shoot("drill-roots", async (p) => {
  await openDrill(p);
  await sleep(1000);
  await p.getByTestId("rc-customize-btn").click();
  await sleep(2000); // 12-root grid visible
  // Turn off everything except F, G, Bb.
  const keep = new Set(["F", "G", "Bb"]);
  for (const r of ["C", "Db", "D", "Eb", "E", "F#", "Ab", "A", "B"]) {
    await p.getByTestId(`rc-root-${r}`).click();
    await sleep(120);
  }
  await sleep(1800); // 3 roots highlighted
  await p.getByTestId("rc-reset-roots-btn").click();
  await sleep(2000); // back to all 12
  await p.getByTestId("rc-customize-btn").click();
  await sleep(2500); // panel closed
});

// ---- Beat 6: tracking — seeded multi-day history, Root Cycling tab ----
await shoot("tracking", async (p) => {
  // Seed plausible multi-day root-cycling history (Free tier reads
  // localStorage). Chord mode groups by "Chord · <quality>"; the live drill
  // is m7, so seed Chord · m7 most recently plus a little arpeggio history.
  await p.evaluate(() => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const roots = ["C", "Eb", "F", "G", "Ab", "Bb", "D", "A"];
    const events = [];
    let id = 0;
    for (let d = 9; d >= 1; d--) {
      const base = 3100 - (9 - d) * 230; // improving: ~3.1s -> ~1.2s
      const count = 3 + (d % 3);
      for (let k = 0; k < count; k++) {
        events.push({
          mode: "chord",
          label: "Gm7",
          root: "G",
          quality: "m7",
          ms: Math.round(base + ((id * 41) % 220) - 80),
          ts: now - d * DAY + (k * 9 + (id % 4)) * 60 * 1000,
        });
        id++;
      }
    }
    // Fresh m7 entries "earlier today" so the live drill reads as continuous.
    const todayBase = 1250;
    for (let i = 0; i < 4; i++) {
      events.push({
        mode: "chord",
        label: "Gm7",
        root: "G",
        quality: "m7",
        ms: Math.round(todayBase + i * 30 + ((i * 57) % 110)),
        ts: now - 45 * 60 * 1000 + i * 4 * 60 * 1000,
      });
    }
    localStorage.setItem("blocked-drill-rootcycle-log", JSON.stringify(events));
  });
  await p.goto(BASE + "/tools/tracking", { waitUntil: "networkidle" });
  await p.waitForSelector('[data-testid="tracking-tab-rootcycle"]', { timeout: 60000 });
  await p.getByTestId("tracking-tab-rootcycle").click();
  await p.waitForSelector('[data-testid="tracking-panel"]', { timeout: 60000 });
  await sleep(6000); // list + chart mount and settle
});

await browser.close();
console.log("done");
