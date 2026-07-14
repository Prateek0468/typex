'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoomAPI, getRandomTextAPI } from "@/lib/utils";
import { ArrowRight, CopyPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoomPage() {

  const [loading, setLoading] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const [error, setError] = useState('');
  const router = useRouter();

  const createRoom = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getRandomTextAPI();
      const room = await createRoomAPI(data.text);
      router.push(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setLoading(false);
    }
  }

  const joinRoom = () => {
    // Normalize the code so copied lower-case links and manually typed codes land in the same room.
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    if (!normalizedRoomCode) return;

    router.push(`/room/${normalizedRoomCode}`);
  }


  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center font-michroma">
      <Card className="w-full max-w-xl space-y-8 rounded-lg p-8">
        <div>
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
            <Users className="size-6" />
          </div>
          <h1 className="text-3xl font-bold">Private Room</h1>

          <p className="mt-2 leading-7 text-muted-foreground">
            Create a room code, share the URL with friends, and start the same typing race together.
          </p>
          {error && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">
            Create Room
          </h2>


          <Button
            className="w-full"
            onClick={createRoom}
            disabled={loading}
          >
            <CopyPlus className="size-4" />
            {loading
              ? "Creating..."
              : "Create Room"
            }
          </Button>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OR
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">
            Join Room
          </h2>

          <Input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.toUpperCase())
            }
          />
          <Button
            className="w-full"
            onClick={joinRoom}
            disabled={!roomCode.trim()}
          >
            <ArrowRight className="size-4" />
            Join Room
          </Button>
        </div>
      </Card>

    </div>


  )
}
