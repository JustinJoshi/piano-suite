"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssColorToRgb, mixRgb } from "@/lib/chladni";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";

// ============================================================
// CHLADNI VISUALIZATION — Reusable WebGL shader component
// ============================================================
// A props-driven full-screen square-plate Chladni figure. The
// parent controls the (m, n) modes, morph blend, line thickness,
// zoom, and secondary-wave parameters; this component owns the
// Three.js scene, the animation loop, and theme-color syncing.
// ============================================================

const VAR_NAMES = [
  "--color-background",
  "--hero-orb-inner",
  "--color-primary",
  "--primary-glow",
];

// Amber defaults used until CSS custom properties are computed.
const DEFAULT_BG: [number, number, number] = [0.047, 0.039, 0.031];
const DEFAULT_INNER: [number, number, number] = [0.91, 0.812, 0.478];
const DEFAULT_OUTER: [number, number, number] = [0.788, 0.635, 0.153];
const DEFAULT_GLOW: [number, number, number] = [0.788, 0.635, 0.153];

export type ChladniVisualizationProps = {
  /** Primary Chladni mode (m, n). */
  mode: [number, number];
  /** Target mode when morph > 0. Defaults to `mode`. */
  nextMode?: [number, number];
  /** Blend between mode and nextMode, 0..1. */
  morph?: number;
  /** Thickness of the nodal lines. */
  lineThickness?: number;
  /** Zoom scale of the pattern. */
  zoom?: number;
  /** Offset of the secondary mode from the primary mode. */
  secondaryOffset?: [number, number];
  /** Blend strength of the secondary mode, 0..1. */
  secondaryBlend?: number;
  /** Speed of the secondary mode's time-based motion. */
  secondarySpeed?: number;
  /** Amplitude of the secondary mode's time-based motion. */
  secondaryMotion?: number;
  /** Amount of slow "breathing" added to the primary mode. */
  breathe?: number;
  /** Multiplier for all internal time-based animation speeds. */
  timeScale?: number;
  /**
   * How strongly lines lift off the background (0..1+). Lab keeps 1;
   * the hero uses a lower value so the field reads as atmosphere.
   */
  lineIntensity?: number;
  /**
   * How far theme line/glow colors are mixed toward the background
   * before upload (0 = vivid theme colors, 1 = fully background).
   */
  colorSoftness?: number;
  /**
   * Optional CSS color override for line/glow uniforms. When null/undefined,
   * colors come from theme tokens (`--hero-orb-inner`, `--color-primary`, etc.).
   */
  patternColor?: string | null;
  /**
   * Multiply the internal rendering resolution beyond device pixel ratio.
   * Useful for small pop-out panels that would otherwise look pixelated.
   */
  resolutionScale?: number;
  /**
   * When true, the shader crops to a centered square plate so the pattern
   * looks the same regardless of viewport aspect ratio.
   */
  normalizeViewport?: boolean;
  className?: string;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMode;
  uniform vec2 uNextMode;
  uniform float uMorph;
  uniform vec3 uBackground;
  uniform vec3 uLineInner;
  uniform vec3 uLineOuter;
  uniform vec3 uGlow;
  uniform float uZoom;
  uniform float uThreshold;
  uniform vec2 uSecondaryOffset;
  uniform float uSecondaryBlend;
  uniform float uSecondarySpeed;
  uniform float uSecondaryMotion;
  uniform float uBreathe;
  uniform float uTimeScale;
  uniform float uLineIntensity;
  uniform bool uNormalizeViewport;

  varying vec2 vUv;

  const float PI = 3.14159265359;

  float chladni(vec2 p, vec2 mn) {
    float a = cos(mn.y * PI * p.x) * cos(mn.x * PI * p.y);
    float b = cos(mn.x * PI * p.x) * cos(mn.y * PI * p.y);
    return a - b;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;

    vec2 p = uv;
    if (uNormalizeViewport) {
      vec2 scale = vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
      p /= scale;
    }
    p *= uZoom;

    vec2 mode = mix(uMode, uNextMode, uMorph);

    float breathe = sin(uTime * 0.0008 * uTimeScale) * uBreathe;
    mode += vec2(breathe);

    vec2 secondary = mode + uSecondaryOffset
      + vec2(
          sin(uTime * 0.0005 * uTimeScale * uSecondarySpeed) * uSecondaryMotion,
          cos(uTime * 0.0007 * uTimeScale * uSecondarySpeed) * uSecondaryMotion
        );

    float val = chladni(p, mode) * (1.0 - uSecondaryBlend)
              + chladni(p, secondary) * uSecondaryBlend;

    float line = smoothstep(uThreshold, 0.0, abs(val));

    float edge = clamp(length(uv) * 0.5, 0.0, 1.0);
    vec3 lineColor = mix(uLineInner, uLineOuter, edge * 0.3);

    vec3 color = mix(uBackground, lineColor, line * uLineIntensity);

    float glow = exp(-length(uv) * 3.0) * 0.08 * uLineIntensity;
    color += uGlow * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function ChladniVisualization({
  mode,
  nextMode = mode,
  morph = 0,
  lineThickness = 30,
  zoom = 2.33,
  secondaryOffset = [1, 2],
  secondaryBlend = 0.15,
  secondarySpeed = 1,
  secondaryMotion = 2,
  breathe = 0.2,
  timeScale = 1,
  lineIntensity = 1,
  colorSoftness = 0,
  patternColor = null,
  resolutionScale = 1,
  normalizeViewport = false,
  className,
}: ChladniVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const cssValues = useThemeCssVars(VAR_NAMES);

  const [backgroundCss, innerCss, outerCss, glowCss] = cssValues;

  // Initialize the WebGL scene once.
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      // WebGL unavailable: leave the container empty.
      return;
    }

    const dpr = Math.min(
      (window.devicePixelRatio || 1) * Math.max(0.5, resolutionScale),
      3
    );
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    mount.appendChild(canvas);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMode: { value: new THREE.Vector2(...mode) },
        uNextMode: { value: new THREE.Vector2(...nextMode) },
        uMorph: { value: morph },
        uBackground: { value: new THREE.Vector3(...DEFAULT_BG) },
        uLineInner: { value: new THREE.Vector3(...DEFAULT_INNER) },
        uLineOuter: { value: new THREE.Vector3(...DEFAULT_OUTER) },
        uGlow: { value: new THREE.Vector3(...DEFAULT_GLOW) },
        uZoom: { value: zoom },
        uThreshold: { value: 0.015 + lineThickness / 400 },
        uSecondaryOffset: { value: new THREE.Vector2(...secondaryOffset) },
        uSecondaryBlend: { value: secondaryBlend },
        uSecondarySpeed: { value: secondarySpeed },
        uSecondaryMotion: { value: secondaryMotion },
        uBreathe: { value: breathe },
        uTimeScale: { value: timeScale },
        uLineIntensity: { value: lineIntensity },
        uNormalizeViewport: { value: normalizeViewport },
      },
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;
      material.uniforms.uTime.value += delta;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    function handleResize() {
      const w = Math.max(mount.clientWidth, 1);
      const h = Math.max(mount.clientHeight, 1);
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
      const nextDpr = Math.min(
        (window.devicePixelRatio || 1) * Math.max(0.5, resolutionScale),
        3
      );
      if (renderer.getPixelRatio() !== nextDpr) {
        renderer.setPixelRatio(nextDpr);
      }
    }

    window.addEventListener("resize", handleResize);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;
    resizeObserver?.observe(mount);

    // Catch late layout after fonts/nav settle.
    handleResize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentElement === mount) {
        mount.removeChild(canvas);
      }
      materialRef.current = null;
    };
    // Mount once; prop sync and theme sync live in separate effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync numeric uniforms whenever props change.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uMode.value.set(mode[0], mode[1]);
    material.uniforms.uNextMode.value.set(nextMode[0], nextMode[1]);
    material.uniforms.uMorph.value = morph;
    material.uniforms.uZoom.value = zoom;
    material.uniforms.uThreshold.value = 0.015 + lineThickness / 400;
    material.uniforms.uSecondaryOffset.value.set(
      secondaryOffset[0],
      secondaryOffset[1]
    );
    material.uniforms.uSecondaryBlend.value = secondaryBlend;
    material.uniforms.uSecondarySpeed.value = secondarySpeed;
    material.uniforms.uSecondaryMotion.value = secondaryMotion;
    material.uniforms.uBreathe.value = breathe;
    material.uniforms.uTimeScale.value = timeScale;
    material.uniforms.uLineIntensity.value = lineIntensity;
    material.uniforms.uNormalizeViewport.value = normalizeViewport;
  }, [
    mode,
    nextMode,
    morph,
    lineThickness,
    zoom,
    secondaryOffset,
    secondaryBlend,
    secondarySpeed,
    secondaryMotion,
    breathe,
    timeScale,
    lineIntensity,
    normalizeViewport,
  ]);

  // Sync theme (or override) colors whenever CSS props / patternColor change.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    const background = cssColorToRgb(backgroundCss || "#0c0a08");
    const override = patternColor?.trim() ? cssColorToRgb(patternColor) : null;
    const inner = override ?? cssColorToRgb(innerCss || "#e8cf7a");
    const outer = override ?? cssColorToRgb(outerCss || "#c9a227");
    const glow = override ?? cssColorToRgb(glowCss || "#c9a227");

    // Softness pulls line colors toward the page background so the
    // pattern complements primary accents without competing with text.
    const softInner = mixRgb(inner, background, colorSoftness * 0.85);
    const softOuter = mixRgb(outer, background, colorSoftness);
    const softGlow = mixRgb(glow, background, colorSoftness);

    material.uniforms.uBackground.value.set(...background);
    material.uniforms.uLineInner.value.set(...softInner);
    material.uniforms.uLineOuter.value.set(...softOuter);
    material.uniforms.uGlow.value.set(...softGlow);
  }, [
    backgroundCss,
    innerCss,
    outerCss,
    glowCss,
    colorSoftness,
    patternColor,
  ]);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden="true"
    />
  );
}
