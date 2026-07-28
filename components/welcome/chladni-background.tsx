"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  buildModeSequence,
  cssColorToRgb,
  lerp,
  smoothstep,
} from "@/lib/chladni";
import { useThemeCssVars } from "@/hooks/useThemeCssVars";

// ============================================================
// CHLADNI ANIMATED BACKGROUND — Piano Suite Edition (Three.js)
// ============================================================
// A full-screen WebGL shader that evaluates the square-plate Chladni
// function per fragment. Sand-like nodal lines morph between curated
// (m, n) modes while reading colors from the active theme tokens.
//
// Settings match the original canvas generator:
//   MORPH_SPEED = 25
//   LINE_THICKNESS = 30
//   ZOOM_SCALE = 233
//   COMPLEXITY = 15
// ============================================================

const MORPH_SPEED = 25;
const LINE_THICKNESS = 30;
const ZOOM_SCALE = 233;
const COMPLEXITY = 15;

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

  varying vec2 vUv;

  const float PI = 3.14159265359;

  float chladni(vec2 p, vec2 mn) {
    float a = cos(mn.y * PI * p.x) * cos(mn.x * PI * p.y);
    float b = cos(mn.x * PI * p.x) * cos(mn.y * PI * p.y);
    return a - b;
  }

  void main() {
    // Pixel coordinates with aspect correction.
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    vec2 p = uv * uZoom;

    float breathe = sin(uTime * 0.0008) * 0.2;
    vec2 current = uMode + vec2(breathe);
    vec2 next = uNextMode + vec2(breathe * 0.6);
    float t = smoothstep(0.0, 1.0, uMorph);
    vec2 mode = mix(current, next, t);

    vec2 secondary = mode + vec2(1.0, 2.0)
      + vec2(sin(uTime * 0.0005), cos(uTime * 0.0007)) * 2.0;
    float blend = 0.15 + 0.1 * sin(uTime * 0.001);

    float val = chladni(p, mode) * (1.0 - blend)
              + chladni(p, secondary) * blend;

    float line = smoothstep(uThreshold, 0.0, abs(val));

    // Radial gradient for line color: brighter in the center,
    // shifting toward the outer brand color at the edges.
    float edge = clamp(length(uv) * 0.5, 0.0, 1.0);
    vec3 lineColor = mix(uLineInner, uLineOuter, edge * 0.3);

    vec3 color = mix(uBackground, lineColor, line);

    // Subtle center glow.
    float glow = exp(-length(uv) * 3.0) * 0.08;
    color += uGlow * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function ChladniBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const cssValues = useThemeCssVars(VAR_NAMES);

  const [backgroundCss, innerCss, outerCss, glowCss] = cssValues;

  // Initialize the WebGL scene once.
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      // WebGL unavailable: leave the container empty so the static hero
      // gradient and content remain visible.
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMode: { value: new THREE.Vector2(5, 7) },
        uNextMode: { value: new THREE.Vector2(5, 7) },
        uMorph: { value: 0 },
        uBackground: { value: new THREE.Vector3(...DEFAULT_BG) },
        uLineInner: { value: new THREE.Vector3(...DEFAULT_INNER) },
        uLineOuter: { value: new THREE.Vector3(...DEFAULT_OUTER) },
        uGlow: { value: new THREE.Vector3(...DEFAULT_GLOW) },
        uZoom: { value: ZOOM_SCALE / 100 },
        uThreshold: { value: 0.015 + LINE_THICKNESS / 400 },
      },
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mode sequence state.
    const modeSequence = buildModeSequence(COMPLEXITY);
    let modeIndex = 0;
    let currentM = modeSequence[0][0];
    let currentN = modeSequence[0][1];
    let targetM = currentM;
    let targetN = currentN;
    let transitionProgress = 0;
    const transitionSpeed = 0.0003 + (MORPH_SPEED / 100) * 0.006;

    function pickNextMode() {
      modeIndex = (modeIndex + 1) % modeSequence.length;
      targetM = modeSequence[modeIndex][0];
      targetN = modeSequence[modeIndex][1];
      transitionProgress = 0;
    }

    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      material.uniforms.uTime.value += delta;

      transitionProgress += transitionSpeed;
      if (transitionProgress >= 1) {
        currentM = targetM;
        currentN = targetN;
        pickNextMode();
        transitionProgress = 0;
      }

      const t = smoothstep(transitionProgress);
      material.uniforms.uMode.value.set(
        lerp(currentM, targetM, t),
        lerp(currentN, targetN, t)
      );
      material.uniforms.uMorph.value = t;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    function handleResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      material.uniforms.uResolution.value.set(w, h);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      materialRef.current = null;
    };
  }, []);

  // Sync theme colors whenever the CSS custom properties change.
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uBackground.value.set(
      ...cssColorToRgb(backgroundCss || "#0c0a08")
    );
    material.uniforms.uLineInner.value.set(
      ...cssColorToRgb(innerCss || "#e8cf7a")
    );
    material.uniforms.uLineOuter.value.set(
      ...cssColorToRgb(outerCss || "#c9a227")
    );
    material.uniforms.uGlow.value.set(
      ...cssColorToRgb(glowCss || "#c9a227")
    );
  }, [backgroundCss, innerCss, outerCss, glowCss]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 -z-10"
      aria-hidden="true"
    />
  );
}
