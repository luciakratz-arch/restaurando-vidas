// src/pages/ProntuariosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy, doc,
  addDoc, updateDoc, serverTimestamp, where, getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProntuariosPage() {
  const { currentUser, userProfile, isGestora, isProfissional } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSel, setPacienteSel] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [form, setForm] = useState({ data: '', queixa: '', observacoes: '', evolucao: '', conduta: '' });
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let q;
    if (isGestora) {
      q = query(collection(db, 'pacientes'), orderBy('createdAt', 'desc'));
    } else if (isProfissional) {
      q = query(collection(db, 'pacientes'), where('profissionalResponsavel', '==', currentUser.uid));
    } else {
      q = query(collection(db, 'pacientes'), where('alunoResponsavel', '==', currentUser.uid));
    }
    return onSnapshot(q, (s) => setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isGestora, isProfissional, currentUser.uid]);

  useEffect(() => {
    if (!pacienteSel) return;
    const q = query(
      collection(db, 'prontuarios'),
      where('pacienteId', '==', pacienteSel.id),
      orderBy('data', 'desc')
    );
    return onSnapshot(q, (s) => setSessoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [pacienteSel]);

  const salvarSessao = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'prontuarios'), {
        pacienteId: pacienteSel.id,
        pacienteNome: pacienteSel.nome,
        alunoId: currentUser.uid,
        alunoNome: userProfile?.nome || 'Estagiário',
        ...form,
        feedbackSupervisora: '',
        createdAt: serverTimestamp(),
      });
      setForm({ data: '', queixa: '', observacoes: '', evolucao: '', conduta: '' });
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const salvarFeedback = async (sessaoId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'prontuarios', sessaoId), {
        feedbackSupervisora: feedback,
        feedbackEm: serverTimestamp(),
        feedbackPor: userProfile?.nome || 'Supervisora',
      });
      setShowFeedback(null);
      setFeedback('');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    if (ts.toDate) return format(ts.toDate(), 'dd/MM/yyyy', { locale: ptBR });
    return ts;
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Prontuários</h1>
        <p>Registro clínico por sessão com supervisão técnica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Lista de pacientes */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>
            Pacientes
          </div>
          {pacientes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum paciente atribuído.</p>
          ) : pacientes.map(p => (
            <div key={p.id}
              onClick={() => { setPacienteSel(p); setShowForm(false); }}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: pacienteSel?.id === p.id ? 'var(--gold-muted)' : 'transparent',
                border: `1px solid ${pacienteSel?.id === p.id ? 'var(--gold-border)' : 'transparent'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.telefone}</div>
            </div>
          ))}
        </div>

        {/* Prontuário do paciente */}
        <div>
          {!pacienteSel ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 12 }}>◈</div>
              <p style={{ color: 'var(--text-muted)' }}>Selecione um paciente para ver o prontuário</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 2 }}>{pacienteSel.nome}</h2>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sessoes.length} sessão(ões) registrada(s)</span>
                </div>
                {!isGestora && !isProfissional && (
                  <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancelar' : '+ Nova Sessão'}
                  </button>
                )}
              </div>

              {/* Formulário nova sessão */}
              {showForm && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 16 }}>Registrar Nova Sessão</h3>
                  <form onSubmit={salvarSessao}>
                    <div className="form-group">
                      <label className="form-label">Data da Sessão *</label>
                      <input className="form-control" type="date" value={form.data}
                        onChange={(e) => setForm(p => ({ ...p, data: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Queixa Principal</label>
                      <textarea className="form-control" rows={2} value={form.queixa}
                        onChange={(e) => setForm(p => ({ ...p, queixa: e.target.value }))}
                        placeholder="Queixa apresentada pelo paciente..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Observações Clínicas *</label>
                      <textarea className="form-control" rows={4} value={form.observacoes}
                        onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))}
                        placeholder="Observações da sessão..." required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Evolução</label>
                      <textarea className="form-control" rows={3} value={form.evolucao}
                        onChange={(e) => setForm(p => ({ ...p, evolucao: e.target.value }))}
                        placeholder="Evolução observada..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Conduta</label>
                      <textarea className="form-control" rows={2} value={form.conduta}
                        onChange={(e) => setForm(p => ({ ...p, conduta: e.target.value }))}
                        placeholder="Conduta adotada..." />
                    </div>
                    <button type="submit" className="btn btn-gold" disabled={saving}>
                      {saving ? 'Salvando...' : '✓ Salvar Sessão'}
                    </button>
                  </form>
                </div>
              )}

              {/* Sessões */}
              {sessoes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-muted)' }}>Nenhuma sessão registrada ainda.</p>
                </div>
              ) : sessoes.map((s) => (
                <div key={s.id} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                        Sessão — {s.data || fmtDate(s.createdAt)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Registrado por: {s.alunoNome}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(s.createdAt)}</div>
                  </div>

                  {s.queixa && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Queixa Principal</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.queixa}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Observações</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.observacoes}</div>
                  </div>
                  {s.evolucao && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Evolução</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.evolucao}</div>
                    </div>
                  )}
                  {s.conduta && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Conduta</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s.conduta}</div>
                    </div>
                  )}

                  {/* Feedback da Supervisora */}
                  {s.feedbackSupervisora ? (
                    <div style={{
                      marginTop: 16, padding: '12px 16px',
                      background: 'var(--gold-muted)',
                      border: '1px solid var(--gold-border)',
                      borderRadius: 8,
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        ✦ Feedback da Supervisora Técnica
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.feedbackSupervisora}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {s.feedbackPor} · {fmtDate(s.feedbackEm)}
                      </div>
                      {isGestora && (
                        <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}
                          onClick={() => { setShowFeedback(s.id); setFeedback(s.feedbackSupervisora); }}>
                          ✎ Editar Feedback
                        </button>
                      )}
                    </div>
                  ) : isGestora && (
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}
                      onClick={() => { setShowFeedback(s.id); setFeedback(''); }}>
                      ✦ Adicionar Feedback de Supervisão
                    </button>
                  )}

                  {showFeedback === s.id && (
                    <div style={{ marginTop: 12 }}>
                      <textarea className="form-control" rows={3} value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Feedback técnico de supervisão..." />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-gold btn-sm" onClick={() => salvarFeedback(s.id)} disabled={saving}>
                          {saving ? 'Salvando...' : '✓ Salvar'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowFeedback(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
