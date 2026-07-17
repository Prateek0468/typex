'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LeaderboardEntry } from '@/lib/constants';
import { loadLeaderboard } from '@/lib/utils';
import { Loader, Medal, Trophy } from 'lucide-react';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try{
        const entries = await loadLeaderboard();
        setLeaderboard(entries);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-3 font-michroma">
      <div>
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
          <Trophy className="size-6" />
        </div>
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Signed-in race results appear here. Guests can still race, but their results stay temporary in the header.
        </p>
      </div>

      <Card className="overflow-x-auto rounded-lg p-0">
        <div className="grid min-w-[720px] grid-cols-[72px_1fr_120px_120px_150px] gap-4 border-b bg-muted/40 px-6 py-4 text-sm text-muted-foreground">
          <span>Rank</span>
          <span>Player</span>
          <span>WPM</span>
          <span>Accuracy</span>
          <span>Total Races</span>
        </div>

        {isLoading && (
          <div className='flex justify-center items-center gap-2 mb-5'>
            <Loader />
            Loading...
          </div>
        )}

        {leaderboard.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Medal className="size-10 text-muted-foreground" />
            <h2 className="text-xl font-bold">No races completed yet</h2>
            <p className="max-w-md leading-7 text-muted-foreground">
              Log in, finish a global or private race, and your result will appear here.
            </p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className="grid min-w-[720px] grid-cols-[72px_1fr_120px_120px_150px] gap-4 border-b px-6 py-4 last:border-b-0"
            >
              <span className="font-bold">#{index + 1}</span>
              <div>
                <p className="font-semibold">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.updatedAt).toLocaleString()}
                </p>
              </div>
              <span>{entry.bestWPM}</span>
              <span>{entry.averageAccuracy}%</span>
              <span className="truncate">{entry.totalRaces}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export default LeaderboardPage;
