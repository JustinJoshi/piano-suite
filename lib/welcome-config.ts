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


/**
 * Copy for the roll landing page. Strings may use a little inline markup,
 * rendered by `components/roll/inline.tsx`: `*em*`, `**strong**`,
 * `` `kbd` `` and `[text](/href)`. `{time}` and `{misses}` are filled in by
 * the drill console.
 */
export interface WelcomeRollSectionCopy {
  label: string;
  note: string;
  eyebrow: string;
  title: string;
  lede: string;
}

export interface WelcomeRollConfig {
  rollLabel: { left: string; middle: string; right: string };
  heroMeta: string;
  console: {
    title: string;
    verb: string;
    rollNote: string;
    helpFine: string;
    helpTouch: string;
    midi: string;
    doneLabel: string;
    doneTitle: string;
    doneSummary: string;
    doneNext: string;
    doneCta: string;
    doneCtaHref: string;
    again: string;
  };
  drills: WelcomeRollSectionCopy & {
    items: Array<{ id: string; name: string; description: string; href: string }>;
    go: string;
    goHref: string;
    goNote: string;
  };
  interludes: { scale: string; circle: string; penta: string; coda: string };
  routes: WelcomeRollSectionCopy & { go: string };
  origin: WelcomeRollSectionCopy & {
    paragraphs: string[];
    turn: string;
    closing: string;
    signoff: string;
    story: string;
    decksIntro: string;
    cardCaption: string;
  };
  pages: WelcomeRollSectionCopy & { go: string; starterIds: string[] };
  workshop: WelcomeRollSectionCopy & {
    cta: string;
    ctaNote: string;
    blocks: Array<{ id: string; name: string; gloss: string; phrase: string }>;
  };
  piece: WelcomeRollSectionCopy & { aside: string; go: string };
  shelf: WelcomeRollSectionCopy & { body: string; browse: string; publish: string };
  reading: WelcomeRollSectionCopy & {
    items: Array<{ slug: string; title: string; summary: string }>;
    go: string;
  };
  progress: WelcomeRollSectionCopy & { empty: string; blocked: string };
  cost: WelcomeRollSectionCopy & {
    rows: Array<{ who: string; price: string; body: string }>;
    stamp: string;
  };
  fine: { word: string; gloss: string; text: string; cta: string; dacapo: string; dacapoSub: string; tail: string };
}

