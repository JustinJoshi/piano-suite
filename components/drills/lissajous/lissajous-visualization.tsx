"use client";

import { useEffect, useRef } from "react";
import { cssColorToRgb, mixRgb } from "@/lib/chladni";
import { lerpParams, pointAt, type LissajousParams } from "@/lib/lissajous";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";

// ============================================================
// LISSAJOUS VISUALIZATION — Canvas 2D trail/glow component
// ============================================================
// Props-driven parametric Lissajous explorer. The parent owns
// frequency ratios, phase, morph, and trail settings; this
// component owns the canvas, fade trail, and theme color sync.
// ============================================================

const VAR_NAMES = [
  "--color-background",
  "--hero-orb-inner",
  "--color-primary",
  "--primary-glow",
];

const DEFAULT_BG: [number, number, number] = [0.047, 0.039, 0.031];
const DEFAULT_INNER: [number, number, number] = [0.91, 0.812, 0.478];
const DEFAULT_OUTER: [number, number, number] = [0.788, 0.635, 0.153];
const DEFAULT_GLOW: [number, number, number] = [0.788, 0.635, 0.153];

export type LissajousVisualizationProps = {
  /** Primary frequency / phase parameters. */
  params: LissajousParams;
  /** Target parameters when morph > 0. Defaults to `params`. */
  nextParams?: LissajousParams;
  /** Blend between params and nextParams, 0..1. */
  morph?: number;
  /** How fast the curve parameter t advances (radians / second). */
  sweepSpeed?: number;
  /**
   * Trail fade strength per frame (0.02 = long trail, 0.2 = short).
   * Lower values leave denser historical strokes.
   */
  trailFade?: number;
  /** Stroke width in CSS pixels. */
  lineThickness?: number;
  /** Scale of the unit circle relative to the canvas (higher = larger). */
  zoom?: number;
  /**
   * How far theme colors are mixed toward the background
   * (0 = vivid, 1 = fully background).
   */
  colorSoftness?: number;
  className?: string;
};

function rgbCss(rgb: [number, number, number], alpha = 1): string {
  const r = Math.round(rgb[0] * 255);
  const g = Math.round(rgb[1] * 255);
  const b = Math.round(rgb[2] * 255);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LissajousVisualization({
  params,
  nextParams,
  morph = 0,
  sweepSpeed = 1.2,
  trailFade = 0.06,
  lineThickness = 2,
  zoom = 0.85,
  colorSoftness = 0,
  className,
}: LissajousVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeColors = useThemeCssVars(VAR_NAMES);

  const paramsRef = useRef(params);
  const nextParamsRef = useRef(nextParams ?? params);
  const morphRef = useRef(morph);
  const sweepSpeedRef = useRef(sweepSpeed);
  const trailFadeRef = useRef(trailFade);
  const lineThicknessRef = useRef(lineThickness);
  const zoomRef = useRef(zoom);
  const colorSoftnessRef = useRef(colorSoftness);
  const themeRef = useRef(themeColors);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    nextParamsRef.current = nextParams ?? params;
  }, [nextParams, params]);
  useEffect(() => {
    morphRef.current = morph;
  }, [morph]);
  useEffect(() => {
    sweepSpeedRef.current = sweepSpeed;
  }, [sweepSpeed]);
  useEffect(() => {
    trailFadeRef.current = trailFade;
  }, [trailFade]);
  useEffect(() => {
    lineThicknessRef.current = lineThickness;
  }, [lineThickness]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    colorSoftnessRef.current = colorSoftness;
  }, [colorSoftness]);
  useEffect(() => {
    themeRef.current = themeColors;
  }, [themeColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let t = 0;
    let lastX = 0;
    let lastY = 0;
    let hasLast = false;
    let lastTime = performance.now();
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        hasLast = false;
      }
    }

    function readColors() {
      const [bgRaw, innerRaw, outerRaw, glowRaw] = themeRef.current;
      const soft = colorSoftnessRef.current;
      const bg = cssColorToRgb(bgRaw ?? "") ?? DEFAULT_BG;
      let inner = cssColorToRgb(innerRaw ?? "") ?? DEFAULT_INNER;
      let outer = cssColorToRgb(outerRaw ?? "") ?? DEFAULT_OUTER;
      let glow = cssColorToRgb(glowRaw ?? "") ?? DEFAULT_GLOW;
      if (soft > 0) {
        inner = mixRgb(inner, bg, soft);
        outer = mixRgb(outer, bg, soft);
        glow = mixRgb(glow, bg, soft);
      }
      return { bg, inner, outer, glow };
    }

    function paint(now: number) {
      if (!canvas || !ctx) return;
      resize();

      const deltaMs = now - lastTime;
      lastTime = now;
      const dt = Math.min(deltaMs / 1000, 0.05);

      const blended = lerpParams(
        paramsRef.current,
        nextParamsRef.current,
        morphRef.current
      );

      t += sweepSpeedRef.current * dt;

      const { bg, inner, outer, glow } = readColors();
      const fade = Math.min(0.35, Math.max(0.015, trailFadeRef.current));

      // Fade previous frames toward background for a glowing trail.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgbCss(bg, fade);
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius =
        Math.min(canvas.width, canvas.height) * 0.5 * zoomRef.current;

      // Draw several samples per frame so high sweep speeds stay continuous.
      const steps = Math.max(1, Math.ceil(sweepSpeedRef.current * 8));
      const stepDt = dt / steps;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < steps; i++) {
        const sampleT = t - (steps - 1 - i) * stepDt * sweepSpeedRef.current;
        const [nx, ny] = pointAt(
          sampleT,
          blended.a,
          blended.b,
          blended.delta
        );
        const x = cx + nx * radius;
        const y = cy - ny * radius;

        if (hasLast) {
          const grad = ctx.createLinearGradient(lastX, lastY, x, y);
          grad.addColorStop(0, rgbCss(glow, 0.35));
          grad.addColorStop(0.5, rgbCss(inner, 0.95));
          grad.addColorStop(1, rgbCss(outer, 0.9));

          ctx.strokeStyle = grad;
          ctx.lineWidth = lineThicknessRef.current * dpr;
          ctx.shadowColor = rgbCss(glow, 0.55);
          ctx.shadowBlur = 12 * dpr;
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        lastX = x;
        lastY = y;
        hasLast = true;
      }

      rafId = requestAnimationFrame(paint);
    }

    // Seed opaque background once so the first fade frames look clean.
    resize();
    const { bg } = readColors();
    ctx.fillStyle = rgbCss(bg, 1);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const onResize = () => {
      hasLast = false;
      resize();
    };
    window.addEventListener("resize", onResize);
    rafId = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
