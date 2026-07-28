"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cssColorToRgb, mixRgb } from "@/lib/chladni";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";
import type { WaveRecipe } from "@/lib/quasiperiodic";

// ============================================================
// QUASIPERIODIC VISUALIZATION — Reusable WebGL shader component
// ============================================================
// N-fold plane-wave interference field with soft nodal contours.
// Parent owns recipes, morph, zoom, thickness; this owns Three.js.
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

export type QuasiperiodicVisualizationProps = {
  recipe: WaveRecipe;
  nextRecipe?: WaveRecipe;
  morph?: number;
  lineThickness?: number;
  zoom?: number;
  breathe?: number;
  timeScale?: number;
  lineIntensity?: number;
  colorSoftness?: number;
  patternColor?: string | null;
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
  uniform float uFoldsA;
  uniform float uFreqA;
  uniform float uPhaseA;
  uniform float uFoldsB;
  uniform float uFreqB;
  uniform float uPhaseB;
  uniform float uMorph;
  uniform vec3 uBackground;
  uniform vec3 uLineInner;
  uniform vec3 uLineOuter;
  uniform vec3 uGlow;
  uniform float uZoom;
  uniform float uThreshold;
  uniform float uBreathe;
  uniform float uTimeScale;
  uniform float uLineIntensity;

  varying vec2 vUv;

  const float PI = 3.14159265359;
  const int MAX_FOLDS = 12;

  float quasiField(vec2 p, float folds, float freq, float phase) {
    float sum = 0.0;
    int n = int(floor(folds + 0.5));
    n = clamp(n, 3, MAX_FOLDS);
    for (int i = 0; i < MAX_FOLDS; i++) {
      if (i >= n) break;
      float theta = float(i) * PI / float(n);
      vec2 dir = vec2(cos(theta), sin(theta));
      sum += cos(freq * dot(p, dir) + phase);
    }
    return sum;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    vec2 p = uv * uZoom;

    float breathe = sin(uTime * 0.0008 * uTimeScale) * uBreathe;
    float phaseA = uPhaseA + breathe;
    float phaseB = uPhaseB + breathe * 0.7;

    float a = quasiField(p, uFoldsA, uFreqA, phaseA);
    float b = quasiField(p, uFoldsB, uFreqB, phaseB);
    float val = mix(a, b, uMorph);

    float line = smoothstep(uThreshold, 0.0, abs(val));

    float edge = clamp(length(uv) * 0.5, 0.0, 1.0);
    vec3 lineColor = mix(uLineInner, uLineOuter, edge * 0.3);

    vec3 color = mix(uBackground, lineColor, line * uLineIntensity);

    float glow = exp(-length(uv) * 3.0) * 0.08 * uLineIntensity;
    color += uGlow * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function QuasiperiodicVisualization({
  recipe,
  nextRecipe = recipe,
  morph = 0,
  lineThickness = 30,
  zoom = 2.33,
  breathe = 0.2,
  timeScale = 1,
  lineIntensity = 1,
  colorSoftness = 0,
  patternColor = null,
  className,
}: QuasiperiodicVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const cssValues = useThemeCssVars(VAR_NAMES);

  const [backgroundCss, innerCss, outerCss, glowCss] = cssValues;

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
      return;
    }

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
        uFoldsA: { value: recipe.folds },
        uFreqA: { value: recipe.frequency },
        uPhaseA: { value: recipe.phase },
        uFoldsB: { value: nextRecipe.folds },
        uFreqB: { value: nextRecipe.frequency },
        uPhaseB: { value: nextRecipe.phase },
        uMorph: { value: morph },
        uBackground: { value: new THREE.Vector3(...DEFAULT_BG) },
        uLineInner: { value: new THREE.Vector3(...DEFAULT_INNER) },
        uLineOuter: { value: new THREE.Vector3(...DEFAULT_OUTER) },
        uGlow: { value: new THREE.Vector3(...DEFAULT_GLOW) },
        uZoom: { value: zoom },
        uThreshold: { value: 0.015 + lineThickness / 400 },
        uBreathe: { value: breathe },
        uTimeScale: { value: timeScale },
        uLineIntensity: { value: lineIntensity },
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
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentElement === mount) {
        mount.removeChild(canvas);
      }
      materialRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uFoldsA.value = recipe.folds;
    material.uniforms.uFreqA.value = recipe.frequency;
    material.uniforms.uPhaseA.value = recipe.phase;
    material.uniforms.uFoldsB.value = nextRecipe.folds;
    material.uniforms.uFreqB.value = nextRecipe.frequency;
    material.uniforms.uPhaseB.value = nextRecipe.phase;
    material.uniforms.uMorph.value = morph;
    material.uniforms.uZoom.value = zoom;
    material.uniforms.uThreshold.value = 0.015 + lineThickness / 400;
    material.uniforms.uBreathe.value = breathe;
    material.uniforms.uTimeScale.value = timeScale;
    material.uniforms.uLineIntensity.value = lineIntensity;
  }, [
    recipe,
    nextRecipe,
    morph,
    lineThickness,
    zoom,
    breathe,
    timeScale,
    lineIntensity,
  ]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    const background = cssColorToRgb(backgroundCss || "#0c0a08");
    const override = patternColor?.trim() ? cssColorToRgb(patternColor) : null;
    const inner = override ?? cssColorToRgb(innerCss || "#e8cf7a");
    const outer = override ?? cssColorToRgb(outerCss || "#c9a227");
    const glow = override ?? cssColorToRgb(glowCss || "#c9a227");

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

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
