'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  User,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/account', label: 'Account', icon: User },
];

function NavItem({ href, label, icon: Icon, exact }: typeof navItems[0]) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ href, label, icon: Icon, exact }: typeof navItems[0]) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 py-2 px-3 text-xs font-medium transition-colors flex-1',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className={cn('h-5 w-5', active && 'text-primary')} />
      {label}
    </Link>
  );
}

export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card z-30">
        <div className="flex flex-col h-full px-4 py-6">
          <div className="mb-8 px-3">
            <Logo />
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <div className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-30 flex items-center safe-area-bottom">
        {navItems.map(item => (
          <MobileNavItem key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}
