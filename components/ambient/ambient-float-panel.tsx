"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  AMBIENT_EFFECT_LABELS,
  type AmbientFloatKind,
  type AmbientFloatSettings,
} from "@/lib/ambient-effects";
import { AmbientEffectRenderer } from "@/components/ambient/ambient-effect-renderer";
import { cn } from "@/lib/utils";

const MIN_W_PX = 180;
const MIN_H_PX = 120;

type PixelRect = { x: number; y: number; w: number; h: number };

function normalizedToPixels(
  rect: AmbientFloatSettings["rect"],
  vw: number,
  vh: number
): PixelRect {
  return {
    x: rect.x * vw,
    y: rect.y * vh,
    w: Math.max(MIN_W_PX, rect.w * vw),
    h: Math.max(MIN_H_PX, rect.h * vh),
  };
}

function pixelsToNormalized(
  rect: PixelRect,
  vw: number,
  vh: number
): AmbientFloatSettings["rect"] {
  return {
    x: rect.x / vw,
    y: rect.y / vh,
    w: rect.w / vw,
    h: rect.h / vh,
  };
}

function clampRect(rect: PixelRect, vw: number, vh: number): PixelRect {
  const w = Math.min(Math.max(rect.w, MIN_W_PX), vw);
  const h = Math.min(Math.max(rect.h, MIN_H_PX), vh);
  const x = Math.min(Math.max(rect.x, 0), vw - w);
  const y = Math.min(Math.max(rect.y, 0), vh - h);
  return { x, y, w, h };
}

function initialPixelRect(rect: AmbientFloatSettings["rect"]): PixelRect {
  if (typeof window === "undefined") {
    return { x: 100, y: 100, w: 320, h: 240 };
  }
  return clampRect(
    normalizedToPixels(rect, window.innerWidth, window.innerHeight),
    window.innerWidth,
    window.innerHeight
  );
}

export type AmbientFloatPanelProps = {
  kind: AmbientFloatKind;
  rect: AmbientFloatSettings["rect"];
  onRectChange: (rect: AmbientFloatSettings["rect"]) => void;
  onClose: () => void;
};

/**
 * Draggable / resizable in-page float panel hosting an ambient visualization.
 *
 * Pixel geometry is local during drag/resize; normalized rect is persisted on
 * pointer-up. Parent should remount (key) when applying a new saved rect.
 */
export function AmbientFloatPanel({
  kind,
  rect,
  onRectChange,
  onClose,
}: AmbientFloatPanelProps) {
  const [pixelRect, setPixelRect] = useState<PixelRect>(() =>
    initialPixelRect(rect)
  );
  const pixelRectRef = useRef(pixelRect);
  const draggingRef = useRef(false);

  useEffect(() => {
    pixelRectRef.current = pixelRect;
  }, [pixelRect]);

  useEffect(() => {
    function onResize() {
      if (draggingRef.current) return;
      setPixelRect((prev) =>
        clampRect(prev, window.innerWidth, window.innerHeight)
      );
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const persistRect = useCallback(() => {
    const current = pixelRectRef.current;
    onRectChange(
      pixelsToNormalized(current, window.innerWidth, window.innerHeight)
    );
  }, [onRectChange]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      draggingRef.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const origin = { ...pixelRectRef.current };

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        setPixelRect(
          clampRect(
            { ...origin, x: origin.x + dx, y: origin.y + dy },
            window.innerWidth,
            window.innerHeight
          )
        );
      }

      function onUp() {
        draggingRef.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        persistRect();
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [persistRect]
  );

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;
      const startX = e.clientX;
      const startY = e.clientY;
      const origin = { ...pixelRectRef.current };

      function onMove(ev: PointerEvent) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        setPixelRect(
          clampRect(
            {
              ...origin,
              w: origin.w + dx,
              h: origin.h + dy,
            },
            window.innerWidth,
            window.innerHeight
          )
        );
      }

      function onUp() {
        draggingRef.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        persistRect();
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [persistRect]
  );

  return (
    <div
      className={cn(
        "fixed z-20 flex flex-col overflow-hidden rounded-xl",
        "border border-border bg-card/90 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md"
      )}
      style={{
        left: pixelRect.x,
        top: pixelRect.y,
        width: pixelRect.w,
        height: pixelRect.h,
      }}
      data-testid="ambient-float-panel"
      data-kind={kind}
    >
      <div
        className="flex h-9 shrink-0 cursor-grab items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 active:cursor-grabbing"
        onPointerDown={startDrag}
        data-testid="ambient-float-drag-handle"
      >
        <span className="truncate text-xs font-medium text-foreground">
          {AMBIENT_EFFECT_LABELS[kind]}
        </span>
        <button
          type="button"
          aria-label="Close ambient float panel"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-background">
        <AmbientEffectRenderer
          kind={kind}
          className="h-full w-full"
          resolutionScale={2}
        />
      </div>

      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        onPointerDown={startResize}
        data-testid="ambient-float-resize-handle"
        aria-hidden="true"
      >
        <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-muted-foreground/60" />
      </div>
    </div>
  );
}
