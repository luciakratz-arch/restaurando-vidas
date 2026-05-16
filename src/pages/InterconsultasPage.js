// src/pages/InterconsultasPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, where, onSnapshot, doc,
  updateDoc, serverTimestamp, orderBy, getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InterconsultasPage() {
  const { isGestora } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [profSelecionado, setProfSelecionado] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'interconsultas'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSolicitacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Buscar profissionais disponíveis
    const qProf = query(collection(db, 'users'), where('role', '==', 'profissional'), where('active', '==', true));
    getDocs(qProf).then(snap => {
      setProfissionais(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, []);

  const handleAprovar = async () => {
    if (!selected || !profSelecionado) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'interconsultas', selected.id), {
        status: 'aprovada',
        profissionalId: profSelecionado,
        observacoesGestora: obs,
        aprovadaEm: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Atualizar o paciente com o profissional atribuído
      if (selected.pacienteId) {
        await updateDoc(doc(db, 'pacientes', selected.pacienteId), {
          profissionalResponsavel: profSelecionado,
          updatedAt: serverTimestamp(),
        });
      }
      setSelected(null);
      setProfSelecionado('');
      setObs('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRejeitar = async (solId) => {
    if (!window.confirm('Rejeitar esta solicitação?')) return;
    await updateDoc(doc(db, 'interconsultas', solId), {
      status: 'rejeitada',
      updatedAt: serverTimestamp(),
    });
  };

  const statusMap = {
    pendente: { text: 'Pendente', cls: 'badge-warning' },
    aprovada: { text: 'Aprovada', cls: 'badge-success' },
    rejeitada: { text: 'Rejeitada', cls: 'badge-danger' },
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Interconsultas</h1>
        <p>Solicitações de Profissional de Saúde enviadas pelos estagiários</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>Carregando...</p>
      ) : solicitacoes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⟳</div>
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma solicitação de interconsulta no momento.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Solicitante (Aluno)</th>
                <th>Motivo</th>
                <th>Data</th>
                <th>Status</th>
                {isGestora && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {solicitacoes.map((s) => {
                const st = statusMap[s.status] || { text: s.status, cls: 'badge-gold' };
                const date = s.createdAt?.toDate
                  ? format(s.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })
                  : '—';
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.pacienteNome || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.alunoNome || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.motivo}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{date}</td>
                    <td><span className={`badge ${st.cls}`}>{st.text}</span></td>
                    {isGestora && s.status === 'pendente' && (
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-gold btn-sm" onClick={() => setSelected(s)}>
                            Aprovar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRejeitar(s.id)}>
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    )}
                    {isGestora && s.status !== 'pendente' && <td>—</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Aprovação */}
      {selected && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: 18 }}>Aprovar Interconsulta</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
                onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paciente</div>
                <div style={{ fontWeight: 600 }}>{selected.pacienteNome}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Motivo da Solicitação</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selected.motivo}</div>
              </div>
              <div className="divider" />
              <div className="form-group">
                <label className="form-label">Atribuir Profissional de Saúde *</label>
                <select
                  className="form-control"
                  value={profSelecionado}
                  onChange={(e) => setProfSelecionado(e.target.value)}
                  required
                >
                  <option value="">Selecione o profissional...</option>
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — {p.especialidade || 'Profissional de Saúde'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Observações da Gestora</label>
                <textarea
                  className="form-control"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Orientações para o profissional (opcional)..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancelar</button>
              <button
                className="btn btn-gold"
                onClick={handleAprovar}
                disabled={!profSelecionado || saving}
              >
                {saving ? 'Salvando...' : '✓ Aprovar e Encaminhar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
