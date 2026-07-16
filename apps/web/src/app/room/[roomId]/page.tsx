'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TypingArea from '@/components/typing-area';
import { RACER_COLORS, RacerType, UserType } from '@/lib/constants';
import {
  getCurrentUser,
  getGuestProfile,
  getRandomTextAPI,
  getRoomAPI,
  getWebSocketURL,
  recordSessionStats,
  updateUserStats,
} from '@/lib/utils';
import { Clock, Copy, Play, RotateCcw, Wifi, WifiOff } from 'lucide-react';

type RoomStatus = 'waiting' | 'racing' | 'finished';

type RoomSnapshot = {
  room: {
    id: string;
    status: RoomStatus;
    text: string;
    startedAt?: number;
    endsAt?: number;
    durationSeconds: number;
  };
  racers: RacerType[];
  now: number;
};

type ServerMessage = {
  type: 'snapshot' | 'error';
  roomId: string;
  snapshot?: RoomSnapshot;
  message?: string;
};

function estimateRaceDuration(text: string) {
  // TypeRacer-style rooms should end by timer, not when the fastest racer finishes.
  // This estimate gives short texts enough time while preventing very long open-ended races.
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(150, Math.max(30, Math.round((wordCount / 45) * 60)));
}

function getRacerColor(racerId: string) {
  const colorIndex = racerId
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0) % RACER_COLORS.length;

  return RACER_COLORS[colorIndex];
}

