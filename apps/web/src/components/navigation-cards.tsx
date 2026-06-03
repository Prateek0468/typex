import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { NavigationCardsType } from '@/lib/constants';
import Link from 'next/link';


function NavigationCards({ icon, title, href, description }: NavigationCardsType) {
  const Icon = icon;
  return (
    <Link href={href}>
      <Card className="flex flex-col max-w-[600px] justify-center items-center shadow-lg dark:shadow-black/40 hover:shadow-xl dark:hover:shadow-black/60 transition-all transform hover:-translate-y-2">
        <CardHeader className='-translate-x-6'>
          <Icon className='size-15' />
        </CardHeader>

        <CardContent className='flex flex-col justify-center items-center text-center'>
          <CardTitle className='text-3xl font-bold mb-3'>{title}</CardTitle>
          <CardDescription className='text-lg'>{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export default NavigationCards