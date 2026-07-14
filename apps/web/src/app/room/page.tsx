'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createRoomCode } from "@/lib/utils";
import { ArrowRight, CopyPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoomPage() {

  const [loading, setLoading] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');
  const router = useRouter();

  const createRoom = async () => {
    // The backend room table is not wired to routes yet, so the MVP creates a client-side code.
    // Each websocket message includes this code, which lets private rooms ignore other rooms.
    setLoading(true);
    const nextRoomCode = createRoomCode();
    router.push(`/room/${nextRoomCode}`);
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
