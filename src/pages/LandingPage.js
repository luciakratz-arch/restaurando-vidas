// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

function Estrelas({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#D4AF37' : '#333', fontSize: 20 }}>★</span>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [dados, setDados] = useState({ historia: '', missao: '', timeline: [] });
  const [participantes, setParticipantes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      // Dados da página inicial
      try {
        const snapPagina = await getDoc(doc(db, 'projeto', 'pagina_inicial'));
        if (snapPagina.exists()) setDados(snapPagina.data());
      } catch (e) {
        console.error('Erro projeto:', e);
      }

      // Participantes ativos (sem filtro de tipo — campo não existe nos docs)
      try {
        const qP = query(collection(db, 'participantes'), where('ativo', '==', true));
        const snapP = await getDocs(qP);
        setParticipantes(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Erro participantes:', e);
      }

      // Avaliações aprovadas (sem orderBy para evitar índice composto)
      try {
        const qA = query(collection(db, 'avaliacoes'), where('aprovada', '==', true));
        const snapA = await getDocs(qA);
        const lista = snapA.docs.map(d => ({ id: d.id, ...d.data() }));
        lista.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setAvaliacoes(lista);
      } catch (e) {
        console.error('Erro avaliações:', e);
      }

      setCarregando(false);
    }
    carregar();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F0E8', fontFamily: 'Raleway, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1200 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/restaurando-vidas/logo.jpeg" alt="Logo"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ height: 48 }} />
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', fontWeight: 700 }}>Restaurando Vidas</div>
            <div style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cuidado da Alma</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 24px', borderRadius: 8, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
          }}>Entrar</button>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '10px 24px', borderRadius: 8, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 14,
          }}>Solicitar Acesso</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '100px 40px', textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
      }}>
        <img src="/restaurando-vidas/logo.jpeg" alt="Logo"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: 140, marginBottom: 32 }} />
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 48, color: '#D4AF37', marginBottom: 16, lineHeight: 1.2 }}>
          Restaurando Vidas
        </h1>
        <p style={{ fontSize: 20, color: '#9A9080', marginBottom: 12, fontStyle: 'italic' }}>"Ser moldado dói, mas vale a pena!"</p>
        <p style={{ fontSize: 16, color: '#9A9080', maxWidth: 600, margin: '0 auto 48px' }}>Cuidado da Alma · Apoio Psicológico Gratuito</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '16px 40px', borderRadius: 10, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 16,
          }}>Solicitar Acesso ao Sistema →</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '16px 40px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 16,
          }}>Já tenho acesso</button>
        </div>
      </section>

      {/* Carregando */}
      {carregando && (
        <section style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ color: '#D4AF37', fontSize: 16 }}>Carregando informações do projeto...</div>
        </section>
      )}

      {/* História e Missão */}
      {!carregando && (dados.historia || dados.missao) && (
        <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {dados.historia && (
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', marginBottom: 20 }}>Nossa História</h2>
                <p style={{ color: '#9A9080', lineHeight: 1.9, fontSize: 15 }}>{dados.historia}</p>
              </div>
            )}
            {dados.missao && (
              <div>
                <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', marginBottom: 20 }}>Missão e Visão</h2>
                <p style={{ color: '#9A9080', lineHeight: 1.9, fontSize: 15 }}>{dados.missao}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Linha do Tempo */}
      {!carregando && dados.timeline?.length > 0 && (
        <section style={{ padding: '60px 40px', background: '#0f0f0f', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>Conquistas e Marcos</h2>
            <div style={{ position: 'relative', paddingLeft: 40 }}>
              <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'rgba(212,175,55,0.3)' }} />
              {dados.timeline.map((m, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 32 }}>
                  <div style={{ position: 'absolute', left: -30, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#D4AF37' }} />
                  <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: 15 }}>{m.ano} — {m.titulo}</div>
                  {m.descricao && <div style={{ fontSize: 14, color: '#9A9080', marginTop: 4 }}>{m.descricao}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Responsáveis Técnicos */}
      {!carregando && participantes.length > 0 && (
        <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>
            Responsáveis Técnicos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {participantes.map(p => (
              <div key={p.id} style={{ background: '#111', border: '1px solid #D4AF37', borderRadius: 16, padding: 28 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', marginBottom: 6 }}>{p.nome}</div>
                <div style={{ fontSize: 13, color: '#9A9080', marginBottom: 8 }}>{p.cargo}</div>
                {p.especializacao && <div style={{ fontSize: 13, color: '#F0D060', fontStyle: 'italic', marginBottom: 12 }}>{p.especializacao}</div>}
                {p.curriculo && <p style={{ fontSize: 13, color: '#9A9080', lineHeight: 1.7 }}>{p.curriculo}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Avaliações */}
      {!carregando && avaliacoes.length > 0 && (
        <section style={{ padding: '80px 40px', background: '#0f0f0f', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>Impacto nas Vidas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {avaliacoes.map(a => (
                <div key={a.id} style={{ background: '#161616', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 24 }}>
                  <Estrelas n={a.estrelas} />
                  <p style={{ color: '#9A9080', fontSize: 14, lineHeight: 1.7, margin: '12px 0' }}>"{a.comentario}"</p>
                  <div style={{ fontSize: 12, color: '#5A5048' }}>{a.periodo || a.pacienteNome}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final */}
      <section style={{
        padding: '80px 40px', textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)',
        borderTop: '1px solid rgba(212,175,55,0.1)',
      }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#D4AF37', marginBottom: 16 }}>Faça Parte do Projeto</h2>
        <p style={{ color: '#9A9080', fontSize: 15, maxWidth: 500, margin: '0 auto 40px' }}>
          Pastores, estagiários e profissionais de saúde podem solicitar acesso ao sistema.
        </p>
        <button onClick={() => navigate('/cadastro')} style={{
          padding: '18px 48px', borderRadius: 10, background: '#D4AF37',
          border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 18,
        }}>Solicitar Acesso →</button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 40px', textAlign: 'center', borderTop: '1px solid rgba(212,175,55,0.1)', color: '#5A5048', fontSize: 13 }}>
        Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito
      </footer>
    </div>
  );
}
