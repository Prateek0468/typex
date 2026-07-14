import NavigationCards from "@/components/navigation-cards";
import { Activity, Sparkles, Timer, Users } from 'lucide-react';
import { CardOptions } from "@/lib/constants";

export default function Home() {

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 font-michroma">
      <section className="grid items-center gap-8 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-amber-500" />
            Typing practice, private rooms, and quick races
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-normal text-foreground md:text-6xl">
              TypeX
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Build speed and accuracy in practice mode, then race friends in a shared room or jump into the global lobby.
            </p>
          </div>
          <div className="grid max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-4">
              <Timer className="mb-3 size-5 text-cyan-500" />
              <p className="text-2xl font-bold">Live</p>
              <p className="text-xs text-muted-foreground">WPM tracking</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Users className="mb-3 size-5 text-emerald-500" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Racers per lobby</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Activity className="mb-3 size-5 text-rose-500" />
              <p className="text-2xl font-bold">Local</p>
              <p className="text-xs text-muted-foreground">Leaderboard MVP</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="mb-4 text-sm text-muted-foreground">Race preview</p>
          <div className="space-y-4">
            {["You", "SpeedTyper92", "KeyboardNinja"].map((name, index) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{[68, 54, 41][index]}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${[68, 54, 41][index]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
          {CardOptions.map(({ href, icon, title, description }) => (
            <NavigationCards key={href} icon={icon} title={title} description={description} href={href} />
          ))}
      </section>
    </div>
  );
}
