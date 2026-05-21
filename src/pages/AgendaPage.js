// src/pages/AgendaPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, orderBy, addDoc,
  updateDoc, doc, serverTimestamp, getDocs, where
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const TIPOS = ['Sessão Individual','Sessão de Acompanhamento','Avaliação Inicial','Supervisão','Outro'];

const STATUS_CFG = {
  agendado:  { label: 'Agendado',  bg: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: 'rgba(212,175,55,0.4)' },
  realizado: { label: 'Realizado', bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', border: 'rgba(34,197,94,0.3)' },
  cancelado: { label: 'Cancelado', bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function gerarMsgWhatsApp(ag) {
  const dataFmt = ag.data
    ? format(parseISO(ag.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—';
  return `Olá, ${ag.pacienteNome}! 😊\n\nGostaríamos de confirmar seu atendimento pelo *Projeto Restaurando Vidas*:\n\n📅 *Data:* ${dataFmt}\n🕐 *Horário:* ${ag.hora}\n📋 *Tipo:* ${ag.tipo}\n👤 *Profissional:* ${ag.profissionalNome}\n\nPor favor, confirme sua presença respondendo esta mensagem com *"Confirmo"*.\n\nQualquer dúvida estamos à disposição! 🙏\n\n_Restaurando Vidas · Cuidado da Alma_`;
}

export default function AgendaPage() {
  const { currentUser, userProfile, isGestora, isAluno, isProfissional } = useAuth();
  const [semanaBase, setSemanaBase] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [agendamentos, setAgendamentos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetalhe, setShowDetalhe] = useState(null);
  const [msgCopiada, setMsgCopiada] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '', pacienteNome: '', data: '', hora: '09:00', tipo: TIPOS[0], observacoes: ''
  });

  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i));

  useEffect(() => {
    let q;
    if (isGestora) {
      q = query(collection(db, 'agendamentos'), orderBy('data', 'asc'));
    } else {
      q = query(
        collection(db, 'agendamentos'),
        where('profissionalId', '==', currentUser.uid),
        orderBy('data', 'asc')
      );
    }
    return onSnapshot(q, s => setAgendamentos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [isGestora, currentUser.uid]);

  useEffect(() => {
    getDocs(collection(db, 'pacientes')).then(s =>
      setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const agsDoDia = (dia) =>
    agendamentos
      .filter(a => a.data === format(dia, 'yyyy-MM-dd'))
      .sort((a, b) => a.hora.localeCompare(b.hora));

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.pacienteId || !form.data || !form.hora) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'agendamentos'), {
        ...form,
        profissionalId: currentUser.uid,
        profissionalNome: userProfile?.nome || 'Profissional',
        status: 'agendado',
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setForm({ pacienteId: '', pacienteNome: '', data: '', hora: '09:00', tipo: TIPOS[0], observacoes: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const atualizarStatus = async (id, status) => {
    await updateDoc(doc(db, 'agendamentos', id), { status, updatedAt: serverTimestamp() });
    setShowDetalhe(prev => prev ? { ...prev, status } : null);
  };

  const copiarWhatsApp = (ag) => {
    navigator.clipboard.writeText(gerarMsgWhatsApp(ag)).then(() => {
      setMsgCopiada(true);
      setTimeout(() => setMsgCopiada(false), 3000);
    });
  };

  const L = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: 6
  };

  return (
    <Layout>

      {/* Modal novo agendamento */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 18 }}>Novo Agendamento</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={salvar}>
              <div className="form-group">
                <label style={L}>Paciente *</label>
                <select className="form-control" value={form.pacienteId} required
                  onChange={e => {
                    const p = pacientes.find(x => x.id === e.target.value);
                    setForm(prev => ({ ...prev, pacienteId: e.target.value, pacienteNome: p?.nome || '' }));
                  }}>
                  <option value="">Selecione...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label style={L}>Data *</label>
                  <input className="form-control" type="date" value={form.data} required
                    onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label style={L}>Horário *</label>
                  <select className="form-control" value={form.hora}
                    onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label style={L}>Tipo de Sessão</label>
                <select className="form-control" value={form.tipo}
                  onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={L}>Observações</label>
                <textarea className="form-control" rows={2} value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Observações internas (opcional)..." />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Salvando...' : '✓ Agendar'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalhe do agendamento */}
      {showDetalhe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#111', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', fontSize: 18 }}>Detalhes do Agendamento</h3>
              <button onClick={() => setShowDetalhe(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            {/* Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><label style={L}>Paciente</label><div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{showDetalhe.pacienteNome}</div></div>
              <div><label style={L}>Profissional</label><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{showDetalhe.profissionalNome}</div></div>
              <div><label style={L}>Data</label><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{showDetalhe.data ? format(parseISO(showDetalhe.data), "dd/MM/yyyy", { locale: ptBR }) : '—'}</div></div>
              <div><label style={L}>Horário</label><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{showDetalhe.hora}</div></div>
              <div><label style={L}>Tipo</label><div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{showDetalhe.tipo}</div></div>
              <div>
                <label style={L}>Status</label>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: STATUS_CFG[showDetalhe.status]?.bg,
                  color: STATUS_CFG[showDetalhe.status]?.color,
                }}>
                  {STATUS_CFG[showDetalhe.status]?.label}
                </span>
              </div>
            </div>

            {showDetalhe.observacoes && (
              <div style={{ marginBottom: 20 }}>
                <label style={L}>Observações</label>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{showDetalhe.observacoes}</div>
              </div>
            )}

            {/* Mensagem WhatsApp */}
            <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <label style={{ ...L, marginBottom: 8 }}>📲 Mensagem de Confirmação (WhatsApp)</label>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-line', maxHeight: 120, overflow: 'auto' }}>
                {gerarMsgWhatsApp(showDetalhe)}
              </div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => copiarWhatsApp(showDetalhe)}>
                {msgCopiada ? '✓ Copiado!' : '📋 Copiar mensagem'}
              </button>
            </div>

            {/* Ações de status */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {showDetalhe.status !== 'realizado' && (
                <button className="btn btn-gold btn-sm" onClick={() => atualizarStatus(showDetalhe.id, 'realizado')}>
                  ✓ Marcar como Realizado
                </button>
              )}
              {showDetalhe.status !== 'cancelado' && (
                <button className="btn btn-outline btn-sm" onClick={() => atualizarStatus(showDetalhe.id, 'cancelado')}>
                  ✕ Cancelar
                </button>
              )}
              {showDetalhe.status === 'cancelado' && (
                <button className="btn btn-outline btn-sm" onClick={() => atualizarStatus(showDetalhe.id, 'agendado')}>
                  ↺ Reagendar
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShowDetalhe(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Agenda de Atendimentos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {isGestora ? 'Visão geral de todos os atendimentos' : 'Seus atendimentos agendados'}
          </p>
        </div>
        {!isGestora && (
          <button className="btn btn-gold" onClick={() => setShowModal(true)}>+ Novo Agendamento</button>
        )}
      </div>

      {/* Navegação semana */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => setSemanaBase(s => subWeeks(s, 1))}>← Anterior</button>
        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15, minWidth: 200, textAlign: 'center' }}>
          {format(semanaBase, "dd 'de' MMM", { locale: ptBR })} — {format(addDays(semanaBase, 6), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setSemanaBase(s => addWeeks(s, 1))}>Próxima →</button>
        <button className="btn btn-outline btn-sm" onClick={() => setSemanaBase(startOfWeek(new Date(), { weekStartsOn: 0 }))}>Hoje</button>
      </div>

      {/* Calendário */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {diasSemana.map((dia, i) => {
          const isHoje = isSameDay(dia, new Date());
          const ags = agsDoDia(dia);
          return (
            <div key={i} style={{
              background: isHoje ? 'rgba(212,175,55,0.06)' : '#111',
              border: `1px solid ${isHoje ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 10, padding: 10, minHeight: 180,
            }}>
              {/* Header dia */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {DIAS_SEMANA[i]}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 700, marginTop: 2,
                  color: isHoje ? 'var(--gold)' : 'var(--text-primary)',
                  background: isHoje ? 'rgba(212,175,55,0.15)' : 'transparent',
                  borderRadius: '50%', width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0',
                }}>
                  {format(dia, 'd')}
                </div>
              </div>

              {/* Agendamentos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {ags.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center', marginTop: 12 }}>—</div>
                ) : ags.map(ag => {
                  const cfg = STATUS_CFG[ag.status] || STATUS_CFG.agendado;
                  return (
                    <div key={ag.id}
                      onClick={() => setShowDetalhe(ag)}
                      style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        borderRadius: 6, padding: '5px 7px', cursor: 'pointer',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{ag.hora}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 1, lineHeight: 1.3 }}>
                        {ag.pacienteNome}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {ag.profissionalNome}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.border}` }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cfg.label}</span>
          </div>
        ))}
      </div>

    </Layout>
  );
}
