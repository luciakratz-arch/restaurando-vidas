// src/pages/AvaliacaoPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy, doc,
  addDoc, updateDoc, serverTimestamp, getDocs, where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function Estrelas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => onChange && onChange(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: 32, cursor: onChange ? 'pointer' : 'default',
            color: i <= (hover || valor) ? 'var(--gold)' : 'var(--text-muted)',
            transition: 'color 0.15s',
          }}>★</span>
      ))}
    </div>
  );
}

export default function AvaliacaoPage() {
  const { isGestora, isPastor, currentUser, userProfile } = useAuth();
  const canEdit = isGestora || isPastor;
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pacienteId: '', estrelas: 0, comentario: '', periodo: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unAv = onSnapshot(
      query(collection(db, 'avaliacoes'), orderBy('createdAt', 'desc')),
      (s) => setAvaliacoes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    getDocs(query(collection(db, 'pacientes'))).then(s => {
      setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unAv;
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    if (form.estrelas === 0) { alert('Selecione a avaliação em estrelas.'); return; }
    setSaving(true);
    try {
      const paciente = pacientes.find(p => p.id === form.pacienteId);
      await addDoc(collection(db, 'avaliacoes'), {
        pacienteId: form.pacienteId,
        pacienteNome: paciente?.nome || '—',
        estrelas: form.estrelas,
        comentario: form.comentario,
        periodo: form.periodo,
        aprovada: false,
        criadoPor: currentUser.uid,
        criadoPorNome: userProfile?.nome,
        createdAt: serverTimestamp(),
      });
      setForm({ pacienteId: '', estrelas: 0, comentario: '', periodo: '' });
      setShowForm(false);
      setSuccess('Avaliação registrada! Aguarda aprovação da Gestora.');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const aprovar = async (id) => {
    await updateDoc(doc(db, 'avaliacoes', id), { aprovada: true, aprovadaEm: serverTimestamp() });
  };

  const rejeitar = async (id) => {
    if (!window.confirm('Remover esta avaliação?')) return;
    await updateDoc(doc(db, 'avaliacoes', id), { aprovada: false, rejeitada: true });
  };

  const fmtDate = (ts) => ts?.toDate ? format(ts.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '—';

  const pendentes = avaliacoes.filter(a => !a.aprovada && !a.rejeitada);
  const aprovadas = avaliacoes.filter(a => a.aprovada);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1>Avaliação de Pacientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ficha colaborativa de acompanhamento</p>
        </div>
        {canEdit && (
          <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancelar' : '+ Nova Avaliação'}
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✓ {success}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Nova Avaliação</h3>
          <form onSubmit={salvar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <select className="form-control" value={form.pacienteId}
                  onChange={(e) => setForm(p => ({ ...p, pacienteId: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Período de Referência</label>
                <input className="form-control" value={form.periodo}
                  onChange={(e) => setForm(p => ({ ...p, periodo: e.target.value }))}
                  placeholder="Ex: Jan-Mar 2026" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Avaliação *</label>
              <Estrelas valor={form.estrelas} onChange={(v) => setForm(p => ({ ...p, estrelas: v }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Comentário</label>
              <textarea className="form-control" rows={4} value={form.comentario}
                onChange={(e) => setForm(p => ({ ...p, comentario: e.target.value }))}
                placeholder="Descreva a evolução e impacto do atendimento..." />
            </div>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              {saving ? 'Salvando...' : '✓ Registrar Avaliação'}
            </button>
          </form>
        </div>
      )}

      {/* Pendentes — só Gestora vê */}
      {isGestora && pendentes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--warning)' }}>
            ⚠ Aguardando Aprovação ({pendentes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendentes.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.pacienteNome}</div>
                  <Estrelas valor={a.estrelas} />
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{a.comentario}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {a.criadoPorNome} · {fmtDate(a.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  <button className="btn btn-gold btn-sm" onClick={() => aprovar(a.id)}>✓ Aprovar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => rejeitar(a.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aprovadas */}
      <h3 style={{ fontSize: 15, marginBottom: 16 }}>Avaliações Aprovadas ({aprovadas.length})</h3>
      {aprovadas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma avaliação aprovada ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {aprovadas.map(a => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>{a.pacienteNome}</div>
                {a.periodo && <span className="badge badge-gold">{a.periodo}</span>}
              </div>
              <Estrelas valor={a.estrelas} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: '12px 0' }}>
                "{a.comentario}"
              </p>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {a.criadoPorNome} · {fmtDate(a.createdAt)}
              </div>
              {isGestora && (
                <button className="btn btn-danger btn-sm" style={{ marginTop: 12 }} onClick={() => rejeitar(a.id)}>
                  Remover da Página Inicial
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
