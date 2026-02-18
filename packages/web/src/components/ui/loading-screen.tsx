'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const MESSAGES = [
  'Understanding gaming, together.',
  'Bringing calm to screen time.',
  'Privacy-first insights for parents.',
  'Building healthier gaming habits.',
  'Your child, in balance.',
  'Real insights, real peace of mind.',
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Image
              src="/logo.png"
              alt="PlaySense"
              width={48}
              height={48}
              className="animate-pulse"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">PlaySense</h2>
          <p className="text-sm text-muted-foreground transition-opacity duration-500">
            {MESSAGES[messageIndex]}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.6s' }}
          />
        ))}
      </div>
    </div>
  );
}
