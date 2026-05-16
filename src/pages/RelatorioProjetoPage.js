// src/pages/RelatorioProjetoPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { collection, query, getDocs, where, orderBy, addDoc, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PERIODOS = [
  { key: 'mensal', label: 'Mensal' },
  { key: 'trimestral', label: 'Trimestral' },
  { key: 'semestral', label: 'Semestral' },
  { key: 'anual', label: 'Anual' },
];

export default function RelatorioProjetoPage() {
  const { isGestora, isPastor } = useAuth();
  const [relatorios, setRelatorios] = useState([]);
  const [periodo, setPeriodo] = useState('mensal');
  const [gerando, setGerando] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'relatorios_projeto'), orderBy('createdAt', 'desc')),
      (s) => setRelatorios(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const getPeriodoRange = (tipo) => {
    const now = new Date();
    switch (tipo) {
      case 'mensal': return { inicio: startOfMonth(subMonths(now, 1)), fim: endOfMonth(subMonths(now, 1)), label: format(subMonths(now, 1), 'MMMM/yyyy', { locale: ptBR }) };
      case 'trimestral': return { inicio: startOfQuarter(subQuarters(now, 1)), fim: endOfQuarter(subQuarters(now, 1)), label: `${format(startOfQuarter(subQuarters(now, 1)), 'MMM', { locale: ptBR })} - ${format(endOfQuarter(subQuarters(now, 1)), 'MMM/yyyy', { locale: ptBR })}` };
      case 'semestral': return { inicio: new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1), fim: new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 31), label: now.getMonth() < 6 ? `1º Semestre ${now.getFullYear()}` : `2º Semestre ${now.getFullYear()}` };
      case 'anual': return { inicio: startOfYear(subYears(now, 1)), fim: endOfYear(subYears(now, 1)), label: `${now.getFullYear() - 1}` };
      default: return { inicio: startOfMonth(now), fim: endOfMonth(now), label: '' };
    }
  };

  const gerarRelatorio = async () => {
    setGerando(true);
    try {
      const range = getPeriodoRange(periodo);
      const [pacSnap, sessSnap, interSnap] = await Promise.all([
        getDocs(query(collection(db, 'pacientes'))),
        getDocs(query(collection(db, 'prontuarios'))),
        getDocs(query(collection(db, 'interconsultas'))),
      ]);

      const pacientes = pacSnap.docs.map(d => d.data());
      const sessoes = sessSnap.docs.map(d => d.data());
      const interconsultas = interSnap.docs.map(d => d.data());

      const dados = {
        periodo: periodo,
        periodoLabel: range.label,
        totalPacientes: pacientes.length,
        pacientesAtivos: pacientes.filter(p => p.status === 'ativo').length,
        pacientesAlta: pacientes.filter(p => p.status === 'alta').length,
        totalSessoes: sessoes.length,
        totalInterconsultas: interconsultas.length,
        interconsultasAprovadas: interconsultas.filter(i => i.status === 'aprovada').length,
        geradoEm: new Date().toISOString(),
        status: 'rascunho',
        observacoes: '',
      };

      setPreview(dados);
    } catch (err) { console.error(err); }
    finally { setGerando(false); }
  };

  const salvarRelatorio = async () => {
    if (!preview) return;
    setGerando(true);
    try {
      await addDoc(collection(db, 'relatorios_projeto'), {
        ...preview,
        createdAt: serverTimestamp(),
        status: 'salvo',
      });
      setPreview(null);
    } catch (err) { console.error(err); }
    finally { setGerando(false); }
  };

  const gerarPDF = (rel) => {
    const doc2 = new jsPDF();
    const GOLD = [212, 175, 55];
    const DARK = [10, 10, 10];
    const W = doc2.internal.pageSize.getWidth();

    doc2.setFillColor(...DARK);
    doc2.rect(0, 0, W, 297, 'F');

    doc2.setFillColor(30, 30, 30);
    doc2.rect(0, 0, W, 45, 'F');
    doc2.setTextColor(...GOLD);
    doc2.setFont('helvetica', 'bold');
    doc2.setFontSize(20);
    doc2.text('RESTAURANDO VIDAS', 15, 20);
    doc2.setFontSize(10);
    doc2.setFont('helvetica', 'normal');
    doc2.setTextColor(200, 200, 200);
    doc2.text(`Relatório ${rel.periodo?.charAt(0).toUpperCase() + rel.periodo?.slice(1)} — ${rel.periodoLabel}`, 15, 30);
    doc2.text(`Gerado em: ${format(new Date(rel.geradoEm), 'dd/MM/yyyy HH:mm')}`, 15, 38);

    let y = 60;
    const section = (title) => {
      doc2.setFillColor(40, 35, 10);
      doc2.rect(15, y - 5, W - 30, 12, 'F');
      doc2.setTextColor(...GOLD);
      doc2.setFont('helvetica', 'bold');
      doc2.setFontSize(11);
      doc2.text(title, 20, y + 3);
      y += 18;
    };
    const row = (label, value) => {
      doc2.setTextColor(180, 180, 180);
      doc2.setFont('helvetica', 'normal');
      doc2.setFontSize(10);
      doc2.text(label, 20, y);
      doc2.setTextColor(...GOLD);
      doc2.setFont('helvetica', 'bold');
      doc2.text(String(value), W - 20, y, { align: 'right' });
      y += 10;
    };

    section('PACIENTES');
    row('Total de Pacientes', rel.totalPacientes);
    row('Pacientes Ativos', rel.pacientesAtivos);
    row('Pacientes com Alta', rel.pacientesAlta);
    y += 8;
    section('ATENDIMENTOS');
    row('Total de Sessões Registradas', rel.totalSessoes);
    row('Interconsultas Realizadas', rel.totalInterconsultas);
    row('Interconsultas Aprovadas', rel.interconsultasAprovadas);

    if (rel.observacoes) {
      y += 8;
      section('OBSERVAÇÕES DA GESTORA');
      doc2.setTextColor(200, 200, 200);
      doc2.setFont('helvetica', 'normal');
      doc2.setFontSize(10);
      const lines = doc2.splitTextToSize(rel.observacoes, W - 40);
      doc2.text(lines, 20, y);
    }

    doc2.setFillColor(30, 30, 30);
    doc2.rect(0, 277, W, 20, 'F');
    doc2.setTextColor(100, 100, 100);
    doc2.setFontSize(8);
    doc2.setFont('helvetica', 'normal');
    doc2.text('Restaurando Vidas · Cuidado da Alma · Documento Confidencial', W / 2, 287, { align: 'center' });

    doc2.save(`relatorio_${rel.periodo}_${rel.periodoLabel?.replace(/\//g, '-')}.pdf`);
  };

  const aprovar = async (id) => {
    await updateDoc(doc(db, 'relatorios_projeto', id), { status: 'aprovado', aprovadoEm: serverTimestamp() });
  };

  const fmtDate = (ts) => ts?.toDate ? format(ts.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '—';

  const statusBadge = { rascunho: 'badge-gold', salvo: 'badge-warning', aprovado: 'badge-success' };
  const statusLabel = { rascunho: 'Rascunho', salvo: 'Aguardando Aprovação', aprovado: 'Aprovado' };

  return (
    <Layout>
      <div className="page-header">
        <h1>Relatórios do Projeto</h1>
        <p>Geração automática por período com exportação em PDF</p>
      </div>

      {/* Gerador */}
      {isGestora && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Gerar Novo Relatório</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {PERIODOS.map(p => (
              <button key={p.key}
                className={`btn ${periodo === p.key ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setPeriodo(p.key)}>
                {p.label}
              </button>
            ))}
            <button className="btn btn-gold" onClick={gerarRelatorio} disabled={gerando} style={{ marginLeft: 'auto' }}>
              {gerando ? 'Gerando...' : '⟳ Gerar Relatório'}
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card" style={{ marginBottom: 32, border: '1px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15 }}>Preview — {preview.periodoLabel}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => gerarPDF(preview)}>↓ PDF</button>
              <button className="btn btn-gold btn-sm" onClick={salvarRelatorio} disabled={gerando}>✓ Salvar</button>
              <button className="btn btn-outline btn-sm" onClick={() => setPreview(null)}>✕</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Pacientes', value: preview.totalPacientes },
              { label: 'Pacientes Ativos', value: preview.pacientesAtivos },
              { label: 'Com Alta', value: preview.pacientesAlta },
              { label: 'Sessões Registradas', value: preview.totalSessoes },
              { label: 'Interconsultas', value: preview.totalInterconsultas },
              { label: 'Interconsultas Aprovadas', value: preview.interconsultasAprovadas },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 32, color: 'var(--gold)', fontFamily: 'Cinzel', fontWeight: 700 }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label">Observações da Gestora</label>
            <textarea className="form-control" rows={3} value={preview.observacoes}
              onChange={(e) => setPreview(p => ({ ...p, observacoes: e.target.value }))}
              placeholder="Adicione observações para o relatório..." />
          </div>
        </div>
      )}

      {/* Relatórios salvos */}
      <h3 style={{ fontSize: 15, marginBottom: 16 }}>Relatórios Gerados</h3>
      {relatorios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum relatório gerado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {relatorios.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Relatório {r.periodo?.charAt(0).toUpperCase() + r.periodo?.slice(1)} — {r.periodoLabel}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {r.totalPacientes} pacientes · {r.totalSessoes} sessões · {r.totalInterconsultas} interconsultas
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{fmtDate(r.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${statusBadge[r.status] || 'badge-gold'}`}>{statusLabel[r.status] || r.status}</span>
                {isGestora && r.status === 'salvo' && (
                  <button className="btn btn-gold btn-sm" onClick={() => aprovar(r.id)}>✓ Aprovar</button>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => gerarPDF(r)}>↓ PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
