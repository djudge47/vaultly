import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getLeakScoreColor(score: number): string {
  if (score < 30) return 'text-emerald-500';
  if (score < 60) return 'text-amber-500';
  return 'text-rose-500';
}

export function getLeakScoreLabel(score: number): string {
  if (score < 30) return 'Healthy';
  if (score < 60) return 'Moderate';
  return 'High Waste';
}

export function getRecommendationColor(rec: string): string {
  switch (rec) {
    case 'keep': return 'bg-emerald-500/10 text-emerald-500';
    case 'downgrade': return 'bg-amber-500/10 text-amber-500';
    case 'cancel': return 'bg-rose-500/10 text-rose-500';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
