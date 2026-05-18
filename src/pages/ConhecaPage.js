// src/pages/ConhecaPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Estrelas({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#D4AF37' : '#333', fontSize: 20 }}>★</span>
      ))}
    </div>
  );
}

const HISTORIA = `O Projeto Restaurando Vidas nasceu na cidade de São Paulo, sob a liderança de Max, como um braço missionário da iniciativa "Papo com Deus". O projeto surge da identificação de uma urgência latente: o cuidado integral com a saúde emocional e espiritual das pessoas. Unindo a fé e a ciência, a iniciativa estruturou uma rede de apoio especializada que conta com a atuação dedicada de psicólogos, psiquiatras e estagiários de psicologia. Nosso propósito é acolher o sofrimento humano com excelência técnica, ética e amor cristão, oferecendo suporte psicológico a quem mais precisa e restaurando a dignidade e a esperança de cada indivíduo assistido.`;

const MISSAO = `Missão: Promover a restauração integral de vidas por meio do cuidado em saúde mental e espiritual, integrando profissionais da saúde e a comunidade cristã. Visão: Ser referência em acolhimento psicossocial e espiritual ONLINE, expandindo a rede de profissionais e estagiários para alcançar e transformar cada vez mais realidades.`;

const TIMELINE = [
  { ano: '2000', titulo: 'SSS', descricao: 'XXX' },
  { ano: '2026', titulo: 'Início do projeto - Restaurando Vidas', descricao: 'Unindo esforços com profissionais da saúde para atender as dores emocionais da comunidade atendida.' },
];

const PARTICIPANTES = [
  {
    nome: 'lucia kratz',
    cargo: 'Psicloga Responsável',
    especializacao: 'Doutora em Psicologia, Esp. em TCC e Musicoterapia',
    curriculo: `Doutora em Psicologia pela PUC-GO e Mestre em Administração pelo CENEC-FACECA/MG, com graduação em Administração de Empresas pela PUC-GO, Psicologia pela UNVIERSO-Go e Bacharelado em Música Canto pela UNIS-MG. Coaching Sênior pelo ICI/SP. Com mais de 25 anos de experiência como musicista e professora de graduação e pós-graduação, atuou como Superintendente de Ensino da Fundação Antares, Coordenadora dos cursos de Administração e Marketing da Faculdade Ipog, Professora na UFES e Avaliadora do INEP nos Cursos Superiores de Tecnologia. Também exerceu funções como Gestora da Qualidade na FacUnicamps e Gestora/Membro parcial da CPA da IES. Com vasta experiência em gestão, tem ênfase em Gestão Educacional, Coaching, Administração de Pessoas, Gestão de Processos, Planejamento Estratégico e Vendas. Atua principalmente com temas como psicologia clínica, neurofeedback, gestão empresarial, administração, planejamento estratégico.`,
  },
];

export default function ConhecaPage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/restaurando-vidas/logo.png" alt="Logo"
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{ height: 48 }} />
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', fontWeight: 700 }}>Restaurando Vidas</div>
            <div style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cuidado da Alma</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{
            padding: '10px 24px', borderRadius: 8, background: 'transparent',
            border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
          }}>← Início</button>
          <button onClick={() => navigate('/cadastro')} style={{
            padding: '10px 24px', borderRadius: 8, background: '#D4AF37',
            border: 'none', color: '#000', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 700, fontSize: 14,
          }}>Solicitar Acesso</button>
        </div>
      </header>

      {/* Título */}
      <section style={{
        padding: '60px 40px 40px', textAlign: 'center',
        borderBottom: '1px solid rgba(212,175,55,0.1)',
      }}>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 36, color: '#D4AF37', marginBottom: 12 }}>
          Conheça o Projeto
        </h1>
        <p style={{ color: '#9A9080', fontSize: 16 }}>
          História, missão, equipe e impacto do Restaurando Vidas
        </p>
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
          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>
            ✦ Conquistas e Marcos
          </h2>
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
        <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#D4AF37', marginBottom: 40, textAlign: 'center' }}>
          ✦ Responsáveis Técnicos
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {PARTICIPANTES.map((p, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid #D4AF37', borderRadius: 16, padding: 28 }}>
              <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: '#D4AF37', marginBottom: 6 }}>{p.nome}</div>
              <div style={{ fontSize: 13, color: '#9A9080', marginBottom: 8 }}>{p.cargo}</div>
              {p.especializacao && <div style={{ fontSize: 13, color: '#F0D060', fontStyle: 'italic', marginBottom: 12 }}>{p.especializacao}</div>}
              {p.curriculo && <p style={{ fontSize: 13, color: '#9A9080', lineHeight: 1.7 }}>{p.curriculo}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
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
