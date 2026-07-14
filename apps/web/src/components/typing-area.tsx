'use client';

import { updateUserStats } from '@/lib/utils';
import { LoaderPinwheel } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type TypingAreaProps = {
  text: string;
  onStatsChange: (stats: {
    wpm: number;
    accuracy: number;
  }) => void;
  onProgressChange: (progress: {
    currentWordIdx: number;
    totalWords: number;
  }) => void;
  isLoading: boolean;
  isRace?: boolean;
  wpm?: number;
  accuracy?: number;
  disabled?: boolean;
  onComplete?: (stats: {
    wpm: number;
    accuracy: number;
  }) => void;
};

export default function TypingArea({
  text,
  onStatsChange,
  onProgressChange,
  isLoading,
  isRace,
  wpm = 0, 
  accuracy = 100,
  disabled = false,
  onComplete,
}: TypingAreaProps) {

  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [userInput, setUserInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const words = useMemo(
    () => text.split(/\s+/).filter(Boolean),
    [text]
  );


  useEffect(() => {
    setTypedWords([]);
    setCurrentWordIdx(0);
    setUserInput("");
    setStartTime(null);
    setIsComplete(false);

    inputRef.current?.focus();
  }, [text]);

  useEffect(() => {
    if(!isRace || !isComplete) return;
    updateUserStats(wpm, accuracy);
  }, [isRace, isComplete, wpm, accuracy])

  useEffect(() => {
    onProgressChange({
      currentWordIdx,
      totalWords: words.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWordIdx, words.length]);


  // this is auto-scrolls and focuses on the next line at the end of text area
  useEffect(() => {
    const el = document.getElementById(`word-${currentWordIdx}`);

    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  }, [currentWordIdx]);

  // Recalculate speed and accuracy on every typed character.
  // The parent page receives these numbers so it can update stat cards, progress bars,
  // race broadcasts, and the local leaderboard without duplicating typing math.
  const updateStats = (
    nextTypedWords: string[],
    currentInput: string
  ) => {
    let correctChars = 0;
    let totalTypedChars = 0;


    nextTypedWords.forEach((typedWord, index) => {
      const expectedWord = words[index];

      for (
        let i = 0;
        i < typedWord.length;
        i++
      ) {

        totalTypedChars++;
        if (
          typedWord[i] === expectedWord[i]
        ) {
          correctChars++;
        }
      }
    });

    const expectedCurrentWord = words[nextTypedWords.length];


    if (expectedCurrentWord) {
      for (
        let i = 0;
        i < currentInput.length;
        i++
      ) {
        totalTypedChars++;
        if (
          currentInput[i] === expectedCurrentWord[i]
        ) {
          correctChars++;
        }
      }
    }

    const nextAccuracy =
      totalTypedChars === 0
        ? 100
        : Math.round(
          (correctChars / totalTypedChars) * 100
        );

    const minutes =
      startTime
        ? (Date.now() - startTime) / 1000 / 60
        : 0;

    const totalChars =
      nextTypedWords.join("").length +
      currentInput.length;

    const nextWpm =
      minutes > 0
        ? Math.round(
          totalChars / 5 / minutes
        )
        : 0;

    const nextStats = {
      wpm: nextWpm,
      accuracy: nextAccuracy,
    };

    onStatsChange(nextStats);
    return nextStats;
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }
    const currentWord = words[currentWordIdx];

    // Complete final word without pressing space
    if (
      currentWordIdx === words.length - 1 &&
      value === currentWord
    ) {

      const nextTypedWords = [
        ...typedWords,
        value
      ];

      setTypedWords(nextTypedWords);
      const finalStats = updateStats(
        nextTypedWords,
        ""
      );

      setCurrentWordIdx(words.length - 1);
      onProgressChange({
        currentWordIdx: words.length - 1,
        totalWords: words.length,
      });
      setIsComplete(true);
      onComplete?.(finalStats);
      setUserInput("");
      return;
    }


    // Word finished by space
    if (value.endsWith(" ")) {
      const typedWord = value.trim();

      if (!typedWord) {
        setUserInput("");
        return;
      }

      const nextTypedWords = [
        ...typedWords,
        typedWord
      ];

      setTypedWords(nextTypedWords);
      updateStats(
        nextTypedWords,
        ""
      );

      setCurrentWordIdx(prev => prev + 1);
      setUserInput("");
      return;
    }

    setUserInput(value);
    updateStats(
      typedWords,
      value
    );
  };


  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Backspace" &&
      userInput.length === 0 &&
      currentWordIdx > 0
    ) {
      e.preventDefault();

      const prevIndex = currentWordIdx - 1;
      setCurrentWordIdx(prevIndex);
      setUserInput(
        typedWords[prevIndex] ?? ""
      );

      setTypedWords(prev =>
        prev.slice(0, prev.length - 1)
      );
    }
  };

  // word coloring
  const renderCurrentWord = (
    word: string,
    typedWord: string = ""
  ) => {
    return word.split("").map(
      (char, index) => {
        let className = "text-gray-400";

        if (index < typedWord.length) {
          className =
            typedWord[index] === char
              ? "text-green-600"
              : "text-red-600";
        }

        return (
          <span
            key={index}
            className={className}
          >
            {char}
          </span>
        );
      }
    );
  };

  return (
    <>
      <div className="mb-6 h-72 overflow-y-auto rounded-lg border bg-background/80 p-6 text-xl leading-relaxed shadow-inner md:text-2xl">
        {isLoading && (
          <div className='flex h-full items-center justify-center gap-2 text-muted-foreground'>
            <LoaderPinwheel className="animate-spin" />
            Loading text
          </div>
        )}


        {!isLoading && words.map((word, index) => {
          // Completed words
          if (index < typedWords.length) {
            return (
              <span
                id={`word-${index}`}
                key={index}
              >
                {renderCurrentWord(
                  word,
                  typedWords[index]
                )}
                {" "}
              </span>
            );
          }

          // Current word
          if (index === currentWordIdx) {
            return (
              <span
                id={`word-${index}`}
                key={index}
              >
                <span className="border-b-2 border-blue-500">
                  {renderCurrentWord(
                    word,
                    userInput
                  )}
                </span>

                {" "}

              </span>
            );
          }

          // Future words
          return (
            <span
              id={`word-${index}`}
              key={index}
              className="text-gray-400"
            >
              {word}{" "}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isComplete || isLoading || words.length === 0}
        className="w-full rounded-lg border bg-background p-5 font-mono text-xl transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={disabled ? "Wait for the race to start..." : "Start typing here..."}
        autoFocus
      />

      {isComplete && (
        <div className="flex flex-col items-center justify-center mt-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            Test completed
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Press &quot;New Text&quot; to try again
          </div>
        </div>
      )}
    </>
  );
}
