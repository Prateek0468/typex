'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCurrentUser, getRandomTextAPI, recordSessionStats, updateUserStats } from '@/lib/utils';
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
    <div className='mx-auto flex max-w-5xl flex-col gap-6 font-michroma'>
        {/* header */}
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>Practice Mode</h1>
            <p className="mt-2 text-muted-foreground">Warm up with random passages and track live speed.</p>
          </div>
          <Button
            variant="ghost"
            className='cursor-pointer border'
            onClick={onClickNewText}
          >
            <RotateCcw />
            New Text
          </Button>
        </div>

        {/* main content */}
        <Card className='rounded-lg p-6'>
          <div className='mb-6 grid gap-4 md:grid-cols-3'>
            {/* WPM */}
            <div
              className="rounded-lg border border-cyan-200 bg-cyan-50 p-5 text-center dark:border-cyan-900 dark:bg-cyan-950/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                <div className="text-sm font-medium text-muted-foreground">
                  WPM
                </div>
              </div>
              <div className="text-4xl font-bold text-cyan-700 dark:text-cyan-300">
                {wpm}
              </div>
            </div>

            {/* Accuracy */}
            <div
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div className="text-sm font-medium text-muted-foreground">
                  Accuracy
                </div>
              </div>
              <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                {accuracy}%
              </div>
            </div>

            {/* Progress */}
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900 dark:bg-rose-950/40">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Progress
              </div>
              <div className="text-4xl font-bold text-rose-700 dark:text-rose-300">
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
            onComplete={async (stats) => {
              recordSessionStats(stats.wpm, stats.accuracy);
              const user = await getCurrentUser();
              if (user) {
                updateUserStats(stats.wpm, stats.accuracy);
              }
            }}
            isLoading={isLoading}
          />
        </Card>
    </div>

  );

}


export default Practice;
