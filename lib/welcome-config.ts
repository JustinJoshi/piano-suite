/**
 * Content and style configuration for the public welcome page and the
 * `/tools` onboarding flow.
 *
 * The default object matches the current shipped copy. A dev lab can edit
 * this config interactively and persist it to localStorage.
 */

export type FontFamily = "heading" | "sans" | "mono";
export type CardStyle = "filled" | "transparent" | "gradient";
export type Density = "compact" | "default" | "spacious";
export type Radius = "sm" | "md" | "lg" | "xl" | "2xl";
export type BackgroundEffect = "none" | "subtle-glow" | "orb" | "beam";
export type FlowLayout = "auto" | "horizontal" | "vertical";
export type ResourceCardVariant = "image-card" | "compact-list";

export interface WelcomeHeroConfig {
  eyebrow: string;
  showEyebrow: boolean;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  align: "center" | "left";
}

export interface WelcomeFeatureSectionConfig {
  id: string;
  number: string;
  label: string;
  title: string;
  body: string[];
  tags?: string[];
}

export interface WelcomeFlowStepConfig {
  id: string;
  label: string;
  text: string;
}

export interface WelcomeDeckConfig {
  label: string;
  href: string;
}

export interface WelcomeOnboardingResourceConfig {
  id: string;
  title: string;
  description: string;
  href: string;
  imageSrc: string;
}

export interface WelcomeOnboardingPillarConfig {
  id: string;
  headline: string;
  body: string[];
  nextDelayMs: number;
  resources: WelcomeOnboardingResourceConfig[];
}

export interface WelcomeConfig {
  hero: WelcomeHeroConfig;
  features: {
    sections: WelcomeFeatureSectionConfig[];
    cardStyle: CardStyle;
    density: Density;
  };
  flow: {
    steps: WelcomeFlowStepConfig[];
    layout: FlowLayout;
  };
  decks: {
    items: WelcomeDeckConfig[];
    variant: "outline" | "solid" | "ghost";
  };
  toolsGrid: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    steps: WelcomeFlowStepConfig[];
  };
  templateStrip: {
    eyebrow: string;
    title: string;
    subtitle: string;
    browseHref: string;
  };
  onboarding: {
    intro: {
      hi: string;
      welcome: string;
    };
    pillarsOverview: string;
    pillars: WelcomeOnboardingPillarConfig[];
    closing: string;
    cta: string;
    resourceCardVariant: ResourceCardVariant;
  };
  styleTokens: {
    sectionSpacing: Density;
    cardRadius: Radius;
    headingFont: FontFamily;
    bodyFont: FontFamily;
    backgroundEffect: BackgroundEffect;
  };
}

