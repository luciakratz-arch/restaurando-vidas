// src/pages/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

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
          <img src="/restaurando-vidas/logo.png" alt="Logo"
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
        padding: '120px 40px', textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
      }}>
        <img src="/restaurando-vidas/logo.png" alt="Logo"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: 140, marginBottom: 32 }} />
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 48, color: '#D4AF37', marginBottom: 16, lineHeight: 1.2 }}>
          Restaurando Vidas
        </h1>
        <p style={{ fontSize: 20, color: '#9A9080', marginBottom: 12, fontStyle: 'italic' }}>
          "Ser moldado dói, mas vale a pena!"
        </p>
        <p style={{ fontSize: 16, color: '#9A9080', maxWidth: 600, margin: '0 auto 56px' }}>
          Cuidado da Alma · Apoio Psicológico Gratuito
        </p>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '16px 40px', borderRadius: 10, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 16,
          }}>Solicitar Acesso ao Sistema →</button>

          <button onClick={() => navigate('/conheca')} style={{
            padding: '16px 40px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.6)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 16,
          }}>Conheça o Projeto ✦</button>

          <button onClick={() => navigate('/login')} style={{
            padding: '16px 40px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.3)', color: '#9A9080',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 16,
          }}>Já tenho acesso</button>
        </div>
      </section>

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
