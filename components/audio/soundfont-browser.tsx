"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GM_INSTRUMENT_CATEGORIES,
  SOUND_FONT_KITS,
  getPresetLabel,
  type AudioPreset,
  type SoundFontKit,
} from "@/lib/audio-presets";

// smplr exports are only safe in the browser.
let smplrHelpers:
  | {
      getSoundfontKits: () => string[];
      getSoundfontNames: () => string[];
      getElectricPianoNames: () => string[];
      getMalletNames: () => string[];
    }
  | null = null;

async function loadSmplrHelpers() {
  if (smplrHelpers) return smplrHelpers;
  const smplr = await import("smplr");
  smplrHelpers = {
    getSoundfontKits: smplr.getSoundfontKits,
    getSoundfontNames: smplr.getSoundfontNames,
    getElectricPianoNames: smplr.getElectricPianoNames,
    getMalletNames: smplr.getMalletNames,
  };
  return smplrHelpers;
}

type BrowserItem = {
  id: AudioPreset;
  label: string;
  category: string;
  kind: "soundfont" | "electric-piano" | "mallet";
};

const CATEGORY_ORDER = [
  "All",
  "Acoustic Pianos",
  "Electric Pianos",
  "Organs & Vintage Keys",
  "Guitars",
  "Basses",
  "Strings",
  "Ensemble",
  "Brass",
  "Reed",
  "Pipe",
  "Synths",
  "Mallets & Bells",
  "Ethnic",
  "Percussive",
  "Sound Effects",
];

type SoundfontBrowserProps = {
  activePreset: AudioPreset;
  onSelect: (preset: AudioPreset) => void;
};

export function SoundfontBrowser({
  activePreset,
  onSelect,
}: SoundfontBrowserProps) {
  const [items, setItems] = useState<BrowserItem[]>([]);
  const [category, setCategory] = useState("All");
  const [kit, setKit] = useState<SoundFontKit>("MusyngKite");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadSmplrHelpers()
      .then((helpers) => {
        if (cancelled) return;
        const soundfontItems: BrowserItem[] = helpers
          .getSoundfontNames()
          .map((instrument) => ({
            id: `sf:${kit}:${instrument}`,
            label: getPresetLabel(`sf:${kit}:${instrument}`),
            category: GM_INSTRUMENT_CATEGORIES[instrument] ?? "Other",
            kind: "soundfont",
          }));

        const electricItems: BrowserItem[] = helpers
          .getElectricPianoNames()
          .map((instrument) => ({
            id: `ep:${instrument}`,
            label: instrument,
            category: "Electric Pianos",
            kind: "electric-piano",
          }));

        const malletItems: BrowserItem[] = helpers
          .getMalletNames()
          .map((instrument) => ({
            id: `mallet:${instrument}`,
            label: instrument,
            category: "Mallets & Bells",
            kind: "mallet",
          }));

        setItems([...soundfontItems, ...electricItems, ...malletItems]);
      })
      .catch(() => {
        // Ignore — the browser simply stays empty.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kit]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;
      const matchesSearch =
        !term || item.label.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [items, category, search]);

  const isGmCategory = category !== "Electric Pianos" && category !== "Mallets & Bells";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instruments…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
            data-testid="audio-browser-search"
          />
        </div>
        {isGmCategory && (
          <select
            value={kit}
            onChange={(e) => setKit(e.target.value as SoundFontKit)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            data-testid="audio-browser-kit"
          >
            {SOUND_FONT_KITS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        data-testid="audio-browser-categories"
      >
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs transition-colors",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:border-primary/50"
            )}
            data-testid={`audio-browser-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading catalog…</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No instruments found.</p>
      ) : (
        <div className="grid max-h-80 gap-2 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
          {filteredItems.map((item) => {
            const isActive = activePreset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  "hover:border-primary/50 hover:bg-card/80",
                  isActive && "border-primary/50 bg-primary/5 ring-1 ring-primary"
                )}
                data-testid={`audio-browser-item-${item.id}`}
              >
                <span className="text-foreground">{item.label}</span>
                {isActive && (
                  <span className="text-xs text-primary">Active</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
