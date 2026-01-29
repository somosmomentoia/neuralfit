'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      // Store token - always use localStorage on iOS/mobile for PWA compatibility
      if (data.token) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // En móviles siempre persistir en localStorage para evitar problemas con PWA
        if (rememberMe || isIOS || isMobile) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('rememberMe', 'true');
        } else {
          sessionStorage.setItem('token', data.token);
          localStorage.removeItem('token');
          localStorage.removeItem('rememberMe');
        }
        console.log('Token stored in localStorage, isIOS:', isIOS, 'isMobile:', isMobile);
      }

      // Redirect based on role
      const redirectPath = 
        data.user.role === 'ADMIN' ? '/admin' :
        data.user.role === 'PROFESSIONAL' ? '/professional' : '/client';
      
      console.log('Redirecting to:', redirectPath);
      router.push(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src="/Recurso 4.svg" alt="NeuralFit" className={styles.logoIcon} />
          <h1 className={styles.brand}><span className={styles.brandNeural}>Neural</span><span className={styles.brandFit}>Fit</span></h1>
          <p className={styles.tagline}>Tu gimnasio, tu progreso</p>
        </div>

        <GlassCard className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.title}>Iniciar sesión</h2>
            
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <label className={styles.rememberMe}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Mantener sesión iniciada</span>
            </label>

            <button 
              type="submit" 
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className={styles.registerLink}>
              <span>¿No tienes cuenta?</span>
              <Link href="/register">Registrarse</Link>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
