import { LucideIcon } from "lucide-react";
import { Keyboard, Trophy } from "lucide-react";

export interface Theme {
  name: string;
  color: string;
}

export type NavigationCardsType = {
  icon: LucideIcon;
  title: string;
  href: string;
  description: string;
}

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
    title: "Practice Mode",
    href: "/practice",
    description: "Improve your typing skills at your own pace with customizable exercises"
  },
  {
    icon: Trophy,
    title: "Race Mode",
    href: "/race",
    description: "Compete against others in real-time typing races"
  },
]