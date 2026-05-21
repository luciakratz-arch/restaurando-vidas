// src/pages/ProntuariosPage.js
import React, { useState, useEffect } from 'react';
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

function fmtDateLong(ts) {
  if (!ts) return '—';
  if (ts.toDate) return format(ts.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  return ts;
}

// ── PDF 1: Prontuário Detalhado ─────────────────────────────────────────────
async function gerarProntuarioDetalhado(paciente, sessoes) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 20;
  let y = 20;

  const addLine = (text, size = 10, bold = false, color = [0,0,0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - margin * 2);
    lines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += size * 0.5 + 2;
    });
  };

  const addSpace = (n = 6) => { y += n; };
  const addDivider = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, W - margin, y);
    y += 6;
  };

  // Cabeçalho
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, W, 35, 'F');
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text('PRONTUÁRIO CLÍNICO DETALHADO', margin, 15);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', margin, 22);
  doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 28);
  y = 45;

  // Dados do paciente
  addLine('DADOS DO PACIENTE', 11, true, [80, 60, 0]);
  addDivider();
  addLine(`Nome: ${paciente.nome}`, 10);
  addLine(`Telefone: ${paciente.telefone || '—'}`, 10);
  addLine(`Demanda: ${paciente.demanda || '—'}`, 10);
  addLine(`Status: ${paciente.status || '—'}`, 10);
  addSpace(8);

  // Sessões
  addLine(`REGISTRO DE SESSÕES (${sessoes.length} no total)`, 11, true, [80, 60, 0]);
  addDivider();

  sessoes.forEach((s, i) => {
    if (y > 250) { doc.addPage(); y = 20; }
    addLine(`Sessão ${i + 1} — ${s.data || fmtDate(s.createdAt)}`, 11, true, [40, 40, 40]);
    addLine(`Profissional: ${s.alunoNome || '—'}`, 9, false, [100, 100, 100]);
    addSpace(3);
    if (s.relatoDetalhado) { addLine('Relato Detalhado:', 10, true); addLine(s.relatoDetalhado, 10); addSpace(3); }
    if (s.demandaDia) { addLine('Demanda do Dia:', 10, true); addLine(s.demandaDia, 10); addSpace(3); }
    if (s.ferramentas) { addLine('Ferramentas Utilizadas:', 10, true); addLine(s.ferramentas, 10); addSpace(3); }
    if (s.metodologia) { addLine('Metodologia Aplicada:', 10, true); addLine(s.metodologia, 10); addSpace(3); }
    if (s.encaminhamento) { addLine('Encaminhamento:', 10, true); addLine(s.encaminhamento, 10); addSpace(3); }
    if (s.feedbackSupervisora) {
      addLine('Feedback de Supervisão:', 10, true, [150, 100, 0]);
      addLine(s.feedbackSupervisora, 10, false, [100, 70, 0]);
      addSpace(3);
    }
    addDivider();
  });

  // Assinatura
  addSpace(8);
  try {
    const img = new Image(); img.src = RESPONSAVEL.assinatura;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    doc.addImage(img, 'PNG', margin, y, 50, 20);
    y += 24;
  } catch(e) {}
  doc.setDrawColor(0); doc.line(margin, y, margin + 60, y); y += 5;
  addLine(RESPONSAVEL.nome, 10, true);
  addLine(`${RESPONSAVEL.funcao} · ${RESPONSAVEL.crp}`, 9);
  addLine(RESPONSAVEL.cargo, 9);

  doc.save(`prontuario_detalhado_${paciente.nome.replace(/\s+/g, '_')}.pdf`);
}

