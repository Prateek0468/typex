'use client';

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RACER_COLORS, RacerType } from '@/lib/constants';
import { getRandomText } from '@/lib/utils';
import { RotateCcw, Play } from 'lucide-react'
import { useEffect, useState } from 'react';

function Race() {

  const [currentText, setCurrentText] = useState("");
  const [racers, setRacers] = useState<RacerType[]>([]);

  useEffect(() => {
    setCurrentText(getRandomText().text)
  }, [])

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

  return (
    <div className='font-michroma flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-6 w-6xl'>
        {/* header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Race Mode</h1>
          <Button variant="ghost" className='border-2 cursor-pointer' onClick={() => setCurrentText(getRandomText().text)}>
            <RotateCcw />
            New Race
          </Button>
        </div>

        {/* main content area */}
        <Card className='p-6 flex flex-col jusify-center'>
          <Button className='flex items-center justify-center w-fit cursor-pointer'>
            <Play className='size-6' />
            Start Race
          </Button>


          <div className="space-y-3 mb-8">
            <div
              // initial={{ opacity: 0, x: -20 }}
              // animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700"
            >
              <div className="w-32 font-bold text-blue-700 dark:text-blue-400 text-lg">You 👤</div>
              <div className="flex-1 bg-gray-300 dark:bg-gray-700 rounded-full h-10 relative overflow-hidden shadow-inner">
                <div
                  // initial={{ width: 0 }}
                  // animate={{ width: `${userProgress}%` }}
                  className="bg-gradient-to-r from-blue-600 to-blue-400 h-full flex items-center justify-end px-3 shadow-lg"
                  // transition={{ duration: 0.3 }}
                >
                  <span className="text-white text-sm font-bold">{Math.round(20)}%</span>
                </div>
              </div>
              <div className="w-24 text-right font-bold text-blue-700 dark:text-blue-400 text-lg">{100} WPM</div>
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
                  <div
                    // initial={{ width: 0 }}
                    // animate={{ width: `${racer.progress}%` }}
                    className={`${racer.color} h-full flex items-center justify-end px-3 shadow-lg`}
                    // transition={{ duration: 0.3 }}
                  >
                    <span className="text-white text-sm font-bold">{Math.round(racer.progress)}%</span>
                  </div>
                </div>
                <div className="w-24 text-right text-gray-600 dark:text-gray-400 font-semibold">{racer.wpm} WPM</div>
              </div>
            ))}
          </div>

          <div className="mb-6 p-8 bg-gradient-to-br rounded-xl text-2xl font-mono leading-relaxed border-2 h-70 overflow-scroll border-gray-200 dark:border-gray-700 shadow-inner">
            {currentText.split('').map((char, index) => (
              <span
                key={index}
                className={"transition-all duration-300 "}
              >
                {char}
              </span>
            ))}
          </div>

          <input
            // ref={inputRef}
            type="text"
            // value={userInput}
            // onChange={handleInputChange}
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