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
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Fraunces is the display face. Loading its optical-size, softness, and
// "wonk" axes lets `.font-heading` (globals.css) dial in an engraved,
// sheet-music feel instead of a flat web serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK", "opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Canonical origin for metadata (OG, canonical URLs). Prefers
// NEXT_PUBLIC_SITE_URL, then Vercel's deployment origin, then localhost.
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