export interface WelcomeConfig {
  hero: WelcomeHeroConfig;
  roll: WelcomeRollConfig;
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
    eyebrow: "Piano Suite",
    showEyebrow: true,
    headline: "A workshop for building *your own* piano practice.",
    subheadline:
      "Pick a ready-made drill and start playing, or put together the exact session you need today from small blocks. It’s free, it runs in your browser, and there’s no account to make.",
    ctaText: "Start playing",
    ctaHref: "/start",
    align: "left",
  },
  roll: {
    rollLabel: {
      left: "A roll for self-taught pianists",
      middle: "Tempo: yours",
      right: "Played by: you",
    },
    heroMeta:
      "Free, with no account and no sign-up. **No MIDI keyboard needed:** the on-screen piano plays with a mouse, a touchscreen, or your computer keys.",
    console: {
      title: "Try it here",
      verb: "Play",
      rollNote: "Your notes get punched into the paper as you play.",
      helpFine:
        "Any octave, any order. On a computer keyboard, the home row plays the white keys, starting from `A` for C. With a mouse, click the notes one after another; close together, they count as a chord.",
      helpTouch:
        "Any octave, any order. Tap all three at once, or one after another in quick succession.",
      midi: "Use a MIDI keyboard instead",
      doneLabel: "Four for four",
      doneTitle: "That was I–V–vi–IV.",
      doneSummary:
        "C, G, A minor and F: the four chords under a great many songs. You found them in {time}, with {misses}.",
      doneNext: "The Chord Drill picks up from here, with more chords, and keeps your times.",
      doneCta: "Open the Chord Drill",
      doneCtaHref: "/tools/chord-drill",
      again: "Go again",
    },
    drills: {
      label: "Ready-made drills",
      note: "Not sure which? Chord Drill. The others grew out of it.",
      eyebrow: "",
      title: "Four drills, ready when you are.",
      lede: "Each one shows you what to play, listens, and times you. Use a MIDI keyboard if you have one. If you don’t, the on-screen keyboard works with a mouse, a finger, or the letter keys on your computer.",
      items: [
        {
          id: "chordDrill",
          name: "Chord Drill",
          description: "A chord name appears and you play it, in any octave. It keeps your time and counts your misses.",
          href: "/tools/chord-drill",
        },
        {
          id: "arpeggios",
          name: "Arpeggios",
          description: "Chords taken apart and played one note at a time, up and back down.",
          href: "/tools/arpeggios",
        },
        {
          id: "progressions",
          name: "Progressions",
          description: "Chords in the order songs use them, such as ii–V–I, so you learn where each one tends to go next.",
          href: "/tools/progression",
        },
        {
          id: "rootCycling",
          name: "Root Cycling",
          description: "One kind of chord, moved from root to root around the keys.",
          href: "/tools/root-cycling",
        },
      ],
      go: "Or play in the Workshop, no account at all",
      goHref: "/tools/workshop",
      goNote: "The drill pages keep your times, so they ask for a free account.",
    },
    interludes: {
      scale: "C major, two octaves up and back down over a held C. On a roll, a scale is a staircase.",
      circle: "Twelve roots around the circle of fourths, each with its third and seventh. A key cycle and a progression at the same time.",
      penta: "A few bars of improvising on the A minor pentatonic scale, over a left hand that stays put.",
      coda: "C major with a ninth, rolled from the bottom up.",
    },
    routes: {
      label: "Guided routes",
      note: "The first route is close to how all of this started.",
      eyebrow: "If you’ve just got a keyboard",
      title: "Not sure what to do first? Follow a route.",
      lede: "Two short routes take you from zero to practicing, one step at a time. Each one ends by building your practice page for you, so the last step is sitting down and playing it.",
      go: "See both routes",
    },
    origin: {
      label: "Where it came from",
      note: "Told by the person who built it.",
      eyebrow: "",
      title: "It started as one web page and a deck of flashcards.",
      lede: "",
      paragraphs: [
        "I taught myself piano, and what I wanted most was to improvise. It took me a while to see what that actually asks of you: knowing your chords cold, so your hands find them before you’ve finished thinking the name.",
        "So I built a small web page. It took a chord from my Anki deck, listened to my MIDI keyboard, and timed how long I took to play it. Anki decided when each chord came back.",
      ],
      turn: "It worked. I learned the chords.",
      closing: "Piano Suite is that same routine, taken apart into pieces so you can build your own version of it, for whatever it is you’re trying to know cold.",
      signoff: "Justin, who built this",
      story: "[Read the longer version](/articles/why-im-learning-piano-without-a-teacher)",
      decksIntro: "If you use Anki, the chord decks are free:",
      cardCaption: "A card like the ones it started with.",
    },
    pages: {
      label: "Ready-made pages",
      note: "None of these is precious. Move things around.",
      eyebrow: "If you’ve been playing the same exercise for months",
      title: "Start from a page that’s already put together.",
      lede: "When you can’t see what comes next, borrow a next step. Each page is a starting point: play it as it is, then rearrange it until it fits.",
      go: "Open them in the Workshop",
      starterIds: [
        "ten-minute-warmup",
        "scale-of-the-day",
        "five-finger-foundations",
        "circle-of-fourths-chords",
        "ii-v-i-every-key",
        "twelve-bar-blues",
        "pop-loop",
        "modes-tour",
        "hanon-cell-warmup",
        "pentatonic-improv",
      ],
    },
    workshop: {
      label: "The Workshop",
      note: "Fewer blocks is usually better. The page you’ll actually open beats the perfect one.",
      eyebrow: "If you’ve got a drill in your head",
      title: "Or build the session you need today.",
      lede: "A practice page is a few blocks on one screen: a metronome, a timer, the chords or scales you’re working on, a way to see how it went. Pick the blocks and put them in order, and the page is there when you come back.",
      cta: "Open the Workshop",
      ctaNote: "No account needed to build a page.",
      blocks: [
        { id: "metronome", name: "Metronome", gloss: "Keeps the beat.", phrase: "a metronome" },
        { id: "drillTimer", name: "Drill timer", gloss: "Times the drill.", phrase: "a drill timer" },
        { id: "restTimer", name: "Rest timer", gloss: "A timed break between rounds.", phrase: "a rest timer" },
        { id: "chordSets", name: "Chord sets", gloss: "The chords you’re working on.", phrase: "chord sets" },
        { id: "scaleRuns", name: "Scale runs", gloss: "Scales, up and back down.", phrase: "scale runs" },
        { id: "keyCycles", name: "Key cycles", gloss: "Takes it through the keys in turn.", phrase: "key cycles" },
        { id: "progressions", name: "Chord progressions", gloss: "Chords in order, like ii–V–I.", phrase: "chord progressions" },
        { id: "fallingNotes", name: "Falling notes", gloss: "Shows what’s coming as it comes.", phrase: "falling notes" },
        { id: "sessionStats", name: "Session stats", gloss: "Today’s times and misses.", phrase: "session stats" },
        { id: "keyboard", name: "On-screen keyboard", gloss: "For when there’s no MIDI keyboard.", phrase: "an on-screen keyboard" },
      ],
    },
    piece: {
      label: "Learning a piece",
      note: "Slow is fine. The speed comes a little at a time.",
      eyebrow: "",
      title: "For a real piece, a few bars at a time.",
      lede: "Bring a MIDI file of something you’re learning. The Workshop loops a few bars at a time and plays them a little faster on each pass, so the hard part gets its repetitions and the tempo comes up gradually.",
      aside: "If you’d like to learn one song by watching a video, there are good places for that already. This is for the practice underneath.",
      go: "Try it in the Workshop",
    },
    shelf: {
      label: "The Marketplace",
      note: "It’s new, so there’s room.",
      eyebrow: "",
      title: "Other people’s practice, there to borrow.",
      lede: "The Marketplace is a shelf of practice pages published for anyone to use. Try one as it is, copy it into your own workshop, and change whatever doesn’t suit you.",
      body: "Publishing your own is free; you only need to sign in. The shelf is new, and for now most of what’s on it is mine, so the pages that go on it next will be among the first things the next person finds.",
      browse: "Browse the Marketplace",
      publish: "Publish yours",
    },
    reading: {
      label: "Reading",
      note: "Written for people teaching themselves.",
      eyebrow: "",
      title: "How to practice, when there’s no teacher to ask.",
      lede: "",
      items: [
        {
          slug: "beginner-pianist-learning-journey",
          title: "How beginners should actually practice",
          summary: "Active recall, spaced repetition, drilling with your hands, and why a good session switches between focused and relaxed thinking.",
        },
        {
          slug: "beginner-pianist-learning-journey-quick-start",
          title: "The quick-start version",
          summary: "The same ideas in a few minutes, for when you’d rather be playing.",
        },
        {
          slug: "anki-ankiconnect-setup",
          title: "Setting up Anki for your chords",
          summary: "Three steps: install Anki, add AnkiConnect, import the decks. Then the Chord Drill can read your reviews.",
        },
      ],
      go: "Read the articles",
    },
    progress: {
      label: "Progress",
      note: "Kept in this browser. Clear it whenever you like.",
      eyebrow: "",
      title: "It keeps count, on your device.",
      lede: "Piano Suite saves your timings, misses, streaks and practice history on your device. This page keeps a small version of the same thing, from the four chords at the top.",
      empty: "Nothing here yet. Play the four chords at the top and your times will be written in here.",
      blocked: "This browser isn’t letting the page save anything, so there’s nothing to keep here. The drill at the top still works.",
    },
    cost: {
      label: "What it costs",
      note: "No card details. No trial clock.",
      eyebrow: "",
      title: "Free, and the Workshop never asks you to sign in.",
      lede: "",
      rows: [
        {
          who: "Without an account",
          price: "Free",
          body: "The Workshop and its ready-made pages, the guided routes, the articles, this page’s drill, and your history on this device.",
        },
        {
          who: "With a free account",
          price: "Free",
          body: "The four ready-made drills, which keep your times, and publishing your pages to the Marketplace. [Sign up](/sign-up) or [sign in](/sign-in).",
        },
        {
          who: "Founding Pro",
          price: "Later",
          body: "Sync across your devices. It’s planned, and it isn’t live yet. If you’d like to hear when it is, [join the Founding Pro waitlist](/pricing).",
        },
      ],
      stamp: "Not live yet",
    },
    fine: {
      word: "Fine",
      gloss: "fee·nay · the end of the roll",
      text: "If you’ve read this far, you know more than you need to. The next step is the smallest one: pick a drill and play it for five minutes.",
      cta: "Start playing",
      dacapo: "Da capo",
      dacapoSub: "back to the top",
      tail: "End of roll",
    },
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

/**
 * Merge stored copy over the defaults, field by field: a string survives only
 * where the default is a string, an array only where it keeps the default's
 * length and shape, so an old or hand-edited config can never leave a hole.
 */
export function mergeCopy<T>(base: T, input: unknown): T {
  if (typeof base === "string") return (typeof input === "string" ? input : base) as T;
  if (Array.isArray(base)) {
    if (!Array.isArray(input) || input.length !== base.length) return base;
    return base.map((item, i) => mergeCopy(item, input[i])) as T;
  }
  if (base && typeof base === "object") {
    const source = isObject(input) ? input : {};
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
      out[key] = mergeCopy(value, source[key]);
    }
    return out as T;
  }
  return base;
}

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

  const roll = mergeCopy(base.roll, input.roll);

  return {
    hero,
    roll,
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
