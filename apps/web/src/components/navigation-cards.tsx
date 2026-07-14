import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { NavigationCardsType } from '@/lib/constants';
import Link from 'next/link';


function NavigationCards({ icon, title, href, description }: NavigationCardsType) {
  const Icon = icon;
  return (
    <Link href={href} className="group">
      <Card className="h-full rounded-lg border bg-card/80 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-400 hover:shadow-lg">
        <CardHeader>
          <div className="flex size-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors group-hover:bg-cyan-500 group-hover:text-white dark:text-cyan-300">
            <Icon className='size-6' />
          </div>
        </CardHeader>

        <CardContent>
          <CardTitle className='mb-3 text-2xl font-bold'>{title}</CardTitle>
          <CardDescription className='text-base leading-7'>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export default NavigationCards