export const defaultWelcomeConfig: WelcomeConfig = {
  hero: {
    eyebrow: "a free workshop for self-taught pianists",
    showEyebrow: true,
    headline: "Build your own piano practice — or grab a drill and start playing.",
    subheadline:
      "Snap metronome, timer, and chord blocks together into your own drills, start instantly from a starter template, and share what you build with other self-taught pianists.",
    ctaText: "Enter the Workshop",
    ctaHref: "/tools",
    align: "left",
  },
  features: {
    sections: [
      {
        id: "why-it-works",
        number: "01",
        label: "why it works",
        title: "Re-reading a chord chart feels like practice. It isn't.",
        body: [
          "Going over a chart again and again feels productive, but it barely moves the needle. What actually builds the memory is retrieval: forcing yourself to produce the answer instead of just recognizing it. And what makes it last is spacing those retrievals over days instead of cramming them into one sitting.",
          "The fastest way to waste practice time is to re-read something you already saw. Retrieval practice roughly doubled week-later retention over re-reading (Roediger & Karpicke, 2006).",
          "That scheduling problem is exactly what Anki is for. It tracks, chord by chord, when you're about to forget something, and puts it back in front of you right before that happens. This drill doesn't reinvent any of that. It listens to whatever Anki already decided you need next.",
        ],
      },
      {
        id: "the-actual-point",
        number: "02",
        label: "the actual point",
        title: "Knowing a chord isn't the same as playing it",
        body: [
          "Flashcards are great at teaching you to name a chord. They can't teach your hands to find it, under time pressure, without looking. That's motor memory, and it needs a different kind of rep: hands off the keys, chord announced, play it, get timed.",
          "Anki keeps the recall side sharp. The drill keeps the physical side honest.",
        ],
      },
      {
        id: "how-it-works",
        number: "03",
        label: "how it actually works",
        title: "One loop, two directions",
        body: [
          "Turn on Anki Sync and the loop runs itself. No manual chord picking, no separate app to babysit.",
        ],
      },
      {
        id: "not-new",
        number: "04",
        label: "not a new idea",
        title: "This is how jazz pianists already practice",
        body: [
          "Drilling a voicing through every root, in time, until it stops requiring thought, is the standard route from theory to fluency in jazz piano, not a shortcut around it. This tool just puts a stopwatch and a spaced-repetition schedule underneath a practice habit that already exists.",
        ],
        tags: [
          "Barry Harris — voicing drills",
          "Mark Levine — Drop 2 / block chords",
          "woodshedding in all 12 keys",
        ],
      },
      {
        id: "companion-deck",
        number: "05",
        label: "the companion deck",
        title: "The actual Anki deck behind this",
        body: [
          "Two ready-to-import decks: root-position 7ths and diminished 7ths across five keys (C-G-D-A-E), and the extended 9/11/13 voicings with LH/RH fingering built in. Both are plain tab-separated Anki exports. Import them via Anki's File → Import (Basic notetype) and they work with this drill out of the box, no add-on needed beyond AnkiConnect.",
        ],
      },
      {
        id: "who-made-this",
        number: "06",
        label: "who made this",
        title: "A community, not just a toolkit",
        body: [
          "Lessons run $60 an hour and up, so a lot of us teach ourselves. Piano Suite started as the toolkit I wanted for that path, but it is becoming something bigger: a free community where self-taught pianists learn together, share what works, and build tools that actually help beginners.",
          "The project is open source. If you're teaching yourself too, questions and ideas are always welcome.",
        ],
      },
    ],
    cardStyle: "filled",
    density: "default",
  },
  flow: {
    steps: [
      { id: "anki", label: "anki", text: "Your due card names a chord" },
      { id: "drill", label: "drill", text: "The drill loads that chord" },
      { id: "midi", label: "midi", text: "You play it, timed, on real keys" },
      { id: "anki-2", label: "anki", text: "The card flips so you can grade it" },
    ],
    layout: "auto",
  },
  decks: {
    items: [
      {
        label: "Chord Symbols — 7ths & dim7 (.txt)",
        href: "/chord-symbols-CGDAEno11.txt",
      },
      {
        label: "Chord Symbols — 9/11/13 (.txt)",
        href: "/chord-symbols-CGDAE.txt",
      },
    ],
    variant: "outline",
  },
  toolsGrid: {
    eyebrow: "also in the toolkit",
    title: "Focused tools for the rest of your practice",
    subtitle:
      "From your first chord drill to advanced pattern labs, everything is designed to keep your practice healthy, focused, and effective.",
  },
  howItWorks: {
    eyebrow: "how the Workshop works",
    title: "Make practice fit the way you learn",
    steps: [
      { id: "pick", label: "01", text: "Pick a starter drill or begin with a blank page" },
      { id: "play", label: "02", text: "Press start and play, timed on real keys" },
      { id: "build", label: "03", text: "Tweak the blocks or build your own routine" },
    ],
  },
  templateStrip: {
    eyebrow: "ready when you are",
    title: "Start with a drill, not a blank page",
    subtitle: "Use a starter routine as-is, then make it yours in the Workshop.",
    browseHref: "/workshop",
  },
  onboarding: {
    intro: {
      hi: "Hi",
      welcome: "welcome to piano suite",
    },
    pillarsOverview:
      "These are the three most important pillars of learning on your piano journey.",
    pillars: [
      {
        id: "active-recall",
        headline: "Active recall & spaced repetition",
        body: [
          "The fastest way to waste practice time is to re-read something you already saw. What actually builds memory is retrieval: producing the answer from scratch, then spacing those retrievals over days.",
          "Anki handles the scheduling. It tracks what you are about to forget and shows it to you right before that happens. Use it for chord names, progressions, and anything else you need to remember.",
        ],
        nextDelayMs: 1800,
        resources: [
          {
            id: "anki",
            title: "Anki",
            description:
              "The spaced-repetition flashcard app that schedules reviews for you.",
            href: "https://apps.ankiweb.net/",
            imageSrc:
              "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "barbara-oakley",
            title: "Dr. Barbara Oakley",
            description:
              "Learning How to Learn — the science of focused and diffuse thinking.",
            href: "https://www.coursera.org/learn/learning-how-to-learn",
            imageSrc:
              "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "active-recall-research",
            title: "Active recall research",
            description:
              "Why retrieval practice outperforms re-reading and highlighting.",
            href: "https://www.retrievalpractice.org/why-it-works",
            imageSrc:
              "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=60",
          },
        ],
      },
      {
        id: "self-care",
        headline: "Take care of yourself",
        body: [
          "Piano puts your hands under repeated load. If your wrists and tendons are not supported, practice becomes injury. Stretch, rest, and build the muscles around your wrists so they can absorb that load.",
          "A few minutes of hand care is not a break from practice — it is part of it. Strong, mobile hands let you practice consistently, and consistency is what makes spaced repetition work.",
        ],
        nextDelayMs: 0,
        resources: [
          {
            id: "isha-hand-stretches",
            title: "Isha Yoga hand stretches",
            description: "A short yoga routine for hand and wrist mobility.",
            href: "https://www.youtube.com/watch?v=M9VSpOiwwDU&t=251s",
            imageSrc:
              "https://images.unsplash.com/photo-1544367563-12123d8965cd?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "dr-levi",
            title: "Dr. Levi's hand exercises",
            description:
              "Stretches and exercises designed for people who use their hands intensively.",
            href: "https://www.youtube.com/c/DrLeviHarrison",
            imageSrc:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "hanging-grip",
            title: "Hanging for grip strength",
            description:
              "Why passive hanging builds resilient shoulders, elbows, and grip.",
            href: "https://www.reddit.com/r/bodyweightfitness/wiki/exercises/pullup/",
            imageSrc:
              "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&auto=format&fit=crop&q=60",
          },
        ],
      },
      {
        id: "manage-frustrations",
        headline: "Manage your frustrations",
        body: [
          "Your brain has two modes: focused mode, where you absorb new material, and diffuse mode, where connections settle in the background. You need both.",
          "Practice in short, focused blocks — twenty minutes of attention, then a real break. Walk away, breathe, let your mind wander. Consistent short sessions beat rare marathon sessions, and the diffuse time is when the memory actually sticks.",
        ],
        nextDelayMs: 0,
        resources: [
          {
            id: "pomodoro",
            title: "The Pomodoro Technique",
            description:
              "Twenty-five minutes of focus followed by a five-minute break.",
            href: "https://francescocirillo.com/products/the-pomodoro-technique",
            imageSrc:
              "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "miracle-of-mind",
            title: "Miracle of Mind",
            description:
              "Short guided rests that help the brain shift into diffuse mode.",
            href: "https://isha.sadhguru.org/us/en/miracle-of-mind",
            imageSrc:
              "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "diffuse-mode",
            title: "Focused vs diffuse thinking",
            description:
              "Barbara Oakley on why walking away is part of learning.",
            href: "https://www.coursera.org/learn/learning-how-to-learn",
            imageSrc:
              "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60",
          },
        ],
      },
    ],
    closing: "Happy learning",
    cta: "Let's practice!",
    resourceCardVariant: "image-card",
  },
  styleTokens: {
    sectionSpacing: "default",
    cardRadius: "2xl",
    headingFont: "heading",
    bodyFont: "sans",
    backgroundEffect: "none",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampArray<T>(
  value: unknown,
  fallback: T[],
  validator: (item: unknown) => item is T
): T[] {
  if (!Array.isArray(value)) return fallback;
  const valid = value.filter(validator);
  return valid.length > 0 ? valid : fallback;
}

function clampString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function clampBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function clampEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isValidResource(
  item: unknown
): item is WelcomeOnboardingResourceConfig {
  return (
    isObject(item) &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.href === "string" &&
    typeof item.imageSrc === "string"
  );
}

function isValidPillar(item: unknown): item is WelcomeOnboardingPillarConfig {
  if (!isObject(item)) return false;
  const resources = Array.isArray(item.resources)
    ? item.resources.filter(isValidResource)
    : [];
  const body = Array.isArray(item.body)
    ? item.body.filter((b): b is string => typeof b === "string")
    : [];
  return (
    typeof item.id === "string" &&
    typeof item.headline === "string" &&
    body.length > 0 &&
    resources.length > 0
  );
}

function isValidFeatureSection(
  item: unknown
): item is WelcomeFeatureSectionConfig {
  if (!isObject(item)) return false;
  const body = Array.isArray(item.body)
    ? item.body.filter((b): b is string => typeof b === "string")
    : [];
  return (
    typeof item.id === "string" &&
    typeof item.number === "string" &&
    typeof item.label === "string" &&
    typeof item.title === "string" &&
    body.length > 0
  );
}

function isValidFlowStep(item: unknown): item is WelcomeFlowStepConfig {
  return (
    isObject(item) &&
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    typeof item.text === "string"
  );
}

function isValidDeck(item: unknown): item is WelcomeDeckConfig {
  return (
    isObject(item) &&
    typeof item.label === "string" &&
    typeof item.href === "string"
  );
}

/**
 * Validates a partial config object and returns a complete config, filling
 * missing or invalid fields from `defaultWelcomeConfig`.
 */
export function validateWelcomeConfig(
  partial: unknown,
  base: WelcomeConfig = defaultWelcomeConfig
): WelcomeConfig {
  const input = isObject(partial) ? partial : {};

  const heroInput = isObject(input.hero) ? input.hero : {};
  const hero: WelcomeHeroConfig = {
    eyebrow: clampString(heroInput.eyebrow, base.hero.eyebrow),
    showEyebrow: clampBoolean(heroInput.showEyebrow, base.hero.showEyebrow),
    headline: clampString(heroInput.headline, base.hero.headline),
    subheadline: clampString(heroInput.subheadline, base.hero.subheadline),
    ctaText: clampString(heroInput.ctaText, base.hero.ctaText),
    ctaHref: clampString(heroInput.ctaHref, base.hero.ctaHref),
    align: clampEnum(heroInput.align, ["center", "left"], base.hero.align),
  };

  const featuresInput = isObject(input.features) ? input.features : {};
  const features: WelcomeConfig["features"] = {
    sections: clampArray(
      featuresInput.sections,
      base.features.sections,
      isValidFeatureSection
    ),
    cardStyle: clampEnum(
      featuresInput.cardStyle,
      ["filled", "transparent", "gradient"],
      base.features.cardStyle
    ),
    density: clampEnum(
      featuresInput.density,
      ["compact", "default", "spacious"],
      base.features.density
    ),
  };

  const flowInput = isObject(input.flow) ? input.flow : {};
  const flow: WelcomeConfig["flow"] = {
    steps: clampArray(flowInput.steps, base.flow.steps, isValidFlowStep),
    layout: clampEnum(
      flowInput.layout,
      ["auto", "horizontal", "vertical"],
      base.flow.layout
    ),
  };

  const decksInput = isObject(input.decks) ? input.decks : {};
  const decks: WelcomeConfig["decks"] = {
    items: clampArray(decksInput.items, base.decks.items, isValidDeck),
    variant: clampEnum(
      decksInput.variant,
      ["outline", "solid", "ghost"],
      base.decks.variant
    ),
  };

  const toolsGridInput = isObject(input.toolsGrid) ? input.toolsGrid : {};
  const toolsGrid: WelcomeConfig["toolsGrid"] = {
    eyebrow: clampString(toolsGridInput.eyebrow, base.toolsGrid.eyebrow),
    title: clampString(toolsGridInput.title, base.toolsGrid.title),
    subtitle: clampString(toolsGridInput.subtitle, base.toolsGrid.subtitle),
  };

  const howItWorksInput = isObject(input.howItWorks) ? input.howItWorks : {};
  const howItWorks: WelcomeConfig["howItWorks"] = {
    eyebrow: clampString(howItWorksInput.eyebrow, base.howItWorks.eyebrow),
    title: clampString(howItWorksInput.title, base.howItWorks.title),
    steps: clampArray(howItWorksInput.steps, base.howItWorks.steps, isValidFlowStep),
  };

  const templateStripInput = isObject(input.templateStrip) ? input.templateStrip : {};
  const templateStrip: WelcomeConfig["templateStrip"] = {
    eyebrow: clampString(templateStripInput.eyebrow, base.templateStrip.eyebrow),
    title: clampString(templateStripInput.title, base.templateStrip.title),
    subtitle: clampString(templateStripInput.subtitle, base.templateStrip.subtitle),
    browseHref: clampString(templateStripInput.browseHref, base.templateStrip.browseHref),
  };

  const onboardingInput = isObject(input.onboarding) ? input.onboarding : {};
  const introInput = isObject(onboardingInput.intro)
    ? onboardingInput.intro
    : {};
  const onboarding: WelcomeConfig["onboarding"] = {
    intro: {
      hi: clampString(introInput.hi, base.onboarding.intro.hi),
      welcome: clampString(
        introInput.welcome,
        base.onboarding.intro.welcome
      ),
    },
    pillarsOverview: clampString(
      onboardingInput.pillarsOverview,
      base.onboarding.pillarsOverview
    ),
    pillars: clampArray(
      onboardingInput.pillars,
      base.onboarding.pillars,
      isValidPillar
    ),
    closing: clampString(onboardingInput.closing, base.onboarding.closing),
    cta: clampString(onboardingInput.cta, base.onboarding.cta),
    resourceCardVariant: clampEnum(
      onboardingInput.resourceCardVariant,
      ["image-card", "compact-list"],
      base.onboarding.resourceCardVariant
    ),
  };

  const styleTokensInput = isObject(input.styleTokens) ? input.styleTokens : {};
  const styleTokens: WelcomeConfig["styleTokens"] = {
    sectionSpacing: clampEnum(
      styleTokensInput.sectionSpacing,
      ["compact", "default", "spacious"],
      base.styleTokens.sectionSpacing
    ),
    cardRadius: clampEnum(
      styleTokensInput.cardRadius,
      ["sm", "md", "lg", "xl", "2xl"],
      base.styleTokens.cardRadius
    ),
    headingFont: clampEnum(
      styleTokensInput.headingFont,
      ["heading", "sans", "mono"],
      base.styleTokens.headingFont
    ),
    bodyFont: clampEnum(
      styleTokensInput.bodyFont,
      ["heading", "sans", "mono"],
      base.styleTokens.bodyFont
    ),
    backgroundEffect: clampEnum(
      styleTokensInput.backgroundEffect,
      ["none", "subtle-glow", "orb", "beam"],
      base.styleTokens.backgroundEffect
    ),
  };

  return {
    hero,
    features,
    flow,
    decks,
    toolsGrid,
    howItWorks,
    templateStrip,
    onboarding,
    styleTokens,
  };
}
