// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HISTORIA = `O Projeto Restaurando Vidas nasceu na cidade de São Paulo, sob a liderança de Max, como um braço missionário da iniciativa "Papo com Deus". O projeto surge da identificação de uma urgência latente: o cuidado integral com a saúde emocional e espiritual das pessoas. Unindo a fé e a ciência, a iniciativa estruturou uma rede de apoio especializada que conta com a atuação dedicada de psicólogos, psiquiatras e estagiários de psicologia. Nosso propósito é acolher o sofrimento humano com excelência técnica, ética e amor cristão, oferecendo suporte psicológico a quem mais precisa e restaurando a dignidade e a esperança de cada indivíduo assistido.`;

const MISSAO = `Missão: Promover a restauração integral de vidas por meio do cuidado em saúde mental e espiritual, integrando profissionais da saúde e a comunidade cristã. Visão: Ser referência em acolhimento psicossocial e espiritual ONLINE, expandindo a rede de profissionais e estagiários para alcançar e transformar cada vez mais realidades.`;

const TIMELINE = [
  { ano: '2026', titulo: 'Início do projeto - Restaurando Vidas', descricao: 'Unindo esforços com profissionais da saúde para atender as dores emocionais da comunidade atendida.' },
];

const RESPONSAVEIS = [
  {
    nome: 'Lucia Kratz',
    cargo: 'Psicóloga Responsável',
    crp: 'CRP 09/20590',
    especializacao: 'Doutora em Psicologia, Esp. em TCC e Musicoterapia',
    curriculo: `Doutora em Psicologia pela PUC-GO e Mestre em Administração pelo CENEC-FACECA/MG, com graduação em Administração de Empresas pela PUC-GO, Psicologia pela UNIVERSO-Go e Bacharelado em Música Canto pela UNIS-MG. Coaching Sênior pelo ICI/SP. Com mais de 25 anos de experiência como musicista e professora de graduação e pós-graduação, atuou como Superintendente de Ensino da Fundação Antares, Coordenadora dos cursos de Administração e Marketing da Faculdade Ipog, Professora na UFES e Avaliadora do INEP nos Cursos Superiores de Tecnologia. Também exerceu funções como Gestora da Qualidade na FacUnicamps e Gestora/Membro parcial da CPA da IES. Atua principalmente com temas como psicologia clínica, neurofeedback, gestão empresarial, administração, planejamento estratégico, liderança, gestão de equipes, relacionamento interpessoal, comportamento organizacional, coaching, empregabilidade, psicodinâmica do trabalho, saúde do trabalhador, inteligência multifocal, gestão do conhecimento, ensino/aprendizagem, didática e andragogia. Autora dos livros "Líder 3.0", "Líder 5.0", "Meu Companheiro é um Psicopata, Será?" e "Aprendizado Vivo".`,
    email: 'luciakratz@gmail.com',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [instalado, setInstalado] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalado(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const [showInstalarModal, setShowInstalarModal] = useState(false);

  const instalarApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result) => {
        if (result.outcome === 'accepted') { setDeferredPrompt(null); setInstalado(true); }
      });
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowInstalarModal(true);
    }
  };

  const labelBtnInstalar = instalado ? '✅ App Instalado!' : deferredPrompt ? '📲 Instalar App Agora' : '📲 Baixar o App';

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#F5F0E8', fontFamily: 'Raleway, sans-serif' }}>

      {/* Modal Instruções Instalar */}
      {showInstalarModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480, border: '1px solid rgba(212,175,55,0.4)' }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#D4AF37', marginBottom: 8, fontFamily: 'Cinzel, serif' }}>📲 Instalar o App</div>
            <p style={{ color: '#9A9080', fontSize: 14, marginBottom: 24 }}>Siga as instruções para instalar o Restaurando Vidas no seu dispositivo:</p>

            <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#D4AF37', marginBottom: 10, fontSize: 14 }}>🤖 Android (Chrome):</div>
              <p style={{ color: '#9A9080', fontSize: 13, margin: '0 0 6px' }}>1. Toque nos <strong style={{ color: '#F5F0E8' }}>3 pontinhos ⋮</strong> no canto superior direito</p>
              <p style={{ color: '#9A9080', fontSize: 13, margin: '0 0 6px' }}>2. Toque em <strong style={{ color: '#F5F0E8' }}>"Adicionar à tela inicial"</strong></p>
              <p style={{ color: '#9A9080', fontSize: 13, margin: 0 }}>3. Toque em <strong style={{ color: '#F5F0E8' }}>Adicionar</strong></p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#D4AF37', marginBottom: 10, fontSize: 14 }}>🖥️ Desktop (Chrome):</div>
              <p style={{ color: '#9A9080', fontSize: 13, margin: '0 0 6px' }}>1. Clique no ícone <strong style={{ color: '#F5F0E8' }}>⊕</strong> na barra de endereços (canto direito)</p>
              <p style={{ color: '#9A9080', fontSize: 13, margin: 0 }}>2. Clique em <strong style={{ color: '#F5F0E8' }}>"Instalar"</strong></p>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.08)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{ fontWeight: 700, color: '#D4AF37', marginBottom: 10, fontSize: 14 }}>🍎 iPhone (Safari):</div>
              <p style={{ color: '#9A9080', fontSize: 13, margin: '0 0 6px' }}>1. Toque em <strong style={{ color: '#F5F0E8' }}>compartilhar ⬆️</strong> na barra inferior</p>
              <p style={{ color: '#9A9080', fontSize: 13, margin: '0 0 6px' }}>2. Toque em <strong style={{ color: '#F5F0E8' }}>"Adicionar à Tela de Início"</strong></p>
              <p style={{ color: '#9A9080', fontSize: 13, margin: 0 }}>3. Toque em <strong style={{ color: '#F5F0E8' }}>Adicionar</strong></p>
            </div>

            <p style={{ fontSize: 12, color: '#5A5048', marginBottom: 20, textAlign: 'center' }}>
              Após instalar, abra o app e faça login com seu <strong style={{ color: '#9A9080' }}>e-mail e senha</strong> cadastrados.
            </p>

            <button onClick={() => setShowInstalarModal(false)} style={{
              width: '100%', padding: 14, borderRadius: 12, border: 'none',
              background: '#D4AF37', color: '#000', fontWeight: 700,
              fontSize: 15, cursor: 'pointer', fontFamily: 'Raleway',
            }}>Entendido ✓</button>
          </div>
        </div>
      )}

      {/* Modal iOS */}
      {showIOSModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111', borderRadius: '20px 20px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, borderTop: '2px solid #D4AF37' }}>
            <div style={{ width: 40, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 24px' }} />
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, color: '#D4AF37' }}>📱 Instalar no iPhone</div>
            <p style={{ color: '#9A9080', marginBottom: 12 }}>1. Toque em <strong style={{ color: '#F5F0E8' }}>compartilhar ⬆️</strong> na barra do Safari</p>
            <p style={{ color: '#9A9080', marginBottom: 12 }}>2. Toque em <strong style={{ color: '#F5F0E8' }}>"Adicionar à Tela de Início"</strong></p>
            <p style={{ color: '#9A9080', marginBottom: 16 }}>3. Toque em <strong style={{ color: '#F5F0E8' }}>Adicionar</strong></p>
            <p style={{ background: 'rgba(212,175,55,0.1)', padding: 10, borderRadius: 8, fontSize: 13, color: '#D4AF37', borderLeft: '3px solid #D4AF37', marginBottom: 16 }}>
              ⚠️ Precisa estar no <strong>Safari</strong>, não no Chrome.
            </p>
            <button onClick={() => setShowIOSModal(false)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#D4AF37', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1200 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.2)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/restaurando-vidas/logo.png" alt="Logo"
            onError={(e) => { e.target.style.display = 'none'; }} style={{ height: 48 }} />
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', fontWeight: 700 }}>Restaurando Vidas</div>
            <div style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cuidado da Alma</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/indicar-paciente')} style={{
            padding: '10px 24px', borderRadius: 8, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
          }}>💙 Indicar Paciente</button>
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
        <img src="/restaurando-vidas/logo.png" alt="Logo"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ width: 140, marginBottom: 32 }} />
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 48, color: '#D4AF37', marginBottom: 16, lineHeight: 1.2 }}>
          Restaurando Vidas
        </h1>
        <p style={{ fontSize: 20, color: '#9A9080', marginBottom: 12, fontStyle: 'italic' }}>
          "Ser moldado dói, mas vale a pena!"
        </p>
        <p style={{ fontSize: 16, color: '#9A9080', maxWidth: 600, margin: '0 auto 48px' }}>
          Cuidado da Alma · Apoio Psicológico Gratuito
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '16px 40px', borderRadius: 10, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 16,
          }}>Solicitar Acesso ao Sistema →</button>
          <button onClick={() => navigate('/indicar-paciente')} style={{
            padding: '16px 40px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.5)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 16,
          }}>💙 Indicar um Paciente</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '16px 40px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.3)', color: '#9A9080',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 16,
          }}>Já tenho acesso</button>
        </div>
      </section>

      {/* Bloco Instalar App */}
      <section style={{ padding: '40px', background: '#0d0d0d', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))',
          border: '1.5px solid rgba(212,175,55,0.3)', borderRadius: 20,
          padding: '28px 36px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              📱 Acesso pelo Celular
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#F5F0E8' }}>
              Instale o app gratuitamente
            </div>
            <div style={{ fontSize: 14, color: '#9A9080', lineHeight: 1.6, maxWidth: 420 }}>
              Acesse o sistema direto pelo celular, sem precisar de loja de aplicativos. Faça login com seu e-mail e senha.
            </div>
          </div>
          <button onClick={instalarApp} disabled={instalado} style={{
            background: instalado ? 'rgba(34,197,94,0.2)' : '#D4AF37',
            color: instalado ? '#22C55E' : '#000',
            fontWeight: 700, fontSize: 15,
            padding: '14px 28px', borderRadius: 12,
            border: instalado ? '1px solid #22C55E' : 'none',
            cursor: instalado ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            fontFamily: 'Raleway',
          }}>
            {labelBtnInstalar}
          </button>
        </div>
      </section>

      {/* Seção Indicar Paciente */}
      <section style={{ padding: '56px 40px', background: '#0d0d0d', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💙</div>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 14 }}>
            Conhece alguém que precisa de apoio?
          </h2>
          <p style={{ color: '#9A9080', fontSize: 15, lineHeight: 1.9, marginBottom: 28, maxWidth: 560, margin: '0 auto 28px' }}>
            Pastores, líderes e membros da comunidade podem indicar pessoas que precisam de acompanhamento psicológico gratuito. O processo é simples, rápido e sigiloso.
          </p>
          <button onClick={() => navigate('/indicar-paciente')} style={{
            padding: '15px 44px', borderRadius: 10, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer',
            fontFamily: 'Raleway', fontWeight: 700, fontSize: 16,
          }}>
            💙 Indicar Paciente Agora
          </button>
          <div style={{ marginTop: 14, fontSize: 12, color: '#5A5048' }}>
            Não é necessário criar conta · 100% gratuito
          </div>
        </div>
      </section>

      {/* História e Missão */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
          <div style={{ background: '#111', borderRadius: 16, padding: 32, border: '1px solid rgba(212,175,55,0.2)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', marginBottom: 20 }}>✦ Nossa História</h2>
            <p style={{ color: '#9A9080', lineHeight: 1.9, fontSize: 15 }}>{HISTORIA}</p>
          </div>
          <div style={{ background: '#111', borderRadius: 16, padding: 32, border: '1px solid rgba(212,175,55,0.2)' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#D4AF37', marginBottom: 20 }}>✦ Missão e Visão</h2>
            <p style={{ color: '#9A9080', lineHeight: 1.9, fontSize: 15 }}>{MISSAO}</p>
          </div>
        </div>
      </section>

      {/* Linha do Tempo */}
      <section style={{ padding: '60px 40px', background: '#0f0f0f', borderTop: '1px solid rgba(212,175,55,0.1)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>✦ Conquistas e Marcos</h2>
          <div style={{ position: 'relative', paddingLeft: 40 }}>
            <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'rgba(212,175,55,0.3)' }} />
            {TIMELINE.map((m, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 32 }}>
                <div style={{ position: 'absolute', left: -30, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#D4AF37' }} />
                <div style={{ fontWeight: 700, color: '#D4AF37', fontSize: 15 }}>{m.ano} — {m.titulo}</div>
                {m.descricao && <div style={{ fontSize: 14, color: '#9A9080', marginTop: 4 }}>{m.descricao}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsáveis Técnicos */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>✦ Responsáveis Técnicos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {RESPONSAVEIS.map((p, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid #D4AF37', borderRadius: 16, padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#D4AF37' }}>{p.nome}</div>
                  <div style={{ fontSize: 13, color: '#9A9080', marginTop: 4 }}>{p.cargo}</div>
                </div>
                <span style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', fontSize: 11, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  RESPONSÁVEL TÉCNICO(A)
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#F0D060', fontStyle: 'italic', margin: '12px 0' }}>{p.especializacao}</div>
              <p style={{ fontSize: 13, color: '#9A9080', lineHeight: 1.8 }}>{p.curriculo}</p>
              {p.email && <div style={{ marginTop: 16, fontSize: 13, color: '#D4AF37' }}>✉ {p.email}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 28, color: '#D4AF37', marginBottom: 16 }}>Faça Parte do Projeto</h2>
        <p style={{ color: '#9A9080', fontSize: 15, maxWidth: 500, margin: '0 auto 40px' }}>
          Pastores, estagiários e profissionais de saúde podem solicitar acesso ao sistema.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '18px 48px', borderRadius: 10, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 18,
          }}>Solicitar Acesso →</button>
          <button onClick={() => navigate('/indicar-paciente')} style={{
            padding: '18px 48px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 18,
          }}>💙 Indicar Paciente</button>
          <button onClick={instalarApp} style={{
            padding: '18px 48px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 18,
          }}>↓ Baixar o App</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 40px', textAlign: 'center', borderTop: '1px solid rgba(212,175,55,0.1)', color: '#5A5048', fontSize: 13 }}>
        Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito
      </footer>
    </div>
  );
}
