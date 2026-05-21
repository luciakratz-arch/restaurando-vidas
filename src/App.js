// src/App.js
import React from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

import LandingPage from './pages/LandingPage';
import CadastroPage from './pages/CadastroPage';
import LoginPage from './pages/LoginPage';
import IndicarPublicoPage from './pages/IndicarPublicoPage';
import AvaliacaoPublicaPage from './pages/AvaliacaoPublicaPage';
import DashboardPage from './pages/DashboardPage';
import IndicarPacientePage from './pages/IndicarPacientePage';
import InterconsultasPage from './pages/InterconsultasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import UsuariosPage from './pages/UsuariosPage';
import SolicitarEspecialistaPage from './pages/SolicitarEspecialistaPage';
import MeusRelatoriosPage from './pages/MeusRelatoriosPage';
import ProntuariosPage from './pages/ProntuariosPage';
import PaginaInicialPage from './pages/PaginaInicialPage';
import AvaliacaoPage from './pages/AvaliacaoPage';
import ParticipantesPage from './pages/ParticipantesPage';
import RelatorioProjetoPage from './pages/RelatorioProjetoPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/indicar-paciente" element={<IndicarPublicoPage />} />
          <Route path="/avaliacao/:token" element={<AvaliacaoPublicaPage />} />

          {/* Gestora + Pastor */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['gestora','pastor']}><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/pagina-inicial" element={
            <ProtectedRoute allowedRoles={['gestora','pastor','aluno','profissional']}><PaginaInicialPage /></ProtectedRoute>
          } />
          <Route path="/participantes" element={
            <ProtectedRoute allowedRoles={['gestora','pastor','aluno','profissional']}><ParticipantesPage /></ProtectedRoute>
          } />
          <Route path="/avaliacoes" element={
            <ProtectedRoute allowedRoles={['gestora','pastor']}><AvaliacaoPage /></ProtectedRoute>
          } />
          <Route path="/relatorios-projeto" element={
            <ProtectedRoute allowedRoles={['gestora','pastor']}><RelatorioProjetoPage /></ProtectedRoute>
          } />
          <Route path="/indicar" element={
            <ProtectedRoute allowedRoles={['gestora','pastor','profissional']}><IndicarPacientePage /></ProtectedRoute>
          } />

          {/* Gestora */}
          <Route path="/interconsultas" element={
            <ProtectedRoute allowedRoles={['gestora']}><InterconsultasPage /></ProtectedRoute>
          } />
          <Route path="/relatorios" element={
            <ProtectedRoute allowedRoles={['gestora']}><RelatoriosPage /></ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute allowedRoles={['gestora']}><UsuariosPage /></ProtectedRoute>
          } />
          <Route path="/prontuarios" element={
            <ProtectedRoute allowedRoles={['gestora']}><ProntuariosPage /></ProtectedRoute>
          } />

          {/* Aluno */}
          <Route path="/atendimentos" element={
            <ProtectedRoute allowedRoles={['aluno']}><ProntuariosPage /></ProtectedRoute>
          } />
          <Route path="/prontuarios-aluno" element={
            <ProtectedRoute allowedRoles={['aluno']}><ProntuariosPage /></ProtectedRoute>
          } />
          <Route path="/solicitar-especialista" element={
            <ProtectedRoute allowedRoles={['aluno']}><SolicitarEspecialistaPage /></ProtectedRoute>
          } />
          <Route path="/meus-relatorios" element={
            <ProtectedRoute allowedRoles={['aluno','profissional']}><MeusRelatoriosPage /></ProtectedRoute>
          } />

          {/* Profissional */}
          <Route path="/meus-pacientes" element={
            <ProtectedRoute allowedRoles={['profissional']}><ProntuariosPage /></ProtectedRoute>
          } />
          <Route path="/prontuarios-profissional" element={
            <ProtectedRoute allowedRoles={['profissional']}><ProntuariosPage /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
