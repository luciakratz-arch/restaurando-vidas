// src/pages/UsuariosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, doc,
  updateDoc, serverTimestamp, setDoc, orderBy, deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLE_LABELS = {
  [ROLES.GESTORA]: 'Gestora',
  [ROLES.PASTOR]: 'Pastor / ADM',
  [ROLES.ALUNO]: 'Estagiário',
  [ROLES.PROFISSIONAL]: 'Prof. de Saúde',
};

const STATUS_PACIENTE = {
  pendente: { label: 'Pendente', cls: 'badge-warning' },
  ativo: { label: 'Ativo', cls: 'badge-success' },
  alta: { label: 'Alta', cls: 'badge-info' },
  encaminhado: { label: 'Encaminhado', cls: 'badge-gold' },
  inativo: { label: 'Inativo', cls: 'badge-danger' },
};

export default function UsuariosPage() {
  const { isGestora } = useAuth();
  const [aba, setAba] = useState('usuarios');
  const [users, setUsers] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editPaciente, setEditPaciente] = useState(null);
  const [editPacForm, setEditPacForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unUsers = onSnapshot(query(collection(db, 'users')), (s) => {
      const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(all);
      setAlunos(all.filter(u => u.role === 'aluno' && u.active));
      setProfissionais(all.filter(u => u.role === 'profissional' && u.active));
    });
    const unSol = onSnapshot(query(collection(db, 'solicitacoes')), (s) =>
      setSolicitacoes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unPac = onSnapshot(
      query(collection(db, 'pacientes'), orderBy('createdAt', 'desc')),
      (s) => setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unUsers(); unSol(); unPac(); };
  }, []);

  const pendentes = solicitacoes.filter(s => s.status === 'pendente');

  const aprovar = async (sol) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', sol.uid), {
        nome: sol.nome, email: sol.email, role: sol.role,
        especialidade: sol.especialidade || '', active: true,
        uid: sol.uid, createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'solicitacoes', sol.id), { status: 'aprovada', updatedAt: serverTimestamp() });
      setSuccess(`${sol.nome} aprovado!`);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const rejeitar = async (sol) => {
    if (!window.confirm(`Rejeitar ${sol.nome}?`)) return;
    await updateDoc(doc(db, 'solicitacoes', sol.id), { status: 'rejeitada', updatedAt: serverTimestamp() });
  };

  const excluirUsuario = async (u) => {
    if (!window.confirm(`Excluir o usuário "${u.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDoc(doc(db, 'users', u.id));
      setSuccess(`Usuário ${u.nome} excluído.`);
    } catch (err) { console.error(err); }
  };

  const excluirPaciente = async (p) => {
    if (!window.confirm(`Excluir o paciente "${p.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDoc(doc(db, 'pacientes', p.id));
      setSuccess(`Paciente ${p.nome} excluído.`);
    } catch (err) { console.error(err); }
  };

  const salvarEdicao = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', editando), { ...editForm, updatedAt: serverTimestamp() });
      setEditando(null);
      setSuccess('Usuário atualizado!');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const salvarPaciente = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'pacientes', editPaciente), { ...editPacForm, updatedAt: serverTimestamp() });
      setEditPaciente(null);
      setSuccess('Paciente atualizado!');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const fmtDate = (ts) => ts?.toDate ? format(ts.toDate(), 'dd/MM/yyyy', { locale: ptBR }) : '—';

  const roleMap = {
    [ROLES.GESTORA]: 'badge-gold', [ROLES.PASTOR]: 'badge-info',
    [ROLES.ALUNO]: 'badge-success', [ROLES.PROFISSIONAL]: 'badge-warning',
  };

  const getNome = (uid) => {
    const u = users.find(u => u.id === uid);
    return u?.nome || '—';
  };

  const abas = [
    { key: 'usuarios', label: `Usuários (${users.length})` },
    { key: 'pacientes', label: `Pacientes (${pacientes.length})` },
    { key: 'solicitacoes', label: `Solicitações${pendentes.length > 0 ? ` (${pendentes.length})` : ''}` },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h1>Usuários e Pacientes</h1>
        <p>Gerencie acessos, pacientes e solicitações</p>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✓ {success}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--gold-border)' }}>
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: aba === a.key ? '2px solid var(--gold)' : '2px solid transparent',
            color: aba === a.key ? 'var(--gold)' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
          }}>{a.label}</button>
        ))}
      </div>

      {/* ABA USUÁRIOS */}
      {aba === 'usuarios' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>E-mail</th><th>Perfil</th>
                <th>Especialidade</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.nome}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge ${roleMap[u.role] || 'badge-gold'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.especialidade || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`status-dot ${u.active ? 'active' : 'inactive'}`} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        setEditando(u.id);
                        setEditForm({ nome: u.nome, role: u.role, especialidade: u.especialidade || '', active: u.active });
                      }}>✎ Editar</button>
                      {u.role !== ROLES.GESTORA && (
                        <button className="btn btn-sm" onClick={() => excluirUsuario(u)}
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                          🗑 Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA PACIENTES */}
      {aba === 'pacientes' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>Telefone</th><th>Demanda</th>
                <th>Estagiário</th><th>Profissional</th>
                <th>Status</th><th>Cadastrado em</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => {
                const st = STATUS_PACIENTE[p.status] || { label: p.status, cls: 'badge-gold' };
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.telefone}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.demanda}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{getNome(p.alunoResponsavel)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{getNome(p.profissionalResponsavel)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(p.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-gold btn-sm" onClick={() => {
                          setEditPaciente(p.id);
                          setEditPacForm({
                            status: p.status || 'pendente',
                            alunoResponsavel: p.alunoResponsavel || '',
                            profissionalResponsavel: p.profissionalResponsavel || '',
                            observacoes: p.observacoes || '',
                          });
                        }}>✎ Gerenciar</button>
                        <button className="btn btn-sm" onClick={() => excluirPaciente(p)}
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                          🗑 Excluir
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

      {/* ABA SOLICITAÇÕES */}
      {aba === 'solicitacoes' && (
        solicitacoes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma solicitação recebida.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th><th>E-mail</th><th>Perfil</th>
                  <th>Especialidade</th><th>Status</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.nome}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.email}</td>
                    <td><span className={`badge ${roleMap[s.role] || 'badge-gold'}`}>{ROLE_LABELS[s.role] || s.role}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.especialidade || '—'}</td>
                    <td>
                      <span className={`badge ${s.status === 'pendente' ? 'badge-warning' : s.status === 'aprovada' ? 'badge-success' : 'badge-danger'}`}>
                        {s.status === 'pendente' ? 'Pendente' : s.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                      </span>
                    </td>
                    <td>
                      {s.status === 'pendente' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-gold btn-sm" onClick={() => aprovar(s)} disabled={saving}>✓ Aprovar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejeitar(s)}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal Editar Usuário */}
      {editando && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditando(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: 18 }}>Editar Usuário</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
                onClick={() => setEditando(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-control" value={editForm.nome}
                  onChange={(e) => setEditForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select className="form-control" value={editForm.role}
                  onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Especialidade</label>
                <input className="form-control" value={editForm.especialidade}
                  onChange={(e) => setEditForm(p => ({ ...p, especialidade: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={editForm.active ? 'true' : 'false'}
                  onChange={(e) => setEditForm(p => ({ ...p, active: e.target.value === 'true' }))}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={salvarEdicao} disabled={saving}>
                {saving ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Paciente */}
      {editPaciente && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditPaciente(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: 18 }}>Gerenciar Paciente</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
                onClick={() => setEditPaciente(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Status do Paciente</label>
                <select className="form-control" value={editPacForm.status}
                  onChange={(e) => setEditPacForm(p => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUS_PACIENTE).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Atribuir Estagiário</label>
                <select className="form-control" value={editPacForm.alunoResponsavel}
                  onChange={(e) => setEditPacForm(p => ({ ...p, alunoResponsavel: e.target.value }))}>
                  <option value="">Nenhum</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Atribuir Profissional de Saúde</label>
                <select className="form-control" value={editPacForm.profissionalResponsavel}
                  onChange={(e) => setEditPacForm(p => ({ ...p, profissionalResponsavel: e.target.value }))}>
                  <option value="">Nenhum</option>
                  {profissionais.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome}{p.especialidade ? ` — ${p.especialidade}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Observações Internas</label>
                <textarea className="form-control" rows={3} value={editPacForm.observacoes}
                  onChange={(e) => setEditPacForm(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Observações para a equipe..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditPaciente(null)}>Cancelar</button>
              <button className="btn btn-gold" onClick={salvarPaciente} disabled={saving}>
                {saving ? 'Salvando...' : '✓ Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
