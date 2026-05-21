// src/pages/ProntuariosPage.js
// Usado por: /prontuarios (Gestora), /prontuarios-aluno (Aluno), /prontuarios-profissional (Profissional)
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy, doc,
  addDoc, updateDoc, serverTimestamp, where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

const RESPONSAVEL = {
  nome: 'Lucia Kratz',
  cargo: 'Responsável Técnica',
  funcao: 'Psicóloga',
  crp: 'CRP 09/20590',
  assinatura: '/restaurando-vidas/assinatura2.png',
};

function fmtDate(ts) {
  if (!ts) return '—';
  if (ts.toDate) return format(ts.toDate(), 'dd/MM/yyyy', { locale: ptBR });
  return ts;
}

function StatusBadge({ status }) {
  const cfg = {
    pendente:  { label: 'Aguardando Validação', bg: 'rgba(234,179,8,0.15)',  color: '#EAB308' },
    validado:  { label: 'Validado ✓',           bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
    rejeitado: { label: 'Revisão Solicitada',    bg: 'rgba(239,68,68,0.15)', color: '#EF4444' },
  }[status] || { label: status, bg: 'rgba(150,150,150,0.15)', color: '#aaa' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── PDFs ─────────────────────────────────────────────────────────────────────
async function loadImg(src) {
  return new Promise(resolve => {
    const img = new Image(); img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

function pdfHeader(doc, titulo) {
  doc.setFillColor(248, 248, 248);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
  doc.text(titulo, 20, 14);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120,120,120);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', 20, 21);
  doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 27);
  doc.setDrawColor(200,200,200); doc.line(20, 32, 190, 32);
}

async function pdfAssinatura(doc, y, validadoPor) {
  const img = await loadImg(RESPONSAVEL.assinatura);
  if (img) { doc.addImage(img, 'PNG', 20, y, 50, 18); y += 20; }
  doc.setDrawColor(0); doc.line(20, y, 80, y); y += 5;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
  doc.text(RESPONSAVEL.nome, 20, y); y += 5;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80,80,80);
  doc.text(`${RESPONSAVEL.funcao} · ${RESPONSAVEL.crp}`, 20, y); y += 5;
  doc.text(RESPONSAVEL.cargo, 20, y); y += 5;
  if (validadoPor) { doc.setTextColor(100,100,100); doc.text(`Validado por: ${validadoPor}`, 20, y); }
  return y;
}

async function gerarProntuarioDetalhado(paciente, sessoes) {
  const d = new jsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(d, 'PRONTUÁRIO CLÍNICO DETALHADO');
  let y = 42;
  const addText = (text, size=10, bold=false, color=[30,30,30]) => {
    d.setFontSize(size); d.setFont('helvetica', bold?'bold':'normal'); d.setTextColor(...color);
    const lines = d.splitTextToSize(String(text||''), 170);
    lines.forEach(l => { if(y>272){d.addPage();y=20;} d.text(l,20,y); y+=size*0.45+2; });
  };
  const sep = () => { d.setDrawColor(220,220,220); d.line(20,y,190,y); y+=5; };

  addText('DADOS DO PACIENTE', 10, true, [120,90,0]);
  sep();
  addText(`Nome: ${paciente.nome}`); addText(`Telefone: ${paciente.telefone||'—'}`);
  addText(`Demanda Inicial: ${paciente.demanda||'—'}`); y+=6;

  addText(`SESSÕES REGISTRADAS (${sessoes.length})`, 10, true, [120,90,0]);
  sep();
  sessoes.forEach((s,i) => {
    if(y>255){d.addPage();y=20;}
    addText(`Sessão ${i+1} — ${s.data||fmtDate(s.createdAt)}`, 10, true, [50,50,50]);
    addText(`Profissional: ${s.alunoNome||'—'}`, 9, false, [120,120,120]); y+=2;
    if(s.relatoDetalhado){ addText('Relato Detalhado:', 9, true); addText(s.relatoDetalhado, 9); y+=2; }
    if(s.demandaDia){ addText('Demanda do Dia:', 9, true); addText(s.demandaDia, 9); y+=2; }
    if(s.ferramentas){ addText('Ferramentas:', 9, true); addText(s.ferramentas, 9); y+=2; }
    if(s.metodologia){ addText('Metodologia:', 9, true); addText(s.metodologia, 9); y+=2; }
    if(s.encaminhamento){ addText('Encaminhamento:', 9, true); addText(s.encaminhamento, 9); y+=2; }
    if(s.feedbackSupervisora){ addText('Feedback Supervisão:', 9, true, [150,100,0]); addText(s.feedbackSupervisora, 9, false, [120,80,0]); }
    sep();
  });
  y+=6; await pdfAssinatura(d, y);
  d.save(`prontuario_${paciente.nome.replace(/\s+/g,'_')}.pdf`);
}

async function gerarResumoSessoes(paciente, sessoes) {
  const d = new jsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(d, 'RESUMO DE SESSÕES');
  let y = 42;
  const addText = (text, size=10, bold=false, color=[30,30,30]) => {
    d.setFontSize(size); d.setFont('helvetica', bold?'bold':'normal'); d.setTextColor(...color);
    const lines = d.splitTextToSize(String(text||''), 170);
    lines.forEach(l => { if(y>272){d.addPage();y=20;} d.text(l,20,y); y+=size*0.45+2; });
  };
  const sep = () => { d.setDrawColor(220,220,220); d.line(20,y,190,y); y+=5; };

  addText('DADOS DO PACIENTE', 10, true, [120,90,0]); sep();
  addText(`Nome: ${paciente.nome}`); addText(`Total de Sessões: ${sessoes.length}`); y+=6;
  addText('RESUMO POR SESSÃO', 10, true, [120,90,0]); sep();

  sessoes.forEach((s,i) => {
    if(y>255){d.addPage();y=20;}
    addText(`Sessão ${i+1} — ${s.data||fmtDate(s.createdAt)}`, 10, true, [50,50,50]);
    if(s.demandaDia) addText(`• Demanda: ${s.demandaDia}`, 9);
    if(s.ferramentas) addText(`• Ferramentas: ${s.ferramentas}`, 9);
    if(s.metodologia) addText(`• Metodologia: ${s.metodologia}`, 9);
    if(s.encaminhamento) addText(`• Encaminhamento: ${s.encaminhamento}`, 9);
    y+=3; sep();
  });
  y+=6; await pdfAssinatura(d, y);
  d.save(`resumo_${paciente.nome.replace(/\s+/g,'_')}.pdf`);
}

async function gerarDeclaracao(paciente, sessao) {
  const d = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 50;
  d.setFontSize(16); d.setFont('helvetica', 'bold'); d.setTextColor(30,30,30);
  d.text('DECLARAÇÃO DE COMPARECIMENTO', 105, y, { align: 'center' }); y+=8;
  d.setFontSize(9); d.setFont('helvetica', 'normal'); d.setTextColor(120,120,120);
  d.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', 105, y, { align: 'center' }); y+=14;
  d.setDrawColor(180,180,180); d.line(30, y, 180, y); y+=14;

  const dataStr = sessao?.data
    ? format(new Date(sessao.data+'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : fmtDate(sessao?.createdAt);

  d.setFontSize(11); d.setFont('helvetica', 'normal'); d.setTextColor(30,30,30);
  const texto1 = `Declaramos, para os devidos fins, que ${paciente.nome} compareceu à sessão de acompanhamento psicológico realizada no dia ${dataStr}, no âmbito do Projeto Restaurando Vidas — programa de apoio psicológico gratuito vinculado à iniciativa Papo com Deus.`;
  d.splitTextToSize(texto1, 150).forEach(l => { d.text(l, 30, y); y+=7; });
  y+=6;
  const texto2 = `O atendimento foi realizado em conformidade com as normas éticas estabelecidas pelo Conselho Regional de Psicologia (CRP), sob responsabilidade técnica da profissional identificada abaixo.`;
  d.splitTextToSize(texto2, 150).forEach(l => { d.text(l, 30, y); y+=7; });
  y+=12;
  d.setFontSize(10); d.setTextColor(100,100,100);
  d.text(`Goiânia, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 30, y); y+=20;
  await pdfAssinatura(d, y, sessao?.validadoPorNome);
  d.save(`declaracao_${paciente.nome.replace(/\s+/g,'_')}.pdf`);
}

// ── Painel de Assinatura ─────────────────────────────────────────────────────
function PainelAssinatura({ onSalvar, onCancelar }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: (touch||e).clientX - rect.left,
      y: (touch||e).clientY - rect.top,
    };
  };

  const startDraw = (e) => { setDrawing(true); const c=canvasRef.current; const ctx=c.getContext('2d'); const p=getPos(e,c); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const draw = (e) => { if(!drawing) return; e.preventDefault(); const c=canvasRef.current; const ctx=c.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#1a1a1a'; const p=getPos(e,c); ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const stopDraw = () => setDrawing(false);
  const limpar = () => { const c=canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); };
  const salvar = () => { const data = canvasRef.current.toDataURL('image/png'); onSalvar(data); };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#111', border:'1px solid var(--gold-border)', borderRadius:16, padding:28, width:420 }}>
        <h3 style={{ color:'var(--gold)', marginBottom:16, fontSize:16 }}>Assinar Prontuário</h3>
        <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:16 }}>Desenhe sua assinatura abaixo:</p>
        <canvas ref={canvasRef} width={380} height={120}
          style={{ background:'#fff', borderRadius:8, display:'block', touchAction:'none', cursor:'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button className="btn btn-gold" onClick={salvar}>✓ Confirmar Assinatura</button>
          <button className="btn btn-outline" onClick={limpar}>Limpar</button>
          <button className="btn btn-outline" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function ProntuariosPage() {
  const { currentUser, userProfile, isGestora, isProfissional } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSel, setPacienteSel] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null);
  const [showAssinatura, setShowAssinatura] = useState(null); // sessaoId
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ data:'', relatoDetalhado:'', demandaDia:'', ferramentas:'', metodologia:'', encaminhamento:'' });

  useEffect(() => {
    let q;
    if (isGestora) {
      q = query(collection(db,'pacientes'), orderBy('createdAt','desc'));
    } else if (isProfissional) {
      q = query(collection(db,'pacientes'), where('profissionalResponsavel','==',currentUser.uid));
    } else {
      q = query(collection(db,'pacientes'), where('alunoResponsavel','==',currentUser.uid));
    }
    return onSnapshot(q, s => setPacientes(s.docs.map(d => ({id:d.id,...d.data()}))));
  }, [isGestora, isProfissional, currentUser.uid]);

  useEffect(() => {
    if (!pacienteSel) return;
    const q = query(collection(db,'prontuarios'), where('pacienteId','==',pacienteSel.id), orderBy('data','desc'));
    return onSnapshot(q, s => setSessoes(s.docs.map(d => ({id:d.id,...d.data()}))));
  }, [pacienteSel]);

  const salvarSessao = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await addDoc(collection(db,'prontuarios'), {
        pacienteId: pacienteSel.id, pacienteNome: pacienteSel.nome,
        alunoId: currentUser.uid, alunoNome: userProfile?.nome || 'Profissional',
        ...form,
        statusValidacao: 'pendente',
        assinaturaAutor: null,
        validadoPor: null, validadoPorNome: null, validadoEm: null,
        feedbackSupervisora: '',
        createdAt: serverTimestamp(),
      });
      setForm({ data:'', relatoDetalhado:'', demandaDia:'', ferramentas:'', metodologia:'', encaminhamento:'' });
      setShowForm(false);
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  const assinarSessao = async (sessaoId, assinaturaData) => {
    setSaving(true);
    try {
      await updateDoc(doc(db,'prontuarios',sessaoId), {
        assinaturaAutor: assinaturaData,
        assinadoEm: serverTimestamp(),
        assinadoPor: userProfile?.nome || 'Profissional',
        statusValidacao: 'assinado',
      });
      setShowAssinatura(null);
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  const validarSessao = async (sessaoId, aprovar) => {
    setSaving(true);
    try {
      await updateDoc(doc(db,'prontuarios',sessaoId), {
        statusValidacao: aprovar ? 'validado' : 'rejeitado',
        validadoPor: currentUser.uid,
        validadoPorNome: userProfile?.nome || 'Gestora',
        validadoEm: serverTimestamp(),
      });
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  const salvarFeedback = async (sessaoId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db,'prontuarios',sessaoId), {
        feedbackSupervisora: feedback, feedbackEm: serverTimestamp(), feedbackPor: userProfile?.nome||'Gestora',
      });
      setShowFeedback(null); setFeedback('');
    } catch(err) { console.error(err); }
    finally { setSaving(false); }
  };

  const L = { fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:'var(--gold)', textTransform:'uppercase', display:'block', marginBottom:6 };

  return (
    <Layout>
      {showAssinatura && (
        <PainelAssinatura
          onSalvar={(data) => assinarSessao(showAssinatura, data)}
          onCancelar={() => setShowAssinatura(null)}
        />
      )}

      <div className="page-header">
        <h1>Prontuários</h1>
        <p>Registro clínico por sessão com supervisão técnica</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' }}>

        {/* Lista pacientes */}
        <div className="card" style={{ padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'var(--gold)', textTransform:'uppercase', marginBottom:12 }}>
            Pacientes
          </div>
          {pacientes.length === 0 ? (
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>Nenhum paciente atribuído.</p>
          ) : pacientes.map(p => (
            <div key={p.id} onClick={() => { setPacienteSel(p); setShowForm(false); }}
              style={{ padding:'10px 12px', borderRadius:8, cursor:'pointer', marginBottom:4,
                background: pacienteSel?.id===p.id ? 'var(--gold-muted)' : 'transparent',
                border:`1px solid ${pacienteSel?.id===p.id ? 'var(--gold-border)' : 'transparent'}` }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{p.nome}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{p.telefone}</div>
            </div>
          ))}
        </div>

        {/* Prontuário */}
        <div>
          {!pacienteSel ? (
            <div className="card" style={{ textAlign:'center', padding:60 }}>
              <div style={{ fontSize:40, color:'var(--gold)', marginBottom:12 }}>◈</div>
              <p style={{ color:'var(--text-muted)' }}>Selecione um paciente para ver o prontuário</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2 style={{ fontSize:20, marginBottom:2 }}>{pacienteSel.nome}</h2>
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{sessoes.length} sessão(ões)</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {sessoes.length > 0 && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => gerarProntuarioDetalhado(pacienteSel, sessoes)}>📄 Prontuário PDF</button>
                      <button className="btn btn-outline btn-sm" onClick={() => gerarResumoSessoes(pacienteSel, sessoes)}>📋 Resumo PDF</button>
                    </>
                  )}
                  {!isGestora && (
                    <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
                      {showForm ? '✕ Cancelar' : '+ Nova Sessão'}
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário */}
              {showForm && (
                <div className="card" style={{ marginBottom:20 }}>
                  <h3 style={{ fontSize:15, marginBottom:20 }}>Registrar Nova Sessão</h3>
                  <form onSubmit={salvarSessao}>
                    <div className="form-group">
                      <label style={L}>Data da Sessão *</label>
                      <input className="form-control" type="date" value={form.data}
                        onChange={e => setForm(p=>({...p,data:e.target.value}))} required />
                    </div>
                    <div className="form-group">
                      <label style={L}>Relato Detalhado *</label>
                      <textarea className="form-control" rows={5} value={form.relatoDetalhado}
                        onChange={e => setForm(p=>({...p,relatoDetalhado:e.target.value}))}
                        placeholder="Descreva detalhadamente o que ocorreu na sessão..." required />
                    </div>
                    <div style={{ borderTop:'1px solid var(--border)', margin:'20px 0', paddingTop:20 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'0.1em', marginBottom:16 }}>CONTROLE DA SESSÃO</div>
                      <div className="form-group">
                        <label style={L}>Demanda do Dia</label>
                        <textarea className="form-control" rows={2} value={form.demandaDia}
                          onChange={e => setForm(p=>({...p,demandaDia:e.target.value}))}
                          placeholder="Demanda principal trazida pelo paciente..." />
                      </div>
                      <div className="form-group">
                        <label style={L}>Ferramentas Utilizadas</label>
                        <textarea className="form-control" rows={2} value={form.ferramentas}
                          onChange={e => setForm(p=>({...p,ferramentas:e.target.value}))}
                          placeholder="Ex: Reestruturação cognitiva, Escuta ativa..." />
                      </div>
                      <div className="form-group">
                        <label style={L}>Metodologia Aplicada</label>
                        <textarea className="form-control" rows={2} value={form.metodologia}
                          onChange={e => setForm(p=>({...p,metodologia:e.target.value}))}
                          placeholder="Ex: TCC, Psicodinâmica, Humanista..." />
                      </div>
                      <div className="form-group">
                        <label style={L}>Encaminhamento</label>
                        <textarea className="form-control" rows={2} value={form.encaminhamento}
                          onChange={e => setForm(p=>({...p,encaminhamento:e.target.value}))}
                          placeholder="Próximos passos, tarefas, encaminhamentos..." />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-gold" disabled={saving}>
                      {saving ? 'Salvando...' : '✓ Salvar Sessão'}
                    </button>
                  </form>
                </div>
              )}

              {/* Sessões */}
              {sessoes.length === 0 ? (
                <div className="card" style={{ textAlign:'center', padding:40 }}>
                  <p style={{ color:'var(--text-muted)' }}>Nenhuma sessão registrada ainda.</p>
                </div>
              ) : sessoes.map(s => (
                <div key={s.id} className="card" style={{ marginBottom:16 }}>

                  {/* Header sessão */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ fontWeight:700, color:'var(--gold)', fontSize:15 }}>
                        Sessão — {s.data||fmtDate(s.createdAt)}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Por: {s.alunoNome}</div>
                      <div style={{ marginTop:6 }}><StatusBadge status={s.statusValidacao||'pendente'} /></div>
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {/* Botão assinar — autor que ainda não assinou */}
                      {!isGestora && !s.assinaturaAutor && (
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAssinatura(s.id)}>
                          ✍ Assinar
                        </button>
                      )}
                      {/* Validar/rejeitar — só gestora, sessão assinada */}
                      {isGestora && s.statusValidacao === 'assinado' && (
                        <>
                          <button className="btn btn-gold btn-sm" disabled={saving} onClick={() => validarSessao(s.id, true)}>
                            ✓ Validar
                          </button>
                          <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => validarSessao(s.id, false)}>
                            ✗ Pedir Revisão
                          </button>
                        </>
                      )}
                      {/* PDF declaração — só validado */}
                      {s.statusValidacao === 'validado' && (
                        <button className="btn btn-outline btn-sm" onClick={() => gerarDeclaracao(pacienteSel, s)}>
                          📃 Declaração
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assinatura do autor */}
                  {s.assinaturaAutor && (
                    <div style={{ marginBottom:12, padding:'8px 12px', background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:8, fontSize:12, color:'#4ade80' }}>
                      ✍ Assinado por {s.assinadoPor} em {fmtDate(s.assinadoEm)}
                    </div>
                  )}

                  {/* Conteúdo */}
                  {s.relatoDetalhado && (
                    <div style={{ marginBottom:14 }}>
                      <div style={L}>Relato Detalhado</div>
                      <div style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7 }}>{s.relatoDetalhado}</div>
                    </div>
                  )}

                  {(s.demandaDia||s.ferramentas||s.metodologia||s.encaminhamento) && (
                    <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px', marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'0.1em', marginBottom:12 }}>CONTROLE DA SESSÃO</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        {s.demandaDia && <div><div style={L}>Demanda do Dia</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.demandaDia}</div></div>}
                        {s.ferramentas && <div><div style={L}>Ferramentas</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.ferramentas}</div></div>}
                        {s.metodologia && <div><div style={L}>Metodologia</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.metodologia}</div></div>}
                        {s.encaminhamento && <div><div style={L}>Encaminhamento</div><div style={{ fontSize:13, color:'var(--text-secondary)' }}>{s.encaminhamento}</div></div>}
                      </div>
                    </div>
                  )}

                  {/* Feedback gestora */}
                  {s.feedbackSupervisora ? (
                    <div style={{ marginTop:12, padding:'12px 16px', background:'var(--gold-muted)', border:'1px solid var(--gold-border)', borderRadius:8 }}>
                      <div style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>✦ Feedback da Supervisora</div>
                      <div style={{ fontSize:14, color:'var(--text-primary)' }}>{s.feedbackSupervisora}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.feedbackPor} · {fmtDate(s.feedbackEm)}</div>
                      {isGestora && (
                        <button className="btn btn-outline btn-sm" style={{ marginTop:8 }}
                          onClick={() => { setShowFeedback(s.id); setFeedback(s.feedbackSupervisora); }}>
                          ✎ Editar
                        </button>
                      )}
                    </div>
                  ) : isGestora && (
                    <button className="btn btn-outline btn-sm" style={{ marginTop:8 }}
                      onClick={() => { setShowFeedback(s.id); setFeedback(''); }}>
                      ✦ Adicionar Feedback
                    </button>
                  )}

                  {showFeedback === s.id && (
                    <div style={{ marginTop:12 }}>
                      <textarea className="form-control" rows={3} value={feedback}
                        onChange={e => setFeedback(e.target.value)} placeholder="Feedback técnico..." />
                      <div style={{ display:'flex', gap:8, marginTop:8 }}>
                        <button className="btn btn-gold btn-sm" onClick={() => salvarFeedback(s.id)} disabled={saving}>
                          {saving ? 'Salvando...' : '✓ Salvar'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowFeedback(null)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
