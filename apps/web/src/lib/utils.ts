import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { typingdata } from "../app/data";

const baseURL = process.env.NEXT_PUBLIC_API_URL

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