// src/pages/IndicarPublicoPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function IndicarPublicoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', telefone: '', demanda: '', observacoes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'pacientes'), {
        ...form,
        status: 'pendente',
        indicadoPor: 'publico',
        indicadoPorNome: 'Indicação Pública',
        alunoResponsavel: null,
        profissionalResponsavel: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setForm({ nome: '', telefone: '', demanda: '', observacoes: '' });
    } catch (err) {
      setError('Erro ao registrar indicação. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F0E8', fontFamily: 'Raleway, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1200 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/restaurando-vidas/logo.png" alt="Logo"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ height: 48 }} />
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', fontWeight: 700 }}>Restaurando Vidas</div>
            <div style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cuidado da Alma</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 24px', borderRadius: 8, background: 'transparent',
          border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
          cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
        }}>← Início</button>
      </header>

      {/* Conteúdo */}
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 24px' }}>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💙</div>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 32, color: '#D4AF37', marginBottom: 12 }}>
            Indicar Paciente
          </h1>
          <p style={{ color: '#9A9080', fontSize: 15, lineHeight: 1.7 }}>
            Indique alguém que precisa de apoio psicológico gratuito.<br />
            Nossa equipe entrará em contato para dar continuidade ao atendimento.
          </p>
        </div>

        {/* Sucesso */}
        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12, padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>Indicação registrada com sucesso!</div>
              <div style={{ color: '#9A9080', fontSize: 14 }}>A Gestora Lúcia receberá a notificação e fará a triagem em breve.</div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24, color: '#f87171',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Formulário */}
        {!success && (
          <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 32 }}>
            <form onSubmit={handleSubmit}>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8 }}>
                  NOME COMPLETO *
                </label>
                <input
                  name="nome" value={form.nome} onChange={handleChange} required
                  placeholder="Nome do paciente"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14,
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)',
                    color: '#F5F0E8', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8 }}>
                  TELEFONE / WHATSAPP *
                </label>
                <input
                  name="telefone" value={form.telefone} onChange={handleChange} required
                  placeholder="(62) 9 0000-0000"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14,
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)',
                    color: '#F5F0E8', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8 }}>
                  BREVE DESCRIÇÃO DA DEMANDA *
                </label>
                <textarea
                  name="demanda" value={form.demanda} onChange={handleChange} required
                  placeholder="Descreva brevemente a situação que motiva o encaminhamento..."
                  rows={4}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14,
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)',
                    color: '#F5F0E8', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', marginBottom: 8 }}>
                  OBSERVAÇÕES ADICIONAIS
                </label>
                <textarea
                  name="observacoes" value={form.observacoes} onChange={handleChange}
                  placeholder="Informações complementares (opcional)..."
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14,
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.2)',
                    color: '#F5F0E8', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Info fluxo */}
              <div style={{
                background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 10, padding: '14px 16px', fontSize: 13,
                color: '#9A9080', marginBottom: 24,
              }}>
                <strong style={{ color: '#D4AF37' }}>ℹ Fluxo de Triagem:</strong> Após o envio, a Gestora (Lúcia)
                receberá um alerta e fará a triagem antes de atribuir o caso a um estagiário ou profissional de saúde.
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '16px', borderRadius: 10, fontSize: 16,
                background: loading ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                border: 'none', color: '#000', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Raleway', fontWeight: 700,
              }}>
                {loading ? 'Enviando...' : '✦ Registrar Indicação'}
              </button>
            </form>
          </div>
        )}

        {/* Após sucesso — botão para indicar outro */}
        {success && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button onClick={() => setSuccess(false)} style={{
              padding: '14px 32px', borderRadius: 10, background: 'transparent',
              border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
              cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 15,
            }}>
              + Indicar outra pessoa
            </button>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', textAlign: 'center', borderTop: '1px solid rgba(212,175,55,0.1)', color: '#5A5048', fontSize: 13, marginTop: 60 }}>
        Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito
      </footer>
    </div>
  );
}
