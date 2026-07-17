import { LucideIcon } from "lucide-react";
import { Keyboard, Trophy, Medal } from "lucide-react";

export interface Theme {
  name: string;
  color: string;
}

export type UserType = {
  name: string;
  email: string;
  id: string;
}

export type SessionStats = {
  totalRaces: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
}

export type NavigationCardsType = {
  icon: LucideIcon;
  title: string;
  href: string;
  description: string;
}

export type RacerType = {
  id: number | string;
  name: string;
  progress: number;
  wpm: number;
  color: string;
  accuracy?: number;
  finishedAt?: number;
}

export type LeaderboardEntry = {
  userId: string;
  name: string;
  averageWPM: number;
  averageAccuracy: number;
  bestWPM: number;
  totalRaces: number;
  updatedAt: string;
};

export const RACER_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
];


export const themes: Theme[] = [
  { name: "dark", color: "dark" },
  { name: "light", color: "light" },
  { name: "blue", color: "blue" },
  { name: "red", color: "red" },
  { name: "yellow", color: "yellow" },
  { name: "green", color: "green" },
];

export const CardOptions: NavigationCardsType[] = [
  {
    icon: Keyboard,
    title: "Practice",
    href: "/practice",
    description: "Improve your typing skills at your own pace with customizable exercises"
  },
  {
    icon: Trophy,
    title: "Multiplayer",
    href: "/race",
    description: "Compete against others in real-time typing races"
  },
  {
    icon: Medal,
    title: "Leaderboard",
    href: "/leaderboard",
    description: "Track your best race results and compare recent runs"
  },
]
