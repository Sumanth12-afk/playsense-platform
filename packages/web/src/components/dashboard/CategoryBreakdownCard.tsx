import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CategoryData {
  category: string;
  percentage: number;
  hours: number;
}

interface CategoryBreakdownCardProps {
  data: CategoryData[];
}

const categoryColors: Record<string, string> = {
  competitive: 'bg-category-competitive',
  creative: 'bg-category-creative',
  casual: 'bg-category-casual',
  social: 'bg-category-social',
};

const categoryTextColors: Record<string, string> = {
  competitive: 'text-category-competitive',
  creative: 'text-category-creative',
  casual: 'text-category-casual',
  social: 'text-category-social',
};

const categoryLabels: Record<string, string> = {
  competitive: 'Competitive',
  creative: 'Creative',
  casual: 'Casual',
  social: 'Social',
};

const categoryDescriptions: Record<string, string> = {
  competitive: 'Games focused on skill-based competition against other players.',
  creative: 'Games that encourage building, creating, and expressing creativity.',
  casual: 'Relaxing games with low-pressure gameplay.',
  social: 'Games primarily focused on interaction with friends and community.',
};

export const CategoryBreakdownCard = ({ data }: CategoryBreakdownCardProps) => {
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">Game Categories</h3>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-sm">
              Games are categorized by their primary gameplay style. This helps understand what type
              of gaming experiences your child enjoys.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">What types of games are being played</p>

      {/* Donut visualization */}
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {(() => {
              let offset = 0;
              return sortedData.map((cat, index) => {
                const strokeDasharray = `${cat.percentage * 2.51327} ${251.327}`;
                const strokeDashoffset = -offset * 2.51327;
                offset += cat.percentage;

                return (
                  <motion.circle
                    key={cat.category}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="20"
                    className={categoryColors[cat.category] || 'bg-muted'}
                    style={{
                      strokeDasharray,
                      strokeDashoffset,
                      stroke: 'currentColor',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  />
                );
              });
            })()}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        {sortedData.map((cat, index) => (
          <motion.div
            key={cat.category}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn('h-3 w-3 rounded-full', categoryColors[cat.category] || 'bg-muted')}
                />
                <Tooltip>
                  <TooltipTrigger className="text-left">
                    <span className="text-sm font-medium text-foreground">
                      {categoryLabels[cat.category] || cat.category}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{categoryDescriptions[cat.category] || ''}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{cat.hours}h</span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    categoryTextColors[cat.category] || 'text-foreground'
                  )}
                >
                  {cat.percentage}%
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.percentage}%` }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                className={cn('h-full rounded-full', categoryColors[cat.category] || 'bg-primary')}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
