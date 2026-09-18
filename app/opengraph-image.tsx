import { ImageResponse } from "next/og";
import {
  buildKeybedGeometry,
  FELT_HEIGHT,
  KEYBED_HEIGHT,
  WHITE_KEY_WIDTH,
  type KeybedKey,
} from "@/lib/keybed";

export const alt =
  "Piano Suite — a free workshop for building your own piano practice, with a decorative piano keybed along the bottom edge.";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

// Colours inlined from the :root block of app/globals.css. A generated
// PNG cannot read CSS custom properties at runtime, so this module is the
// one sanctioned place for colour literals.
const bg = "#0c0a08"; // --background
const foreground = "#efe8d6"; // --foreground
const mutedForeground = "#a99d87"; // --muted-foreground
const primary = "#d3ab2e"; // --primary
const ivory = "#f3ecd9"; // --ivory
const ebony = "#0b0a09"; // --ebony

const DESCRIPTION =
  "A free workshop for building your own piano practice. Start with a ready-made drill, or snap components together into the session you need today.";

// Keybed rendered from lib/keybed.ts geometry as absolutely-positioned divs
// (Satori supports flex + absolute positioning; the styled Keybed component
// itself is not guaranteed inside ImageResponse).
const geometry = buildKeybedGeometry(3);
const scale = 1200 / geometry.width;
const keybedHeight = KEYBED_HEIGHT * scale;
const feltHeight = FELT_HEIGHT * scale;

function Key({ kbd }: { kbd: KeybedKey }) {
  return (
    <div
      style={{
        position: "absolute",
        left: kbd.x * scale,
        top: kbd.y * scale,
        width: kbd.width * scale,
        height: kbd.height * scale,
        backgroundColor: kbd.width < WHITE_KEY_WIDTH ? ebony : ivory,
      }}
    />
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: bg,
          padding: "72px 80px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              color: primary,
              letterSpacing: "-0.02em",
            }}
          >
            Piano Suite
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              lineHeight: 1.4,
              color: foreground,
              maxWidth: 940,
            }}
          >
            {DESCRIPTION}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: mutedForeground,
            }}
          >
            piano-suite
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "relative",
            marginLeft: -80,
            width: 1200,
            height: keybedHeight,
            backgroundColor: bg,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: feltHeight,
              backgroundColor: primary,
            }}
          />
          {geometry.whiteKeys.map((kbd) => (
            <Key key={`w-${kbd.semitone}`} kbd={kbd} />
          ))}
          {geometry.blackKeys.map((kbd) => (
            <Key key={`b-${kbd.semitone}`} kbd={kbd} />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
