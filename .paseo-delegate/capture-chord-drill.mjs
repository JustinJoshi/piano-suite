import { chromium } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";
import fs from "node:fs";

// Unique test user per run (same pattern as e2e/global.setup.ts).
const email = (process.env.E2E_CLERK_USER_EMAIL || "e2e-piano-suite+clerk_test@example.com")
  .replace("@", `+cd${Date.now()}@`);
const password = process.env.E2E_CLERK_USER_PASSWORD;
const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
await client.users.createUser({ emailAddress: [email], password, firstName: "Demo", lastName: "User" });
console.log("created user:", email);

const OUT = process.env.HOME + "/piano-content/public/footage-chord-drill";
const BASE = process.env.BASE_URL ?? "http://localhost:3001";
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

const newPage = async () => {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const p = await ctx.newPage();
  await p.addInitScript(MOCK_MIDI);
  await setupClerkTestingToken({ page: p });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await clerk.signIn({ page: p, emailAddress: email, password });
  await p.waitForFunction(() => window.Clerk?.user !== null, { timeout: 20000 });
  await p.evaluate(() => localStorage.setItem("piano-suite:onboarding-completed", "true"));
  // Pre-set the first-visit demo-intro flag so re-captures never film the overlay.
  await p.evaluate((href) => localStorage.setItem("piano-suite:demo-intro-seen:" + href, "true"), "/tools/chord-drill");
  return { ctx, p };
};

const shoot = async (name, fn) => {
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

// Free-tier user: local history key (`blocked-drill-first-chord-log`) drives
// the Tracking chart — seed a plausible improving trend across the last 9
// days before the live run adds today's reps. Drill settings live in Convex
// (cloud), so rep target / notes visibility are set through the UI instead.
const seedHistory = (p) =>
  p.evaluate(() => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const rows = [];
    let id = 0;
    for (let d = 9; d >= 1; d--) {
      const base = 2400 - (9 - d) * 160; // improving: ~2.4s -> ~1.1s
      const count = 2 + (d % 3);
      for (let k = 0; k < count; k++) {
        rows.push({
          id: `seed_${id++}`,
          chord: "Cmaj7",
          ms: Math.round(base + (k % 2) * 180 - 60),
          grade: d % 3 === 0 ? "Good" : d % 3 === 1 ? "Hard" : "Again",
          isRedo: false,
          ts: now - d * DAY + k * 5 * 60 * 1000,
        });
      }
    }
    localStorage.setItem("blocked-drill-first-chord-log", JSON.stringify(rows));
  });

// ---- One shared context: seed → drill round → tracking (rule 2: history
// must persist from the drill run into the Tracking page in one context) ----
{
  const { ctx, p } = await newPage();
  try {
    await p.goto(BASE + "/tools/chord-drill", { waitUntil: "networkidle" });
    await sleep(3000); // page settles, settings load
    await seedHistory(p);

    await p.getByTestId("connect-midi-btn").click();
    await p.waitForFunction(
      () => document.querySelector('[data-testid="start-drill-btn"]')?.textContent?.includes("Start"),
      { timeout: 10000 }
    );
    // Settings come from Convex; set rep target + note display through the UI.
    await p.getByTestId("chord-drill-rep-target-5").click();
    await p.getByTestId("setting-row-chord-notes").getByRole("button", { name: "Show" }).click();
    await sleep(1000);

    // Locator click auto-scrolls the drill card into frame briefly; the
    // opening framing is reset right after (this transient is not used by
    // any beat window).
    await p.getByTestId("start-drill-btn").click();
    await sleep(1600); // phase flips to armed

    // Hold the true page top — the beat 2 shot opens here (header + MIDI
    // connect bar, drill armed; Settings still below the fold).
    await p.evaluate(() => window.scrollTo(0, 0));
    await sleep(2600);

    // Settle on the drill card: settings card's first pixel exactly at the
    // viewport bottom edge, so no settings rows are in frame.
    const settleOnCard = (p) =>
      p.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (n.nodeValue.includes("Configure how the drill behaves")) {
            const card = n.parentElement.closest(".rounded-xl, .rounded-lg");
            const top = card.getBoundingClientRect().top + window.scrollY;
            window.scrollTo(0, Math.max(0, top - 900));
            break;
          }
        }
      });
    await settleOnCard(p);
    await sleep(600);
    await sleep(600);

    // Play Cmaj7 (C E G B, any octave — scoring is pitch-class), rep target 5.
    // Dev-mode stalls can swallow note-ons; track the X/5 counter and re-fire
    // when a rep does not register.
    const chord = [60, 64, 67, 71];
    const repsDone = () =>
      p.evaluate(() =>
        parseInt(document.body.textContent?.match(/(\d+)\/5 reps/)?.[1] ?? "0", 10),
      );
    for (let rep = 0; rep < 12; rep++) {
      const before = await repsDone();
      await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOn(n)), chord);
      await sleep(900);
      await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOff(n)), chord);
      await sleep(1500);
      if ((await repsDone()) > before) continue; // rep landed
      console.log("stall:", before, "held:", await p.evaluate(() =>
        document.querySelectorAll('[data-testid="held-note"], .held-note').length));
      await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOn(n)), chord); // make-up pulse
      await sleep(700);
      await p.evaluate((notes) => notes.forEach((n) => window.__mockNoteOff(n)), chord);
      await sleep(1500);
    }
    // Wait for the round-complete line (avg/best + Redo/Next buttons).
    await p.waitForFunction(
      () => /first chord \d/i.test(document.body.textContent ?? "") && document.body.textContent?.includes("Redo"),
      { timeout: 20000 },
    );

    // Beat 3 framing: round stats up top, Settings card in view — the
    // narration says "five at a time", which is the rep-target setting.
    await p.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let anchor = null;
      for (let n = walker.nextNode(); n && !anchor; n = walker.nextNode()) {
        if (n.nodeValue.includes("Configure how the drill behaves")) {
          anchor = n.parentElement.closest(".rounded-xl, .rounded-lg");
        }
      }
      const card = anchor ?? document.body;
      const top = card.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - 560));
    });
    await sleep(6000);

    // Same context → the seeded history plus today's live reps are visible.
    await p.goto(BASE + "/tools/tracking", { waitUntil: "networkidle" });
    await sleep(6000); // chart mounts and animates in
    console.log("ok: chord-drill-run+tracking");
  } catch (e) {
    console.error("FAIL: chord-drill-run+tracking", e.message);
  }
  await ctx.close(); // flushes the video file
}

await browser.close();
console.log("done");
