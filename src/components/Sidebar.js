// src/components/Sidebar.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../contexts/AuthContext';

export default function Sidebar({ pendingCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout, isGestora, isPastor, isAluno, isProfissional } = useAuth();

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const nav = (path) => navigate(path);
  const at = (path) => location.pathname === path;

  const roleLabel = {
    [ROLES.GESTORA]: 'Gestora Clínica',
    [ROLES.PASTOR]: 'Pastor / ADM',
    [ROLES.ALUNO]: 'Estagiário',
    [ROLES.PROFISSIONAL]: 'Prof. de Saúde',
  }[userProfile?.role] || 'Usuário';

  const NavItem = ({ icon, label, path }) => (
    <div className={`nav-item ${at(path) ? 'active' : ''}`} onClick={() => nav(path)}>
      <span style={{ fontSize: 16, color: at(path) ? 'var(--gold)' : 'var(--text-muted)' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Restaurando<br />Vidas</h2>
        <span>Cuidado da Alma</span>
      </div>

      <nav className="sidebar-nav">

        {/* Todos os perfis */}
        <span className="nav-section-title">Projeto</span>
        <NavItem icon="🏠" label="Página Inicial" path="/pagina-inicial" />
        <NavItem icon="❋" label="Equipe e Parceiros" path="/participantes" />

        {/* Gestora + Pastor */}
        {(isGestora || isPastor) && (
          <>
            <span className="nav-section-title">Gestão</span>
            <NavItem icon="◈" label="Dashboard" path="/dashboard" />
            <NavItem icon="★" label="Avaliações" path="/avaliacoes" />
            <NavItem icon="📊" label="Relatórios do Projeto" path="/relatorios-projeto" />
          </>
        )}

        {/* Indicar paciente — Gestora, Pastor e Profissional */}
        {(isGestora || isPastor || isProfissional) && (
          <NavItem icon="♡" label="Indicar Paciente" path="/indicar" />
        )}

        {/* Gestora */}
        {isGestora && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon="📋" label="Prontuários" path="/prontuarios" />
            <NavItem icon={`⟳${pendingCount > 0 ? ` (${pendingCount})` : ''}`} label="Interconsultas" path="/interconsultas" />
            <NavItem icon="◎" label="Relatórios Clínicos" path="/relatorios" />
            <span className="nav-section-title">Admin</span>
            <NavItem icon="❋" label="Usuários" path="/usuarios" />
          </>
        )}

        {/* Aluno / Estagiário */}
        {isAluno && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon="📅" label="Agenda de Atendimentos" path="/atendimentos" />
            <NavItem icon="📋" label="Prontuários" path="/prontuarios-aluno" />
            <NavItem icon="⟳" label="Solicitar Especialista" path="/solicitar-especialista" />
          </>
        )}

        {/* Profissional de Saúde */}
        {isProfissional && (
          <>
            <span className="nav-section-title">Clínica</span>
            <NavItem icon="📅" label="Agenda de Atendimentos" path="/meus-pacientes" />
            <NavItem icon="📋" label="Prontuários" path="/prontuarios-profissional" />
            <NavItem icon="◎" label="Meus Relatórios" path="/meus-relatorios" />
          </>
        )}

        {/* Pastor */}
        {isPastor && (
          <>
            <span className="nav-section-title">Acompanhamento</span>
            <NavItem icon="★" label="Ver Avaliações" path="/avaliacoes" />
          </>
        )}

      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userProfile?.nome || 'Usuário'}</div>
          <div>{roleLabel}</div>
        </div>
        <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
          → Sair
        </button>
      </div>
    </aside>
  );
}
