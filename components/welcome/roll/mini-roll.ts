/**
 * The strip of paper above the hero's keyboard. Notes are punched into it as
 * they're played and the paper feeds upward while anything is happening;
 * when a chord is right its holes turn red and its time is stamped beside
 * it. Under reduced motion the paper steps instead of gliding.
 *
 * Imperative on purpose: it draws every animation frame while notes are held.
 */

const SPEED = 44; // px of paper per second
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

type Hole = { midi: number; x: number; black: boolean; start: number; end: number | null; kind: "note" | "good" | "miss" };
type Stamp = { text: string; at: number; right: number; left: number };

export type MiniRollColors = { hole: string; felt: string; miss: string; label: string };

export class MiniRoll {
  private ctx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private clock = 0;
  private last = 0;
  private running = false;
  private movingUntil = 0;
  private holes: Hole[] = [];
  private stamps: Stamp[] = [];
  private observer: ResizeObserver | null = null;
  private frame = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    /** Horizontal centre of a note's key, as a fraction of the canvas width. */
    private xOf: (midi: number) => number,
    private colors: MiniRollColors,
    private reduced: () => boolean
  ) {
    this.ctx = canvas.getContext("2d");
    if (typeof ResizeObserver === "function") {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas);
    } else {
      window.addEventListener("resize", this.resize);
    }
    this.resize();
  }

  dispose() {
    this.observer?.disconnect();
    window.removeEventListener("resize", this.resize);
    if (this.frame) cancelAnimationFrame(this.frame);
    this.running = false;
  }

  punch(midi: number): Hole {
    if (this.reduced()) this.clock += 0.34;
    const hole: Hole = {
      midi,
      x: this.xOf(midi),
      black: BLACK_PCS.has(((midi % 12) + 12) % 12),
      start: this.clock,
      end: null,
      kind: "note",
    };
    this.holes.push(hole);
    this.kick();
    return hole;
  }

  lift(midi: number) {
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const hole = this.holes[i];
      if (hole.midi === midi && hole.end == null) {
        hole.end = this.reduced() ? hole.start + 0.26 : this.clock;
        break;
      }
    }
    this.kick();
  }

  markMiss(hole: Hole | undefined) {
    if (hole) hole.kind = "miss";
    this.kick();
  }

  /** Turn the latest hole of each of these notes red and stamp the time beside them. */
  markGood(midis: number[], text: string) {
    const good: Hole[] = [];
    for (const midi of midis) {
      for (let i = this.holes.length - 1; i >= 0; i--) {
        if (this.holes[i].midi === midi) {
          this.holes[i].kind = "good";
          good.push(this.holes[i]);
          break;
        }
      }
    }
    if (good.length) {
      this.stamps.push({
        text,
        at: Math.max(...good.map((g) => g.start)),
        right: Math.max(...good.map((g) => g.x)),
        left: Math.min(...good.map((g) => g.x)),
      });
    }
    this.kick(900);
  }

  private resize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.draw();
  };

  private kick(ms = 1500) {
    if (this.reduced()) {
      this.draw();
      return;
    }
    this.movingUntil = Math.max(this.movingUntil, performance.now() + ms);
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.loop);
    }
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const held = this.holes.some((h) => h.end == null);
    const moving = held || now < this.movingUntil;
    if (moving) this.clock += dt;
    this.draw();
    if (moving) this.frame = requestAnimationFrame(this.loop);
    else this.running = false;
  };

  private draw() {
    const { ctx, w, h } = this;
    if (!ctx || !w || !h) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const base = h - 12;
    const reduced = this.reduced();
    const y = (t: number) => base - (this.clock - t) * SPEED;

    for (let i = this.holes.length - 1; i >= 0; i--) {
      const hole = this.holes[i];
      const end = hole.end ?? (reduced ? hole.start + 0.26 : this.clock);
      let top = y(hole.start);
      const bottom = y(end);
      if (bottom < -30) {
        this.holes.splice(i, 1);
        continue;
      }
      if (bottom - top < 6) top = bottom - 6;
      const width = hole.black ? 6 : 8;
      const x = hole.x * w - width / 2;
      ctx.fillStyle = hole.kind === "good" ? this.colors.felt : hole.kind === "miss" ? this.colors.miss : this.colors.hole;
      if (bottom - top <= 10) this.pill(x, top, width, bottom - top);
      else for (let yy = top; yy < bottom; yy += 7) this.pill(x, yy, width, Math.min(4, bottom - yy));
    }

    ctx.font = `650 12px ${this.colors.label}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.colors.felt;
    for (let i = this.stamps.length - 1; i >= 0; i--) {
      const s = this.stamps[i];
      const sy = y(s.at);
      if (sy < -20) {
        this.stamps.splice(i, 1);
        continue;
      }
      const tw = ctx.measureText(s.text).width;
      let sx = s.right * w + 14;
      if (sx + tw > w - 8) sx = s.left * w - 14 - tw;
      ctx.fillText(s.text, sx, sy + 3);
    }
  }

  private pill(x: number, y: number, width: number, height: number) {
    const ctx = this.ctx!;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, width, height, Math.min(2.5, height / 2));
    else ctx.rect(x, y, width, height);
    ctx.fill();
  }
}
