'use client';

import styles from './page.module.css';

export default function ClientAboutPage() {
  return (
    <div className={styles.container}>
      {/* Logo Section */}
      <div className={styles.logoSection}>
        <img src="/Recurso 4.svg" alt="NeuralFit" className={styles.logoIcon} />
        <div className={styles.logo}>
          <span className={styles.logoNeural}>Neural</span><span className={styles.logoFit}>Fit</span>
        </div>
        <span className={styles.version}>Versión 1.0.0</span>
      </div>

      {/* About Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Sobre NeuralFit</h2>
        <p className={styles.cardText}>
          NeuralFit es la plataforma integral de gestión para gimnasios que conecta 
          a clientes, entrenadores y administradores en un solo lugar.
        </p>
        <p className={styles.cardText}>
          Diseñada para hacer tu experiencia de entrenamiento más simple, 
          organizada y efectiva.
        </p>
      </div>

      {/* Features */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Características</h2>
        <ul className={styles.featuresList}>
          <li>
            <div className={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className={styles.featureContent}>
              <span className={styles.featureName}>Ingreso con QR</span>
              <span className={styles.featureDesc}>Acceso rápido y sin contacto</span>
            </div>
          </li>
          <li>
            <div className={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.featureContent}>
              <span className={styles.featureName}>Rutinas personalizadas</span>
              <span className={styles.featureDesc}>Planes de entrenamiento a tu medida</span>
            </div>
          </li>
          <li>
            <div className={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className={styles.featureContent}>
              <span className={styles.featureName}>Seguimiento de progreso</span>
              <span className={styles.featureDesc}>Métricas y estadísticas de tu avance</span>
            </div>
          </li>
          <li>
            <div className={styles.featureIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className={styles.featureContent}>
              <span className={styles.featureName}>Gestión de pagos</span>
              <span className={styles.featureDesc}>Controla tu suscripción fácilmente</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Contacto</h2>
        <div className={styles.contactList}>
          <a href="mailto:soporte@neuralfit.com" className={styles.contactItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>soporte@neuralfit.com</span>
          </a>
          <a href="https://neuralfit.com" target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>www.neuralfit.com</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>© 2026 NeuralFit. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}
