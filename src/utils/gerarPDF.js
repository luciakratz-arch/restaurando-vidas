// src/utils/gerarPDF.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GOLD = [212, 175, 55];
const DARK = [10, 10, 10];
const GRAY = [40, 40, 40];
const WHITE = [245, 240, 232];

export function gerarRelatorioRV(relatorio) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ─── Background ───────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, H, 'F');

  // ─── Header bar ───────────────────────────────────────
  doc.setFillColor(...GRAY);
  doc.rect(0, 0, W, 40, 'F');

  // Gold accent line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(0, 40, W, 40);

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GOLD);
  doc.text('RESTAURANDO VIDAS', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...WHITE);
  doc.text('Cuidado da Alma · Apoio Psicológico Gratuito', 15, 24);

  // Tipo do documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GOLD);
  doc.text('RELATÓRIO CLÍNICO', W - 15, 16, { align: 'right' });

  // Número e data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const now = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em ${now}`, W - 15, 24, { align: 'right' });
  doc.text(`Documento nº ${relatorio.id?.slice(-8).toUpperCase() || '--------'}`, W - 15, 30, { align: 'right' });

  // ─── Status ribbon ────────────────────────────────────
  const statusColors = {
    aprovado: [76, 175, 80],
    pendente_revisao: [255, 152, 0],
    rascunho: [100, 100, 100],
  };
  const sc = statusColors[relatorio.status] || GOLD;
  doc.setFillColor(...sc);
  doc.roundedRect(15, 47, 50, 10, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const statusTexts = {
    aprovado: 'APROVADO PELA GESTORA',
    pendente_revisao: 'AGUARDANDO REVISÃO',
    rascunho: 'RASCUNHO',
  };
  doc.text(statusTexts[relatorio.status] || relatorio.status?.toUpperCase() || 'RELATÓRIO', 40, 53.5, { align: 'center' });

  // ─── Dados do Paciente ────────────────────────────────
  let y = 68;

  const sectionTitle = (title, yPos) => {
    doc.setFillColor(...GRAY);
    doc.rect(15, yPos - 5, W - 30, 12, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(2);
    doc.line(15, yPos - 5, 15, yPos + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text(title, 21, yPos + 3);
    doc.setLineWidth(0.3);
    return yPos + 16;
  };

  const field = (label, value, yPos, labelW = 50) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(label.toUpperCase(), 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(String(value || '—'), 15 + labelW, yPos);
    return yPos + 7;
  };

  y = sectionTitle('IDENTIFICAÇÃO DO PACIENTE', y);
  y = field('Nome:', relatorio.pacienteNome, y);
  y = field('Telefone:', relatorio.pacienteTelefone || '—', y);
  y = field('Atendido por:', relatorio.alunoNome, y);
  if (relatorio.profissionalNome) {
    y = field('Prof. de Saúde:', relatorio.profissionalNome, y);
  }
  y = field('Período:', relatorio.periodo || '—', y);
  y += 6;

  y = sectionTitle('EVOLUÇÃO CLÍNICA', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  const evolucaoLines = doc.splitTextToSize(relatorio.evolucao || '—', W - 30);
  doc.text(evolucaoLines, 15, y);
  y += evolucaoLines.length * 5 + 8;

  y = sectionTitle('INTERVENÇÕES REALIZADAS', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);
  const interLines = doc.splitTextToSize(relatorio.intervencoes || '—', W - 30);
  doc.text(interLines, 15, y);
  y += interLines.length * 5 + 8;

  // Observações da Gestora (destaque)
  if (relatorio.observacoesGestora) {
    doc.setFillColor(212, 175, 55, 0.1);
    doc.setFillColor(40, 35, 10);
    const obsLines = doc.splitTextToSize(relatorio.observacoesGestora, W - 46);
    doc.roundedRect(15, y - 4, W - 30, obsLines.length * 5 + 16, 3, 3, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, y - 4, W - 30, obsLines.length * 5 + 16, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text('OBSERVAÇÕES DA GESTORA (Lúcia Kratz · CRP 09/20590)', 22, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...WHITE);
    doc.text(obsLines, 22, y + 11);
    y += obsLines.length * 5 + 24;
  }

  // ─── Assinatura ───────────────────────────────────────
  y = Math.max(y, H - 55);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(15, y, 85, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(relatorio.alunoNome || 'Estagiário', 50, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Estagiário de Psicologia', 50, y + 10, { align: 'center' });

  if (relatorio.status === 'aprovado') {
    doc.line(W - 85, y, W - 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text('Lúcia Kratz', W - 50, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gestora Clínica · CRP 09/20590', W - 50, y + 10, { align: 'center' });
  }

  // ─── Footer ───────────────────────────────────────────
  doc.setFillColor(...GRAY);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Restaurando Vidas · Cuidado da Alma · Apoio Psicológico Gratuito', W / 2, H - 7, { align: 'center' });
  doc.text('Documento confidencial. Uso restrito aos profissionais autorizados.', W / 2, H - 3, { align: 'center' });

  const filename = `relatorio_${(relatorio.pacienteNome || 'paciente').replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy')}.pdf`;
  doc.save(filename);
}
