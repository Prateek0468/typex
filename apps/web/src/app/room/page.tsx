'use client'

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function RoomPage() {

  const [loading, setLoading] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>('');



  const createRoom = () => {
    // todo: update with room creation logic
    console.log("create room");
  }

  const joinRoom = () => {
    // todo: update with room joining logic
    console.log('Join room');
    setLoading(false);
  }


  return (
    <div className="min-h-screen flex items-center justify-center -mt-32">
      <Card className="p-8 w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            Private Room
          </h1>

          <p className="text-gray-500 mt-2">
            Create a room or join one with a code.
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
            {loading
              ? "Creating..."
              : "Create Room"
            }
          </Button>
        </div>

        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-px bg-gray-500 flex-1" />
          OR
          <div className="h-px bg-gray-500 flex-1" />
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">
            Join Room
          </h2>

          <Input
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value)
            }
          />
          <Button
            className="w-full"
            onClick={joinRoom}
          >
            Join Room
          </Button>
        </div>
      </Card>

    </div>


  )
}