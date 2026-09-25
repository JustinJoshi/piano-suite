import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, Archivo, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientEffectsHost } from "@/components/ambient/ambient-effects-host";
import { FaviconHost } from "@/components/brand/favicon-host";
import { ThemeColorHost } from "@/components/brand/theme-color-host";
import { AmbientEffectsProvider } from "@/hooks/useAmbientEffects";
import { AudioEngineHost } from "@/components/audio/audio-engine-host";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import { ExperimentalFeaturesProvider } from "@/hooks/useExperimentalFeatures";
import { MusicPlayerProvider } from "@/hooks/useMusicPlayer";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { defaultTheme, themeIds } from "@/lib/themes";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./roll.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Newsreader is the roll's printed type: headings everywhere, and running
// text on public pages. Its optical-size axis gives a 72px headline the tight
// display cut and a 17px paragraph the open text cut.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// Archivo, condensed through its width axis, sets the roll's labels:
// roll numbers, tempo markings, button faces.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Canonical origin for metadata (OG, canonical URLs). Prefers
// the explicit site URL env var, then Vercel's deployment origin, then localhost.
const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: {
    // Child segments that set their own title get the brand suffix;
    // pages without a title fall back to the default.
    template: "%s · Piano Suite",
    default: "Piano Suite",
  },
  description:
    "A free workshop for building your own piano practice. Start with a ready-made drill, or snap components together into the session you need today.",
  openGraph: {
    title: "Piano Suite",
    description:
      "A free workshop for building your own piano practice. Start with a ready-made drill, or snap components together into the session you need today.",
    url: "/",
    siteName: "Piano Suite",
    images: ["/opengraph-image"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Piano Suite",
    description:
      "A free workshop for building your own piano practice. Start with a ready-made drill, or snap components together into the session you need today.",
  },
};

// First-paint browser chrome colour (the roll's paper). ThemeColorHost
// re-points it at the active preset once the client knows which one it is.
export const viewport: Viewport = {
  themeColor: "#efe6d3",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${archivo.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem={false}
          storageKey="piano-suite-theme"
          themes={[...themeIds]}
        >
          <ClerkProvider appearance={{ theme: shadcn }}>
            <ConvexClientProvider>
              <ExperimentalFeaturesProvider>
                <AudioSettingsProvider>
                  <AmbientEffectsProvider>
                    <MusicPlayerProvider>
                      <AnalyticsProvider>
                        <AmbientEffectsHost />
                        <AudioEngineHost />
                        <FaviconHost />
                        <ThemeColorHost />
                        {children}
                      </AnalyticsProvider>
                    </MusicPlayerProvider>
                  </AmbientEffectsProvider>
                </AudioSettingsProvider>
              </ExperimentalFeaturesProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
