"use client";

import { useEffect, useRef } from "react";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { cssColorToRgb, mixRgb } from "@/lib/chladni";
import type { Complex } from "@/lib/julia";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";
import { useVisibilityPause } from "@/hooks/useVisibilityPause";

// ============================================================
// JULIA VISUALIZATION — Reusable WebGL shader component
// ============================================================
// Props-driven escape-time Julia set. The parent controls c,
// morph blend, zoom, iterations, and color softness; this
// component owns the Three.js scene, animation loop, and theme
// color syncing.
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

export type JuliaVisualizationProps = {
  /** Primary Julia parameter c = re + im·i. */
  c: Complex;
  /** Target c when morph > 0. Defaults to `c`. */
  nextC?: Complex;
  /** Blend between c and nextC, 0..1. */
  morph?: number;
  /** Zoom scale (higher = closer). */
  zoom?: number;
  /** Maximum escape-time iterations. */
  maxIterations?: number;
  /** Escape radius for |z|. */
  escapeRadius?: number;
  /**
   * How far theme colors are mixed toward the background
   * (0 = vivid, 1 = fully background).
   */
  colorSoftness?: number;
  /** Multiplier for subtle palette cycling. */
  timeScale?: number;
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
  uniform vec2 uC;
  uniform vec2 uNextC;
  uniform float uMorph;
  uniform vec3 uBackground;
  uniform vec3 uInner;
  uniform vec3 uOuter;
  uniform vec3 uGlow;
  uniform float uZoom;
  uniform float uMaxIterations;
  uniform float uEscapeRadius;
  uniform float uTimeScale;

  varying vec2 vUv;

  vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    // Map screen coords into the complex plane around the origin.
    vec2 z = uv / uZoom;
    vec2 c = mix(uC, uNextC, uMorph);

    float escape2 = uEscapeRadius * uEscapeRadius;
    float iter = 0.0;
    bool escaped = false;
    const int MAX_LOOP = 512;

    for (int i = 0; i < MAX_LOOP; i++) {
      if (float(i) >= uMaxIterations) break;
      if (dot(z, z) > escape2) {
        escaped = true;
        // Smooth coloring: i + 1 - log2(log2(|z|))
        float logZn = log(dot(z, z)) / 2.0;
        float nu = log(logZn / log(2.0)) / log(2.0);
        iter = float(i) + 1.0 - nu;
        break;
      }
      z = complexMul(z, z) + c;
      iter = float(i) + 1.0;
    }

    if (!escaped) {
      gl_FragColor = vec4(uBackground, 1.0);
      return;
    }

    float t = clamp(iter / uMaxIterations, 0.0, 1.0);
    // Subtle palette drift driven by time — stays within theme hues.
    float drift = sin(uTime * 0.0003 * uTimeScale + t * 6.28318) * 0.08;
    t = clamp(t + drift, 0.0, 1.0);

    vec3 band = mix(uInner, uOuter, smoothstep(0.0, 1.0, t));
    float glow = exp(-length(uv) * 2.5) * 0.1;
    vec3 color = mix(uBackground, band, pow(t, 0.65));
    color += uGlow * glow * t;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function JuliaVisualization({
  c,
  nextC = c,
  morph = 0,
  zoom = 1.2,
  maxIterations = 128,
  escapeRadius = 4,
  colorSoftness = 0,
  timeScale = 1,
  className,
}: JuliaVisualizationProps) {
  const [mountRef, visible] = useVisibilityPause<HTMLDivElement>();
  const materialRef = useRef<ShaderMaterial | null>(null);
  const visibleRef = useRef(visible);
  const cssValues = useThemeCssVars(VAR_NAMES);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const [backgroundCss, innerCss, outerCss, glowCss] = cssValues;

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return;
    }

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    mount.appendChild(canvas);

    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(width, height) },
        uC: { value: new Vector2(...c) },
        uNextC: { value: new Vector2(...nextC) },
        uMorph: { value: morph },
        uBackground: { value: new Vector3(...DEFAULT_BG) },
        uInner: { value: new Vector3(...DEFAULT_INNER) },
        uOuter: { value: new Vector3(...DEFAULT_OUTER) },
        uGlow: { value: new Vector3(...DEFAULT_GLOW) },
        uZoom: { value: zoom },
        uMaxIterations: { value: maxIterations },
        uEscapeRadius: { value: escapeRadius },
        uTimeScale: { value: timeScale },
      },
    });
    materialRef.current = material;

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      if (!visibleRef.current) {
        lastTime = now;
        rafId = requestAnimationFrame(animate);
        return;
      }
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
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;
    resizeObserver?.observe(mount);
    handleResize();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentElement === mount) {
        mount.removeChild(canvas);
      }
      materialRef.current = null;
    };
    // Mount once; prop sync and theme sync live in separate effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uC.value.set(c[0], c[1]);
    material.uniforms.uNextC.value.set(nextC[0], nextC[1]);
    material.uniforms.uMorph.value = morph;
    material.uniforms.uZoom.value = zoom;
    material.uniforms.uMaxIterations.value = maxIterations;
    material.uniforms.uEscapeRadius.value = escapeRadius;
    material.uniforms.uTimeScale.value = timeScale;
  }, [c, nextC, morph, zoom, maxIterations, escapeRadius, timeScale]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    const background = cssColorToRgb(backgroundCss || "#0c0a08");
    const inner = cssColorToRgb(innerCss || "#e8cf7a");
    const outer = cssColorToRgb(outerCss || "#c9a227");
    const glow = cssColorToRgb(glowCss || "#c9a227");

    const softInner = mixRgb(inner, background, colorSoftness * 0.85);
    const softOuter = mixRgb(outer, background, colorSoftness);
    const softGlow = mixRgb(glow, background, colorSoftness);

    material.uniforms.uBackground.value.set(...background);
    material.uniforms.uInner.value.set(...softInner);
    material.uniforms.uOuter.value.set(...softOuter);
    material.uniforms.uGlow.value.set(...softGlow);
  }, [backgroundCss, innerCss, outerCss, glowCss, colorSoftness]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
