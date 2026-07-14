'use client';

import { useEffect, useState } from 'react';
import { Keyboard, Moon, Sun, Trophy, Users, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import LoginForm from './login-form';
import { SessionStats, UserType } from '@/lib/constants';
import { getCurrentUser, loadSessionStats } from '@/lib/utils';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function Header() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalRaces: 0,
    averageWpm: 0,
    averageAccuracy: 100,
    bestWpm: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getCurrentUser().then(res => {
      setUser(res ?? undefined);
    });
  }, [])

  useEffect(() => {
    setSessionStats(loadSessionStats());

    const refreshStats = () => setSessionStats(loadSessionStats());
    window.addEventListener("typex-session-stats-updated", refreshStats);

    return () => {
      window.removeEventListener("typex-session-stats-updated", refreshStats);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      })

      setUser(undefined);
    } catch (err) {
      console.error("Logout failed: ", err);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 px-4 py-4 backdrop-blur font-michroma">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <Link className="flex items-center gap-2 text-xl font-bold" href="/">
          <Zap className="size-7 text-cyan-500" />
          TypeX
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/practice">
              <Keyboard className="size-4" />
              Practice
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/race">
              <Users className="size-4" />
              Race
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/leaderboard">
              <Trophy className="size-4 text-amber-500" />
              Leaderboard
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg border px-3 py-2 text-xs leading-5 text-muted-foreground sm:block">
            <span className="font-semibold text-foreground">{sessionStats.bestWpm}</span> best WPM
            <span className="mx-2">·</span>
            <span className="font-semibold text-foreground">{sessionStats.averageAccuracy}%</span> avg accuracy
          </div>

          <Button
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            className="cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {user ? (
            <div className='flex items-center gap-2'>
              <span className="hidden max-w-32 truncate text-sm md:inline">{user.name}</span>
              <Button onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsLoginOpen(true)}
              className="cursor-pointer"
            >
              Login / Signup
            </Button>
          )}
        </div>
        </div>
      </header>

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute right-3 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
            <LoginForm />
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
