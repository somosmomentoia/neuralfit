'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, apiFetch } from '@/lib/api';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setShowLanding(true);
        setChecking(false);
        return;
      }

      try {
        const res = await apiFetch('/auth/me');
        if (res.ok) {
          const data = await res.json();
          const redirectPath = 
            data.user.role === 'ADMIN' ? '/admin' :
            data.user.role === 'PROFESSIONAL' ? '/professional' : '/client';
          router.replace(redirectPath);
        } else {
          setShowLanding(true);
          setChecking(false);
        }
      } catch {
        setShowLanding(true);
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0d1210'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(188, 255, 49, 0.2)',
          borderTopColor: '#bcff31',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage />;
  }

  return null;
}
