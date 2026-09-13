import { chromium } from "@playwright/test";
import fs from "node:fs";

// Workshop demo capture — PUBLIC routes, no Clerk sign-in needed.
// The Workshop (/tools/workshop), its block library (/tools/workshop/blocks),
// and /marketplace all render signed-out; pages persist in localStorage.
// One browser context per shot: each shot replays the state it needs from a
// fresh store (fresh store seeds the starter page + template picker).

const OUT = process.env.HOME + "/piano-content/public/footage-workshop";
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

const newPage = async (record = true) => {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: record ? { dir: OUT, size: { width: 1440, height: 900 } } : undefined,
  });
  const p = await ctx.newPage();
  await p.addInitScript(MOCK_MIDI);
  await p.addInitScript(() => {
    try {
      window.localStorage.setItem("piano-suite:onboarding-completed", "true");
    } catch {}
  });
  return { ctx, p };
};

// SHOT=<name> re-runs a single shot.
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

// Warm-up (unrecorded): compile the three public routes so recorded
// contexts don't spend their first seconds cold-compiling.
{
  const { ctx, p } = await newPage(false);
  for (const route of ["/tools/workshop", "/tools/workshop/blocks", "/marketplace"]) {
    try {
      await p.goto(BASE + route, { waitUntil: "networkidle", timeout: 120000 });
      console.log("ok: warmup", route);
    } catch (e) {
      console.error("FAIL: warmup", route, e.message);
    }
  }
  await ctx.close();
}

// Fresh context = starter page + template picker visible.
const openWorkshop = async (p) => {
  await p.goto(BASE + "/tools/workshop", { waitUntil: "networkidle" });
  await p.getByText("How do you want to start?").waitFor({ timeout: 60000 });
  await sleep(1500);
};

// Pick the "First chords" starter template and wait for the grid.
const pickFirstChords = async (p) => {
  await openWorkshop(p);
  await p.getByRole("button", { name: /First chords/ }).click();
  await p.getByTestId("workshop-grid").waitFor({ timeout: 30000 });
  await sleep(2500); // grid settles, tiles render
};

// ---- Beat 1: intro — starter picker, the three ways in ----
await shoot("intro-picker", async (p) => {
  await openWorkshop(p);
  await sleep(9000);
});

// ---- Beat 2: pick "First chords" — the grid fills with blocks ----
await shoot("pick-template", async (p) => {
  await pickFirstChords(p);
  await sleep(9000);
});

// ---- Beat 3: make it yours — rename the page, drag a tile, resize one ----
await shoot("edit-grid", async (p) => {
  await pickFirstChords(p);
  // Rename the page (typed, not filled, so the video shows the text appear).
  const title = p.getByLabel("Practice page title");
  await title.click();
  await title.fill("");
  await title.pressSequentially("Morning warmup", { delay: 90 });
  await sleep(1500);
  // Drag-reorder: grab the first tile's grip and drop it on the second tile.
  // dnd-kit needs >8px movement to activate; guides flash while dragging.
  const tiles = p.locator("[data-workshop-tile]");
  const grip = tiles.nth(0).getByLabel("Drag to reorder");
  await grip.hover();
  await p.mouse.down();
  await p.mouse.move(720, 400, { steps: 12 });
  const tile2 = await tiles.nth(1).boundingBox();
  await p.mouse.move(tile2.x + tile2.width / 2, tile2.y + tile2.height / 2, { steps: 10 });
  await sleep(900); // hold over the drop target so guides are on camera
  await p.mouse.up();
  await sleep(1500);
  // Resize the chord-target tile wider via its corner handle.
  const handle = tiles.nth(1).getByLabel("Resize tile");
  await handle.hover();
  await p.mouse.down();
  await p.mouse.move(
    (await handle.boundingBox()).x + 500,
    (await handle.boundingBox()).y + 60,
    { steps: 14 }
  );
  await p.mouse.up();
  await sleep(5000);
});

// ---- Beat 4: block library — browse, search, live previews ----
await shoot("block-library", async (p) => {
  await pickFirstChords(p);
  await p.getByLabel("Open the block library").click();
  await p.getByTestId("marketplace-card-metronome").waitFor({ timeout: 60000 });
  await sleep(4000);
  await p.getByTestId("library-search").fill("metronome");
  await sleep(4500);
});

// ---- Beat 5: add the Metronome block, back to the workshop, start it ----
await shoot("add-metronome", async (p) => {
  await pickFirstChords(p);
  await p.getByLabel("Open the block library").click();
  await p.getByTestId("marketplace-card-metronome").waitFor({ timeout: 60000 });
  await sleep(2000);
  await p.getByLabel("Add Metronome").click();
  await sleep(2500); // plus flips to a check
  await p.getByRole("link", { name: "Back to workshop" }).click();
  await p.getByTestId("workshop-grid").waitFor({ timeout: 30000 });
  await p.getByTestId("metronome-btn").scrollIntoViewIfNeeded();
  await sleep(1500);
  await p.getByTestId("metronome-btn").click();
  await sleep(8000); // pulse dot ticks at 80 BPM
});

// ---- Beat 6: marketplace — featured pages, copy one into the workshop ----
await shoot("marketplace", async (p) => {
  await p.goto(BASE + "/marketplace", { waitUntil: "networkidle" });
  await p.getByText("Play your first Cmaj7").first().waitFor({ timeout: 60000 });
  await sleep(5000);
  await p.getByRole("button", { name: "Copy to my workshop" }).first().click();
  await p.getByTestId("workshop-grid").waitFor({ timeout: 30000 });
  await sleep(6000); // forked page "Play your first Cmaj7 (fork)" on the grid
});

// ---- Beat 7: play it — the forked page's on-screen keyboard rings Cmaj7 ----
await shoot("play-keys", async (p) => {
  await p.goto(BASE + "/marketplace", { waitUntil: "networkidle" });
  await p.getByText("Play your first Cmaj7").first().waitFor({ timeout: 60000 });
  await p.getByRole("button", { name: "Copy to my workshop" }).first().click();
  await p.getByTestId("workshop-grid").waitFor({ timeout: 30000 });
  await p.getByTestId("keyboard-display").scrollIntoViewIfNeeded();
  await sleep(2500);
  // Cmaj7 = C E G B -> computer keys A D G J (lowNote C3, 2 octaves).
  for (const k of ["a", "d", "g", "j"]) {
    await p.keyboard.down(k);
    await sleep(350);
  }
  await sleep(2500); // all four keys lit, chord ringing
  for (const k of ["a", "d", "g", "j"]) {
    await p.keyboard.up(k);
    await sleep(200);
  }
  await sleep(1500);
  // One more note for motion: E (key D).
  await p.keyboard.down("d");
  await sleep(900);
  await p.keyboard.up("d");
  await sleep(4000);
});

await browser.close();
console.log("done");
