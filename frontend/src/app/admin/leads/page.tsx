'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { LeadModal } from './LeadModal';
import { ConvertLeadModal } from './ConvertLeadModal';
import { LeadList, Lead } from '@/components/leads';

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISITED: 'Visitó',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    try {
      const res = await apiFetch('/admin/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreate = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setModalOpen(false);
    setEditingLead(null);
    await fetchLeads();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lead?')) return;
    
    try {
      await apiFetch(`/admin/leads/${id}`, { method: 'DELETE' });
      await fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleConvert = (lead: Lead) => {
    setConvertingLead(lead);
  };

  const handleConvertSuccess = async () => {
    setConvertingLead(null);
    await fetchLeads();
  };

  const filteredLeads = filter === 'ALL' 
    ? leads 
    : leads.filter(l => l.status === filter);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    contacted: leads.filter(l => l.status === 'CONTACTED').length,
    converted: leads.filter(l => l.status === 'CONVERTED').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leads</h1>
          <p className={styles.subtitle}>Gestiona tus prospectos y conviértelos en clientes</p>
        </div>
        <button className={styles.addButton} onClick={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Lead
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.newLead}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.new}</span>
            <span className={styles.statLabel}>nuevos</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.contacted}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.contacted}</span>
            <span className={styles.statLabel}>contactados</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.converted}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.converted}</span>
            <span className={styles.statLabel}>convertidos</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        {['ALL', 'NEW', 'CONTACTED', 'VISITED', 'CONVERTED', 'LOST'].map((status) => (
          <button
            key={status}
            className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'ALL' ? 'Todos' : statusLabels[status]}
          </button>
        ))}
      </div>

      <div className={styles.resultsCount}>
        {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando leads...</div>
      ) : (
        <LeadList
          leads={filteredLeads}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvert={handleConvert}
        />
      )}

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {convertingLead && (
        <ConvertLeadModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  );
}