function RoomRacePage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId.toUpperCase();
  const isGlobalRoom = roomId === 'GLOBAL';

  const socketRef = useRef<WebSocket | null>(null);
  const expireSentRef = useRef(false);
  const progressRef = useRef({
    currentWordIdx: 0,
    totalWords: 0,
  });

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [racerId, setRacerId] = useState('');
  const [racerName, setRacerName] = useState('Guest');
  const [currentText, setCurrentText] = useState('');
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [progress, setProgress] = useState({
    currentWordIdx: 0,
    totalWords: 0,
  });
  const [racers, setRacers] = useState<RacerType[]>([]);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('waiting');
  const [startedAt, setStartedAt] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [error, setError] = useState('');

  const serverNow = now + clockOffset;
  const countdown = roomStatus === 'racing' && startedAt > serverNow
    ? Math.ceil((startedAt - serverNow) / 1000)
    : null;
  const raceStarted = roomStatus === 'racing' && startedAt > 0 && serverNow >= startedAt;
  const raceEnded = roomStatus === 'finished' || (endsAt > 0 && serverNow >= endsAt);
  const timeLeftSeconds = endsAt > 0
    ? Math.max(0, Math.ceil((endsAt - serverNow) / 1000))
    : 0;

  const progressPercentage =
    progress.totalWords === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            ((progress.currentWordIdx + 1) / progress.totalWords) * 100
          )
        );

  const localRacer: RacerType = {
    id: racerId,
    name: racerName,
    progress: raceFinished ? 100 : progressPercentage,
    wpm,
    accuracy,
    color: getRacerColor(racerId),
    finishedAt: raceFinished ? Date.now() : undefined,
  };

  const sortedRacers = useMemo(() => {
    return racers
      .filter(racer => Boolean(racer.id))
      .sort(
        (a, b) =>
          b.progress - a.progress ||
          b.wpm - a.wpm ||
          (a.finishedAt || Infinity) - (b.finishedAt || Infinity)
      );
  }, [racers]);

  const sendMessage = (message: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const applySnapshot = (snapshot: RoomSnapshot) => {
    setClockOffset(snapshot.now - Date.now());
    setRoomStatus(snapshot.room.status);
    setStartedAt(snapshot.room.startedAt || 0);
    setEndsAt(snapshot.room.endsAt || 0);
    setRacers(snapshot.racers);

    if (snapshot.room.text) {
      setCurrentText(snapshot.room.text);
    }

    if (snapshot.room.status === 'waiting') {
      expireSentRef.current = false;
      setRaceFinished(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function prepareRoom() {
      try {
        const [user, data] = await Promise.all([
          getCurrentUser(),
          getRoomAPI(roomId),
        ]);
        const guest = getGuestProfile();

        setCurrentUser(user);
        setRacerId(user?.id || guest.id);
        setRacerName(user?.name || guest.name);
        applySnapshot(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Room not found');
      }
    }

    prepareRoom();
  }, [roomId]);

  useEffect(() => {
    if (!racerId || error) return;

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
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.type === 'error') {
          setError(message.message || 'Room error');
          return;
        }

        if (message.roomId !== roomId || !message.snapshot) return;
        applySnapshot(message.snapshot);
      } catch {
        setError('Could not read room update');
      }
    };

    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [racerId, error, roomId]);

  useEffect(() => {
    if (!racerId || !raceStarted || raceFinished || raceEnded) return;

    sendMessage({
      type: 'progress',
      roomId,
      racer: localRacer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercentage, wpm, accuracy, raceStarted, raceFinished, raceEnded, roomId, racerId]);

  useEffect(() => {
    if (!raceEnded || expireSentRef.current) return;

    expireSentRef.current = true;
    sendMessage({
      type: 'expire',
      roomId,
    });
  }, [raceEnded, roomId]);

  const startRace = () => {
    sendMessage({
      type: 'start',
      roomId,
      text: currentText,
      durationSeconds: estimateRaceDuration(currentText),
    });
  };

  const resetRace = async () => {
    try {
      setIsLoading(true);
      const data = await getRandomTextAPI();
      setWpm(0);
      setAccuracy(100);
      setProgress({ currentWordIdx: 0, totalWords: 0 });
      progressRef.current = { currentWordIdx: 0, totalWords: 0 };
      setRaceFinished(false);
      setCurrentText(data.text);
      sendMessage({
        type: 'reset',
        roomId,
        text: data.text,
      });
    } finally {
      setIsLoading(false);
    }
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
    recordSessionStats(stats.wpm, stats.accuracy);

    if (currentUser) {
      // saveLeaderboardEntry({
      //   userId: currentUser.id,
      //   name: currentUser.name,
      //   mode: isGlobalRoom ? 'Global race' : 'Private room',
      //   roomId,
      //   wpm: stats.wpm,
      //   accuracy: stats.accuracy,
      // });
      updateUserStats(stats.wpm, stats.accuracy);
    }

    sendMessage({
      type: 'finish',
      roomId,
      racer: finishedRacer,
    });
  };

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center font-michroma">
        <Card className="rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold">Room unavailable</h1>
          <p className="mt-3 leading-7 text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm">
            <Clock className="size-4 text-cyan-500" />
            {roomStatus === 'waiting' ? 'Waiting' : `${timeLeftSeconds}s left`}
          </div>
          {!isGlobalRoom && (
            <Button variant="outline" onClick={copyRoomLink}>
              <Copy className="size-4" />
              {copied ? 'Copied' : 'Invite'}
            </Button>
          )}
          <Button variant="outline" onClick={resetRace} disabled={!connected || isLoading}>
            <RotateCcw className="size-4" />
            New Text
          </Button>
          <Button
            onClick={startRace}
            disabled={!connected || isLoading || !currentText || roomStatus === 'racing'}
          >
            <Play className="size-4" />
            Start Race
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="rounded-lg p-6">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Your run</p>
              <p className="mt-2 text-2xl font-bold">{wpm} WPM</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="mt-2 text-2xl font-bold">{accuracy}%</p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="mt-2 text-2xl font-bold">{progressPercentage}%</p>
            </div>
          </div>

          {countdown !== null && (
            <div className="mb-6 rounded-lg border bg-card p-8 text-center">
              <div className="text-7xl font-bold text-cyan-500">{countdown}</div>
              <p className="mt-2 text-muted-foreground">Race starts soon</p>
            </div>
          )}

          {raceEnded && !raceFinished && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Time is up. Start a new race when everyone is ready.
            </div>
          )}

          <TypingArea
            text={currentText}
            onStatsChange={(stats) => {
              setWpm(stats.wpm);
              setAccuracy(stats.accuracy);
            }}
            onProgressChange={(data) => {
              progressRef.current = data;
              setProgress(data);
            }}
            onComplete={finishRace}
            isLoading={isLoading}
            isRace
            wpm={wpm}
            accuracy={accuracy}
            disabled={!raceStarted || raceEnded || raceFinished}
          />
        </Card>

        <Card className="rounded-lg p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Live Leaderboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {sortedRacers.length} racer{sortedRacers.length === 1 ? '' : 's'} in this room.
            </p>
          </div>

          <div className="space-y-3">
            {sortedRacers.map((racer, index) => (
              <div key={racer.id} className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">
                    #{index + 1} {racer.id === racerId ? 'You' : racer.name}
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
