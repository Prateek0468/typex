'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LeaderboardEntry } from '@/lib/constants';
import { loadLeaderboard } from '@/lib/utils';
import { Medal, Trophy } from 'lucide-react';

function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Browser storage is used only for the MVP so the UI works before a public leaderboard API exists.
    setEntries(loadLeaderboard());
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 font-michroma">
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
          <span>Mode</span>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Medal className="size-10 text-muted-foreground" />
            <h2 className="text-xl font-bold">No races completed yet</h2>
            <p className="max-w-md leading-7 text-muted-foreground">
              Log in, finish a global or private race, and your result will appear here.
            </p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className="grid min-w-[720px] grid-cols-[72px_1fr_120px_120px_150px] gap-4 border-b px-6 py-4 last:border-b-0"
            >
              <span className="font-bold">#{index + 1}</span>
              <div>
                <p className="font-semibold">{entry.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.completedAt).toLocaleString()}
                </p>
              </div>
              <span>{entry.wpm}</span>
              <span>{entry.accuracy}%</span>
              <span className="truncate">{entry.mode}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export default LeaderboardPage;
