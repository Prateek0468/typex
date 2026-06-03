'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Trophy, Zap } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'
import { useTheme } from 'next-themes';
import Link from 'next/link';

function Header() {

  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  // so that we wait until the component is mounted to change themes
  // otherwise will get hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="text-xl flex justify-between items-center p-10 font-michroma">
      {/* App */}
      <Link className="flex gap-2 font-bold" href='/'>
        <Zap className="size-8" fill='dark' /> TypeX
      </Link>


      {/* Login and theme swticher */}
      <div className="flex gap-4">
        {/* Make it dynamic later*/}
        <Button>
          <Trophy className="size-4 text-yellow-500 dark:text-yellow-600" />
          Avg: 0 WPM
        </Button>

        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
        <Button className="">Login/Signup</Button>
      </div>
    </header>
  )
}

export default Header