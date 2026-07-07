'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRandomTextAPI } from '@/lib/utils';
import { RotateCcw, Target, Zap } from 'lucide-react';
import TypingArea from '@/components/typing-area';


function Practice() {

  const [currentText, setCurrentText] = useState("");

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState({
    currentWordIdx: 0,
    totalWords: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadText = async () => {
    try {
      setIsLoading(true);
      const data = await getRandomTextAPI();
      setCurrentText(data.text);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    loadText();
  }, []);

  const onClickNewText = () => {
    loadText();
    setWpm(0);
    setAccuracy(100);
  };

  return (
    <div className='font-michroma flex flex-col justify-center items-center'>
      <div className='flex flex-col gap-6 w-4xl'>
        {/* header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>
            Practice Mode
          </h1>
          <Button
            variant="ghost"
            className='border-2 cursor-pointer'
            onClick={onClickNewText}
          >
            <RotateCcw />
            New Text
          </Button>
        </div>

        {/* main content */}
        <Card className='p-6 flex flex-col'>
          <div className='grid grid-cols-3 gap-4 mb-6'>
            {/* WPM */}
            <div
              className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  WPM
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {wpm}
              </div>
            </div>

            {/* Accuracy */}
            <div
              className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl border-2 border-green-200 dark:border-green-700">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Accuracy
                </div>
              </div>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {accuracy}%
              </div>
            </div>

            {/* Progress */}
            <div
              className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl border-2 border-purple-200 dark:border-purple-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                Progress
              </div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {Math.min(
                  progress.currentWordIdx + 1,
                  progress.totalWords
                )} / {progress.totalWords}
              </div>
            </div>
          </div>

          <TypingArea
            text={currentText}
            onStatsChange={(stats) => {
              setWpm(stats.wpm);
              setAccuracy(stats.accuracy);
            }}
            onProgressChange={(data) => {
              setProgress(data);
            }}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </div>

  );

}


export default Practice;