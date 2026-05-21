// src/pages/AvaliacaoPublicaPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

function Estrelas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 48, cursor: 'pointer',
            color: i <= (hover || valor) ? '#D4AF37' : '#333',
            transition: 'color 0.15s, transform 0.1s',
            transform: i <= (hover || valor) ? 'scale(1.15)' : 'scale(1)',
            display: 'inline-block',
          }}>★</span>
      ))}
    </div>
  );
}

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito Bom', 'Excelente!'];

export default function AvaliacaoPublicaPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ estrelas: 0, comentario: '' });
  const [enviado, setEnviado] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(token));
      if (!decoded.id || !decoded.nome) throw new Error('Token inválido');
      setPaciente(decoded);
    } catch {
      setErro('Link inválido ou expirado. Solicite um novo link à equipe.');
    }
  }, [token]);

  const enviar = async (e) => {
    e.preventDefault();
    if (form.estrelas === 0) { alert('Por favor, selecione uma avaliação em estrelas.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'avaliacoes'), {
        pacienteId: paciente.id,
        pacienteNome: paciente.nome,
        estrelas: form.estrelas,
        comentario: form.comentario,
        aprovada: false,
        rejeitada: false,
        origem: 'link_paciente',
        createdAt: serverTimestamp(),
      });
      setEnviado(true);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F0E8', fontFamily: 'Raleway, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1200 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <img src="/restaurando-vidas/logo.png" alt="Logo"
          onError={e => e.target.style.display='none'} style={{ height: 44 }} />
        <div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 17, color: '#D4AF37', fontWeight: 700 }}>Restaurando Vidas</div>
          <div style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cuidado da Alma</div>
        </div>
      </header>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Erro de token */}
          {erro && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ color: '#EF4444', marginBottom: 12 }}>Link Inválido</h2>
              <p style={{ color: '#9A9080' }}>{erro}</p>
            </div>
          )}

          {/* Enviado com sucesso */}
          {enviado && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🙏</div>
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#D4AF37', marginBottom: 16 }}>
                Obrigado!
              </h2>
              <p style={{ color: '#9A9080', fontSize: 16, lineHeight: 1.8 }}>
                Sua avaliação foi recebida com sucesso.<br />
                Ela será revisada pela nossa equipe.
              </p>
              <p style={{ color: '#5A5048', fontSize: 13, marginTop: 24 }}>
                Que Deus abençoe sua jornada de restauração! 💛
              </p>
            </div>
          )}

          {/* Formulário */}
          {!erro && !enviado && paciente && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 36 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#D4AF37', marginBottom: 12 }}>
                  Sua Avaliação
                </h1>
                <p style={{ color: '#9A9080', fontSize: 15, lineHeight: 1.7 }}>
                  Olá, <strong style={{ color: '#F5F0E8' }}>{paciente.nome}</strong>!<br />
                  Como foi sua experiência com o Projeto Restaurando Vidas?
                </p>
              </div>

              <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 32 }}>
                <form onSubmit={enviar}>

                  {/* Estrelas */}
                  <div style={{ marginBottom: 28, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 16 }}>
                      COMO VOCÊ AVALIA O ATENDIMENTO? *
                    </div>
                    <Estrelas valor={form.estrelas} onChange={v => setForm(p => ({ ...p, estrelas: v }))} />
                    {form.estrelas > 0 && (
                      <div style={{ marginTop: 10, fontSize: 14, color: '#D4AF37', fontWeight: 600 }}>
                        {LABELS[form.estrelas]}
                      </div>
                    )}
                  </div>

                  {/* Comentário */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8 }}>
                      CONTE UM POUCO SOBRE SUA EXPERIÊNCIA
                    </label>
                    <textarea
                      value={form.comentario}
                      onChange={e => setForm(p => ({ ...p, comentario: e.target.value }))}
                      rows={4} placeholder="Como o atendimento impactou sua vida? (opcional)"
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14,
                        background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)',
                        color: '#F5F0E8', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Info privacidade */}
                  <div style={{
                    background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.15)',
                    borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#9A9080', marginBottom: 20,
                  }}>
                    🔒 Sua resposta será revisada pela equipe antes de ser publicada. Seu nome completo não será exibido publicamente.
                  </div>

                  <button type="submit" disabled={saving} style={{
                    width: '100%', padding: '16px', borderRadius: 10, fontSize: 16,
                    background: saving ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                    border: 'none', color: '#000', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Raleway', fontWeight: 700,
                  }}>
                    {saving ? 'Enviando...' : '✦ Enviar Avaliação'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '20px 40px', textAlign: 'center', borderTop: '1px solid rgba(212,175,55,0.1)', color: '#5A5048', fontSize: 12 }}>
        Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito
      </footer>
    </div>
  );
}
