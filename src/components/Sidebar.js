// src/components/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../contexts/AuthContext';

const ICONS = {
  dashboard: '◈',
  patients: '♡',
  clinical: '✦',
  reports: '◎',
  users: '❋',
  interconsulta: '⟳',
  perfil: '◉',
  logout: '→',
};

function NavItem({ icon, label, path, active, onClick }) {
  return (
    <div
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span style={{ fontSize: 16, color: active ? 'var(--gold)' : 'var(--text-muted)' }}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

export default function Sidebar({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout, isGestora, isPastor, isAluno, isProfissional } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const nav = (path) => navigate(path);
  const at = (path) => location.pathname === path;

  const roleLabel = {
    [ROLES.GESTORA]: 'Gestora Clínica',
    [ROLES.PASTOR]: 'Pastor / ADM',
    [ROLES.ALUNO]: 'Estagiário',
    [ROLES.PROFISSIONAL]: 'Prof. de Saúde',
  }[userProfile?.role] || 'Usuário';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Restaurando<br />Vidas</h2>
        <span>Cuidado da Alma</span>
      </div>

      <nav className="sidebar-nav">
        {/* Gestora & Pastores */}
        {(isGestora || isPastor) && (
          <>
            <span className="nav-section-title">Gestão</span>
            <NavItem icon={ICONS.dashboard} label="Dashboard" path="/dashboard"
              active={at('/dashboard')} onClick={() => nav('/dashboard')} />
          </>
        )}

        {/* Indicação — Pastores, Gestora, Profissionais */}
        {(isGestora || isPastor || isProfissional) && (
          <NavItem icon={ICONS.patients} label="Indicar Paciente" path="/indicar"
            active={at('/indicar')} onClick={() => nav('/indicar')} />
        )}

        {/* Gestora only */}
        {isGestora && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon={ICONS.clinical} label="Prontuários" path="/prontuarios"
              active={at('/prontuarios')} onClick={() => nav('/prontuarios')} />
            <NavItem icon={ICONS.interconsulta} label={`Interconsultas${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
              path="/interconsultas" active={at('/interconsultas')} onClick={() => nav('/interconsultas')} />
            <NavItem icon={ICONS.reports} label="Relatórios" path="/relatorios"
              active={at('/relatorios')} onClick={() => nav('/relatorios')} />
            <span className="nav-section-title">Admin</span>
            <NavItem icon={ICONS.users} label="Usuários" path="/usuarios"
              active={at('/usuarios')} onClick={() => nav('/usuarios')} />
          </>
        )}

        {/* Aluno */}
        {isAluno && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon={ICONS.clinical} label="Meus Atendimentos" path="/atendimentos"
              active={at('/atendimentos')} onClick={() => nav('/atendimentos')} />
            <NavItem icon={ICONS.interconsulta} label="Solicitar Especialista" path="/solicitar-especialista"
              active={at('/solicitar-especialista')} onClick={() => nav('/solicitar-especialista')} />
            <NavItem icon={ICONS.reports} label="Relatórios" path="/meus-relatorios"
              active={at('/meus-relatorios')} onClick={() => nav('/meus-relatorios')} />
          </>
        )}

        {/* Profissional */}
        {isProfissional && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon={ICONS.clinical} label="Meus Pacientes" path="/meus-pacientes"
              active={at('/meus-pacientes')} onClick={() => nav('/meus-pacientes')} />
            <NavItem icon={ICONS.reports} label="Relatórios" path="/meus-relatorios"
              active={at('/meus-relatorios')} onClick={() => nav('/meus-relatorios')} />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {userProfile?.nome || 'Usuário'}
          </div>
          <div>{roleLabel}</div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
          {ICONS.logout} Sair
        </button>
      </div>
    </aside>
  );
}
