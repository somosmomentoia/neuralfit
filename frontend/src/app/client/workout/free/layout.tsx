import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function FreeWorkoutLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
