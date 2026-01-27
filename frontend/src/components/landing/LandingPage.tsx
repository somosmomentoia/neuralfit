'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [heroBgLoaded, setHeroBgLoaded] = useState(false);
  const [strengthBgLoaded, setStrengthBgLoaded] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeScreen < appScreens.length - 1) {
      setActiveScreen(prev => prev + 1);
    }
    if (isRightSwipe && activeScreen > 0) {
      setActiveScreen(prev => prev - 1);
    }
  };

  const appScreens = [
    { src: '/mocks/mis logros.png', label: 'Mis Logros' },
    { src: '/mocks/rutinas.png', label: 'Rutinas' },
    { src: '/mocks/Mesa de trabajo 1 copia 3.png', label: 'Progreso' },
    { src: '/mocks/Mesa de trabajo 1 copia 10.png', label: 'Entrenamientos' },
  ];

  const programImages = [
    '/fotos para landing/mina entrenando.jpeg',
    '/fotos para landing/pexels-franklin-santillan-a-551795305-20901477.jpg',
    '/fotos para landing/pexels-koolshooters-9944901.jpg',
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const heroImg = new window.Image();
    heroImg.src = '/fotos para landing/pexels-franklin-santillan-a-551795305-20901480.jpg';
    heroImg.onload = () => setHeroBgLoaded(true);

    const strengthImg = new window.Image();
    strengthImg.src = '/fotos para landing/pexels-franklin-santillan-a-551795305-20901483.jpg';
    strengthImg.onload = () => setStrengthBgLoaded(true);
  }, []);

  const features = [
    {
      id: 'membresias',
      name: 'Membresías',
      description: 'Accedé a gimnasios asociados con tu membresía digital. Todo desde la app.',
    },
    {
      id: 'rutinas',
      name: 'Rutinas Personalizadas',
      description: 'Tus profesores te asignan rutinas diseñadas específicamente para vos.',
    },
    {
      id: 'beneficios',
      name: 'Beneficios Exclusivos',
      description: 'Descuentos y beneficios especiales por ser parte de la comunidad NeuralFit.',
    },
  ];

  return (
    <div className={styles.landing}>
      {/* ==================== NAVIGATION ==================== */}
      <nav className={`${styles.nav} ${isScrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.logo}>
            <Image src="/Recurso 4.svg" alt="NeuralFit" width={32} height={32} className={styles.logoIcon} />
            <span className={styles.logoText}>
              <span className={styles.logoNeural}>Neural</span>
              <span className={styles.logoFit}>Fit</span>
            </span>
          </Link>
          
          <div className={styles.navLinks}>
            <a href="#about" className={styles.navLink}>Beneficios</a>
            <a href="#app" className={styles.navLink}>La App</a>
            <a href="#features" className={styles.navLink}>Funciones</a>
            <a href="#contact" className={styles.navLink}>Contacto</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.loginBtn}>Ingresar</Link>
            <Link href="/register" className={styles.ctaBtn}>Registrarme</Link>
          </div>

          <button 
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen : ''}`} />
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen : ''}`} />
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Outside nav to avoid z-index issues */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <button 
          className={styles.mobileMenuClose}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
        <a href="#about" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Beneficios</a>
        <a href="#app" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>La App</a>
        <a href="#features" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Funciones</a>
        <a href="#contact" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Contacto</a>
        <div className={styles.mobileCtas}>
          <Link href="/login" className={styles.mobileLoginBtn}>Ingresar</Link>
          <Link href="/register" className={styles.mobileCtaBtn}>Registrarme</Link>
        </div>
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section className={styles.hero}>
        <div className={`${styles.heroBgFull} ${heroBgLoaded ? styles.loaded : ''}`} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroTagline}>TU GIMNASIO EN TU BOLSILLO</p>
          <h1 className={styles.heroTitle}>
            ENTRENÁ <span className={styles.heroTitleOutline}>MEJOR.</span><br />
            PROGRESÁ <span className={styles.heroTitleHighlight}>MÁS.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Membresías digitales, rutinas personalizadas de tus profesores, 
            seguimiento de progreso y beneficios exclusivos. Todo en una sola app.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.heroCtaPrimary}>
              Crear mi cuenta gratis
            </Link>
            <a href="#app" className={styles.heroCtaSecondary}>
              <span className={styles.playIcon}>▶</span>
              Ver la app
            </a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Digital</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>24/7</span>
              <span className={styles.heroStatLabel}>Acceso</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>∞</span>
              <span className={styles.heroStatLabel}>Rutinas</span>
            </div>
          </div>
        </div>
        <div className={styles.heroScrollIndicator}>
          <span>Scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* ==================== EXPERIENCE SECTION ==================== */}
      <section id="about" className={styles.experience}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>¿POR QUÉ NEURALFIT?</span>
            <h2 className={styles.sectionTitle}>Todo lo que necesitás</h2>
          </div>
          <div className={styles.experienceGrid}>
            <div className={styles.experienceCard}>
              <div className={styles.experienceIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3>Membresías digitales</h3>
              <p>Accedé a gimnasios asociados con tu membresía 100% digital desde la app.</p>
            </div>
            <div className={styles.experienceCard}>
              <div className={styles.experienceIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Rutinas personalizadas</h3>
              <p>Tus profesores te asignan rutinas diseñadas específicamente para tus objetivos.</p>
            </div>
            <div className={styles.experienceCard}>
              <div className={styles.experienceIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 20V10"/>
                  <path d="M18 20V4"/>
                  <path d="M6 20v-4"/>
                </svg>
              </div>
              <h3>Seguimiento completo</h3>
              <p>Historial, estadísticas, calorías y progreso de cada entrenamiento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== WORKOUT ENGINE SECTION ==================== */}
      <section className={styles.workoutEngine}>
        <div className={styles.sectionContainer}>
          <div className={styles.workoutGrid}>
            {/* Text Content */}
            <div className={styles.workoutContent}>
              <span className={styles.sectionTag}>MOTOR DE ENTRENAMIENTO</span>
              <h2 className={styles.workoutTitle}>
                Entrená como<br />
                <span className={styles.workoutHighlight}>un profesional</span>
              </h2>
              <p className={styles.workoutDesc}>
                Nuestro motor de entrenamiento te guía ejercicio por ejercicio. 
                Timer integrado, videos demostrativos, registro de series y repeticiones.
              </p>
              <ul className={styles.workoutFeatures}>
                <li>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Timer automático entre series</span>
                </li>
                <li>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Videos de cada ejercicio</span>
                </li>
                <li>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Registro de peso y repeticiones</span>
                </li>
                <li>
                  <span className={styles.featureCheck}>✓</span>
                  <span>Historial de entrenamientos</span>
                </li>
              </ul>
            </div>

            {/* Phone Mockups */}
            <div className={styles.workoutMockups}>
              <div className={styles.workoutPhone}>
                <div className={styles.workoutPhoneFrame}>
                  <Image
                    src="/mocks/Mesa de trabajo 1 copia 10.png"
                    alt="Motor de entrenamiento"
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className={styles.programs}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>FUNCIONALIDADES</span>
            <h2 className={styles.sectionTitle}>Todo en una app</h2>
          </div>
          <div className={styles.programsGrid}>
            {features.map((feature, index) => (
              <div key={feature.id} className={styles.programCard}>
                <div className={styles.programImage}>
                  <Image
                    src={programImages[index]}
                    alt={feature.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={styles.programOverlay} />
                </div>
                <div className={styles.programContent}>
                  <h3 className={styles.programName}>{feature.name}</h3>
                  <p className={styles.programDesc}>{feature.description}</p>
                  <Link href="/register" className={styles.programCta}>
                    Empezar
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== APP SHOWCASE SECTION ==================== */}
      <section id="app" className={styles.appShowcase}>
        <div className={styles.sectionContainer}>
          <div className={styles.showcaseGrid}>
            {/* Phone Mockup */}
            <div className={styles.phoneMockup}>
              <div className={styles.phoneFrame}>
                <div className={styles.phoneNotch} />
                <div 
                  className={styles.phoneScreen}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div 
                    className={styles.screenSlider}
                    style={{ transform: `translateX(-${activeScreen * 100}%)` }}
                  >
                    {appScreens.map((screen, index) => (
                      <div key={index} className={styles.screenSlide}>
                        <Image
                          src={screen.src}
                          alt={screen.label}
                          fill
                          style={{ objectFit: 'cover', objectPosition: 'top' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Navigation dots */}
              <div className={styles.screenDots}>
                {appScreens.map((screen, index) => (
                  <button
                    key={index}
                    className={`${styles.screenDot} ${activeScreen === index ? styles.screenDotActive : ''}`}
                    onClick={() => setActiveScreen(index)}
                    aria-label={screen.label}
                  />
                ))}
              </div>
              {/* Screen label */}
              <div className={styles.screenLabel}>{appScreens[activeScreen].label}</div>
            </div>

            {/* Text Content */}
            <div className={styles.showcaseContent}>
              <span className={styles.sectionTag}>LA APP</span>
              <h2 className={styles.showcaseTitle}>
                Tu progreso,<br />
                <span className={styles.showcaseHighlight}>siempre visible</span>
              </h2>
              <p className={styles.showcaseDesc}>
                Seguí cada entrenamiento, cada logro, cada mejora. 
                NeuralFit te muestra estadísticas detalladas de tu evolución 
                para que nunca pierdas la motivación.
              </p>
              <ul className={styles.showcaseFeatures}>
                <li>
                  <span className={styles.featureIcon}>📊</span>
                  <span>Estadísticas semanales y mensuales</span>
                </li>
                <li>
                  <span className={styles.featureIcon}>🔥</span>
                  <span>Tracking de calorías quemadas</span>
                </li>
                <li>
                  <span className={styles.featureIcon}>📅</span>
                  <span>Calendario de entrenamientos</span>
                </li>
                <li>
                  <span className={styles.featureIcon}>📋</span>
                  <span>Apto médico digital</span>
                </li>
              </ul>
              <Link href="/register" className={styles.showcaseCta}>
                Crear cuenta
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className={styles.howItWorks}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>¿CÓMO FUNCIONA?</span>
            <h2 className={styles.sectionTitle}>Empezá en 3 pasos</h2>
          </div>
          <div className={styles.stepsTimeline}>
            <div className={styles.timelineLine} />
            <div className={styles.stepItem}>
              <div className={styles.stepDot}>
                <span>1</span>
              </div>
              <div className={styles.stepContent}>
                <h3>Creá tu cuenta</h3>
                <p>Registrate gratis y completá tu perfil con tus datos.</p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepDot}>
                <span>2</span>
              </div>
              <div className={styles.stepContent}>
                <h3>Elegí tu gimnasio</h3>
                <p>Seleccioná un gimnasio asociado y activá tu membresía.</p>
              </div>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepDot}>
                <span>3</span>
              </div>
              <div className={styles.stepContent}>
                <h3>Empezá a entrenar</h3>
                <p>Recibí rutinas personalizadas y seguí tu progreso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STRENGTH BANNER ==================== */}
      <section className={styles.strengthBanner}>
        <div className={`${styles.strengthBgFull} ${strengthBgLoaded ? styles.loaded : ''}`} />
        <div className={styles.strengthOverlay} />
        <div className={styles.strengthContent}>
          <h2 className={styles.strengthTitle}>ENTRENÁ</h2>
          <p className={styles.strengthSubtitle}>Tu mejor versión te espera</p>
          <Link href="/register" className={styles.strengthCta}>
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* ==================== CONTACT SECTION ==================== */}
      <section id="contact" className={styles.contact}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>CONTACTO</span>
            <h2 className={styles.sectionTitle}>¿Tenés dudas?</h2>
          </div>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>✉️</div>
                <div>
                  <h4>Email</h4>
                  <p>soporte@neuralfit.app</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>💬</div>
                <div>
                  <h4>Soporte</h4>
                  <p>Respondemos en menos de 24hs</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>📱</div>
                <div>
                  <h4>App</h4>
                  <p>Disponible en iOS y Android</p>
                </div>
              </div>
              <div className={styles.contactSocial}>
                <a href="#" className={styles.socialBtn}>Instagram</a>
                <a href="#" className={styles.socialBtn}>Twitter</a>
              </div>
            </div>
            <div className={styles.contactForm}>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formRow}>
                  <input type="text" placeholder="Nombre" className={styles.formInput} />
                  <input type="email" placeholder="Email" className={styles.formInput} />
                </div>
                <input type="text" placeholder="Asunto" className={styles.formInput} />
                <textarea placeholder="Tu mensaje" className={styles.formTextarea} rows={4} />
                <button type="submit" className={styles.formSubmit}>
                  Enviar mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerMain}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogoWrapper}>
                <Image src="/Recurso 4.svg" alt="NeuralFit" width={24} height={24} />
                <span className={styles.footerLogo}>
                  <span className={styles.logoNeural}>Neural</span>
                  <span className={styles.logoFit}>Fit</span>
                </span>
              </div>
              <p>Tu gimnasio, tu progreso.</p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Links</h4>
                <a href="#about">Beneficios</a>
                <a href="#app">La App</a>
                <a href="#features">Funciones</a>
                <a href="#contact">Contacto</a>
              </div>
              <div className={styles.footerColumn}>
                <h4>Legal</h4>
                <a href="#">Privacidad</a>
                <a href="#">Términos</a>
              </div>
              <div className={styles.footerColumn}>
                <h4>Cuenta</h4>
                <Link href="/login">Iniciar sesión</Link>
                <Link href="/register">Registrarme</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2024 NeuralFit. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
