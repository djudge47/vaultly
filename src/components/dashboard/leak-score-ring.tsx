'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LeakScoreRingProps {
  score: number;
  size?: 'sm' | 'lg';
  animated?: boolean;
}

export function LeakScoreRing({ score, size = 'lg', animated = true }: LeakScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const isLg = size === 'lg';

  const svgSize = isLg ? 200 : 80;
  const strokeWidth = isLg ? 12 : 6;
  const radius = (svgSize - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayScore / 100) * circumference;

  // Colour by score
  const color = score < 30 ? '#10B981' : score < 60 ? '#F59E0B' : '#F43F5E';
  const label = score < 30 ? 'Healthy' : score < 60 ? 'Moderate' : 'High Waste';

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    let current = 0;
    const step = () => {
      current = Math.min(current + 2, score);
      setDisplayScore(current);
      if (current < score) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  if (size === 'sm') {
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-bold" style={{ color }}>{displayScore}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
          {/* Progress */}
          <circle
            cx={svgSize / 2} cy={svgSize / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-black tabular-nums" style={{ color }}>{displayScore}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Leak Score</span>
        </div>
      </div>
      <span
        className={cn('text-sm font-semibold px-3 py-1 rounded-full')}
        style={{ color, background: `${color}18` }}
      >
        {label}
      </span>
    </div>
  );
}
