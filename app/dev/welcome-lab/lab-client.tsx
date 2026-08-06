"use client";

import { useCallback, useState } from "react";
import { Smartphone, Monitor, RotateCcw, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { WelcomeContent } from "@/components/welcome/welcome-content";
import { OnboardingContent } from "@/components/tools/onboarding/onboarding-content";
import { OnboardingShell } from "@/components/tools/onboarding/onboarding-shell";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import {
  defaultWelcomeConfig,
  type WelcomeConfig,
  type WelcomeFeatureSectionConfig,
  type WelcomeOnboardingPillarConfig,
} from "@/lib/welcome-config";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string };

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  );
}

function HeroControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { hero } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Hero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleField
          label="Show eyebrow"
          checked={hero.showEyebrow}
          onChange={(showEyebrow) => updateConfig({ hero: { ...hero, showEyebrow } })}
        />
        <TextField
          label="Eyebrow"
          value={hero.eyebrow}
          onChange={(eyebrow) => updateConfig({ hero: { ...hero, eyebrow } })}
        />
        <TextAreaField
          label="Headline"
          value={hero.headline}
          onChange={(headline) => updateConfig({ hero: { ...hero, headline } })}
          rows={2}
        />
        <TextAreaField
          label="Subheadline"
          value={hero.subheadline}
          onChange={(subheadline) => updateConfig({ hero: { ...hero, subheadline } })}
          rows={2}
        />
        <TextField
          label="CTA text"
          value={hero.ctaText}
          onChange={(ctaText) => updateConfig({ hero: { ...hero, ctaText } })}
        />
        <SelectField
          label="Alignment"
          value={hero.align}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
          ]}
          onChange={(align) =>
            updateConfig({ hero: { ...hero, align: align as "left" | "center" } })
          }
        />
      </CardContent>
    </Card>
  );
}

function StyleControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { styleTokens } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Style tokens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SelectField
          label="Section spacing"
          value={styleTokens.sectionSpacing}
          options={[
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "spacious", label: "Spacious" },
          ]}
          onChange={(sectionSpacing) =>
            updateConfig({
              styleTokens: { ...styleTokens, sectionSpacing: sectionSpacing as WelcomeConfig["styleTokens"]["sectionSpacing"] },
            })
          }
        />
        <SelectField
          label="Card radius"
          value={styleTokens.cardRadius}
          options={[
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
            { value: "xl", label: "Extra large" },
            { value: "2xl", label: "2x large" },
          ]}
          onChange={(cardRadius) =>
            updateConfig({
              styleTokens: { ...styleTokens, cardRadius: cardRadius as WelcomeConfig["styleTokens"]["cardRadius"] },
            })
          }
        />
        <SelectField
          label="Heading font"
          value={styleTokens.headingFont}
          options={[
            { value: "heading", label: "Fraunces (heading)" },
            { value: "sans", label: "Inter (sans)" },
            { value: "mono", label: "Geist Mono" },
          ]}
          onChange={(headingFont) =>
            updateConfig({
              styleTokens: { ...styleTokens, headingFont: headingFont as WelcomeConfig["styleTokens"]["headingFont"] },
            })
          }
        />
        <SelectField
          label="Body font"
          value={styleTokens.bodyFont}
          options={[
            { value: "sans", label: "Inter (sans)" },
            { value: "heading", label: "Fraunces (heading)" },
            { value: "mono", label: "Geist Mono" },
          ]}
          onChange={(bodyFont) =>
            updateConfig({
              styleTokens: { ...styleTokens, bodyFont: bodyFont as WelcomeConfig["styleTokens"]["bodyFont"] },
            })
          }
        />
        <SelectField
          label="Background effect"
          value={styleTokens.backgroundEffect}
          options={[
            { value: "none", label: "None" },
            { value: "subtle-glow", label: "Subtle glow" },
            { value: "orb", label: "Orb" },
            { value: "beam", label: "Beam" },
          ]}
          onChange={(backgroundEffect) =>
            updateConfig({
              styleTokens: { ...styleTokens, backgroundEffect: backgroundEffect as WelcomeConfig["styleTokens"]["backgroundEffect"] },
            })
          }
        />
      </CardContent>
    </Card>
  );
}

function FeatureControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { features } = config;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const section = features.sections[selectedIndex];

  const updateSection = useCallback(
    (patch: Partial<WelcomeFeatureSectionConfig>) => {
      const next = [...features.sections];
      next[selectedIndex] = { ...section, ...patch };
      updateConfig({ features: { ...features, sections: next } });
    },
    [features, selectedIndex, section, updateConfig]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Feature sections</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SelectField
          label="Card style"
          value={features.cardStyle}
          options={[
            { value: "filled", label: "Filled" },
            { value: "transparent", label: "Transparent" },
            { value: "gradient", label: "Gradient" },
          ]}
          onChange={(cardStyle) =>
            updateConfig({
              features: { ...features, cardStyle: cardStyle as WelcomeConfig["features"]["cardStyle"] },
            })
          }
        />
        <SelectField
          label="Density"
          value={features.density}
          options={[
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "spacious", label: "Spacious" },
          ]}
          onChange={(density) =>
            updateConfig({
              features: { ...features, density: density as WelcomeConfig["features"]["density"] },
            })
          }
        />
        <Separator />
        <SelectField
          label="Editing section"
          value={String(selectedIndex)}
          options={features.sections.map((s, i) => ({
            value: String(i),
            label: `${s.number} — ${s.title}`,
          }))}
          onChange={(value) => setSelectedIndex(Number(value))}
        />
        {section ? (
          <div className="space-y-3">
            <TextField
              label="Number"
              value={section.number}
              onChange={(number) => updateSection({ number })}
            />
            <TextField
              label="Label"
              value={section.label}
              onChange={(label) => updateSection({ label })}
            />
            <TextAreaField
              label="Title"
              value={section.title}
              onChange={(title) => updateSection({ title })}
              rows={2}
            />
            <TextAreaField
              label="Body paragraphs (one per line)"
              value={section.body.join("\n")}
              onChange={(value) => updateSection({ body: value.split("\n").filter(Boolean) })}
              rows={5}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FlowControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { flow } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Flow diagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SelectField
          label="Layout"
          value={flow.layout}
          options={[
            { value: "auto", label: "Auto (vertical on mobile)" },
            { value: "horizontal", label: "Horizontal" },
            { value: "vertical", label: "Vertical" },
          ]}
          onChange={(layout) =>
            updateConfig({ flow: { ...flow, layout: layout as WelcomeConfig["flow"]["layout"] } })
          }
        />
        <TextAreaField
          label="Steps (label|text per line)"
          value={flow.steps.map((s) => `${s.label}|${s.text}`).join("\n")}
          onChange={(value) =>
            updateConfig({
              flow: {
                ...flow,
                steps: value
                  .split("\n")
                  .filter(Boolean)
                  .map((line, i) => {
                    const [label, ...rest] = line.split("|");
                    return {
                      id: `step-${i}`,
                      label: label ?? "",
                      text: rest.join("|"),
                    };
                  }),
              },
            })
          }
          rows={5}
        />
      </CardContent>
    </Card>
  );
}

function DeckControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { decks } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Deck downloads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SelectField
          label="Button variant"
          value={decks.variant}
          options={[
            { value: "outline", label: "Outline" },
            { value: "solid", label: "Solid" },
            { value: "ghost", label: "Ghost" },
          ]}
          onChange={(variant) =>
            updateConfig({ decks: { ...decks, variant: variant as WelcomeConfig["decks"]["variant"] } })
          }
        />
        <TextAreaField
          label="Decks (label|href per line)"
          value={decks.items.map((d) => `${d.label}|${d.href}`).join("\n")}
          onChange={(value) =>
            updateConfig({
              decks: {
                ...decks,
                items: value
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => {
                    const [label, ...rest] = line.split("|");
                    return { label: label ?? "", href: rest.join("|") };
                  }),
              },
            })
          }
          rows={3}
        />
      </CardContent>
    </Card>
  );
}

function ToolsGridControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { toolsGrid } = config;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Tools grid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TextField
          label="Eyebrow"
          value={toolsGrid.eyebrow}
          onChange={(eyebrow) => updateConfig({ toolsGrid: { ...toolsGrid, eyebrow } })}
        />
        <TextField
          label="Title"
          value={toolsGrid.title}
          onChange={(title) => updateConfig({ toolsGrid: { ...toolsGrid, title } })}
        />
        <TextAreaField
          label="Subtitle"
          value={toolsGrid.subtitle}
          onChange={(subtitle) => updateConfig({ toolsGrid: { ...toolsGrid, subtitle } })}
          rows={2}
        />
      </CardContent>
    </Card>
  );
}

