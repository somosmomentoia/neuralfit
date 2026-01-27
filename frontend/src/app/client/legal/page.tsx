'use client';

import styles from './page.module.css';

export default function ClientLegalPage() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Términos y Condiciones</h2>
        <div className={styles.content}>
          <p>
            Al utilizar la aplicación NeuralFit, aceptás los siguientes términos y condiciones 
            de uso. Te recomendamos leerlos detenidamente.
          </p>
          
          <h3>1. Uso del Servicio</h3>
          <p>
            NeuralFit es una plataforma de gestión para gimnasios que permite a los usuarios 
            acceder a sus rutinas, gestionar su membresía y realizar el check-in en las 
            instalaciones.
          </p>

          <h3>2. Cuenta de Usuario</h3>
          <p>
            Sos responsable de mantener la confidencialidad de tu cuenta y contraseña. 
            Cualquier actividad realizada bajo tu cuenta es tu responsabilidad.
          </p>

          <h3>3. Código QR de Ingreso</h3>
          <p>
            El código QR es personal e intransferible. Compartirlo con terceros puede 
            resultar en la suspensión de tu membresía.
          </p>

          <h3>4. Apto Médico</h3>
          <p>
            Es obligatorio contar con un certificado médico vigente para utilizar las 
            instalaciones del gimnasio. El gimnasio no se responsabiliza por lesiones 
            derivadas de la falta de aptitud física.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Política de Privacidad</h2>
        <div className={styles.content}>
          <p>
            Tu privacidad es importante para nosotros. Esta política describe cómo 
            recopilamos, usamos y protegemos tu información personal.
          </p>

          <h3>Información que Recopilamos</h3>
          <ul>
            <li>Datos de registro (nombre, email, teléfono)</li>
            <li>Información de membresía y pagos</li>
            <li>Registros de asistencia al gimnasio</li>
            <li>Progreso de entrenamiento</li>
          </ul>

          <h3>Uso de la Información</h3>
          <p>
            Utilizamos tu información para brindarte el servicio, mejorar tu experiencia, 
            y comunicarnos contigo sobre tu membresía y novedades del gimnasio.
          </p>

          <h3>Protección de Datos</h3>
          <p>
            Implementamos medidas de seguridad para proteger tu información personal 
            contra acceso no autorizado, alteración o destrucción.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Contacto</h2>
        <div className={styles.content}>
          <p>
            Si tenés preguntas sobre estos términos o nuestra política de privacidad, 
            podés contactarnos a través de:
          </p>
          <ul>
            <li>Email: legal@neuralfit.com</li>
            <li>Teléfono: +54 9 11 1234-5678</li>
          </ul>
        </div>
      </section>

      <div className={styles.footer}>
        <p>Última actualización: Enero 2026</p>
      </div>
    </div>
  );
}
