import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ href = '/', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg' },
    md: { icon: 'h-6 w-6', text: 'text-xl' },
    lg: { icon: 'h-8 w-8', text: 'text-2xl' },
  };
  const s = sizes[size];

  return (
    <Link href={href} className="flex items-center gap-2 font-bold hover:opacity-90 transition-opacity">
      <div className="flex items-center justify-center rounded-xl bg-primary/10 p-1.5">
        <ShieldCheck className={`${s.icon} text-primary`} />
      </div>
      <span className={`${s.text} font-bold tracking-tight`}>
        Vault<span className="text-primary">ly</span>
      </span>
    </Link>
  );
}
