import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../hooks/useAuth';

export const WebDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [caregivers, setCaregivers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: medsData } = await supabase.from('medications').select('*');
      const { data: caregiversData } = await supabase.from('caregivers').select('*');
      if (medsData) setMedications(medsData);
      if (caregiversData) setCaregivers(caregiversData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      padding: '20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '900',
      color: '#f8fafc',
    },
    logoutButton: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#ef4444',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#1e293b',
      borderRadius: '16px',
      padding: '16px',
      borderLeft: '4px solid #3b82f6',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: '900',
      color: '#f8fafc',
    },
    statLabel: {
      fontSize: '12px',
      color: '#94a3b8',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#f8fafc',
      marginBottom: '12px',
    },
    addButton: {
      background: '#3b82f6',
      border: 'none',
      padding: '16px',
      borderRadius: '16px',
      cursor: 'pointer',
      color: '#f8fafc',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
    },
    medCard: {
      background: '#1e293b',
      borderRadius: '28px',
      padding: '24px',
      marginBottom: '16px',
      border: '1px solid #334155',
    },
    medName: {
      fontSize: '22px',
      fontWeight: '900',
      color: '#f8fafc',
    },
    medDosage: {
      fontSize: '13px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    takeButton: {
      background: '#f8fafc',
      border: 'none',
      padding: '14px',
      borderRadius: '18px',
      cursor: 'pointer',
      marginTop: '16px',
      width: '100%',
      fontWeight: '900',
      color: '#0f172a',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hello, {user?.email?.split('@')[0]}</h1>
          <p style={{ color: '#94a3b8' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button style={styles.logoutButton} onClick={() => supabase.auth.signOut()}>
          Logout
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ color: '#3b82f6', marginBottom: '8px' }}>💊</div>
          <div style={styles.statValue}>{medications.length}</div>
          <div style={styles.statLabel}>Active Meds</div>
        </div>
        <div style={{ ...styles.statCard, borderLeftColor: '#f59e0b' }}>
          <div style={{ color: '#f59e0b', marginBottom: '8px' }}>👥</div>
          <div style={styles.statValue}>{caregivers.length}</div>
          <div style={styles.statLabel}>Team Members</div>
        </div>
      </div>

      <div style={styles.section}>
        <button style={styles.addButton} onClick={() => navigate('/add-medication')}>
          <span>+</span> Add Medication
        </button>

        <h2 style={styles.sectionTitle}>Medications</h2>
        {medications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No medications yet</p>
            <p style={{ fontSize: '14px' }}>Click "Add Medication" to get started</p>
          </div>
        ) : (
          medications.map(med => (
            <div key={med.id} style={styles.medCard}>
              <div style={styles.medName}>{med.name}</div>
              <div style={styles.medDosage}>{med.dosage} • Every {med.frequency_hours}h</div>
              <button style={styles.takeButton}>Mark as Taken</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
