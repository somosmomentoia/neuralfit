'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface GymAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

interface GymSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isPublic: boolean;
  createdAt: string;
  admins: GymAdmin[];
  stats: {
    users: number;
    branches: number;
    plans: number;
    subscriptions: number;
  };
}

interface FormState {
  gymName: string;
  slug: string;
  description: string;
  logo: string;
  isPublic: boolean;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  branchGoogleMapsUrl: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminDocumentNumber: string;
  adminPassword: string;
  adminPasswordConfirm: string;
}

const initialForm: FormState = {
  gymName: '',
  slug: '',
  description: '',
  logo: '',
  isPublic: true,
  branchName: '',
  branchAddress: '',
  branchPhone: '',
  branchGoogleMapsUrl: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
  adminDocumentNumber: '',
  adminPassword: '',
  adminPasswordConfirm: '',
};

const slugifyGymName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function SuperadminPage() {
  const [gyms, setGyms] = useState<GymSummary[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchGyms = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const response = await apiFetch('/superadmin/gyms');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron cargar los gyms');
      }

      setGyms(data.gyms || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los gyms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGyms();
  }, [fetchGyms]);

  const metrics = useMemo(() => {
    const totalGyms = gyms.length;
    const publicGyms = gyms.filter((gym) => gym.isPublic).length;
    const totalAdmins = gyms.reduce((acc, gym) => acc + gym.admins.length, 0);
    const totalBranches = gyms.reduce((acc, gym) => acc + gym.stats.branches, 0);

    return { totalGyms, publicGyms, totalAdmins, totalBranches };
  }, [gyms]);

  const suggestedSlug = form.slug.trim() || slugifyGymName(form.gymName);

  const updateField = <K extends keyof FormState,>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError('');
    setSuccess('');

    if (form.adminPassword !== form.adminPasswordConfirm) {
      setSubmitError('La confirmación de contraseña no coincide');
      return;
    }

    if (!suggestedSlug) {
      setSubmitError('Ingresa un nombre de gym válido para generar el slug');
      return;
    }

    try {
      setSaving(true);
      const response = await apiFetch('/superadmin/gyms', {
        method: 'POST',
        body: JSON.stringify({
          gymName: form.gymName,
          slug: form.slug,
          description: form.description,
          logo: form.logo,
          isPublic: form.isPublic,
          branchName: form.branchName,
          branchAddress: form.branchAddress,
          branchPhone: form.branchPhone,
          branchGoogleMapsUrl: form.branchGoogleMapsUrl,
          adminFirstName: form.adminFirstName,
          adminLastName: form.adminLastName,
          adminEmail: form.adminEmail,
          adminPhone: form.adminPhone,
          adminDocumentNumber: form.adminDocumentNumber,
          adminPassword: form.adminPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el gym');
      }

      setSuccess(`Listo. ${data.gym.name} ya tiene administrador asignado.`);
      setForm(initialForm);
      await fetchGyms();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo crear el gym');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.badge}>Control central</span>
        <h1 className={styles.title}>Alta de gyms y admins desde un único panel</h1>
        <p className={styles.description}>
          Crea nuevos gimnasios operativos con su administrador principal, sucursal inicial opcional y visibilidad pública desde el mismo flujo.
        </p>
      </section>

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Gyms creados</span>
          <strong className={styles.metricValue}>{metrics.totalGyms}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Gyms públicos</span>
          <strong className={styles.metricValue}>{metrics.publicGyms}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Admins asignados</span>
          <strong className={styles.metricValue}>{metrics.totalAdmins}</strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Sucursales cargadas</span>
          <strong className={styles.metricValue}>{metrics.totalBranches}</strong>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Gyms existentes</h2>
            <p className={styles.panelDescription}>
              Vista rápida de cada gym, sus admins y el estado básico de configuración inicial.
            </p>
          </div>

          {loading ? <div className={styles.status}>Cargando gyms...</div> : null}
          {!loading && loadError ? <div className={styles.error}>{loadError}</div> : null}
          {!loading && !loadError && gyms.length === 0 ? (
            <div className={styles.emptyState}>Todavía no hay gyms dados de alta.</div>
          ) : null}

          {!loading && gyms.length > 0 ? (
            <div className={styles.gymList}>
              {gyms.map((gym) => (
                <article key={gym.id} className={styles.gymCard}>
                  <div className={styles.gymHeader}>
                    <div className={styles.gymTitleBlock}>
                      <div className={styles.gymTitleRow}>
                        <h3 className={styles.gymName}>{gym.name}</h3>
                        <span className={`${styles.visibilityBadge} ${gym.isPublic ? '' : styles.privateBadge}`}>{gym.isPublic ? 'Público' : 'Privado'}</span>
                        <span className={styles.slugBadge}>/{gym.slug}</span>
                      </div>
                      <p className={styles.gymDescription}>{gym.description || 'Sin descripción cargada.'}</p>
                    </div>
                    <span className={styles.countBadge}>{gym.admins.length} admin{gym.admins.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Usuarios</span>
                      <span className={styles.metaValue}>{gym.stats.users}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Sucursales</span>
                      <span className={styles.metaValue}>{gym.stats.branches}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Planes</span>
                      <span className={styles.metaValue}>{gym.stats.plans}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Suscripciones</span>
                      <span className={styles.metaValue}>{gym.stats.subscriptions}</span>
                    </div>
                  </div>

                  <div className={styles.adminList}>
                    {gym.admins.map((admin) => (
                      <div key={admin.id} className={styles.adminCard}>
                        <span className={styles.adminName}>{admin.firstName} {admin.lastName}</span>
                        <span className={styles.adminInfo}>{admin.email}</span>
                        <span className={styles.adminInfo}>{admin.phone || 'Sin teléfono'}</span>
                        <span className={styles.adminInfo}>DNI: {admin.documentNumber || 'No informado'}</span>
                        <span className={styles.createdAt}>Alta: {new Date(admin.createdAt).toLocaleDateString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.gymMeta}>
                    <span className={styles.createdAt}>Creado: {new Date(gym.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Nuevo gym + admin</h2>
            <p className={styles.panelDescription}>
              El admin creado queda listo para entrar por el mismo login general y continuar la configuración del gimnasio.
            </p>
          </div>

          {success ? <div className={styles.success}>{success}</div> : null}
          {submitError ? <div className={styles.error}>{submitError}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Datos del gym</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Nombre del gym</span>
                  <input className={styles.input} value={form.gymName} onChange={(e) => updateField('gymName', e.target.value)} placeholder="NeuralFit Palermo" required />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Slug</span>
                  <input className={styles.input} value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="neuralfit-palermo" />
                  <p className={styles.hint}>Se usará: {suggestedSlug || 'completa el nombre para generarlo'}</p>
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Descripción</span>
                  <textarea className={styles.textarea} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Qué ofrece este gym, propuesta y contexto comercial." />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Logo URL</span>
                  <input className={styles.input} type="url" value={form.logo} onChange={(e) => updateField('logo', e.target.value)} placeholder="https://..." />
                </label>
              </div>

              <label className={styles.checkboxRow}>
                <input className={styles.checkbox} type="checkbox" checked={form.isPublic} onChange={(e) => updateField('isPublic', e.target.checked)} />
                <span className={styles.label}>Mostrar este gym en superficies públicas para clientes</span>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Sucursal inicial</h3>
              <div className={styles.fieldGridTwo}>
                <label className={styles.field}>
                  <span className={styles.label}>Nombre de sucursal</span>
                  <input className={styles.input} value={form.branchName} onChange={(e) => updateField('branchName', e.target.value)} placeholder="Casa central" />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Teléfono sucursal</span>
                  <input className={styles.input} value={form.branchPhone} onChange={(e) => updateField('branchPhone', e.target.value)} placeholder="11 5555 5555" />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Dirección</span>
                  <input className={styles.input} value={form.branchAddress} onChange={(e) => updateField('branchAddress', e.target.value)} placeholder="Av. Santa Fe 1234" />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Google Maps URL</span>
                  <input className={styles.input} type="url" value={form.branchGoogleMapsUrl} onChange={(e) => updateField('branchGoogleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
                </label>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Administrador principal</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Nombre</span>
                  <input className={styles.input} value={form.adminFirstName} onChange={(e) => updateField('adminFirstName', e.target.value)} placeholder="Lucía" required />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Apellido</span>
                  <input className={styles.input} value={form.adminLastName} onChange={(e) => updateField('adminLastName', e.target.value)} placeholder="Pérez" required />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Email</span>
                  <input className={styles.input} type="email" value={form.adminEmail} onChange={(e) => updateField('adminEmail', e.target.value)} placeholder="admin@gym.com" required />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Teléfono</span>
                  <input className={styles.input} value={form.adminPhone} onChange={(e) => updateField('adminPhone', e.target.value)} placeholder="11 4444 4444" />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>DNI</span>
                  <input className={styles.input} value={form.adminDocumentNumber} onChange={(e) => updateField('adminDocumentNumber', e.target.value)} placeholder="30111222" required />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Contraseña inicial</span>
                  <input className={styles.input} type="password" value={form.adminPassword} onChange={(e) => updateField('adminPassword', e.target.value)} placeholder="Mínimo 6 caracteres" required />
                </label>

                <label className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.label}>Confirmar contraseña</span>
                  <input className={styles.input} type="password" value={form.adminPasswordConfirm} onChange={(e) => updateField('adminPasswordConfirm', e.target.value)} placeholder="Repite la contraseña" required />
                </label>
              </div>
            </div>

            <button className={styles.submitButton} type="submit" disabled={saving}>
              {saving ? 'Creando gym...' : 'Crear gym y administrador'}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}
