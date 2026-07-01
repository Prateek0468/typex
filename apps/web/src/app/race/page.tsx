'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RACER_COLORS, RacerType } from '@/lib/constants';
import { getRandomTextAPI } from '@/lib/utils';
import { RotateCcw, Play } from 'lucide-react'
import { motion } from 'framer-motion';

function Race() {

  const [currentText, setCurrentText] = useState("");
  const [racers, setRacers] = useState<RacerType[]>([]);
  const [wpm, setWpm] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [accuracy, setAccuracy] = useState(100);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState(0);
  const [isRacing, setIsRacing] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadText() {
      const data = await getRandomTextAPI();
      setCurrentText(data.text);
    }
    loadText();
  }, [])

  useEffect(() => {
    if (isRacing && !raceFinished) {
      // Simulate other racers' progress
      const interval = setInterval(() => {
        setRacers(prev => prev.map(racer => {
          if (racer.progress >= 100) return racer;

          const speedVariation = 0.5 + Math.random() * 1.5;
          const newProgress = Math.min(100, racer.progress + speedVariation);
          const newWpm = Math.round(40 + Math.random() * 40);

          return { ...racer, progress: newProgress, wpm: newWpm };
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRacing, raceFinished]);

  const startRace = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countInterval);
          setIsRacing(true);
          setStartTime(Date.now());
          // setCountdown(null);
          inputRef.current?.focus();
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // Generate mock racers
    const mockRacers: RacerType[] = [
      { id: 1, name: 'SpeedTyper92', progress: 0, wpm: 0, color: RACER_COLORS[0] },
      { id: 2, name: 'KeyboardNinja', progress: 0, wpm: 0, color: RACER_COLORS[1] },
      { id: 3, name: 'TypeMaster', progress: 0, wpm: 0, color: RACER_COLORS[2] },
      { id: 4, name: 'QuickFingers', progress: 0, wpm: 0, color: RACER_COLORS[3] },
    ];
    setRacers(mockRacers);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!startTime) setStartTime(Date.now());

    setUserInput(value);

    const progress = (value.length / currentText.length) * 100;
    setUserProgress(progress);


    // calculate accuracy
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] == currentText[i]) correct++;
    }

    const acc = value.length > 0 ? (correct / value.length) * 100 : 100;
    setAccuracy(Math.round(acc));


    // calculate WPM
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = value.split(' ').length;
      const currentWpm = Math.round(wordsTyped / timeElapsed);
      setWpm(currentWpm);
    }
  }

  const generateNewText = async () => {
    const data = await getRandomTextAPI();
    setCurrentText(data.text);
  }

  const resetRace = () => {
    generateNewText();
    setUserInput('');
    setStartTime(null);
    setWpm(0);
    setIsRacing(false);
    setRaceFinished(false);
    setUserProgress(0);
  }


  const getCharacterClass = (index: number) => {
    if (index >= userInput.length) {
      return 'text-gray-400';
    }
    return userInput[index] === currentText[index]
      ? 'text-green-600'
      : 'text-red-600';
  }

  return (
    <div className='font-michroma flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-6 w-6xl'>
        {/* header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Race Mode</h1>
          <Button variant="ghost" className='border-2 cursor-pointer' onClick={resetRace}>
            <RotateCcw />
            New Race
          </Button>
        </div>

        {/* main content area */}
        <Card className='p-6 flex flex-col jusify-center'>
          <div className='flex justify-between items-center'>
            <Button className='flex items-center justify-center w-fit cursor-pointer' onClick={startRace}>
              <Play className='size-6' />
              Start Race
            </Button>
            <span>{accuracy}% Accuracy</span>
          </div>


          {countdown !== null && (
            <div
              // initial={{ opacity: 0, scale: 0.8 }}
              // animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div
                key={countdown}
                // initial={{ scale: 1.5, opacity: 0 }}
                // animate={{ scale: 1, opacity: 1 }}
                className="text-9xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent"
              >
                {countdown}
              </div>
              <p className="text-2xl text-gray-600 dark:text-gray-400 mt-4 font-semibold">Get ready...</p>
            </div>
          )}



          <div className="space-y-3 mb-8">
            <div
              // initial={{ opacity: 0, x: -20 }}
              // animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700"
            >
              <div className="w-32 font-bold text-blue-700 dark:text-blue-400 text-lg">You 👤</div>
              <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-10 relative overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userProgress}%` }}
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full flex items-center justify-end px-3 shadow-lg"
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white text-sm font-bold">{Math.round(userProgress)}%</span>
                </motion.div>
              </div>
              <div className="w-24 text-right font-bold text-blue-700 dark:text-blue-400 text-lg">{wpm} WPM</div>
            </div>

            {racers.map((racer) => (
              <div
                key={racer.id}
                // initial={{ opacity: 0, x: -20 }}
                // animate={{ opacity: 1, x: 0 }}
                // transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-32 text-gray-700 dark:text-gray-300 truncate font-medium">{racer.name}</div>
                <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-10 relative overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${racer.progress}%` }}
                    className={`${racer.color} h-full flex items-center justify-end px-3 shadow-lg`}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-white text-sm font-bold">{Math.round(racer.progress)}%</span>
                  </motion.div>
                </div>
                <div className="w-24 text-right text-gray-600 dark:text-gray-400 font-semibold">{racer.wpm} WPM</div>
              </div>
            ))}
          </div>

          <div className="mb-6 p-8 bg-gradient-to-br rounded-xl text-2xl font-mono leading-relaxed border-2 h-70 overflow-scroll border-gray-200 dark:border-gray-700 shadow-inner">
            {currentText.split('').map((char, index) => (
              <span
                key={index}
                className={`${getCharacterClass(index)} transition-all duration-300`}
              >
                {char}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            // disabled={isComplete}
            className="w-full p-5 text-xl border-2 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
            placeholder="Start typing here..."
            autoFocus
          />


        </Card>
      </div>
    </div>
  )
}

export default Race