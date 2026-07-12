import { Card } from "@/components/ui/card";
import Link from "next/link";


export default function RacePage() {
  return (
    <div className="font-michroma min-h-screen flex flex-col items-center justify-center gap-8 -mt-32">
      <h1 className="text-4xl font-bold">Multiplayer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Link href="room/global">
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Quick Match</h2>
            <p className="mt-2 text-gray-500">Race against available players</p>
          </Card>
        </Link>

        <Link href="room">
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Private Room</h2>
            <p className="mt-2 text-gray-500">Create a room and invite your friends</p>
          </Card>
        </Link>
      </div>

    </div>
  )
}