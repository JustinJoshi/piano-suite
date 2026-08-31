import type { Metadata } from "next";
import { Inter, Fraunces, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AmbientEffectsHost } from "@/components/ambient/ambient-effects-host";
import { FaviconHost } from "@/components/brand/favicon-host";
import { AmbientEffectsProvider } from "@/hooks/useAmbientEffects";
import { AudioEngineHost } from "@/components/audio/audio-engine-host";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import { ExperimentalFeaturesProvider } from "@/hooks/useExperimentalFeatures";
import { MusicPlayerProvider } from "@/hooks/useMusicPlayer";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { defaultTheme, themeIds } from "@/lib/themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Canonical origin for metadata (OG, canonical URLs). Set
// NEXT_PUBLIC_SITE_URL to the production domain in Vercel; the localhost
// fallback keeps dev builds honest instead of emitting a wrong canonical.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  title: "Piano Suite",
  description:
    "A piano practice suite that connects Anki reviews to a MIDI keyboard so you drill chords with spaced repetition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
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
