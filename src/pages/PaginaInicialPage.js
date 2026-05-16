// src/pages/PaginaInicialPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, query, where, onSnapshot, orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function PaginaInicialPage() {
  const { isGestora, isPastor } = useAuth();
  const canEdit = isGestora || isPastor;

  const [dados, setDados] = useState({ historia: '', missao: '', timeline: [] });
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ historia: '', missao: '' });
  const [novoMarco, setNovoMarco] = useState({ ano: '', titulo: '', descricao: '' });
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'projeto', 'pagina_inicial')).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setDados(d);
        setForm({ historia: d.historia || '', missao: d.missao || '' });
      }
    });

    const q = query(
      collection(db, 'avaliacoes'),
      where('aprovada', '==', true),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (s) => setAvaliacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const salvar = async () => {
    setSaving(true);
    try {
      const novo = { ...form, timeline: dados.timeline || [], updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'projeto', 'pagina_inicial'), novo, { merge: true });
      setDados(prev => ({ ...prev, ...form }));
      setEditando(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const adicionarMarco = async () => {
    if (!novoMarco.ano || !novoMarco.titulo) return;
    const novaTimeline = [...(dados.timeline || []), novoMarco].sort((a, b) => a.ano - b.ano);
    await setDoc(doc(db, 'projeto', 'pagina_inicial'), { timeline: novaTimeline }, { merge: true });
    setDados(prev => ({ ...prev, timeline: novaTimeline }));
    setNovoMarco({ ano: '', titulo: '', descricao: '' });
  };

  const removerMarco = async (idx) => {
    const novaTimeline = dados.timeline.filter((_, i) => i !== idx);
    await setDoc(doc(db, 'projeto', 'pagina_inicial'), { timeline: novaTimeline }, { merge: true });
    setDados(prev => ({ ...prev, timeline: novaTimeline }));
  };

  const Estrelas = ({ n }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? 'var(--gold)' : 'var(--text-muted)', fontSize: 18 }}>★</span>
      ))}
    </div>
  );

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Restaurando Vidas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Página Inicial do Projeto</p>
        </div>
        {canEdit && (
          <button className={`btn ${editando ? 'btn-outline' : 'btn-gold'}`}
            onClick={() => setEditando(!editando)}>
            {editando ? '✕ Cancelar' : '✎ Editar Página'}
          </button>
        )}
      </div>

      {/* História e Missão */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>História do Projeto</h3>
          {editando ? (
            <textarea className="form-control" rows={6} value={form.historia}
              onChange={(e) => setForm(p => ({ ...p, historia: e.target.value }))}
              placeholder="Conte a história do projeto Restaurando Vidas..." />
          ) : (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
              {dados.historia || 'A história do projeto ainda não foi adicionada.'}
            </p>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Missão e Visão</h3>
          {editando ? (
            <textarea className="form-control" rows={6} value={form.missao}
              onChange={(e) => setForm(p => ({ ...p, missao: e.target.value }))}
              placeholder="Descreva a missão e visão do projeto..." />
          ) : (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
              {dados.missao || 'A missão do projeto ainda não foi adicionada.'}
            </p>
          )}
        </div>
      </div>

      {editando && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <button className="btn btn-gold" onClick={salvar} disabled={saving}>
            {saving ? 'Salvando...' : '✓ Salvar Alterações'}
          </button>
        </div>
      )}

      {/* Linha do Tempo */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, marginBottom: 24 }}>Linha do Tempo e Conquistas</h3>
        {(dados.timeline || []).length === 0 && !editando ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum marco adicionado ainda.</p>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, background: 'var(--gold-border)' }} />
            {(dados.timeline || []).map((m, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{
                  position: 'absolute', left: -26, top: 4,
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--gold)', border: '2px solid var(--bg-base)',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 14 }}>{m.ano} — {m.titulo}</div>
                    {m.descricao && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{m.descricao}</div>}
                  </div>
                  {editando && canEdit && (
                    <button className="btn btn-danger btn-sm" onClick={() => removerMarco(i)}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {editando && canEdit && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--gold-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 12 }}>Adicionar Marco</div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, marginBottom: 12 }}>
              <input className="form-control" placeholder="Ano" value={novoMarco.ano}
                onChange={(e) => setNovoMarco(p => ({ ...p, ano: e.target.value }))} />
              <input className="form-control" placeholder="Título do marco" value={novoMarco.titulo}
                onChange={(e) => setNovoMarco(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <textarea className="form-control" rows={2} placeholder="Descrição (opcional)" value={novoMarco.descricao}
              onChange={(e) => setNovoMarco(p => ({ ...p, descricao: e.target.value }))} style={{ marginBottom: 12 }} />
            <button className="btn btn-gold btn-sm" onClick={adicionarMarco}>+ Adicionar Marco</button>
          </div>
        )}
      </div>

      {/* Avaliações aprovadas */}
      {avaliacoes.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Avaliações dos Pacientes Atendidos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {avaliacoes.map(a => (
              <div key={a.id} className="card">
                <Estrelas n={a.estrelas} />
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: '12px 0' }}>
                  "{a.comentario}"
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {a.pacienteNome || 'Paciente'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
