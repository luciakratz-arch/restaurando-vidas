// src/utils/gerarPDF.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GOLD = [180, 130, 20];
const DARK = [30, 30, 30];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [240, 240, 240];

// Tenta carregar imagem como base64
async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function gerarRelatorioRV(relatorio) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ─── Fundo branco ─────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // ─── Cabeçalho colorido ────────────────────────────────
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, W, 42, 'F');

  // Linha dourada
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(0, 42, W, 42);

  // Tentar carregar logo
  const logoUrl = window.location.origin + '/restaurando-vidas/logo.png';
  const logoData = await loadImageAsBase64(logoUrl);
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 12, 6, 28, 28); } catch (e) {}
  }

  // Título no cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...GOLD);
  doc.text('RESTAURANDO VIDAS', logoData ? 46 : 15, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Cuidado da Alma · Apoio Psicológico Gratuito', logoData ? 46 : 15, 26);

  // Tipo e data no lado direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('RELATÓRIO CLÍNICO', W - 15, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em ${now}`, W - 15, 24, { align: 'right' });
  doc.text(`Doc nº ${relatorio.id?.slice(-8).toUpperCase() || '--------'}`, W - 15, 31, { align: 'right' });

  // ─── Status ──────────────────────────────────────────
  const statusColors = {
    aprovado: [34, 139, 34],
    pendente_revisao: [200, 120, 0],
    rascunho: [120, 120, 120],
  };
  const sc = statusColors[relatorio.status] || GOLD;
  doc.setFillColor(...sc);
  doc.roundedRect(15, 48, 55, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  const statusTexts = {
    aprovado: 'APROVADO PELA GESTORA',
    pendente_revisao: 'AGUARDANDO REVISÃO',
    rascunho: 'RASCUNHO',
  };
  doc.text(statusTexts[relatorio.status] || 'RELATÓRIO', 42.5, 53.5, { align: 'center' });

  // ─── Conteúdo (texto escuro em fundo branco) ──────────
  let y = 66;

  const sectionTitle = (title, yPos) => {
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(15, yPos - 4, W - 30, 10, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(2);
    doc.line(15, yPos - 4, 15, yPos + 6);
    doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    doc.text(title, 21, yPos + 2.5);
    return yPos + 14;
  };

  const fieldRow = (label, value, yPos) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(String(value || '—'), 70, yPos);
    return yPos + 7;
  };

  const textBlock = (label, value, yPos) => {
    if (!value) return yPos;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(value, W - 30);
    doc.text(lines, 15, yPos);
    return yPos + lines.length * 5 + 4;
  };

  y = sectionTitle('IDENTIFICAÇÃO DO PACIENTE', y);
  y = fieldRow('Paciente:', relatorio.pacienteNome, y);
  y = fieldRow('Telefone:', relatorio.pacienteTelefone, y);
  y = fieldRow('Estagiário:', relatorio.alunoNome, y);
  if (relatorio.profissionalNome) y = fieldRow('Prof. de Saúde:', relatorio.profissionalNome, y);
  y = fieldRow('Período:', relatorio.periodo, y);
  y += 4;

  y = sectionTitle('EVOLUÇÃO CLÍNICA', y);
  y = textBlock('', relatorio.evolucao || '—', y);
  y += 2;

  y = sectionTitle('INTERVENÇÕES REALIZADAS', y);
  y = textBlock('', relatorio.intervencoes || '—', y);
  y += 2;

  // Observações da Gestora — box dourado
  if (relatorio.observacoesGestora) {
    doc.setFillColor(255, 248, 220);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    const obsLines = doc.splitTextToSize(relatorio.observacoesGestora, W - 46);
    const boxH = obsLines.length * 5 + 16;
    doc.roundedRect(15, y, W - 30, boxH, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text('OBSERVAÇÕES DA SUPERVISORA TÉCNICA', 22, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(obsLines, 22, y + 13);
    y += boxH + 8;
  }

  // ─── Assinaturas ──────────────────────────────────────
  y = Math.max(y + 10, H - 65);

  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(15, y - 2, W - 15, y - 2);

  // Assinatura 1 — Estagiário
  const col1x = 15;
  const col2x = W / 2 + 5;
  const sigW = W / 2 - 25;

  // Tentar carregar assinatura1
  const sig1Url = window.location.origin + '/restaurando-vidas/assinatura1.png';
  const sig1Data = await loadImageAsBase64(sig1Url);

  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.5);
  doc.line(col1x, y + 20, col1x + sigW, y + 20);

  if (sig1Data) {
    try { doc.addImage(sig1Data, 'PNG', col1x, y, sigW, 18); } catch (e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(relatorio.alunoNome || 'Estagiário', col1x + sigW / 2, y + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Estagiário de Psicologia', col1x + sigW / 2, y + 30, { align: 'center' });

  // Assinatura 2 — Gestora/Supervisora
  const sig2Url = window.location.origin + '/restaurando-vidas/assinatura2.png';
  const sig2Data = await loadImageAsBase64(sig2Url);

  doc.setDrawColor(...GRAY);
  doc.line(col2x, y + 20, col2x + sigW, y + 20);

  if (sig2Data) {
    try { doc.addImage(sig2Data, 'PNG', col2x, y, sigW, 18); } catch (e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Lúcia Kratz', col2x + sigW / 2, y + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Supervisora Técnica · CRP 09/20590', col2x + sigW / 2, y + 30, { align: 'center' });

  // ─── Rodapé ───────────────────────────────────────────
  doc.setFillColor(245, 245, 245);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(0, H - 12, W, H - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', W / 2, H - 7, { align: 'center' });
  doc.text('Documento confidencial. Uso restrito aos profissionais autorizados.', W / 2, H - 3, { align: 'center' });

  const filename = `relatorio_${(relatorio.pacienteNome || 'paciente').replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
  doc.save(filename);
}

// PDF do Relatório do Projeto
export async function gerarRelatorioProjeto(rel) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');

  // Cabeçalho
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, W, 48, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(0, 48, W, 48);

  const logoUrl = window.location.origin + '/restaurando-vidas/logo.png';
  const logoData = await loadImageAsBase64(logoUrl);
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', 12, 6, 30, 30); } catch (e) {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GOLD);
  doc.text('RESTAURANDO VIDAS', logoData ? 48 : 15, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Relatório ${rel.periodo?.charAt(0).toUpperCase() + rel.periodo?.slice(1)} — ${rel.periodoLabel}`, logoData ? 48 : 15, 29);
  doc.text(`Gerado em: ${format(new Date(rel.geradoEm), 'dd/MM/yyyy HH:mm')}`, logoData ? 48 : 15, 37);

  let y = 62;

  const section = (title, yPos) => {
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(15, yPos - 4, W - 30, 10, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(2);
    doc.line(15, yPos - 4, 15, yPos + 6);
    doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(title, 21, yPos + 2.5);
    return yPos + 14;
  };

  const row = (label, value, yPos) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GOLD);
    doc.text(String(value), W - 20, yPos, { align: 'right' });
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.2);
    doc.line(20, yPos + 2, W - 20, yPos + 2);
    return yPos + 10;
  };

  y = section('PACIENTES', y);
  y = row('Total de Pacientes Cadastrados', rel.totalPacientes, y);
  y = row('Pacientes em Atendimento Ativo', rel.pacientesAtivos, y);
  y = row('Pacientes com Alta', rel.pacientesAlta, y);
  y += 6;

  y = section('ATENDIMENTOS', y);
  y = row('Total de Sessões Registradas', rel.totalSessoes, y);
  y = row('Interconsultas Realizadas', rel.totalInterconsultas, y);
  y = row('Interconsultas Aprovadas', rel.interconsultasAprovadas, y);
  y += 6;

  if (rel.observacoes) {
    y = section('OBSERVAÇÕES DA GESTORA', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(rel.observacoes, W - 40);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 8;
  }

  // Assinatura
  y = Math.max(y + 10, H - 55);

  const sig2Url = window.location.origin + '/restaurando-vidas/assinatura2.png';
  const sig2Data = await loadImageAsBase64(sig2Url);
  const sigW = 70;
  const sigX = W / 2 - sigW / 2;

  if (sig2Data) {
    try { doc.addImage(sig2Data, 'PNG', sigX, y, sigW, 18); } catch (e) {}
  }

  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.5);
  doc.line(sigX, y + 20, sigX + sigW, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Lúcia Kratz', W / 2, y + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Responsável Técnica · CRP 09/20590', W / 2, y + 31, { align: 'center' });
  doc.text('Doutora em Psicologia · Goiânia, GO', W / 2, y + 36, { align: 'center' });

  // Rodapé
  doc.setFillColor(245, 245, 245);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', W / 2, H - 7, { align: 'center' });
  doc.text('Documento oficial. Goiânia, GO.', W / 2, H - 3, { align: 'center' });

  doc.save(`relatorio_projeto_${rel.periodo}_${rel.periodoLabel?.replace(/\//g, '-') || ''}.pdf`);
}
