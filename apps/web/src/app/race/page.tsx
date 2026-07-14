import { Card } from "@/components/ui/card";
import { Globe2, LockKeyhole, Users } from "lucide-react";
import Link from "next/link";


export default function RacePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center gap-8 font-michroma">
      <div>
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
          <Users className="size-6" />
        </div>
        <h1 className="text-4xl font-bold">Multiplayer</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Join the global lobby for a public race or create a private room to race friends with an invite link.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/room/global" className="group">
          <Card className="h-full rounded-lg p-6 transition-all hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
            <Globe2 className="mb-6 size-10 text-cyan-500" />
            <h2 className="text-2xl font-bold">Global Racing Room</h2>
            <p className="mt-2 leading-7 text-muted-foreground">Race anyone who joins the shared public lobby.</p>
          </Card>
        </Link>

        <Link href="/room" className="group">
          <Card className="h-full rounded-lg p-6 transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg">
            <LockKeyhole className="mb-6 size-10 text-emerald-500" />
            <h2 className="text-2xl font-bold">Private Room</h2>
            <p className="mt-2 leading-7 text-muted-foreground">Create a code, share it, and race in the same room.</p>
          </Card>
        </Link>
      </div>

    </div>
  )
}
