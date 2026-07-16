import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { typingdata } from "../app/data";
import { LeaderboardEntry, SessionStats, UserType } from "./constants";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const sessionStatsStorageKey = "typex-session-stats";
const guestProfileStorageKey = "typex-guest-profile";

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

  } catch (err) {
    // Guests are allowed to play, so stat sync can fail quietly when there is no auth cookie.
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }
}

export const getCurrentUser = async (): Promise<UserType | null> => {
  try {
    const response = await fetch(`${baseURL}/user`, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();

    if (!response.ok || result.error) return null;

    return result;
  } catch {
    return null;
  }
}

export const createRoomAPI = async (text: string) => {
  const response = await fetch(`${baseURL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to create room");
  }

  return result as {
    id: string;
    expiresAt: string;
    maxPlayers: number;
  };
}

export const getRoomAPI = async (roomId: string) => {
  const response = await fetch(`${baseURL}/rooms/${roomId}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Room not found");
  }

  return result;
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
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const getGuestProfile = () => {
  if (typeof window === "undefined") {
    return {
      id: "guest",
      name: "Guest",
    };
  }

  const savedProfile = window.sessionStorage.getItem(guestProfileStorageKey);
  if (savedProfile) return JSON.parse(savedProfile) as { id: string; name: string };

  const profile = {
    id: crypto.randomUUID(),
    name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
  };

  window.sessionStorage.setItem(guestProfileStorageKey, JSON.stringify(profile));
  return profile;
}

export const loadSessionStats = (): SessionStats => {
  if (typeof window === "undefined") {
    return {
      totalRaces: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      bestWpm: 0,
    };
  }

  const savedStats = window.sessionStorage.getItem(sessionStatsStorageKey);
  if (!savedStats) {
    return {
      totalRaces: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      bestWpm: 0,
    };
  }

  return JSON.parse(savedStats);
}

export const recordSessionStats = (wpm: number, accuracy: number) => {
  if (typeof window === "undefined") return;

  const currentStats = loadSessionStats();
  const totalRaces = currentStats.totalRaces + 1;
  const nextStats = {
    totalRaces,
    averageWpm: Math.round(
      ((currentStats.averageWpm * currentStats.totalRaces) + wpm) / totalRaces
    ),
    averageAccuracy: Math.round(
      ((currentStats.averageAccuracy * currentStats.totalRaces) + accuracy) / totalRaces
    ),
    bestWpm: Math.max(currentStats.bestWpm, wpm),
  };

  window.sessionStorage.setItem(sessionStatsStorageKey, JSON.stringify(nextStats));
  window.dispatchEvent(new CustomEvent("typex-session-stats-updated"));

  return nextStats;
}

export const loadLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await fetch(`${baseURL}/leaderboard`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load leaderboard");
    }

    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};


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
