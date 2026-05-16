// src/pages/SolicitarEspecialistaPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SolicitarEspecialistaPage() {
  const { currentUser, userProfile } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState([]);
  const [form, setForm] = useState({ pacienteId: '', motivo: '', urgencia: 'normal' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Meus pacientes atribuídos
    const qPac = query(collection(db, 'pacientes'), where('alunoResponsavel', '==', currentUser.uid));
    const unPac = onSnapshot(qPac, (s) => {
      setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Minhas solicitações
    const qSol = query(
      collection(db, 'interconsultas'),
      where('alunoId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unSol = onSnapshot(qSol, (s) => {
      setMinhasSolicitacoes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unPac(); unSol(); };
  }, [currentUser.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const paciente = pacientes.find(p => p.id === form.pacienteId);
      // Verificar se já existe solicitação pendente para este paciente
      const jaExiste = minhasSolicitacoes.find(
        s => s.pacienteId === form.pacienteId && s.status === 'pendente'
      );
      if (jaExiste) {
        setError('Já existe uma solicitação pendente para este paciente.');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'interconsultas'), {
        pacienteId: form.pacienteId,
        pacienteNome: paciente?.nome || 'Não identificado',
        alunoId: currentUser.uid,
        alunoNome: userProfile?.nome || 'Estagiário',
        motivo: form.motivo,
        urgencia: form.urgencia,
        status: 'pendente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setForm({ pacienteId: '', motivo: '', urgencia: 'normal' });
    } catch (err) {
      setError('Erro ao enviar solicitação. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    pendente: { text: 'Aguardando Gestora', cls: 'badge-warning' },
    aprovada: { text: 'Aprovada ✓', cls: 'badge-success' },
    rejeitada: { text: 'Não Aprovada', cls: 'badge-danger' },
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Solicitar Profissional de Saúde</h1>
        <p>A solicitação será analisada pela Gestora antes do encaminhamento</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Formulário */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Nova Solicitação</h3>

            {success && (
              <div className="alert alert-success">
                <span>✓</span> Solicitação enviada! A Gestora será notificada para avaliação.
              </div>
            )}
            {error && (
              <div className="alert alert-error">
                <span>⚠</span> {error}
              </div>
            )}

            <div style={{
              background: 'var(--gold-muted)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              <strong style={{ color: 'var(--gold)' }}>⚠ Atenção:</strong> Esta solicitação passará
              por aprovação da Gestora antes de ser encaminhada ao profissional.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <select
                  className="form-control"
                  value={form.pacienteId}
                  onChange={(e) => setForm(p => ({ ...p, pacienteId: e.target.value }))}
                  required
                >
                  <option value="">Selecione o paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
                {pacientes.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Nenhum paciente atribuído a você ainda.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Urgência</label>
                <select
                  className="form-control"
                  value={form.urgencia}
                  onChange={(e) => setForm(p => ({ ...p, urgencia: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                  <option value="emergencia">Emergência</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo da Solicitação *</label>
                <textarea
                  className="form-control"
                  value={form.motivo}
                  onChange={(e) => setForm(p => ({ ...p, motivo: e.target.value }))}
                  placeholder="Descreva clinicamente o motivo da necessidade de interconsulta..."
                  rows={5}
                  required
                />
              </div>

              <button type="submit" className="btn btn-gold" disabled={loading || pacientes.length === 0}>
                {loading ? 'Enviando...' : '→ Solicitar Interconsulta'}
              </button>
            </form>
          </div>
        </div>

        {/* Histórico */}
        <div>
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Minhas Solicitações</h3>
            {minhasSolicitacoes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma solicitação enviada ainda.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {minhasSolicitacoes.map((s) => {
                  const st = statusMap[s.status] || { text: s.status, cls: 'badge-gold' };
                  const date = s.createdAt?.toDate
                    ? format(s.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })
                    : '—';
                  return (
                    <div key={s.id} style={{
                      padding: '14px 16px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--gold-border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>{s.pacienteNome}</div>
                        <span className={`badge ${st.cls}`}>{st.text}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.motivo}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{date}</div>
                      {s.observacoesGestora && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px',
                          background: 'var(--gold-muted)',
                          borderRadius: 'var(--radius)',
                          fontSize: 12,
                        }}>
                          <strong style={{ color: 'var(--gold)' }}>Obs. Gestora:</strong>{' '}
                          <span style={{ color: 'var(--text-secondary)' }}>{s.observacoesGestora}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
