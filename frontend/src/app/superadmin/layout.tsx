import { ReactNode } from 'react';
import { SuperadminLayout as SuperadminLayoutComponent } from '@/components/layout/superadmin';

interface LayoutProps {
  children: ReactNode;
}

export default function SuperadminLayout({ children }: LayoutProps) {
  return <SuperadminLayoutComponent>{children}</SuperadminLayoutComponent>;
}
