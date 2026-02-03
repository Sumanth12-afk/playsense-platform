// src/components/ui/Badge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'competitive' | 'creative' | 'casual' | 'social';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    competitive: 'bg-[hsl(0,65%,95%)] text-[hsl(0,70%,45%)]',
    creative: 'bg-[hsl(280,60%,95%)] text-[hsl(280,60%,45%)]',
    casual: 'bg-[hsl(200,70%,95%)] text-[hsl(200,70%,40%)]',
    social: 'bg-[hsl(145,55%,94%)] text-[hsl(145,55%,35%)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

