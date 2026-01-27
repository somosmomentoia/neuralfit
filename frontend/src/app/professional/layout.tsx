import { ReactNode } from 'react';
import { ProfessionalLayout as ProfessionalLayoutComponent } from '@/components/layout/professional';

interface LayoutProps {
  children: ReactNode;
}

export default function ProfessionalRootLayout({ children }: LayoutProps) {
  return <ProfessionalLayoutComponent>{children}</ProfessionalLayoutComponent>;
}
