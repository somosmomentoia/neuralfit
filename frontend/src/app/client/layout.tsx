import { ReactNode } from 'react';
import { ClientLayout as ClientLayoutComponent } from '@/components/layout/client';

interface LayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: LayoutProps) {
  return <ClientLayoutComponent>{children}</ClientLayoutComponent>;
}
