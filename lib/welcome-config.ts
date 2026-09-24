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

export interface WelcomeDoorItemConfig {
  id: "play" | "build" | "learn";
  label: string;
  description: string;
  href: string;
}

export interface WelcomeDoorsConfig {
  eyebrow: string;
  title: string;
  items: WelcomeDoorItemConfig[];
}

export interface WelcomeDemoVideoConfig {
  number: string;
  label: string;
  title: string;
  body: string[];
  videoSrc: string;
  videoLabel: string;
}

export interface WelcomeClosingCtaConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface WelcomeConfig {
  hero: WelcomeHeroConfig;
  doors: WelcomeDoorsConfig;
  closingCta: WelcomeClosingCtaConfig;
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
  demoVideo: WelcomeDemoVideoConfig;
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
    eyebrow: "free tools for people learning piano",
    showEyebrow: true,
    headline:
      "Teaching yourself piano? — welcome home. Let’s practice.",
    subheadline:
      "Piano Suite is a free, friendly home for self-taught pianists. Build your own practice from simple blocks, borrow a starter template that already works, and grow alongside other learners.",
    ctaText: "Come on in",
    ctaHref: "/start",
    align: "center",
  },
  doors: {
    eyebrow: "welcome — pick a door",
    title: "How would you like to start today?",
    items: [
      {
        id: "play",
        label: "Play",
        description:
          "Just want to play? A friendly chord drill opens right away — free, no account, no setup.",
        href: "/tools/chord-drill",
      },
      {
        id: "build",
        label: "Build",
        description:
          "Feeling curious? Snap a few blocks together in the Workshop and shape practice that fits you.",
        href: "/tools/workshop",
      },
      {
        id: "learn",
        label: "Learn",
        description: "Rather read first? Short, gentle articles on how practice actually works.",
        href: "/articles",
      },
    ],
  },
  closingCta: {
    eyebrow: "the bench is ready",
    title: "Pull up the bench. We saved you a seat.",
    subtitle:
      "Everything here is free and runs right in your browser. Your progress stays safely on this device until you decide you’d like an account — no pressure, no paywall between you and the piano.",
  },
  features: {
    sections: [
      {
        id: "build-your-practice",
        number: "01",
        label: "build your practice",
        title: "Practice that fits you, not the other way around.",
        body: [
          "A metronome. A timer. A chord to aim for. Snap them together and you’ve made yourself a practice page. Change the chords, ease the tempo, leave yourself a kind note for tomorrow — the Workshop bends to whatever you need today, and you can practice right there.",
          "No code, no setup, nothing to install. Press the slash key, pick a block, and play. Every page saves itself, so you can close the lid and pick up exactly where you left off.",
        ],
      },
      {
        id: "start-from-something-that-works",
        number: "02",
        label: "start from something that works",
        title: "Blank pages are scary. Start with one that isn’t.",
        body: [
          "First chords. A gentle ii-V-I warmup. A five-minute metronome sprint. Starter templates give you a working drill in one click — sit down, press start, and change anything once you feel at home.",
          "You can also wander through drills shared by other self-taught pianists, copy one into your own Workshop, and make it yours. Someone out there has already built the thing you were about to struggle with.",
        ],
      },
      {
        id: "why-these-drills-work",
        number: "03",
        label: "why these drills work",
        title: "Kind to you, and built on the science of remembering.",
        body: [
          "Re-reading a chord chart feels like practice. It isn’t — and that’s good news, because the thing that actually works is simpler: retrieval. Ask your hands for the answer instead of showing it to them. In one classic study, retrieval practice roughly doubled week-later retention over re-reading (Roediger & Karpicke, 2006).",
          "Every drill here is built on that principle. Turn on Anki Sync and the Workshop quietly loads your due cards, scheduling reviews right before you’d forget. Or just pick chords by hand — the motor-memory loop works either way, and neither way is wrong.",
          "Playing a voicing through every key, in time, until it stops needing thought — that’s how jazz pianists have always gotten from theory to fluency. We just put a stopwatch and a gentle schedule underneath a habit that already works.",
        ],
        tags: [
          "Barry Harris — voicing drills",
          "Mark Levine — Drop 2 / block chords",
          "woodshedding in all 12 keys",
        ],
      },
      {
        id: "who-made-this",
        number: "04",
        label: "who made this",
        title: "Made by a self-taught pianist, for the rest of us.",
        body: [
          "Lessons run $60 an hour and up, so a lot of us teach ourselves — usually alone, usually unsure if we’re doing it right. Piano Suite started as the toolkit I wished I’d had, and it’s growing into something warmer: a free community where self-taught pianists learn together, share what works, and cheer each other on.",
          "The whole project is open source and always will be free to learn with. If you’re teaching yourself too, you belong here — questions, ideas, and first attempts are all welcome.",
        ],
      },
    ],
    cardStyle: "transparent",
    density: "default",
  },
  flow: {
    steps: [
      {
        id: "pick",
        label: "pick",
        text: "Start from a friendly template or a fresh page",
      },
      {
        id: "build",
        label: "build",
        text: "Snap metronome, timer, and chord blocks together",
      },
      {
        id: "play",
        label: "play",
        text: "Press start and play — real keys or on-screen",
      },
      {
        id: "share",
        label: "share",
        text: "Share what you built, or borrow someone else’s",
      },
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
  howItWorks: {
    eyebrow: "how the Workshop works",
    title: "Practice that fits the way you learn",
    steps: [
      { id: "pick", label: "01", text: "Pick a starter drill or open a fresh page" },
      { id: "play", label: "02", text: "Press start and play — we’ll keep time for you" },
      { id: "build", label: "03", text: "Tweak the blocks until it feels like yours" },
    ],
  },
  templateStrip: {
    eyebrow: "no blank pages here",
    title: "Start with a drill that already works",
    subtitle: "Borrow a starter routine as-is, then make it yours in the Workshop.",
    browseHref: "/marketplace",
  },
  demoVideo: {
    number: "06",
    label: "see it in action",
    title: "Take a 46-second peek at the Workshop.",
    body: [
      "Watch a practice page come together: blocks snapped into a drill, played on real keys, timed and scored as it goes. No account, no setup — everything you see runs right in the browser.",
      "Ready to try it yourself? The Workshop is one click away, and everything you need to start is free.",
    ],
    videoSrc: "/demo-web2.mp4",
    videoLabel:
      "Product demo: building and playing a practice page in the Piano Suite Workshop",
  },
  onboarding: {
    intro: {
      hi: "Hi",
      welcome: "welcome to piano suite",
    },
    pillarsOverview:
      "We’re glad you’re here. Before you dive in, here are the three most important pillars of learning on your piano journey.",
    pillars: [
      {
        id: "active-recall",
        headline: "Active recall & spaced repetition",
        body: [
          "Here’s a friendly secret: re-reading something you already saw is the easiest way to spend practice time without learning much. What actually builds memory is retrieval — producing the answer from scratch, then spacing those little wins out over days.",
          "Anki handles the scheduling so you don’t have to. It notices what you’re about to forget and shows it to you right before that happens. Use it for chord names, progressions, and anything else worth keeping.",
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
          "Your hands are doing all the work here, so be good to them. Piano puts wrists and tendons under repeated load — stretch, rest, and build the muscles around your wrists so they can carry you for years of playing.",
          "A few minutes of hand care isn’t a break from practice — it is practice. Strong, comfortable hands let you show up every day, and showing up is what makes everything else work.",
        ],
        nextDelayMs: 0,
        resources: [
          {
            id: "isha-hand-stretches",
            title: "Isha Yoga hand stretches",
            description: "A short yoga routine for hand and wrist mobility.",
            href: "https://www.youtube.com/watch?v=M9VSpOiwwDU&t=251s",
            imageSrc:
              "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&auto=format&fit=crop&q=60",
          },
          {
            id: "dr-levi",
            title: "Dr. Levi’s hand exercises",
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
          "Some days the piano wins, and that’s okay — it’s part of how learning works. Your brain has two modes: focused mode, where you absorb new material, and diffuse mode, where connections quietly settle in the background. You need both.",
          "So practice in short, kind blocks — twenty minutes of real attention, then a real break. Walk away, breathe, let your mind wander. Little sessions most days beat rare marathons every time, and the wandering is when the music actually sinks in.",
        ],
        nextDelayMs: 0,
        resources: [
          {
            id: "pomodoro",
            title: "The Pomodoro Technique",
            description:
              "Twenty-five minutes of focus followed by a five-minute break.",
            href: "https://www.pomodorotechnique.com",
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
    closing: "Happy playing — we’re rooting for you",
    cta: "Let’s practice!",
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

function isValidDoor(item: unknown): item is WelcomeDoorItemConfig {
  if (!isObject(item)) return false;
  const id = item.id;
  return (
    (id === "play" || id === "build" || id === "learn") &&
    typeof item.label === "string" &&
    typeof item.description === "string" &&
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

  const doorsInput = isObject(input.doors) ? input.doors : {};
  const doors: WelcomeDoorsConfig = {
    eyebrow: clampString(doorsInput.eyebrow, base.doors.eyebrow),
    title: clampString(doorsInput.title, base.doors.title),
    items: clampArray(doorsInput.items, base.doors.items, isValidDoor),
  };

  const closingCtaInput = isObject(input.closingCta) ? input.closingCta : {};
  const closingCta: WelcomeClosingCtaConfig = {
    eyebrow: clampString(closingCtaInput.eyebrow, base.closingCta.eyebrow),
    title: clampString(closingCtaInput.title, base.closingCta.title),
    subtitle: clampString(closingCtaInput.subtitle, base.closingCta.subtitle),
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

  const howItWorksInput = isObject(input.howItWorks) ? input.howItWorks : {};
  const howItWorks: WelcomeConfig["howItWorks"] = {
    eyebrow: clampString(howItWorksInput.eyebrow, base.howItWorks.eyebrow),
    title: clampString(howItWorksInput.title, base.howItWorks.title),
    steps: clampArray(
      howItWorksInput.steps,
      base.howItWorks.steps,
      isValidFlowStep
    ),
  };

  const templateStripInput = isObject(input.templateStrip)
    ? input.templateStrip
    : {};
  const templateStrip: WelcomeConfig["templateStrip"] = {
    eyebrow: clampString(templateStripInput.eyebrow, base.templateStrip.eyebrow),
    title: clampString(templateStripInput.title, base.templateStrip.title),
    subtitle: clampString(
      templateStripInput.subtitle,
      base.templateStrip.subtitle
    ),
    browseHref: clampString(
      templateStripInput.browseHref,
      base.templateStrip.browseHref
    ),
  };

  const demoVideoInput = isObject(input.demoVideo) ? input.demoVideo : {};
  const demoVideo: WelcomeDemoVideoConfig = {
    number: clampString(demoVideoInput.number, base.demoVideo.number),
    label: clampString(demoVideoInput.label, base.demoVideo.label),
    title: clampString(demoVideoInput.title, base.demoVideo.title),
    body: clampArray(
      demoVideoInput.body,
      base.demoVideo.body,
      (b): b is string => typeof b === "string"
    ),
    videoSrc: clampString(demoVideoInput.videoSrc, base.demoVideo.videoSrc),
    videoLabel: clampString(
      demoVideoInput.videoLabel,
      base.demoVideo.videoLabel
    ),
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
    doors,
    closingCta,
    features,
    flow,
    decks,
    howItWorks,
    templateStrip,
    demoVideo,
    onboarding,
    styleTokens,
  };
}