// ── PDF 2: Resumo de Sessões ────────────────────────────────────────────────
async function gerarResumoSessoes(paciente, sessoes) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 20;
  let y = 20;

  const addLine = (text, size = 10, bold = false, color = [0,0,0]) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - margin * 2);
    lines.forEach(line => { if (y > 270) { doc.addPage(); y = 20; } doc.text(line, margin, y); y += size * 0.5 + 2; });
  };
  const addSpace = (n = 6) => { y += n; };
  const addDivider = () => { doc.setDrawColor(200,200,200); doc.line(margin, y, W-margin, y); y += 5; };

  // Cabeçalho
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, W, 35, 'F');
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
  doc.text('RESUMO DE SESSÕES', margin, 15);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100,100,100);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', margin, 22);
  doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, 28);
  y = 45;

  addLine('DADOS DO PACIENTE', 11, true, [80,60,0]);
  addDivider();
  addLine(`Nome: ${paciente.nome}`, 10);
  addLine(`Telefone: ${paciente.telefone || '—'}`, 10);
  addLine(`Total de Sessões: ${sessoes.length}`, 10);
  addSpace(8);

  addLine('RESUMO POR SESSÃO', 11, true, [80,60,0]);
  addDivider();

  sessoes.forEach((s, i) => {
    if (y > 255) { doc.addPage(); y = 20; }
    addLine(`Sessão ${i + 1} — ${s.data || fmtDate(s.createdAt)}`, 11, true, [40,40,40]);
    if (s.demandaDia) { addLine(`• Demanda do Dia: ${s.demandaDia}`, 10); }
    if (s.ferramentas) { addLine(`• Ferramentas: ${s.ferramentas}`, 10); }
    if (s.metodologia) { addLine(`• Metodologia: ${s.metodologia}`, 10); }
    if (s.encaminhamento) { addLine(`• Encaminhamento: ${s.encaminhamento}`, 10); }
    addSpace(4); addDivider();
  });

  addSpace(8);
  try {
    const img = new Image(); img.src = RESPONSAVEL.assinatura;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    doc.addImage(img, 'PNG', margin, y, 50, 20); y += 24;
  } catch(e) {}
  doc.setDrawColor(0); doc.line(margin, y, margin + 60, y); y += 5;
  addLine(RESPONSAVEL.nome, 10, true);
  addLine(`${RESPONSAVEL.funcao} · ${RESPONSAVEL.crp}`, 9);
  addLine(RESPONSAVEL.cargo, 9);

  doc.save(`resumo_sessoes_${paciente.nome.replace(/\s+/g, '_')}.pdf`);
}

