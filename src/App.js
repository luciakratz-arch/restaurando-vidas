// src/App.js
import React from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IndicarPacientePage from './pages/IndicarPacientePage';
import InterconsultasPage from './pages/InterconsultasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import SolicitarEspecialistaPage from './pages/SolicitarEspecialistaPage';
import MeusRelatoriosPage from './pages/MeusRelatoriosPage';

// Página placeholder simples para módulos em desenvolvimento
function PlaceholderPage({ titulo }) {
  const { useAuth } = require('./contexts/AuthContext');
  const Layout = require('./components/Layout').default;
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 16 }}>◈</div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{titulo}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Módulo em desenvolvimento</p>
      </div>
    </Layout>
  );
}

function AtendimentosPage() { return <PlaceholderPage titulo="Meus Atendimentos" />; }
function MeusPacientesPage() { return <PlaceholderPage titulo="Meus Pacientes" />; }
function ProntuariosPage() { return <PlaceholderPage titulo="Prontuários" />; }

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Público */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Gestora + Pastor */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['gestora', 'pastor']}>
              <DashboardPage />
            </ProtectedRoute>
          } />

          {/* Indicar Paciente — Gestora, Pastor, Profissional */}
          <Route path="/indicar" element={
            <ProtectedRoute allowedRoles={['gestora', 'pastor', 'profissional']}>
              <IndicarPacientePage />
            </ProtectedRoute>
          } />

          {/* Gestora only */}
          <Route path="/interconsultas" element={
            <ProtectedRoute allowedRoles={['gestora']}>
              <InterconsultasPage />
            </ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute allowedRoles={['gestora']}>
              <RelatoriosPage />
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['gestora']}>
              <UsuariosPage />
            </ProtectedRoute>
          } />
          <Route path="/prontuarios" element={
            <ProtectedRoute allowedRoles={['gestora']}>
              <ProntuariosPage />
            </ProtectedRoute>
          } />

          {/* Aluno */}
          <Route path="/atendimentos" element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <AtendimentosPage />
            </ProtectedRoute>
          } />
          <Route path="/solicitar-especialista" element={
            <ProtectedRoute allowedRoles={['aluno']}>
              <SolicitarEspecialistaPage />
            </ProtectedRoute>
          } />
          <Route path="/meus-relatorios" element={
            <ProtectedRoute allowedRoles={['aluno', 'profissional']}>
              <MeusRelatoriosPage />
            </ProtectedRoute>
          } />

          {/* Profissional */}
          <Route path="/meus-pacientes" element={
            <ProtectedRoute allowedRoles={['profissional']}>
              <MeusPacientesPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
