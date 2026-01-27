'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import ImageUploader from '@/components/ImageUploader';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  googleMapsUrl: string | null;
  googleMapsEmbed: string | null;
  isActive: boolean;
}

interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
  features: { feature: PlanFeature }[];
  _count: { clients: number };
}

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  discount: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  validUntil: string | null;
  isActive: boolean;
}

type ActiveTab = 'general' | 'branches' | 'plans' | 'features' | 'benefits';

interface GymConfig {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  isPublic: boolean;
  hasMpConfigured: boolean;
  mpPublicKey: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [gymConfig, setGymConfig] = useState<GymConfig | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [showMpModal, setShowMpModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  // Form states
  const [gymForm, setGymForm] = useState({
    name: '',
    description: '',
    logo: '',
    isPublic: true,
  });

  const [mpForm, setMpForm] = useState({
    accessToken: '',
    publicKey: '',
  });

  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    googleMapsUrl: '',
    googleMapsEmbed: '',
  });

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    durationDays: '30',
    featureIds: [] as string[],
  });

  const [featureForm, setFeatureForm] = useState({
    name: '',
    description: '',
    icon: '',
  });

  const [benefitForm, setBenefitForm] = useState({
    name: '',
    description: '',
    discount: '',
    imageUrl: '',
    websiteUrl: '',
    validUntil: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gymRes, branchesRes, plansRes, featuresRes, benefitsRes] = await Promise.all([
        apiFetch('/admin/gym'),
        apiFetch('/admin/branches'),
        apiFetch('/admin/plans'),
        apiFetch('/admin/plan-features'),
        apiFetch('/admin/benefits'),
      ]);

      const gymData = await gymRes.json();
      const branchesData = await branchesRes.json();
      const plansData = await plansRes.json();
      const featuresData = await featuresRes.json();
      const benefitsData = await benefitsRes.json();

      if (gymData.gym) {
        setGymConfig(gymData.gym);
        setGymForm({
          name: gymData.gym.name || '',
          description: gymData.gym.description || '',
          logo: gymData.gym.logo || '',
          isPublic: gymData.gym.isPublic ?? true,
        });
      }
      setBranches(branchesData.branches || []);
      setPlans(plansData.plans || []);
      setFeatures(featuresData.features || []);
      setBenefits(benefitsData.benefits || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGymConfig = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/admin/gym', {
        method: 'PUT',
        body: JSON.stringify(gymForm),
      });
      if (res.ok) {
        const data = await res.json();
        setGymConfig(prev => prev ? { ...prev, ...data.gym } : null);
        alert('Configuración guardada');
      }
    } catch (error) {
      console.error('Error saving gym config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMpConfig = async () => {
    if (!mpForm.accessToken || !mpForm.publicKey) {
      alert('Completa todos los campos');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/admin/gym/mercadopago', {
        method: 'PUT',
        body: JSON.stringify(mpForm),
      });
      if (res.ok) {
        setGymConfig(prev => prev ? { ...prev, hasMpConfigured: true } : null);
        setShowMpModal(false);
        setMpForm({ accessToken: '', publicKey: '' });
        alert('MercadoPago configurado correctamente');
      }
    } catch (error) {
      console.error('Error saving MP config:', error);
    } finally {
      setSaving(false);
    }
  };

  // Función para extraer URL del iframe de Google Maps
  const extractGoogleMapsUrl = (input: string): string => {
    if (!input) return '';
    // Si ya es una URL limpia, devolverla
    if (input.startsWith('https://www.google.com/maps/embed')) {
      return input;
    }
    // Si es HTML del iframe, extraer el src
    const srcMatch = input.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1];
    }
    return input;
  };

  // Branch handlers
  const openBranchModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchForm({
        name: branch.name,
        address: branch.address,
        phone: branch.phone || '',
        googleMapsUrl: branch.googleMapsUrl || '',
        googleMapsEmbed: branch.googleMapsEmbed || '',
      });
    } else {
      setEditingBranch(null);
      setBranchForm({ name: '', address: '', phone: '', googleMapsUrl: '', googleMapsEmbed: '' });
    }
    setShowBranchModal(true);
  };

  const saveBranch = async () => {
    try {
      const method = editingBranch ? 'PUT' : 'POST';
      const url = editingBranch ? `/admin/branches/${editingBranch.id}` : '/admin/branches';
      
      // Extraer URL limpia del embed si el usuario pegó el HTML completo
      const processedForm = {
        ...branchForm,
        googleMapsEmbed: extractGoogleMapsUrl(branchForm.googleMapsEmbed),
      };
      
      await apiFetch(url, {
        method,
        body: JSON.stringify(processedForm),
      });

      setShowBranchModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving branch:', error);
    }
  };

  const deleteBranch = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;
    try {
      await apiFetch(`/admin/branches/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  };

  // Plan handlers
  const openPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        durationDays: plan.durationDays.toString(),
        featureIds: plan.features.map(f => f.feature.id),
      });
    } else {
      setEditingPlan(null);
      setPlanForm({ name: '', description: '', price: '', durationDays: '30', featureIds: [] });
    }
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    try {
      const method = editingPlan ? 'PUT' : 'POST';
      const url = editingPlan ? `/admin/plans/${editingPlan.id}` : '/admin/plans';
      
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...planForm,
          price: parseFloat(planForm.price),
          durationDays: parseInt(planForm.durationDays),
        }),
      });

      setShowPlanModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este plan?')) return;
    try {
      const res = await apiFetch(`/admin/plans/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  // Feature handlers
  const openFeatureModal = (feature?: PlanFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatureForm({
        name: feature.name,
        description: feature.description || '',
        icon: feature.icon || '',
      });
    } else {
      setEditingFeature(null);
      setFeatureForm({ name: '', description: '', icon: '' });
    }
    setShowFeatureModal(true);
  };

  const saveFeature = async () => {
    try {
      const method = editingFeature ? 'PUT' : 'POST';
      const url = editingFeature ? `/admin/plan-features/${editingFeature.id}` : '/admin/plan-features';
      
      await apiFetch(url, {
        method,
        body: JSON.stringify(featureForm),
      });

      setShowFeatureModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving feature:', error);
    }
  };

  const deleteFeature = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este beneficio?')) return;
    try {
      await apiFetch(`/admin/plan-features/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  };

  const togglePlanFeature = (featureId: string) => {
    setPlanForm(prev => ({
      ...prev,
      featureIds: prev.featureIds.includes(featureId)
        ? prev.featureIds.filter(id => id !== featureId)
        : [...prev.featureIds, featureId],
    }));
  };

  // Benefit handlers
  const openBenefitModal = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setBenefitForm({
        name: benefit.name,
        description: benefit.description || '',
        discount: benefit.discount,
        imageUrl: benefit.imageUrl || '',
        websiteUrl: benefit.websiteUrl || '',
        validUntil: benefit.validUntil ? benefit.validUntil.split('T')[0] : '',
      });
    } else {
      setEditingBenefit(null);
      setBenefitForm({ name: '', description: '', discount: '', imageUrl: '', websiteUrl: '', validUntil: '' });
    }
    setShowBenefitModal(true);
  };

  const saveBenefit = async () => {
    try {
      const method = editingBenefit ? 'PUT' : 'POST';
      const url = editingBenefit ? `/admin/benefits/${editingBenefit.id}` : '/admin/benefits';
      
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...benefitForm,
          validUntil: benefitForm.validUntil || null,
        }),
      });

      setShowBenefitModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving benefit:', error);
    }
  };

  const deleteBenefit = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este beneficio exclusivo?')) return;
    try {
      await apiFetch(`/admin/benefits/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting benefit:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración del Negocio</h1>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'branches' ? styles.active : ''}`}
            onClick={() => setActiveTab('branches')}
          >
            Sucursales
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'plans' ? styles.active : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            Planes
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'features' ? styles.active : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'benefits' ? styles.active : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            Beneficios
          </button>
        </div>

        <div className={styles.tabContent}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className={styles.form}>
              {/* Logo */}
              <div className={styles.logoSection}>
                <label className={styles.logoLabel}>Logo del Gimnasio</label>
                <ImageUploader
                  currentImage={gymForm.logo || null}
                  onImageUploaded={(url) => setGymForm({ ...gymForm, logo: url })}
                  onImageRemoved={() => setGymForm({ ...gymForm, logo: '' })}
                  aspectRatio={1}
                  maxSizeMB={5}
                  uploadEndpoint="/upload/gym-logo"
                />
              </div>

              <div className={styles.field}>
                <label>Nombre del Gimnasio</label>
                <input
                  type="text"
                  value={gymForm.name}
                  onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
                  placeholder="Mi Gimnasio"
                />
              </div>

              <div className={styles.field}>
                <label>Descripción</label>
                <textarea
                  value={gymForm.description}
                  onChange={(e) => setGymForm({ ...gymForm, description: e.target.value })}
                  placeholder="Descripción de tu gimnasio..."
                  rows={3}
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={gymForm.isPublic}
                  onChange={(e) => setGymForm({ ...gymForm, isPublic: e.target.checked })}
                />
                <span>Visible en el explorador de gimnasios</span>
              </label>

              <button 
                className={styles.saveBtn} 
                onClick={handleSaveGymConfig}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {/* MercadoPago */}
              <div className={styles.mpSection}>
                <div className={`${styles.mpIndicator} ${gymConfig?.hasMpConfigured ? styles.mpConfigured : styles.mpNotConfigured}`}>
                  {gymConfig?.hasMpConfigured ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <span>MercadoPago configurado</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>MercadoPago no configurado</span>
                    </>
                  )}
                </div>
                <p className={styles.mpHint}>
                  Configura tu cuenta de MercadoPago para recibir pagos de suscripciones directamente.
                </p>
                <button 
                  className={styles.mpConfigBtn}
                  onClick={() => setShowMpModal(true)}
                >
                  {gymConfig?.hasMpConfigured ? 'Actualizar credenciales' : 'Configurar MercadoPago'}
                </button>
              </div>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Sucursales ({branches.length})</h2>
                <button className={styles.addButton} onClick={() => openBranchModal()}>
                  + Agregar Sucursal
                </button>
              </div>
              <div className={styles.grid}>
                {branches.map(branch => (
                  <div key={branch.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{branch.name}</h3>
                      <span className={`${styles.badge} ${branch.isActive ? styles.active : styles.inactive}`}>
                        {branch.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className={styles.cardAddress}>{branch.address}</p>
                    {branch.phone && <p className={styles.cardPhone}>{branch.phone}</p>}
                    <div className={styles.cardActions}>
                      <button className={styles.editBtn} onClick={() => openBranchModal(branch)}>
                        Editar
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteBranch(branch.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Planes ({plans.length})</h2>
                <button className={styles.addButton} onClick={() => openPlanModal()}>
                  + Agregar Plan
                </button>
              </div>
              <div className={styles.grid}>
                {plans.map(plan => (
                  <div key={plan.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{plan.name}</h3>
                      <span className={styles.price}>{formatPrice(plan.price)}</span>
                    </div>
                    <p className={styles.cardDescription}>{plan.description}</p>
                    <p className={styles.cardDuration}>{plan.durationDays} días</p>
                    <div className={styles.featuresList}>
                      {plan.features.slice(0, 3).map(f => (
                        <span key={f.feature.id} className={styles.featureTag}>
                          {f.feature.name}
                        </span>
                      ))}
                      {plan.features.length > 3 && (
                        <span className={styles.featureMore}>+{plan.features.length - 3} más</span>
                      )}
                    </div>
                    <p className={styles.clientCount}>{plan._count.clients} clientes</p>
                    <div className={styles.cardActions}>
                      <button className={styles.editBtn} onClick={() => openPlanModal(plan)}>
                        Editar
                      </button>
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => deletePlan(plan.id)}
                        disabled={plan._count.clients > 0}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Beneficios ({features.length})</h2>
                <button className={styles.addButton} onClick={() => openFeatureModal()}>
                  + Agregar Beneficio
                </button>
              </div>
              <div className={styles.featureGrid}>
                {features.map(feature => (
                  <div key={feature.id} className={styles.featureCard}>
                    <div className={styles.featureIcon}>{feature.icon || '✓'}</div>
                    <div className={styles.featureInfo}>
                      <h4 className={styles.featureName}>{feature.name}</h4>
                      {feature.description && (
                        <p className={styles.featureDesc}>{feature.description}</p>
                      )}
                    </div>
                    <div className={styles.featureActions}>
                      <button className={styles.editBtn} onClick={() => openFeatureModal(feature)}>
                        Editar
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteFeature(feature.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Beneficios Exclusivos ({benefits.length})</h2>
                <button className={styles.addButton} onClick={() => openBenefitModal()}>
                  + Agregar
                </button>
              </div>
              <div className={styles.grid}>
                {benefits.map(benefit => (
                  <div key={benefit.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{benefit.name}</h3>
                      <span className={styles.discountBadge}>{benefit.discount}</span>
                    </div>
                    {benefit.description && (
                      <p className={styles.cardDescription}>{benefit.description}</p>
                    )}
                    {benefit.websiteUrl && (
                      <p className={styles.cardMeta}>
                        <a href={benefit.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {benefit.websiteUrl}
                        </a>
                      </p>
                    )}
                    {benefit.validUntil && (
                      <p className={styles.cardMeta}>
                        Válido hasta: {new Date(benefit.validUntil).toLocaleDateString('es-AR')}
                      </p>
                    )}
                    <div className={styles.cardActions}>
                      <button className={styles.editBtn} onClick={() => openBenefitModal(benefit)}>
                        Editar
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteBenefit(benefit.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Modal */}
      {showBranchModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBranchModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="Sucursal Centro"
                />
              </div>
              <div className={styles.field}>
                <label>Dirección</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Av. Principal 450"
                />
              </div>
              <div className={styles.field}>
                <label>Teléfono</label>
                <input
                  type="text"
                  value={branchForm.phone}
                  onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="+54 11 4444-5555"
                />
              </div>
              <div className={styles.field}>
                <label>Link Google Maps</label>
                <input
                  type="text"
                  value={branchForm.googleMapsUrl}
                  onChange={e => setBranchForm({ ...branchForm, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
              <div className={styles.field}>
                <label>Embed Google Maps (iframe src)</label>
                <input
                  type="text"
                  value={branchForm.googleMapsEmbed}
                  onChange={e => setBranchForm({ ...branchForm, googleMapsEmbed: e.target.value })}
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowBranchModal(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={saveBranch}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Plan Mensual"
                />
              </div>
              <div className={styles.field}>
                <label>Descripción</label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Descripción del plan..."
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Precio (ARS)</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="15000"
                  />
                </div>
                <div className={styles.field}>
                  <label>Duración (días)</label>
                  <select
                    value={planForm.durationDays}
                    onChange={e => setPlanForm({ ...planForm, durationDays: e.target.value })}
                  >
                    <option value="30">30 días (Mensual)</option>
                    <option value="90">90 días (Trimestral)</option>
                    <option value="180">180 días (Semestral)</option>
                    <option value="365">365 días (Anual)</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Beneficios incluidos</label>
                <div className={styles.featuresCheckboxes}>
                  {features.map(feature => (
                    <label key={feature.id} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={planForm.featureIds.includes(feature.id)}
                        onChange={() => togglePlanFeature(feature.id)}
                      />
                      <span>{feature.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowPlanModal(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={savePlan}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFeatureModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingFeature ? 'Editar Feature' : 'Nuevo Feature'}
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  type="text"
                  value={featureForm.name}
                  onChange={e => setFeatureForm({ ...featureForm, name: e.target.value })}
                  placeholder="Acceso a pileta"
                />
              </div>
              <div className={styles.field}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={featureForm.description}
                  onChange={e => setFeatureForm({ ...featureForm, description: e.target.value })}
                  placeholder="Natación libre y aquagym"
                />
              </div>
              <div className={styles.field}>
                <label>Icono (nombre)</label>
                <input
                  type="text"
                  value={featureForm.icon}
                  onChange={e => setFeatureForm({ ...featureForm, icon: e.target.value })}
                  placeholder="waves"
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowFeatureModal(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={saveFeature}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit Modal */}
      {showBenefitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowBenefitModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingBenefit ? 'Editar Beneficio Exclusivo' : 'Nuevo Beneficio Exclusivo'}
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Nombre de la marca/empresa</label>
                <input
                  type="text"
                  value={benefitForm.name}
                  onChange={e => setBenefitForm({ ...benefitForm, name: e.target.value })}
                  placeholder="Golden"
                />
              </div>
              <div className={styles.field}>
                <label>Descuento</label>
                <input
                  type="text"
                  value={benefitForm.discount}
                  onChange={e => setBenefitForm({ ...benefitForm, discount: e.target.value })}
                  placeholder="25% OFF"
                />
              </div>
              <div className={styles.field}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={benefitForm.description}
                  onChange={e => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  placeholder="Descuento en suplementos deportivos"
                />
              </div>
              <div className={styles.field}>
                <label>URL del sitio web</label>
                <input
                  type="url"
                  value={benefitForm.websiteUrl}
                  onChange={e => setBenefitForm({ ...benefitForm, websiteUrl: e.target.value })}
                  placeholder="https://golden.com.ar"
                />
              </div>
              <div className={styles.field}>
                <label>Imagen de portada</label>
                <ImageUploader
                  currentImage={benefitForm.imageUrl || null}
                  onImageUploaded={(url) => setBenefitForm({ ...benefitForm, imageUrl: url })}
                  onImageRemoved={() => setBenefitForm({ ...benefitForm, imageUrl: '' })}
                  aspectRatio={16 / 9}
                  maxSizeMB={10}
                />
              </div>
              <div className={styles.field}>
                <label>Válido hasta (opcional)</label>
                <input
                  type="date"
                  value={benefitForm.validUntil}
                  onChange={e => setBenefitForm({ ...benefitForm, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowBenefitModal(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={saveBenefit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MercadoPago Modal */}
      {showMpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMpModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Configurar MercadoPago</h2>
            <p className={styles.mpModalDesc}>
              Ingresa las credenciales de tu cuenta de MercadoPago para recibir pagos de suscripciones.
              Puedes obtenerlas en <a href="https://www.mercadopago.com.ar/developers/panel/app" target="_blank" rel="noopener noreferrer">tu panel de desarrollador</a>.
            </p>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Access Token</label>
                <input
                  type="password"
                  value={mpForm.accessToken}
                  onChange={e => setMpForm({ ...mpForm, accessToken: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>
              <div className={styles.field}>
                <label>Public Key</label>
                <input
                  type="text"
                  value={mpForm.publicKey}
                  onChange={e => setMpForm({ ...mpForm, publicKey: e.target.value })}
                  placeholder="APP_USR-..."
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowMpModal(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={handleSaveMpConfig} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
