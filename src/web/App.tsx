import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WebLogin } from './screens/Login';
import { WebDashboard } from './screens/Dashboard';

export default function WebApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f172a'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #1e293b',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <Routes>
        {!user ? (
          <Route path="*" element={<WebLogin />} />
        ) : (
          <>
            <Route path="/" element={<WebDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}
