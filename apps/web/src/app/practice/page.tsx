'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getRandomTextAPI } from '@/lib/utils';
import { LoaderPinwheel, RotateCcw, Target, Zap } from 'lucide-react'

function Practice() {
  const [currentText, setCurrentText] = useState("");
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [wpm, setWpm] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [accuracy, setAccuracy] = useState(100);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // split the current text into words and render those
  const words = useMemo(() => currentText.split(/\s+/).filter(Boolean), [currentText]);
  useEffect(() => {
    async function loadText() {
      try {
        setIsLoading(true);
        const data = await getRandomTextAPI();
        setCurrentText(data.text);
      } finally {
        setIsLoading(false);
      }
    }

    loadText();
  }, []);

  useEffect(() => {
    const el = document.getElementById(`word-${currentWordIdx}`);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [currentWordIdx]);

  const updateStats = (
    nextTypedWords: string[],
    currentInput: string
  ) => {
    let correctChars = 0;
    let totalTypedChars = 0;

    // Completed words
    nextTypedWords.forEach((typedWord, index) => {
      const expectedWord = words[index];

      for (
        let i = 0;
        i < typedWord.length;
        i++
      ) {
        totalTypedChars++;

        if (typedWord[i] === expectedWord[i]) {
          correctChars++;
        }
      }
    });

    // Current word
    const expectedCurrentWord = words[nextTypedWords.length];

    if (expectedCurrentWord) {
      for (
        let i = 0;
        i < currentInput.length;
        i++
      ) {
        totalTypedChars++;

        if (currentInput[i] === expectedCurrentWord[i]) {
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

    setAccuracy(nextAccuracy);

    if (startTime) {
      const minutes =
        (Date.now() - startTime) / 1000 / 60;

      const totalChars =
        nextTypedWords.join("").length +
        currentInput.length;

      setWpm(
        Math.round(
          totalChars / 5 / Math.max(minutes, 0.01)
        )
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
  
    if (!startTime) setStartTime(Date.now());
  
    const currentWord = words[currentWordIdx];
  
    // User finished the final word (without needing space)
    if (
      currentWordIdx === words.length - 1 &&
      value === currentWord
    ) {
      const nextTypedWords = [...typedWords, value];
  
      setTypedWords(nextTypedWords);
      updateStats(nextTypedWords, "");
  
      setIsComplete(true);
      setUserInput("");
      return;
    }
  
    // Space pressed -> finish current word
    if (value.endsWith(" ")) {
      const typedWord = value.trim();
  
      if (!typedWord) {
        setUserInput("");
        return;
      }
  
      const nextTypedWords = [...typedWords, typedWord];
  
      setTypedWords(nextTypedWords);
      updateStats(nextTypedWords, "");
  
      setCurrentWordIdx(prev => prev + 1);
      setUserInput("");
      return;
    }
  
    // Normal typing
    setUserInput(value);
    updateStats(typedWords, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' &&
      userInput.length === 0 &&
      currentWordIdx > 0
    ) {
      e.preventDefault();

      const prevIndex = currentWordIdx - 1;

      setCurrentWordIdx(prevIndex);
      setUserInput(typedWords[prevIndex] ?? '');

      setTypedWords(prev =>
        prev.slice(0, prev.length - 1)
      );
    }
  };

  const generateNewText = async () => {
    try {
      setIsLoading(true);
      const data = await getRandomTextAPI();
      setCurrentText(data.text);
    } finally {
      setIsLoading(false);
    }
  }


  const onClickNewText = () => {
    generateNewText();
    setTypedWords([]);
    setUserInput('');
    setStartTime(null);
    setCurrentWordIdx(0);
    setWpm(0);
    setAccuracy(100);
    setIsComplete(false);
    inputRef.current?.focus();
  }


  const renderCurrentWord = (word: string, typedWord: string = "") => {
    return word.split("").map((char, index) => {
      let className = "text-gray-400";

      if (index < typedWord.length) {
        className =
          typedWord[index] === char
            ? "text-green-600"
            : "text-red-600";
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className='font-michroma flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-6 w-4xl'>
        {/* header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Practice Mode</h1>
          <Button variant="ghost" className='border-2 cursor-pointer' onClick={onClickNewText}>
            <RotateCcw />
            New Text
          </Button>
        </div>

        {/* main content area */}
        <Card className='p-6 flex flex-col'>
          <div className='grid grid-cols-3 gap-4 mb-6'>
            {/* can turn these into reusable cards. Too much repetition here */}
            <div
              className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border-2 border-blue-200 dark:border-blue-700"
            >

              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">WPM</div>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{wpm}</div>
            </div>
            <div
              className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border-2 border-green-200 dark:border-green-700"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Accuracy</div>
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{accuracy}%</div>
            </div>
            <div
              className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border-2 border-purple-200 dark:border-purple-700"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Progress</div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {Math.min(currentWordIdx + 1, words.length)}/ {words.length}
              </div>
            </div>
          </div>


          <div className="mb-6 p-8 bg-gradient-to-br rounded-xl text-2xl font-mono h-70 overflow-scroll leading-relaxed border-2 border-gray-200 dark:border-gray-700 shadow-inner">
            {isLoading && <div className='flex justify-center items-center h-full'><LoaderPinwheel />...Loading</div>}
            {!isLoading && words.map((word, index) => {
              // Completed words
              if (index < typedWords.length) {
                return (
                  <span id={`word-${index}`} key={index}>
                    {renderCurrentWord(word, typedWords[index])}
                    {" "}
                  </span>
                );
              }

              // Current word
              if (index === currentWordIdx) {
                return (
                  <span id={`word-${index}`} key={index}>
                    <span className="border-b-2 border-blue-500">
                      {renderCurrentWord(word, userInput)}
                    </span>
                    {" "}
                  </span>
                );
              }

              // Future words
              return (
                <span id={`word-${index}`} key={index} className="text-gray-400">
                  {word}{" "}
                </span>
              );
            })}

          </div>

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => handleInputChange(e)}
            onKeyDown={handleKeyDown}
            disabled={isComplete}
            className="w-full p-5 text-xl border-2 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
            placeholder="Start typing here..."
            autoFocus
          />
          {isComplete && (
            <div className="flex flex-col items-center justify-center mt-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                Test Completed 🎉
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Press &quot;New Text&quot; to try again
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Practice