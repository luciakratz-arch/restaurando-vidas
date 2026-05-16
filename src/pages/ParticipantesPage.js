// src/pages/ParticipantesPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { collection, query, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ParticipantesPage() {
  const { isGestora } = useAuth();
  const [participantes, setParticipantes] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showParceiro, setShowParceiro] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nome: '', cargo: '', tipo: 'responsavel_tecnico', especializacao: '',
    curriculo: '', email: '', foto: '', ativo: true,
  });
  const [formParceiro, setFormParceiro] = useState({ nome: '', descricao: '', site: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unP = onSnapshot(query(collection(db, 'participantes')), (s) =>
      setParticipantes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unPa = onSnapshot(query(collection(db, 'parceiros')), (s) =>
      setParceiros(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unP(); unPa(); };
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editando) {
        await updateDoc(doc(db, 'participantes', editando), { ...form, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'participantes'), { ...form, createdAt: serverTimestamp() });
      }
      setForm({ nome: '', cargo: '', tipo: 'responsavel_tecnico', especializacao: '', curriculo: '', email: '', foto: '', ativo: true });
      setShowForm(false);
      setEditando(null);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const salvarParceiro = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'parceiros'), { ...formParceiro, createdAt: serverTimestamp() });
      setFormParceiro({ nome: '', descricao: '', site: '' });
      setShowParceiro(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const abrirEdicao = (p) => {
    setEditando(p.id);
    setForm({ nome: p.nome, cargo: p.cargo, tipo: p.tipo, especializacao: p.especializacao || '', curriculo: p.curriculo || '', email: p.email || '', foto: p.foto || '', ativo: p.ativo });
    setShowForm(true);
  };

  const tipoLabel = {
    responsavel_tecnico: 'Responsável Técnico(a)',
    estagiario: 'Estagiário(a)',
    profissional: 'Profissional de Saúde',
    colaborador: 'Colaborador(a)',
  };

  const tipoColor = {
    responsavel_tecnico: 'badge-gold',
    estagiario: 'badge-success',
    profissional: 'badge-warning',
    colaborador: 'badge-info',
  };

  const responsaveis = participantes.filter(p => p.tipo === 'responsavel_tecnico' && p.ativo);
  const demais = participantes.filter(p => p.tipo !== 'responsavel_tecnico' && p.ativo);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1>Equipe e Parceiros</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Responsáveis técnicos, participantes e parceiros do projeto</p>
        </div>
        {isGestora && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={() => { setShowParceiro(!showParceiro); setShowForm(false); }}>
              + Parceiro
            </button>
            <button className="btn btn-gold" onClick={() => { setShowForm(!showForm); setShowParceiro(false); setEditando(null); setForm({ nome: '', cargo: '', tipo: 'responsavel_tecnico', especializacao: '', curriculo: '', email: '', foto: '', ativo: true }); }}>
              + Participante
            </button>
          </div>
        )}
      </div>

      {/* Form Participante */}
      {showForm && isGestora && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>{editando ? 'Editar Participante' : 'Novo Participante'}</h3>
          <form onSubmit={salvar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input className="form-control" value={form.nome}
                  onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-control" value={form.tipo}
                  onChange={(e) => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cargo / Função</label>
                <input className="form-control" value={form.cargo}
                  onChange={(e) => setForm(p => ({ ...p, cargo: e.target.value }))}
                  placeholder="Ex: Psicóloga CRP 09/20590" />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-control" type="email" value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Especialização / Titulação</label>
                <input className="form-control" value={form.especializacao}
                  onChange={(e) => setForm(p => ({ ...p, especializacao: e.target.value }))}
                  placeholder="Ex: Doutora em Psicologia, Especialista em TCC e Neuromodulação" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Mini Currículo</label>
                <textarea className="form-control" rows={5} value={form.curriculo}
                  onChange={(e) => setForm(p => ({ ...p, curriculo: e.target.value }))}
                  placeholder="Breve currículo do participante..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                {saving ? 'Salvando...' : '✓ Salvar'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditando(null); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form Parceiro */}
      {showParceiro && isGestora && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Novo Parceiro</h3>
          <form onSubmit={salvarParceiro}>
            <div className="form-group">
              <label className="form-label">Nome do Parceiro *</label>
              <input className="form-control" value={formParceiro.nome}
                onChange={(e) => setFormParceiro(p => ({ ...p, nome: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-control" rows={3} value={formParceiro.descricao}
                onChange={(e) => setFormParceiro(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Site</label>
              <input className="form-control" value={formParceiro.site}
                onChange={(e) => setFormParceiro(p => ({ ...p, site: e.target.value }))}
                placeholder="https://..." />
            </div>
            <button type="submit" className="btn btn-gold" disabled={saving}>Salvar Parceiro</button>
          </form>
        </div>
      )}

      {/* Responsáveis Técnicos */}
      {responsaveis.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20, color: 'var(--gold)' }}>✦ Responsáveis Técnicos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {responsaveis.map(p => (
              <div key={p.id} className="card" style={{ border: '1px solid var(--gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>{p.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.cargo}</div>
                  </div>
                  <span className={`badge ${tipoColor[p.tipo]}`}>{tipoLabel[p.tipo]}</span>
                </div>
                {p.especializacao && (
                  <div style={{ fontSize: 13, color: 'var(--gold-light)', marginBottom: 8, fontStyle: 'italic' }}>
                    {p.especializacao}
                  </div>
                )}
                {p.curriculo && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{p.curriculo}</p>
                )}
                {p.email && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>✉ {p.email}</div>
                )}
                {isGestora && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => abrirEdicao(p)}>
                    ✎ Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demais Participantes */}
      {demais.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Equipe</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {demais.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.cargo}</div>
                  </div>
                  <span className={`badge ${tipoColor[p.tipo]}`}>{tipoLabel[p.tipo]}</span>
                </div>
                {p.especializacao && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{p.especializacao}</div>}
                {p.curriculo && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.curriculo}</p>}
                {isGestora && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => abrirEdicao(p)}>✎ Editar</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parceiros */}
      {parceiros.length > 0 && (
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Parceiros</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {parceiros.map(p => (
              <div key={p.id} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{p.nome}</div>
                {p.descricao && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.descricao}</p>}
                {p.site && (
                  <a href={p.site} target="_blank" rel="noopener noreferrer"
                    className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                    Visitar Site →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {participantes.length === 0 && parceiros.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 12 }}>❋</div>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum participante ou parceiro cadastrado ainda.</p>
          {isGestora && (
            <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
              + Adicionar Primeiro Participante
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
