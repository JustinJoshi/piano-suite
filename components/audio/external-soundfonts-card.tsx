"use client";

import { ExternalLink } from "lucide-react";

const EXTERNAL_LIBRARIES = [
  {
    name: "Polyphone Soundfont Library",
    description: "Browse and download curated GM and specialty soundfonts.",
    href: "https://polyphone-soundfonts.com/",
  },
  {
    name: "Musical Artifacts",
    description: "Community-hosted soundfonts and sample packs.",
    href: "https://musical-artifacts.com/artifacts?tags=soundfont",
  },
  {
    name: "Zanderjaz Soundfonts",
    description: "A large collection of free GM soundfonts.",
    href: "https://zanderjaz.com/soundfonts/",
  },
  {
    name: "gleitz/midi-js-soundfonts",
    description: "GitHub repository of pre-rendered GM instruments used by smplr.",
    href: "https://github.com/gleitz/midi-js-soundfonts",
  },
  {
    name: "smpldsnds",
    description: "Samples and soundfonts for the smplr ecosystem.",
    href: "https://smpldsnds.github.io/",
  },
];

export function ExternalSoundfontsCard() {
  return (
    <ul className="space-y-3">
      {EXTERNAL_LIBRARIES.map((lib) => (
        <li key={lib.href}>
          <a
            href={lib.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-card/80"
          >
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {lib.name}
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {lib.description}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
