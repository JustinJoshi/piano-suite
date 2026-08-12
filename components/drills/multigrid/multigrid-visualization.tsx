"use client";

import { useEffect, useRef, useState } from "react";
import { cssColorToRgb, mixRgb } from "@/lib/chladni";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";
import { useVisibilityPause } from "@/hooks/useVisibilityPause";
import {
  blendRecipes,
  buildMultigridScene,
  uniqueOrientationKeys,
  type MultigridRecipe,
  type MultigridViewMode,
} from "@/lib/multigrid";

const VAR_NAMES = [
  "--color-background",
  "--hero-orb-inner",
  "--color-primary",
  "--color-accent",
  "--color-muted",
  "--primary-glow",
];

export type MultigridVisualizationProps = {
  recipe: MultigridRecipe;
  nextRecipe?: MultigridRecipe;
  morph?: number;
  viewMode?: MultigridViewMode;
  showIntersections?: boolean;
  lineIntensity?: number;
  colorSoftness?: number;
  patternColor?: string | null;
  className?: string;
};

function rgbCss(rgb: [number, number, number], alpha = 1): string {
  const [r, g, b] = rgb;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

export function MultigridVisualization({
  recipe,
  nextRecipe = recipe,
  morph = 0,
  viewMode = "grid",
  showIntersections = true,
  lineIntensity = 1,
  colorSoftness = 0,
  patternColor = null,
  className,
}: MultigridVisualizationProps) {
  // Tiling / both marked for deletion — only the grid (lines) panel is shown.
  // `viewMode` is accepted for API compatibility with persisted settings.
  void viewMode;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mountRef, visible] = useVisibilityPause<HTMLDivElement>();
  const visibleRef = useRef(visible);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const cssValues = useThemeCssVars(VAR_NAMES);
  const [bgCss, innerCss, primaryCss, accentCss, mutedCss, glowCss] = cssValues;

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        w: Math.max(Math.floor(width), 1),
        h: Math.max(Math.floor(height), 1),
      });
    });
    ro.observe(mount);
    return () => ro.disconnect();
  }, [mountRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w: width, h: height } = size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!visibleRef.current) return;

    const background = cssColorToRgb(bgCss || "#0c0a08");
    const override = patternColor?.trim() ? cssColorToRgb(patternColor) : null;
    const inner = override ?? cssColorToRgb(innerCss || "#e8cf7a");
    const primary = override ?? cssColorToRgb(primaryCss || "#c9a227");
    const accent = override ?? cssColorToRgb(accentCss || "#c9a227");
    const muted = cssColorToRgb(mutedCss || "#1c1912");
    const glow = override ?? cssColorToRgb(glowCss || "#c9a227");

    const softInner = mixRgb(inner, background, colorSoftness * 0.85);
    const softPrimary = mixRgb(primary, background, colorSoftness);
    const softAccent = mixRgb(accent, background, colorSoftness);
    const softMuted = mixRgb(muted, background, colorSoftness * 0.4);
    const softGlow = mixRgb(glow, background, colorSoftness);

    ctx.fillStyle = rgbCss(background);
    ctx.fillRect(0, 0, width, height);

    const blended = blendRecipes(recipe, nextRecipe, morph);

    // Tiling / both marked for deletion: grid-only. Tiling draw branch below
    // remains until a follow-up hard-delete PR removes `mode: "tiling"`.
    const panels: {
      x: number;
      y: number;
      w: number;
      h: number;
      mode: "grid" | "tiling";
    }[] = [{ x: 0, y: 0, w: width, h: height, mode: "grid" }];

    for (const panel of panels) {
      const scene = buildMultigridScene(blended, panel.w, panel.h);
      const steps = scene.steps;
      const spacing =
        (blended.zoom * Math.min(panel.w, panel.h)) / Math.max(steps, 1);
      const preFactor =
        (spacing * ((2 * Math.PI) / blended.symmetry)) / Math.PI;
      const rotate = (blended.rotate * Math.PI) / 180;
      const panPx = -blended.zoom * Math.min(panel.w, panel.h) * blended.pan;

      ctx.save();
      ctx.beginPath();
      ctx.rect(panel.x, panel.y, panel.w, panel.h);
      ctx.clip();
      ctx.translate(panel.x + panel.w / 2 + panPx, panel.y + panel.h / 2);
      ctx.rotate(rotate);

      if (panel.mode === "tiling") {
        const keys = uniqueOrientationKeys(scene.tiles);
        const palette = [softInner, softPrimary, softAccent, softMuted, softGlow];
        for (const tile of scene.tiles) {
          const idx = Math.max(0, keys.indexOf(tile.angles));
          const fill = palette[idx % palette.length]!;
          ctx.beginPath();
          tile.dualPts.forEach((pt, i) => {
            const x = preFactor * pt.x;
            const y = preFactor * pt.y;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fillStyle = rgbCss(fill, 0.35 + 0.55 * lineIntensity);
          ctx.fill();
          ctx.strokeStyle = rgbCss(softPrimary, 0.15 + 0.25 * lineIntensity);
          ctx.lineWidth = Math.min(Math.sqrt(Math.max(preFactor, 1)) / 4.5, 1.2);
          ctx.stroke();
        }
      } else {
        const table = Array.from({ length: blended.symmetry }, (_, i) => {
          const m = (2 * Math.PI) / blended.symmetry;
          return { sin: Math.sin(i * m), cos: Math.cos(i * m) };
        });

        ctx.strokeStyle = rgbCss(softAccent, 0.45 + 0.4 * lineIntensity);
        ctx.lineWidth = Math.min(Math.sqrt(Math.max(spacing, 1)) / 8, 1.1);

        for (const line of scene.lines) {
          const sc = table[line.angle];
          if (!sc) continue;
          const dx = -sc.sin;
          const dy = sc.cos;
          const px = line.index * sc.cos;
          const py = line.index * sc.sin;
          const extent = Math.max(panel.w, panel.h) / Math.max(spacing, 1e-6);
          ctx.beginPath();
          ctx.moveTo(
            (px - dx * extent) * spacing,
            (py - dy * extent) * spacing
          );
          ctx.lineTo(
            (px + dx * extent) * spacing,
            (py + dy * extent) * spacing
          );
          ctx.stroke();
        }

        if (showIntersections) {
          ctx.fillStyle = rgbCss(softInner, 0.7 * lineIntensity);
          for (const tile of scene.tiles) {
            ctx.beginPath();
            ctx.arc(tile.x * spacing, tile.y * spacing, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    }
  }, [
    size,
    recipe,
    nextRecipe,
    morph,
    showIntersections,
    lineIntensity,
    colorSoftness,
    patternColor,
    bgCss,
    innerCss,
    primaryCss,
    accentCss,
    mutedCss,
    glowCss,
    visible,
  ]);

  return (
    <div ref={mountRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}
