'use client';

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getRandomText } from '@/lib/utils';
import { RotateCcw, Target, Zap } from 'lucide-react'
import { useEffect, useState } from 'react';

function Practice() {
  const [currentText, setCurrentText] = useState("");

  useEffect(() => {
    setCurrentText(getRandomText().text)
  }, [])

  return (
    <div className='font-michroma flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-6 w-4xl'>
        {/* header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Practice Mode</h1>
          <Button variant="ghost" className='border-2 cursor-pointer' onClick={() => setCurrentText(getRandomText().text)}>
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
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{29}</div>
            </div>
            <div
              className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border-2 border-green-200 dark:border-green-700"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Accuracy</div>
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{0}%</div>
            </div>
            <div
              className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border-2 border-purple-200 dark:border-purple-700"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Progress</div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {72}/{100}
              </div>
            </div>
          </div>


          <div className="mb-6 p-8 bg-gradient-to-br rounded-xl text-2xl font-mono leading-relaxed border-2 border-gray-200 dark:border-gray-700 shadow-inner">
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

export default Practice