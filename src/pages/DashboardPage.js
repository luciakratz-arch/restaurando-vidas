// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { isGestora, isPastor } = useAuth();
  const [stats, setStats] = useState({
    pacientesAtivos: 0,
    interconsultasPendentes: 0,
    relatoriosPendentes: 0,
    atendimentosHoje: 0,
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pacientes ativos
    const qPac = query(collection(db, 'pacientes'), where('status', '==', 'ativo'));
    const unPac = onSnapshot(qPac, (s) => {
      setStats(prev => ({ ...prev, pacientesAtivos: s.size }));
    });

    // Interconsultas pendentes
    const qInt = query(collection(db, 'interconsultas'), where('status', '==', 'pendente'));
    const unInt = onSnapshot(qInt, (s) => {
      setStats(prev => ({ ...prev, interconsultasPendentes: s.size }));
    });

    // Relatórios pendentes
    const qRel = query(collection(db, 'relatorios'), where('status', '==', 'pendente_revisao'));
    const unRel = onSnapshot(qRel, (s) => {
      setStats(prev => ({ ...prev, relatoriosPendentes: s.size }));
    });

    // Pacientes recentes
    const qRecent = query(collection(db, 'pacientes'), orderBy('createdAt', 'desc'), limit(5));
    const unRecent = onSnapshot(qRecent, (s) => {
      setRecentPatients(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => { unPac(); unInt(); unRel(); unRecent(); };
  }, []);

  const statCards = [
    { label: 'Pacientes Ativos', value: stats.pacientesAtivos, icon: '♡', color: 'var(--gold)' },
    { label: 'Interconsultas Pendentes', value: stats.interconsultasPendentes, icon: '⟳',
      color: stats.interconsultasPendentes > 0 ? 'var(--warning)' : 'var(--gold)' },
    { label: 'Relatórios p/ Revisar', value: stats.relatoriosPendentes, icon: '◎',
      color: stats.relatoriosPendentes > 0 ? 'var(--warning)' : 'var(--gold)' },
    { label: 'Atendimentos Esta Semana', value: stats.atendimentosHoje, icon: '✦', color: 'var(--gold)' },
  ];

  const statusLabel = {
    ativo: { text: 'Ativo', cls: 'badge-success' },
    pendente: { text: 'Pendente', cls: 'badge-warning' },
    alta: { text: 'Alta', cls: 'badge-info' },
    inativo: { text: 'Inativo', cls: 'badge-danger' },
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do programa Restaurando Vidas</p>
      </div>

      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <span style={{ fontSize: 24, color: s.color }}>{s.icon}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {stats.interconsultasPendentes > 0 && isGestora && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⟳</span>
          <strong>{stats.interconsultasPendentes} interconsulta(s)</strong> aguardando sua aprovação.
          <a href="/interconsultas" style={{ color: 'var(--gold)', marginLeft: 8 }}>Ver agora →</a>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16 }}>Pacientes Recentes</h3>
          {(isGestora || isPastor) && (
            <a href="/indicar" className="btn btn-outline btn-sm">+ Indicar Paciente</a>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Carregando...</p>
        ) : recentPatients.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>
            Nenhum paciente cadastrado ainda.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Demanda</th>
                  <th>Status</th>
                  <th>Cadastrado em</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => {
                  const st = statusLabel[p.status] || { text: p.status, cls: 'badge-gold' };
                  const date = p.createdAt?.toDate
                    ? format(p.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })
                    : '—';
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nome}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.telefone}</td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.demanda}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.text}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