function OnboardingControls() {
  const { config, updateConfig } = useWelcomeConfig();
  const { onboarding } = config;
  const [selectedPillar, setSelectedPillar] = useState(0);
  const pillar = onboarding.pillars[selectedPillar];

  const updatePillar = useCallback(
    (patch: Partial<WelcomeOnboardingPillarConfig>) => {
      const next = [...onboarding.pillars];
      next[selectedPillar] = { ...pillar, ...patch };
      updateConfig({ onboarding: { ...onboarding, pillars: next } });
    },
    [onboarding, selectedPillar, pillar, updateConfig]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Onboarding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TextField
          label="Hi text"
          value={onboarding.intro.hi}
          onChange={(hi) =>
            updateConfig({ onboarding: { ...onboarding, intro: { ...onboarding.intro, hi } } })
          }
        />
        <TextField
          label="Welcome text"
          value={onboarding.intro.welcome}
          onChange={(welcome) =>
            updateConfig({ onboarding: { ...onboarding, intro: { ...onboarding.intro, welcome } } })
          }
        />
        <TextAreaField
          label="Pillars overview"
          value={onboarding.pillarsOverview}
          onChange={(pillarsOverview) =>
            updateConfig({ onboarding: { ...onboarding, pillarsOverview } })
          }
          rows={2}
        />
        <TextField
          label="Closing text"
          value={onboarding.closing}
          onChange={(closing) => updateConfig({ onboarding: { ...onboarding, closing } })}
        />
        <TextField
          label="CTA text"
          value={onboarding.cta}
          onChange={(cta) => updateConfig({ onboarding: { ...onboarding, cta } })}
        />
        <SelectField
          label="Resource card style"
          value={onboarding.resourceCardVariant}
          options={[
            { value: "image-card", label: "Image card" },
            { value: "compact-list", label: "Compact list" },
          ]}
          onChange={(resourceCardVariant) =>
            updateConfig({
              onboarding: {
                ...onboarding,
                resourceCardVariant: resourceCardVariant as WelcomeConfig["onboarding"]["resourceCardVariant"],
              },
            })
          }
        />
        <Separator />
        <SelectField
          label="Editing pillar"
          value={String(selectedPillar)}
          options={onboarding.pillars.map((p, i) => ({
            value: String(i),
            label: p.headline,
          }))}
          onChange={(value) => setSelectedPillar(Number(value))}
        />
        {pillar ? (
          <div className="space-y-3">
            <TextField
              label="Headline"
              value={pillar.headline}
              onChange={(headline) => updatePillar({ headline })}
            />
            <TextAreaField
              label="Body (one paragraph per line)"
              value={pillar.body.join("\n")}
              onChange={(value) =>
                updatePillar({ body: value.split("\n").filter(Boolean) })
              }
              rows={5}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LabControls() {
  return (
    <div className="space-y-4">
      <HeroControls />
      <StyleControls />
      <FeatureControls />
      <FlowControls />
      <DeckControls />
      <ToolsGridControls />
      <OnboardingControls />
    </div>
  );
}

function OnboardingPreview() {
  const { config } = useWelcomeConfig();
  const [slide, setSlide] = useState(0);
  const totalSlides = 2 + config.onboarding.pillars.length + 1;

  return (
    <OnboardingShell visible isInstant mode="inline">
      <div className="relative">
        <OnboardingContent
          currentSlide={slide}
          isInstant
          onNext={() => setSlide((s) => Math.min(s + 1, totalSlides - 1))}
          onPrevious={() => setSlide((s) => Math.max(s - 1, 0))}
          onComplete={() => setSlide(0)}
        />
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setSlide(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === slide
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}

export function WelcomeLab() {
  const [config, setConfig] = useState<WelcomeConfig>(() => defaultWelcomeConfig);
  const [mobile, setMobile] = useState(false);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "welcome-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config]);

  return (
    <WelcomeConfigProvider value={config} onChange={setConfig}>
      <div className="flex h-screen flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
          <h1 className="font-heading text-lg font-semibold text-foreground">
            Welcome Style Lab
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={mobile ? "default" : "outline"}
              size="sm"
              onClick={() => setMobile(true)}
              aria-label="Mobile preview"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={!mobile ? "default" : "outline"}
              size="sm"
              onClick={() => setMobile(false)}
              aria-label="Desktop preview"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfig(defaultWelcomeConfig)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-full max-w-sm overflow-y-auto border-r border-border bg-card/30 p-4 sm:w-80 lg:w-96">
            <LabControls />
          </aside>
          <main className="flex-1 overflow-y-auto bg-background p-4">
            <div
              className={cn(
                "mx-auto transition-all",
                mobile
                  ? "max-w-[375px] border-x border-border shadow-2xl"
                  : "max-w-full"
              )}
            >
              <div className="relative">
                <WelcomeContent />
              </div>
              <div className="relative mt-8 h-[80vh] border-y border-border">
                <OnboardingPreview />
              </div>
            </div>
          </main>
        </div>
      </div>
    </WelcomeConfigProvider>
  );
}
