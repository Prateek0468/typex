import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { typingdata } from "../app/data";
import { LeaderboardEntry } from "./constants";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const leaderboardStorageKey = "typex-leaderboard";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRandomText = () => {
  return typingdata[Math.floor(Math.random() * typingdata.length)];
};

export const getRandomTextAPI = async () => {
  const res = await fetch(`${baseURL}/api/typing`);

  if(!res.ok) {
    throw new Error("Failed to fetch text");
  }

  return res.json();
}

export const updateUserStats = async (wpm: number, accuracy: number) => {
  try {
    const response = await fetch(`${baseURL}/race/finish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ wpm, accuracy })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    console.log("user stas updated successfully: ", result);
  } catch (err) {
    console.error(err);
  }
}

export const getWebSocketURL = () => {
  // NEXT_PUBLIC_WS_URL lets production point to a hosted websocket server.
  // If it is missing, the app derives ws/wss from the API URL so local dev works with one env variable.
  const explicitURL = process.env.NEXT_PUBLIC_WS_URL;
  if (explicitURL) return explicitURL;

  const fallbackHTTPURL = baseURL || "http://localhost:8080";
  return fallbackHTTPURL.replace(/^http/, "ws") + "/ws";
}

export const createRoomCode = () => {
  // A short readable code is enough for the MVP because the websocket server currently broadcasts messages.
  // The client still includes roomId in every message, so different rooms can ignore each other.
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const loadLeaderboard = (): LeaderboardEntry[] => {
  if (typeof window === "undefined") return [];

  try {
    const savedEntries = window.localStorage.getItem(leaderboardStorageKey);
    return savedEntries ? JSON.parse(savedEntries) : [];
  } catch {
    return [];
  }
}

export const saveLeaderboardEntry = (
  entry: Omit<LeaderboardEntry, "id" | "completedAt">
) => {
  if (typeof window === "undefined") return;

  const nextEntry: LeaderboardEntry = {
    ...entry,
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
  };

  const nextEntries = [nextEntry, ...loadLeaderboard()]
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
    .slice(0, 25);

  window.localStorage.setItem(
    leaderboardStorageKey,
    JSON.stringify(nextEntries)
  );

  return nextEntry;
}

/**
   * Calculates Words Per Minute (WPM) based on user input and elapsed time
   * WPM = (words typed / time in minutes) * 60
   * 
   * @returns {number} The calculated WPM, or 0 if timing data is missing
   */
export const calculateWPM = (startTime: number, endTime: number, userInput: string) => {
  // Return 0 if we don't have both start and end times
  // This prevents division by zero and handles incomplete typing sessions
  if (!endTime || !startTime) return 0;

  // Convert milliseconds to minutes for WPM calculation
  // 60000 ms = 1 minute (60 seconds * 1000 milliseconds)
  const timeInMinutes = (endTime - startTime) / 60000;

  // Count words by splitting on whitespace and filtering out empty strings
  // trim() removes leading/trailing spaces, split(/\s+/) splits on one or more whitespace characters
  const wordsTyped = userInput.trim().split(/\s+/).length;

  // Calculate WPM: (words / minutes) * 60, then round to nearest integer
  // We multiply by 60 because WPM is typically measured per minute, not per second
  return Math.round((wordsTyped / timeInMinutes) * 60);
}
