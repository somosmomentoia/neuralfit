import { ReactNode } from 'react';
import { AdminLayout as AdminLayoutComponent } from '@/components/layout/admin';

interface LayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: LayoutProps) {
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}
