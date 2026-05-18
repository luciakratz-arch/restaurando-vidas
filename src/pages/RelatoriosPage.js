// src/pages/RelatoriosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy,
  doc, updateDoc, serverTimestamp, addDoc, where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { gerarRelatorioRV, gerarRelatorioProjeto } from '../utils/gerarPDF';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatoriosPage() {
  const { isGestora, currentUser, userProfile } = useAuth();
  const [relatorios, setRelatorios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editando, setEditando] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (isGestora) {
      q = query(collection(db, 'relatorios'), orderBy('createdAt', 'desc'));
    } else {
      // Aluno/Profissional vê apenas os aprovados que lhe dizem respeito
      q = query(
        collection(db, 'relatorios'),
        where('status', '==', 'aprovado'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setRelatorios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [isGestora]);

  const abrirParaRevisao = (r) => {
    setSelected(r);
    setEditData({
      evolucao: r.evolucao || '',
      intervencoes: r.intervencoes || '',
      observacoesGestora: r.observacoesGestora || '',
    });
    setEditando(true);
  };

  const salvarEAprovar = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'relatorios', selected.id), {
        ...editData,
        status: 'aprovado',
        aprovadoEm: serverTimestamp(),
        aprovadoPor: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
      setEditando(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const salvarRascunho = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'relatorios', selected.id), {
        ...editData,
        status: 'pendente_revisao',
        updatedAt: serverTimestamp(),
      });
      setEditando(false);
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = (r) => {
    gerarRelatorioRV(r).catch(console.error);
  };

  const statusMap = {
    rascunho: { text: 'Rascunho', cls: 'badge-gold' },
    pendente_revisao: { text: 'Aguardando Gestora', cls: 'badge-warning' },
    aprovado: { text: 'Aprovado ✓', cls: 'badge-success' },
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Relatórios Clínicos</h1>
        <p>
          {isGestora
            ? 'Revise, edite e aprove relatórios dos estagiários'
            : 'Relatórios aprovados pela Gestora'}
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>Carregando...</p>
      ) : relatorios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <p style={{ color: 'var(--text-muted)' }}>Nenhum relatório disponível no momento.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Estagiário</th>
                <th>Período</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorios.map((r) => {
                const st = statusMap[r.status] || { text: r.status, cls: 'badge-gold' };
                const date = r.createdAt?.toDate
                  ? format(r.createdAt.toDate(), 'dd/MM/yyyy', { locale: ptBR })
                  : '—';
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.pacienteNome || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.alunoNome || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.periodo || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{date}</td>
                    <td><span className={`badge ${st.cls}`}>{st.text}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {isGestora && r.status !== 'aprovado' && (
                          <button className="btn btn-gold btn-sm" onClick={() => abrirParaRevisao(r)}>
                            Revisar
                          </button>
                        )}
                        {r.status === 'aprovado' && (
                          <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPDF(r)}>
                            ↓ PDF
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => { setSelected(r); setEditando(false); }}>
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Visualização / Edição */}
      {selected && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) { setSelected(null); setEditando(false); }
        }}>
          <div className="modal-box" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 18 }}>
                  {editando ? 'Revisar Relatório' : 'Visualizar Relatório'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Paciente: <strong>{selected.pacienteNome}</strong> · Estagiário: {selected.alunoNome}
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
                onClick={() => { setSelected(null); setEditando(false); }}
              >✕</button>
            </div>

            <div className="modal-body">
              {editando ? (
                // Modo edição
                <>
                  <div className="form-group">
                    <label className="form-label">Evolução Clínica</label>
                    <textarea
                      className="form-control"
                      value={editData.evolucao}
                      onChange={(e) => setEditData(p => ({ ...p, evolucao: e.target.value }))}
                      rows={5}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Intervenções Realizadas</label>
                    <textarea
                      className="form-control"
                      value={editData.intervencoes}
                      onChange={(e) => setEditData(p => ({ ...p, intervencoes: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--gold-light)' }}>
                      ✦ Observações da Gestora (campo exclusivo)
                    </label>
                    <textarea
                      className="form-control"
                      style={{ borderColor: 'var(--gold)', boxShadow: '0 0 0 2px var(--gold-muted)' }}
                      value={editData.observacoesGestora}
                      onChange={(e) => setEditData(p => ({ ...p, observacoesGestora: e.target.value }))}
                      placeholder="Adicione suas observações de supervisão clínica aqui..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                // Modo visualização
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Evolução Clínica
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                      {selected.evolucao || '—'}
                    </div>
                  </div>
                  <div className="divider" />
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Intervenções Realizadas
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                      {selected.intervencoes || '—'}
                    </div>
                  </div>
                  {selected.observacoesGestora && (
                    <>
                      <div className="divider" />
                      <div style={{
                        background: 'var(--gold-muted)',
                        border: '1px solid var(--gold-border)',
                        borderRadius: 'var(--radius)',
                        padding: '12px 16px',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                          Observações da Gestora
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.7 }}>
                          {selected.observacoesGestora}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              {editando ? (
                <>
                  <button className="btn btn-outline" onClick={salvarRascunho} disabled={saving}>
                    Salvar sem Aprovar
                  </button>
                  <button className="btn btn-gold" onClick={salvarEAprovar} disabled={saving}>
                    {saving ? 'Salvando...' : '✓ Validar e Aprovar'}
                  </button>
                </>
              ) : (
                <>
                  {selected.status === 'aprovado' && (
                    <button className="btn btn-gold" onClick={() => handleDownloadPDF(selected)}>
                      ↓ Gerar PDF
                    </button>
                  )}
                  {isGestora && selected.status !== 'aprovado' && (
                    <button className="btn btn-gold" onClick={() => {
                      setEditData({
                        evolucao: selected.evolucao || '',
                        intervencoes: selected.intervencoes || '',
                        observacoesGestora: selected.observacoesGestora || '',
                      });
                      setEditando(true);
                    }}>
                      ✎ Revisar e Editar
                    </button>
                  )}
                  <button className="btn btn-outline" onClick={() => { setSelected(null); setEditando(false); }}>
                    Fechar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
