'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TypingArea from '@/components/typing-area';
import { RACER_COLORS, RacerType } from '@/lib/constants';
import {
  getRandomTextAPI,
  getWebSocketURL,
  saveLeaderboardEntry,
  updateUserStats,
} from '@/lib/utils';
import { Copy, Play, RotateCcw, Wifi, WifiOff } from 'lucide-react';

type RaceMessage =
  | {
      type: 'join';
      roomId: string;
      racer: RacerType;
    }
  | {
      type: 'start';
      roomId: string;
      text: string;
      startedBy: string;
    }
  | {
      type: 'progress';
      roomId: string;
      racer: RacerType;
    }
  | {
      type: 'finish';
      roomId: string;
      racer: RacerType;
    }
  | {
      type: 'reset';
      roomId: string;
      text: string;
    };

const guestNames = [
  'SwiftKeys',
  'RapidType',
  'WordRunner',
  'KeyPilot',
  'SyntaxSprinter',
];

function RoomRacePage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId.toUpperCase();
  const isGlobalRoom = roomId === 'GLOBAL';

  const socketRef = useRef<WebSocket | null>(null);
  const racerIdRef = useRef(
    crypto.randomUUID()
  );
  const racerNameRef = useRef(
    guestNames[Math.floor(Math.random() * guestNames.length)]
  );

  const [currentText, setCurrentText] = useState('');
  const [connected, setConnected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState({
    currentWordIdx: 0,
    totalWords: 0,
  });
  const [racers, setRacers] = useState<RacerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const progressPercentage =
    progress.totalWords === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            ((progress.currentWordIdx + 1) / progress.totalWords) * 100
          )
        );

  const sortedRacers = useMemo(() => {
    // Sorting by progress turns the racer list into the MVP leaderboard for the current room.
    return [...racers]
      .filter(racer => racer.id !== racerIdRef.current)
      .sort(
      (a, b) =>
        b.progress - a.progress ||
        b.wpm - a.wpm ||
        (a.finishedAt || Infinity) - (b.finishedAt || Infinity)
    );
  }, [racers]);

  const localRacer: RacerType = {
    id: racerIdRef.current,
    name: racerNameRef.current,
    progress: progressPercentage,
    wpm,
    accuracy,
    color: RACER_COLORS[0],
    finishedAt: raceFinished ? Date.now() : undefined,
  };

  const sendMessage = (message: RaceMessage) => {
    // The Go server broadcasts plain websocket messages, so the client owns the JSON shape.
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const upsertRacer = (nextRacer: RacerType) => {
    setRacers(prev => {
      const withoutOldValue = prev.filter(racer => racer.id !== nextRacer.id);
      return [...withoutOldValue, nextRacer];
    });
  };

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

  useEffect(() => {
    const socket = new WebSocket(getWebSocketURL());
    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      sendMessage({
        type: 'join',
        roomId,
        racer: localRacer,
      });
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data) as RaceMessage;
        if (message.roomId !== roomId) return;

        if (message.type === 'join') {
          upsertRacer(message.racer);
        }

        if (message.type === 'start') {
          setCurrentText(message.text);
          beginCountdown();
        }

        if (message.type === 'reset') {
          setCurrentText(message.text);
          setRaceStarted(false);
          setRaceFinished(false);
          setCountdown(null);
          setWpm(0);
          setAccuracy(100);
          setProgress({ currentWordIdx: 0, totalWords: 0 });
        }

        if (message.type === 'progress' || message.type === 'finish') {
          upsertRacer(message.racer);
        }
      } catch {
        // Ignore non-JSON messages such as "Lobby full" from the current Go hub.
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!raceStarted || raceFinished) return;

    sendMessage({
      type: 'progress',
      roomId,
      racer: localRacer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercentage, wpm, accuracy, raceStarted, raceFinished, roomId]);

  const beginCountdown = () => {
    setRaceStarted(false);
    setRaceFinished(false);
    setCountdown(3);

    const countInterval = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          window.clearInterval(countInterval);
          setRaceStarted(true);
          return null;
        }

        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const startRace = () => {
    sendMessage({
      type: 'start',
      roomId,
      text: currentText,
      startedBy: racerIdRef.current,
    });
    beginCountdown();
  };

  const resetRace = async () => {
    const data = await getRandomTextAPI();
    setCurrentText(data.text);
    setRaceStarted(false);
    setRaceFinished(false);
    setCountdown(null);
    setWpm(0);
    setAccuracy(100);
    setProgress({ currentWordIdx: 0, totalWords: 0 });
    setRacers([]);

    sendMessage({
      type: 'reset',
      roomId,
      text: data.text,
    });
  };

  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const finishRace = (stats: { wpm: number; accuracy: number }) => {
    const finishedRacer = {
      ...localRacer,
      progress: 100,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      finishedAt: Date.now(),
    };

    setRaceFinished(true);
    upsertRacer(finishedRacer);
    sendMessage({
      type: 'finish',
      roomId,
      racer: finishedRacer,
    });

    saveLeaderboardEntry({
      name: 'You',
      mode: isGlobalRoom ? 'Global race' : 'Private room',
      roomId,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    });

    updateUserStats(stats.wpm, stats.accuracy);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 font-michroma">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {isGlobalRoom ? 'Global Racing Room' : 'Private Racing Room'}
          </p>
          <h1 className="text-3xl font-bold">Room {roomId}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm">
            {connected ? (
              <Wifi className="size-4 text-emerald-500" />
            ) : (
              <WifiOff className="size-4 text-rose-500" />
            )}
            {connected ? 'Connected' : 'Connecting'}
          </div>
          {!isGlobalRoom && (
            <Button variant="outline" onClick={copyRoomLink}>
              <Copy className="size-4" />
              {copied ? 'Copied' : 'Invite'}
            </Button>
          )}
          <Button variant="outline" onClick={resetRace}>
            <RotateCcw className="size-4" />
            New Text
          </Button>
          <Button onClick={startRace} disabled={isLoading || countdown !== null}>
            <Play className="size-4" />
            Start Race
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-lg p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Your run</p>
              <p className="text-2xl font-bold">
                {wpm} WPM · {accuracy}% accuracy
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{progressPercentage}%</p>
            </div>
          </div>

          {countdown !== null && (
            <div className="mb-6 rounded-lg border bg-card p-8 text-center">
              <div className="text-7xl font-bold text-cyan-500">{countdown}</div>
              <p className="mt-2 text-muted-foreground">Get ready</p>
            </div>
          )}

          <TypingArea
            text={currentText}
            onStatsChange={(stats) => {
              setWpm(stats.wpm);
              setAccuracy(stats.accuracy);
            }}
            onProgressChange={(data) => setProgress(data)}
            onComplete={finishRace}
            isLoading={isLoading}
            isRace
            wpm={wpm}
            accuracy={accuracy}
            disabled={!raceStarted || countdown !== null}
          />
        </Card>

        <Card className="rounded-lg p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Live Leaderboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Racers in this room update as they type.
            </p>
          </div>

          <div className="space-y-3">
            {[{ ...localRacer, name: 'You' }, ...sortedRacers].map((racer, index) => (
              <div key={racer.id} className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">
                    #{index + 1} {racer.name}
                  </span>
                  <span className="text-muted-foreground">{racer.wpm} WPM</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    animate={{ width: `${Math.min(100, racer.progress)}%` }}
                    className={`${racer.color || 'bg-cyan-500'} h-full rounded-full`}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RoomRacePage;
