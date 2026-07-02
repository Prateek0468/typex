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
  }, [])

  const updateStats = (nextTypedWords: string[]) => {
    const correctWords = nextTypedWords.filter(
      (word, idx) => word === words[idx]
    ).length;

    const totalWords = nextTypedWords.length;

    const nextAccuracy =
      totalWords === 0
        ? 100
        : Math.round((correctWords / totalWords) * 100);

    setAccuracy(nextAccuracy);

    if (startTime) {
      const minutes =
        (Date.now() - startTime) / 1000 / 60;

      const nextWpm = Math.round(
        correctWords / Math.max(minutes, 0.01)
      );

      setWpm(nextWpm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!startTime) setStartTime(Date.now());

    if (value.endsWith(" ")) {
      const typedWord = value.trim();
      if (!typedWord) {
        setUserInput('');
        return;
      }

      const nextTypedWords = [...typedWords, typedWord];
      setTypedWords(nextTypedWords);
      updateStats(nextTypedWords);

      if (currentWordIdx >= words.length - 1) {
        setIsComplete(true);
        setUserInput('');
        return;
      }

      setCurrentWordIdx(prev => prev + 1);
      setUserInput('');
      return;
    }

    setUserInput(value);


    // // calculate accuracy
    // let correct = 0;
    // for(let i = 0; i < value.length; i++)
    // {
    //   if(value[i] == currentText[i]) correct++;
    // }

    // const acc = value.length > 0 ? (correct / value.length) * 100 : 100;
    // setAccuracy(Math.round(acc));


    // // calculate WPM
    // if (startTime) {
    //   const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
    //   const wordsTyped = value.split(' ').length;
    //   const currentWpm = Math.round(wordsTyped / timeElapsed);
    //   setWpm(currentWpm);
    // }

    // // Check if complete
    // if (value === currentText) {
    //   setIsComplete(true);
    //   const wordsTyped = value.split(' ').length;
    //   // updateStats(currentWpm, acc, wordsTyped, 'practice');
    //   confetti({
    //     particleCount: 100,
    //     spread: 70,
    //     origin: { y: 0.6 }
    //   });
    // }
  }

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


  const renderCurrentWord = (word: string) => {
    return word.split('').map((char, i) => {
      let className = 'text-gray-400';

      if (i < userInput.length) {
        className =
          userInput[i] === char
            ? 'text-green-600'
            : 'text-red-600';
      }

      return (
        <span key={i} className={className}>
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
                {Math.min(currentWordIdx, words.length)}/ {words.length}
              </div>
            </div>
          </div>


          <div className="mb-6 p-8 bg-gradient-to-br rounded-xl text-2xl font-mono h-70 overflow-scroll leading-relaxed border-2 border-gray-200 dark:border-gray-700 shadow-inner">
            {isLoading && <div className='flex justify-center items-center h-full'><LoaderPinwheel />...Loading</div>}
            {!isLoading && words.map((word, index) => {
              // Completed words
              if (index < typedWords.length) {
                const correct = typedWords[index] === words[index];

                return (
                  <span
                    key={index}
                    className={correct ? 'text-green-600' : 'text-red-600'}
                  >
                    {word}{' '}
                  </span>
                );
              }

              // Current word
              if (index === currentWordIdx) {
                return (
                  <span key={index}>
                    <span className='border-b-2 border-blue-500'>
                      {renderCurrentWord(word)}
                    </span>
                    {' '}
                  </span>
                );
              }

              // Future words
              return (
                <span key={index} className="text-gray-400">
                  {word}{' '}
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
        </Card>
      </div>
    </div>
  )
}

export default Practice