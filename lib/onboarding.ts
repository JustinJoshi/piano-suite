/**
 * Content and types for the first-time `/tools` onboarding flow.
 *
 * Images and external links below are placeholders. Swap in real assets
 * before shipping; URLs are intentionally typed as strings so they can be
 * replaced without touching component code.
 */

export interface OnboardingResource {
  id: string;
  title: string;
  description: string;
  href: string;
  imageSrc: string;
}

export interface OnboardingPillar {
  id: string;
  headline: string;
  body: string[];
  resources: OnboardingResource[];
  /** Hide the Next button for this many milliseconds. */
  nextDelayMs: number;
}

export const ONBOARDING_STORAGE_KEY = "piano-suite:onboarding-completed";
export const ONBOARDING_INSTANT_PARAM = "onboarding=instant";
export const ONBOARDING_RESET_PARAM = "onboarding=reset";

export const introSlides = {
  hi: "Hi",
  welcome: "welcome to piano suite",
  pillarsOverview: "These are the three most important pillars of learning on your piano journey.",
  closing: "Happy learning",
  cta: "Let's practice!",
} as const;

export const onboardingPillars: OnboardingPillar[] = [
  {
    id: "active-recall",
    headline: "Active recall & spaced repetition",
    body: [
      "The fastest way to waste practice time is to re-read something you already saw. What actually builds memory is retrieval: producing the answer from scratch, then spacing those retrievals over days.",
      "Anki handles the scheduling. It tracks what you are about to forget and shows it to you right before that happens. Use it for chord names, progressions, and anything else you need to remember.",
    ],
    nextDelayMs: 8000,
    resources: [
      {
        id: "anki",
        title: "Anki",
        description: "The spaced-repetition flashcard app that schedules reviews for you.",
        href: "https://apps.ankiweb.net/",
        imageSrc: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "barbara-oakley",
        title: "Dr. Barbara Oakley",
        description: "Learning How to Learn — the science of focused and diffuse thinking.",
        href: "https://www.coursera.org/learn/learning-how-to-learn",
        imageSrc: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "active-recall-research",
        title: "Active recall research",
        description: "Why retrieval practice outperforms re-reading and highlighting.",
        href: "https://www.retrievalpractice.org/why-it-works",
        imageSrc: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=60",
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
        imageSrc: "https://images.unsplash.com/photo-1544367563-12123d8965cd?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "dr-levi",
        title: "Dr. Levi's hand exercises",
        description: "Stretches and exercises designed for people who use their hands intensively.",
        href: "https://www.youtube.com/c/DrLeviHarrison",
        imageSrc: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "hanging-grip",
        title: "Hanging for grip strength",
        description: "Why passive hanging builds resilient shoulders, elbows, and grip.",
        href: "https://www.reddit.com/r/bodyweightfitness/wiki/exercises/pullup/",
        imageSrc: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&auto=format&fit=crop&q=60",
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
        description: "Twenty-five minutes of focus followed by a five-minute break.",
        href: "https://francescocirillo.com/products/the-pomodoro-technique",
        imageSrc: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "miracle-of-mind",
        title: "Miracle of Mind",
        description: "Short guided rests that help the brain shift into diffuse mode.",
        href: "https://isha.sadhguru.org/us/en/miracle-of-mind",
        imageSrc: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=60",
      },
      {
        id: "diffuse-mode",
        title: "Focused vs diffuse thinking",
        description: "Barbara Oakley on why walking away is part of learning.",
        href: "https://www.coursera.org/learn/learning-how-to-learn",
        imageSrc: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60",
      },
    ],
  },
];
