export type DailyActivityId =
  | "wheel-spin" | "guess-sponsor" | "cup-shuffle" | "cards" | "secret-reveal"
  | "puzzle" | "just-ads" | "coin-drop" | "slots" | "mystery-box" | "panda-target";

export interface DailyActivityDefinition {
  id: DailyActivityId;
  name: string;
  shortDescription: string;
  icon: string;
}

export const DAILY_ACTIVITY_LIBRARY: DailyActivityDefinition[] = [
  { id: "wheel-spin", name: "Wheel Spin", shortDescription: "Spin a visible prize wheel.", icon: "🎡" },
  { id: "guess-sponsor", name: "Guess the Sponsor", shortDescription: "Pick one sponsored box and reveal the sponsor.", icon: "🎁" },
  { id: "cup-shuffle", name: "Panda Cup Shuffle", shortDescription: "Pick a prize, then follow the shuffled cups.", icon: "🥤" },
  { id: "cards", name: "Cards", shortDescription: "Pick up to three prize cards.", icon: "🃏" },
  { id: "secret-reveal", name: "Secret Reveal", shortDescription: "Solve a 9-piece Secret Confession puzzle.", icon: "🧩" },
  { id: "puzzle", name: "Puzzle", shortDescription: "Solve the 30-second BC puzzle.", icon: "🧠" },
  { id: "just-ads", name: "Just Ads", shortDescription: "Watch the admin-selected ad before entering Circle Panda.", icon: "📺" },
  { id: "coin-drop", name: "Coin Drop", shortDescription: "Drop into the BC arena and reveal the result.", icon: "🪙" },
  { id: "slots", name: "Slots", shortDescription: "Spin three reels and match symbols.", icon: "🎰" },
  { id: "mystery-box", name: "Mystery Box", shortDescription: "Choose one of three hidden pixel boxes.", icon: "📦" },
  { id: "panda-target", name: "Panda Target", shortDescription: "Tap fast targets for 30 seconds.", icon: "🎯" },
];

export const DEFAULT_DAILY_ACTIVITY_SLOTS: DailyActivityId[] = [
  "wheel-spin", "guess-sponsor", "cup-shuffle", "cards", "secret-reveal", "puzzle", "coin-drop",
];

export interface DailyActivityConfig {
  enabled: boolean;
  slots: DailyActivityId[];
  wheelPrizes: number[];
  cardPrizes: number[];
  coinDropPrizes: number[];
  slotSymbols: string[];
}

export const DEFAULT_DAILY_ACTIVITY_CONFIG: DailyActivityConfig = {
  enabled: true,
  slots: DEFAULT_DAILY_ACTIVITY_SLOTS,
  wheelPrizes: [1, 2, 5, 10, 20, 30],
  cardPrizes: [1, 20, 30],
  coinDropPrizes: [1, 2, 5, 10],
  slotSymbols: ["🐼", "⭐", "🪙", "🎋", "💎"],
};

export function getDailyActivityForDay(day: number, config: DailyActivityConfig): DailyActivityId {
  const safeDay = Math.min(7, Math.max(1, day));
  return config.slots[safeDay - 1] || DEFAULT_DAILY_ACTIVITY_SLOTS[safeDay - 1] || "wheel-spin";
}
