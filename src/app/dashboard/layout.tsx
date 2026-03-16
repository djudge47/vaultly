import { NavShell } from '@/components/dashboard/nav-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
