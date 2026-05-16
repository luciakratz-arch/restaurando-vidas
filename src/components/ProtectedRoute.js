// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 32, color: 'var(--gold)' }}>✦</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirecionar para a página inicial do perfil
    const roleHome = {
      gestora: '/dashboard',
      pastor: '/dashboard',
      aluno: '/atendimentos',
      profissional: '/meus-pacientes',
    };
    return <Navigate to={roleHome[userProfile.role] || '/dashboard'} replace />;
  }

  return children;
}
