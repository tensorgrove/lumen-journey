// Everything the coach can edit from the dashboard lives here.
// Defaults below are used until the coach saves their own words.

export type PathId = "challenge" | "purpose";

export type Challenge = {
  id: string;
  name: string;
  path: PathId;
  out: [string, string];
  quote: string;
  colors: [string, string];
};

export type Plan = {
  id: string;
  name: string;
  priceCents: number;
  interval: "one_time" | "month";
  priceNote: string;
  features: string[];
  style: "ghost" | "primary" | "gold";
  tag?: string;
};

export type SiteContent = {
  headline: string;
  intro: string;
  challenges: Challenge[];
  qualities: string[];
  plans: Plan[];
  bookingUrl: string;
  bookingTitle: string;
  bookingText: string;
  feedback: { aggressive: string; passive: string; assertive: string };
};

export const DEFAULT_CONTENT: SiteContent = {
  headline: "Turn what’s weighing on you into what moves you forward",
  intro:
    "A guided coaching journey you can take at your own pace, one honest step at a time. Where would you like to begin?",
  challenges: [
    {
      id: "burnout",
      name: "Burnout",
      path: "challenge",
      out: ["Energy", "Boundaries"],
      quote: "Rest isn’t a reward for finishing. It’s how you keep going.",
      colors: ["#F6B26B", "#E07A3F"],
    },
    {
      id: "change",
      name: "A Big Life Change",
      path: "challenge",
      out: ["Calm", "Adaptability"],
      quote: "Change shakes the ground under you. Your values are what you stand on.",
      colors: ["#6FA8DC", "#2C5282"],
    },
    {
      id: "stuck",
      name: "Feeling Stuck",
      path: "purpose",
      out: ["Clarity", "Momentum"],
      quote: "You don’t need the whole map. You need the next honest step.",
      colors: ["#9BB7E0", "#4C668F"],
    },
    {
      id: "goal",
      name: "A Big Goal",
      path: "purpose",
      out: ["Focus", "Consistency"],
      quote: "Small steps, repeated, quietly become big results.",
      colors: ["#7FD3C3", "#2F8F7F"],
    },
  ],
  qualities: [
    "Curiosity", "Courage", "Kindness", "Patience", "Honesty", "Creativity",
    "Resilience", "Generosity", "Humor", "Discipline", "Empathy", "Loyalty",
  ],
  plans: [
    {
      id: "self",
      name: "Self-Guided",
      priceCents: 2900,
      interval: "one_time",
      priceNote: "one time",
      features: ["All three steps and your horizon", "Your progress saved", "Come back any time"],
      style: "ghost",
    },
    {
      id: "group",
      name: "Guided + Group Coaching",
      priceCents: 7900,
      interval: "month",
      priceNote: "/ month",
      features: ["Everything in Self-Guided", "Monthly group coaching call", "New challenges added each month"],
      style: "primary",
      tag: "Most chosen",
    },
    {
      id: "session",
      name: "1:1 Clarity Session",
      priceCents: 24900,
      interval: "one_time",
      priceNote: "one time",
      features: ["A private 45-minute session", "Full journey included", "A written action plan afterwards"],
      style: "gold",
    },
  ],
  bookingUrl: "https://example.com/book",
  bookingTitle: "Take the next step with Maya",
  bookingText: "A free 20-minute clarity call: talk through your horizon and plan your first move.",
  feedback: {
    aggressive:
      "That’s an aggressive response. It feels strong for a moment, but the conversation turns into a fight and the room stops listening.",
    passive: "That’s a passive response. It avoids the conflict, but your idea and your voice quietly disappear.",
    assertive:
      "That’s assertive. Calm, clear and firm. You claim your work without attacking anyone, and you keep the conversation moving.",
  },
};

export const STEPS = [
  { key: "lantern", name: "The Lantern", desc: "Bring what’s weighing on you, see what it lights up", href: "/lantern" },
  { key: "strengths", name: "1 · Name your strengths", desc: "Notice the good you already carry", href: "/step/strengths" },
  { key: "purpose", name: "2 · Set your direction", desc: "Turn those strengths into a clear direction", href: "/step/direction" },
  { key: "voice", name: "3 · Find your voice", desc: "Speak up calmly, clearly and firmly", href: "/step/voice" },
  { key: "horizon", name: "Your Horizon", desc: "See where your path is leading", href: "/horizon" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function formatPrice(cents: number) {
  return "$" + (cents % 100 === 0 ? (cents / 100).toLocaleString("en-US") : (cents / 100).toFixed(2));
}

/** Merge saved content over defaults, tolerating partial or old shapes. */
export function mergeContent(saved: unknown): SiteContent {
  if (!saved || typeof saved !== "object") return DEFAULT_CONTENT;
  const s = saved as Partial<SiteContent>;
  return {
    ...DEFAULT_CONTENT,
    ...s,
    feedback: { ...DEFAULT_CONTENT.feedback, ...(s.feedback ?? {}) },
    challenges: Array.isArray(s.challenges) && s.challenges.length ? s.challenges : DEFAULT_CONTENT.challenges,
    qualities: Array.isArray(s.qualities) && s.qualities.length ? s.qualities : DEFAULT_CONTENT.qualities,
    plans: Array.isArray(s.plans) && s.plans.length ? s.plans : DEFAULT_CONTENT.plans,
  };
}
