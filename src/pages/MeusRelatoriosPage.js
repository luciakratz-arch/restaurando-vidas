// src/pages/MeusRelatoriosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, addDoc, query, where, onSnapshot,
  orderBy, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { gerarRelatorioRV } from '../utils/gerarPDF';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MeusRelatoriosPage() {
  const { currentUser, userProfile } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '', periodo: '', evolucao: '', intervencoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Meus pacientes
    const qPac = query(collection(db, 'pacientes'), where('alunoResponsavel', '==', currentUser.uid));
    const unPac = onSnapshot(qPac, (s) => {
      setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Meus relatórios
    const qRel = query(
      collection(db, 'relatorios'),
      where('alunoId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unRel = onSnapshot(qRel, (s) => {
      setRelatorios(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unPac(); unRel(); };
  }, [currentUser.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const paciente = pacientes.find(p => p.id === form.pacienteId);
      await addDoc(collection(db, 'relatorios'), {
        pacienteId: form.pacienteId,
        pacienteNome: paciente?.nome || '—',
        pacienteTelefone: paciente?.telefone || '—',
        alunoId: currentUser.uid,
        alunoNome: userProfile?.nome || 'Estagiário',
        periodo: form.periodo,
        evolucao: form.evolucao,
        intervencoes: form.intervencoes,
        observacoesGestora: '',
        status: 'pendente_revisao',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setForm({ pacienteId: '', periodo: '', evolucao: '', intervencoes: '' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    rascunho: { text: 'Rascunho', cls: 'badge-gold' },
    pendente_revisao: { text: 'Aguardando Gestora', cls: 'badge-warning' },
    aprovado: { text: 'Aprovado ✓', cls: 'badge-success' },
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Meus Relatórios</h1>
          <p>Relatórios de evolução e impacto dos atendimentos</p>
        </div>
        <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Novo Relatório'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <span>✓</span> Relatório enviado para revisão da Gestora!
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setSuccess(false)}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Novo Relatório de Evolução</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <select
                  className="form-control"
                  value={form.pacienteId}
                  onChange={(e) => setForm(p => ({ ...p, pacienteId: e.target.value }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Período de Referência *</label>
                <input
                  className="form-control"
                  value={form.periodo}
                  onChange={(e) => setForm(p => ({ ...p, periodo: e.target.value }))}
                  placeholder="Ex: Maio 2026 / Semana 1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Evolução Clínica *</label>
              <textarea
                className="form-control"
                value={form.evolucao}
                onChange={(e) => setForm(p => ({ ...p, evolucao: e.target.value }))}
                placeholder="Descreva a evolução observada no paciente durante o período..."
                rows={5}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Intervenções Realizadas *</label>
              <textarea
                className="form-control"
                value={form.intervencoes}
                onChange={(e) => setForm(p => ({ ...p, intervencoes: e.target.value }))}
                placeholder="Descreva as técnicas e intervenções aplicadas..."
                rows={4}
                required
              />
            </div>

            <div style={{
              background: 'var(--gold-muted)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              Após o envio, o relatório ficará visível para revisão da Gestora.
              O PDF só será gerado após a aprovação.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-gold" disabled={loading}>
                {loading ? 'Enviando...' : '→ Enviar para Revisão'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {relatorios.length === 0 && !showForm ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum relatório criado ainda.</p>
          <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
            + Criar Primeiro Relatório
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {relatorios.map((r) => {
            const st = statusMap[r.status] || { text: r.status, cls: 'badge-gold' };
            const date = r.createdAt?.toDate
              ? format(r.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })
              : '—';
            return (
              <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.pacienteNome}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Período: {r.periodo} · Enviado em {date}
                  </div>
                  {r.observacoesGestora && (
                    <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>
                      ✦ Gestora adicionou observações
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className={`badge ${st.cls}`}>{st.text}</span>
                  {r.status === 'aprovado' && (
                    <button className="btn btn-outline btn-sm" onClick={() => gerarRelatorioRV(r).catch(console.error)}>
                      ↓ PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
