import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const user = await getSession();

  if (!user) {
    return <LandingPage />;
  }

  // Redirect based on role
  const redirectPath = 
    user.role === 'ADMIN' ? '/admin' :
    user.role === 'PROFESSIONAL' ? '/professional' : '/client';
  
  redirect(redirectPath);
}