// ── PDF 3: Declaração de Comparecimento ─────────────────────────────────────
async function gerarDeclaracao(paciente, sessao) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 30;
  let y = 40;

  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
  doc.text('DECLARAÇÃO DE COMPARECIMENTO', W/2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100,100,100);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', W/2, y, { align: 'center' });
  y += 20;

  doc.setDrawColor(180,180,180); doc.line(margin, y, W-margin, y); y += 15;

  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(30,30,30);
  const dataFormatada = sessao?.data
    ? format(new Date(sessao.data + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : fmtDateLong(sessao?.createdAt);

  const texto = `Declaramos, para os devidos fins, que ${paciente.nome} compareceu à sessão de acompanhamento psicológico realizada no dia ${dataFormatada}, no âmbito do Projeto Restaurando Vidas — programa de apoio psicológico gratuito vinculado à iniciativa Papo com Deus.`;

  const lines = doc.splitTextToSize(texto, W - margin * 2);
  lines.forEach(line => { doc.text(line, margin, y); y += 7; });

  y += 10;
  const texto2 = `O atendimento foi realizado em conformidade com as normas éticas estabelecidas pelo Conselho Regional de Psicologia, sob a responsabilidade técnica da profissional identificada abaixo.`;
  const lines2 = doc.splitTextToSize(texto2, W - margin * 2);
  lines2.forEach(line => { doc.text(line, margin, y); y += 7; });

  y += 15;
  doc.setFontSize(10); doc.setTextColor(100,100,100);
  doc.text(`Goiânia, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
  y += 25;

  try {
    const img = new Image(); img.src = RESPONSAVEL.assinatura;
    await new Promise(r => { img.onload = r; img.onerror = r; });
    doc.addImage(img, 'PNG', margin, y, 50, 20); y += 24;
  } catch(e) { y += 24; }

  doc.setDrawColor(0); doc.line(margin, y, margin + 70, y); y += 6;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,30,30);
  doc.text(RESPONSAVEL.nome, margin, y); y += 6;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(60,60,60);
  doc.text(`${RESPONSAVEL.funcao} · ${RESPONSAVEL.crp}`, margin, y); y += 5;
  doc.text(RESPONSAVEL.cargo, margin, y);

  doc.save(`declaracao_comparecimento_${paciente.nome.replace(/\s+/g, '_')}.pdf`);
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function ProntuariosPage() {
  const { currentUser, userProfile, isGestora, isProfissional } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSel, setPacienteSel] = useState(null);
  const [sessoes, setSessoes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    data: '', relatoDetalhado: '', demandaDia: '', ferramentas: '', metodologia: '', encaminhamento: '',
  });

  useEffect(() => {
    let q;
    if (isGestora) {
      q = query(collection(db, 'pacientes'), orderBy('createdAt', 'desc'));
    } else if (isProfissional) {
      q = query(collection(db, 'pacientes'), where('profissionalResponsavel', '==', currentUser.uid));
    } else {
      q = query(collection(db, 'pacientes'), where('alunoResponsavel', '==', currentUser.uid));
    }
    return onSnapshot(q, (s) => setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isGestora, isProfissional, currentUser.uid]);

  useEffect(() => {
    if (!pacienteSel) return;
    const q = query(collection(db, 'prontuarios'), where('pacienteId', '==', pacienteSel.id), orderBy('data', 'desc'));
    return onSnapshot(q, (s) => setSessoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [pacienteSel]);

  const salvarSessao = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await addDoc(collection(db, 'prontuarios'), {
        pacienteId: pacienteSel.id, pacienteNome: pacienteSel.nome,
        alunoId: currentUser.uid, alunoNome: userProfile?.nome || 'Estagiário',
        ...form, feedbackSupervisora: '', createdAt: serverTimestamp(),
      });
      setForm({ data: '', relatoDetalhado: '', demandaDia: '', ferramentas: '', metodologia: '', encaminhamento: '' });
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const salvarFeedback = async (sessaoId) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'prontuarios', sessaoId), {
        feedbackSupervisora: feedback, feedbackEm: serverTimestamp(), feedbackPor: userProfile?.nome || 'Supervisora',
      });
      setShowFeedback(null); setFeedback('');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 6 };

  return (
    <Layout>
      <div className="page-header">
        <h1>Prontuários</h1>
        <p>Registro clínico por sessão com supervisão técnica</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Lista de pacientes */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>
            Pacientes
          </div>
          {pacientes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum paciente atribuído.</p>
          ) : pacientes.map(p => (
            <div key={p.id} onClick={() => { setPacienteSel(p); setShowForm(false); }}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: pacienteSel?.id === p.id ? 'var(--gold-muted)' : 'transparent',
                border: `1px solid ${pacienteSel?.id === p.id ? 'var(--gold-border)' : 'transparent'}`,
              }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.telefone}</div>
            </div>
          ))}
        </div>

        {/* Prontuário */}
        <div>
          {!pacienteSel ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 12 }}>◈</div>
              <p style={{ color: 'var(--text-muted)' }}>Selecione um paciente para ver o prontuário</p>
            </div>
          ) : (
            <>
              {/* Header do paciente */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, marginBottom: 2 }}>{pacienteSel.nome}</h2>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sessoes.length} sessão(ões) registrada(s)</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sessoes.length > 0 && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => gerarProntuarioDetalhado(pacienteSel, sessoes)}>
                        📄 Prontuário PDF
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => gerarResumoSessoes(pacienteSel, sessoes)}>
                        📋 Resumo PDF
                      </button>
                    </>
                  )}
                  {!isGestora && !isProfissional && (
                    <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
                      {showForm ? '✕ Cancelar' : '+ Nova Sessão'}
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário nova sessão */}
              {showForm && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 15, marginBottom: 20 }}>Registrar Nova Sessão</h3>
                  <form onSubmit={salvarSessao}>
                    <div className="form-group">
                      <label style={labelStyle}>Data da Sessão *</label>
                      <input className="form-control" type="date" value={form.data}
                        onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required />
                    </div>

                    <div className="form-group">
                      <label style={labelStyle}>Relato Detalhado *</label>
                      <textarea className="form-control" rows={5} value={form.relatoDetalhado}
                        onChange={e => setForm(p => ({ ...p, relatoDetalhado: e.target.value }))}
                        placeholder="Descreva detalhadamente o que ocorreu na sessão, comportamento do paciente, conteúdo abordado..." required />
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0', paddingTop: 20 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 16 }}>
                        CONTROLE DA SESSÃO
                      </div>

                      <div className="form-group">
                        <label style={labelStyle}>Demanda do Dia</label>
                        <textarea className="form-control" rows={2} value={form.demandaDia}
                          onChange={e => setForm(p => ({ ...p, demandaDia: e.target.value }))}
                          placeholder="Qual foi a demanda principal trazida pelo paciente nesta sessão..." />
                      </div>

                      <div className="form-group">
                        <label style={labelStyle}>Ferramentas Utilizadas</label>
                        <textarea className="form-control" rows={2} value={form.ferramentas}
                          onChange={e => setForm(p => ({ ...p, ferramentas: e.target.value }))}
                          placeholder="Ex: Reestruturação cognitiva, Respiração diafragmática, Escuta ativa..." />
                      </div>

                      <div className="form-group">
                        <label style={labelStyle}>Metodologia Aplicada</label>
                        <textarea className="form-control" rows={2} value={form.metodologia}
                          onChange={e => setForm(p => ({ ...p, metodologia: e.target.value }))}
                          placeholder="Ex: TCC, Psicodinâmica, Humanista, Mindfulness..." />
                      </div>

                      <div className="form-group">
                        <label style={labelStyle}>Encaminhamento</label>
                        <textarea className="form-control" rows={2} value={form.encaminhamento}
                          onChange={e => setForm(p => ({ ...p, encaminhamento: e.target.value }))}
                          placeholder="Próximos passos, encaminhamentos para outros profissionais, tarefas para o paciente..." />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-gold" disabled={saving}>
                      {saving ? 'Salvando...' : '✓ Salvar Sessão'}
                    </button>
                  </form>
                </div>
              )}

              {/* Lista de sessões */}
              {sessoes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: 'var(--text-muted)' }}>Nenhuma sessão registrada ainda.</p>
                </div>
              ) : sessoes.map((s) => (
                <div key={s.id} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                        Sessão — {s.data || fmtDate(s.createdAt)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Registrado por: {s.alunoNome}</div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => gerarDeclaracao(pacienteSel, s)}>
                      📃 Declaração
                    </button>
                  </div>

                  {s.relatoDetalhado && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={labelStyle}>Relato Detalhado</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.relatoDetalhado}</div>
                    </div>
                  )}

                  {(s.demandaDia || s.ferramentas || s.metodologia || s.encaminhamento) && (
                    <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', marginBottom: 12 }}>
                        CONTROLE DA SESSÃO
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {s.demandaDia && (
                          <div>
                            <div style={labelStyle}>Demanda do Dia</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.demandaDia}</div>
                          </div>
                        )}
                        {s.ferramentas && (
                          <div>
                            <div style={labelStyle}>Ferramentas</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.ferramentas}</div>
                          </div>
                        )}
                        {s.metodologia && (
                          <div>
                            <div style={labelStyle}>Metodologia</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.metodologia}</div>
                          </div>
                        )}
                        {s.encaminhamento && (
                          <div>
                            <div style={labelStyle}>Encaminhamento</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.encaminhamento}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback supervisora */}
                  {s.feedbackSupervisora ? (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--gold-muted)', border: '1px solid var(--gold-border)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        ✦ Feedback da Supervisora Técnica
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.feedbackSupervisora}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        {s.feedbackPor} · {fmtDate(s.feedbackEm)}
                      </div>
                      {isGestora && (
                        <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}
                          onClick={() => { setShowFeedback(s.id); setFeedback(s.feedbackSupervisora); }}>
                          ✎ Editar Feedback
                        </button>
                      )}
                    </div>
                  ) : isGestora && (
                    <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}
                      onClick={() => { setShowFeedback(s.id); setFeedback(''); }}>
                      ✦ Adicionar Feedback de Supervisão
                    </button>
                  )}

                  {showFeedback === s.id && (
                    <div style={{ marginTop: 12 }}>
                      <textarea className="form-control" rows={3} value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Feedback técnico de supervisão..." />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
