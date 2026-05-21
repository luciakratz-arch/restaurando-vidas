// src/pages/AvaliacaoPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy, doc,
  updateDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function Estrelas({ valor }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 24, color: i <= valor ? 'var(--gold)' : 'var(--text-muted)' }}>★</span>
      ))}
    </div>
  );
}

const BASE_URL = 'https://luciakratz-arch.github.io/restaurando-vidas/#/avaliacao';

export default function AvaliacaoPage() {
  const { isGestora } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [linkCopiado, setLinkCopiado] = useState('');

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

  const gerarLink = (paciente) => {
    // Codifica nome e id em base64 para URL limpa
    const token = btoa(JSON.stringify({ id: paciente.id, nome: paciente.nome }));
    return `${BASE_URL}/${token}`;
  };

  const copiarLink = (paciente) => {
    const link = gerarLink(paciente);
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopiado(paciente.id);
      setTimeout(() => setLinkCopiado(''), 3000);
    });
  };

  const compartilharWhatsApp = (paciente) => {
    const link = gerarLink(paciente);
    const msg = encodeURIComponent(`Olá ${paciente.nome}! Gostaríamos de saber como foi sua experiência com o Projeto Restaurando Vidas. Por favor, responda nossa avaliação: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
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
      <div className="page-header">
        <h1>Avaliações</h1>
        <p>Envie links de avaliação para os pacientes e gerencie as respostas</p>
      </div>

      {/* Gerar links por paciente */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, color: 'var(--gold)', marginBottom: 4 }}>✦ Enviar Link de Avaliação</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          Selecione um paciente e copie o link personalizado para enviar via WhatsApp ou e-mail.
          O paciente responde sem precisar de login.
        </p>

        {pacientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum paciente cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pacientes.map(p => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--bg-secondary)',
                borderRadius: 10, border: '1px solid var(--border)', flexWrap: 'wrap', gap: 8,
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.telefone || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => copiarLink(p)}>
                    {linkCopiado === p.id ? '✓ Link Copiado!' : '🔗 Copiar Link'}
                  </button>
                  <button className="btn btn-gold btn-sm" onClick={() => compartilharWhatsApp(p)}>
                    📲 WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pendentes — só Gestora vê */}
      {isGestora && pendentes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 16, color: '#EAB308' }}>
            ⚠ Aguardando Aprovação ({pendentes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendentes.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{a.pacienteNome}</div>
                  <Estrelas valor={a.estrelas} />
                  {a.comentario && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 500 }}>"{a.comentario}"</div>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Respondido em: {fmtDate(a.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-gold btn-sm" onClick={() => aprovar(a.id)}>✓ Aprovar</button>
                  <button className="btn btn-outline btn-sm" onClick={() => rejeitar(a.id)}>✕ Rejeitar</button>
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
              {a.comentario && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, margin: '12px 0' }}>
                  "{a.comentario}"
                </p>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(a.createdAt)}</div>
              {isGestora && (
                <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => rejeitar(a.id)}>
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
