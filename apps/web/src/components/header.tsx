'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Trophy, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import LoginForm from './login-form';
import { UserType } from '@/lib/constants';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function Header() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${apiUrl}/user`, {
      method: "GET",
      credentials: "include"
    })
      .then((response) => response.json())
      .then(res => {
        if (res.error) setUser(undefined);
        else setUser(res);
      });
  }, [])

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

  console.log(user, 'user')
  if (!mounted) return null;

  return (
    <>
      <header className="text-xl flex justify-between items-center p-10 font-michroma">
        <Link className="flex gap-2 font-bold" href="/">
          <Zap className="size-8" />
          TypeX
        </Link>

        <div className="flex gap-4">
          <Button>
            <Trophy className="size-4 text-yellow-500 dark:text-yellow-600" />
            Avg: 0 WPM
          </Button>

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
              <span>{user.name}</span>
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