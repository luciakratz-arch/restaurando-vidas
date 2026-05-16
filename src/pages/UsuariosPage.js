// src/pages/UsuariosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  collection, query, onSnapshot, doc,
  updateDoc, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContext';

const ROLE_LABELS = {
  [ROLES.GESTORA]: 'Gestora',
  [ROLES.PASTOR]: 'Pastor / ADM',
  [ROLES.ALUNO]: 'Estagiário',
  [ROLES.PROFISSIONAL]: 'Prof. de Saúde',
};

export default function UsuariosPage() {
  const { isGestora } = useAuth();
  const [users, setUsers] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [aba, setAba] = useState('usuarios'); // 'usuarios' | 'solicitacoes'

  useEffect(() => {
    const unUsers = onSnapshot(query(collection(db, 'users')), (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unSol = onSnapshot(
      query(collection(db, 'solicitacoes')),
      (s) => setSolicitacoes(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { unUsers(); unSol(); };
  }, []);

  const pendentes = solicitacoes.filter(s => s.status === 'pendente');

  const aprovar = async (sol) => {
    setSaving(true);
    try {
      // Cria o perfil no Firestore
      await setDoc(doc(db, 'users', sol.uid), {
        nome: sol.nome,
        email: sol.email,
        role: sol.role,
        especialidade: sol.especialidade || '',
        active: true,
        uid: sol.uid,
        createdAt: serverTimestamp(),
      });
      // Atualiza solicitação
      await updateDoc(doc(db, 'solicitacoes', sol.id), {
        status: 'aprovada',
        updatedAt: serverTimestamp(),
      });
      setSuccess(`${sol.nome} aprovado com sucesso!`);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const rejeitar = async (sol) => {
    if (!window.confirm(`Rejeitar solicitação de ${sol.nome}?`)) return;
    await updateDoc(doc(db, 'solicitacoes', sol.id), {
      status: 'rejeitada',
      updatedAt: serverTimestamp(),
    });
  };

  const abrirEdicao = (u) => {
    setEditando(u.id);
    setEditForm({ nome: u.nome, role: u.role, especialidade: u.especialidade || '', active: u.active });
  };

  const salvarEdicao = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', editando), {
        ...editForm,
        updatedAt: serverTimestamp(),
      });
      setEditando(null);
      setSuccess('Usuário atualizado!');
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleActive = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), { active: !current, updatedAt: serverTimestamp() });
  };

  const roleMap = {
    [ROLES.GESTORA]: 'badge-gold',
    [ROLES.PASTOR]: 'badge-info',
    [ROLES.ALUNO]: 'badge-success',
    [ROLES.PROFISSIONAL]: 'badge-warning',
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Usuários</h1>
          <p>Gerencie acessos e solicitações do sistema</p>
        </div>
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
        {[
          { key: 'usuarios', label: `Usuários (${users.length})` },
          { key: 'solicitacoes', label: `Solicitações${pendentes.length > 0 ? ` (${pendentes.length} pendentes)` : ''}` },
        ].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: aba === a.key ? '2px solid var(--gold)' : '2px solid transparent',
              color: aba === a.key ? 'var(--gold)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600, fontSize: 14,
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba Usuários */}
      {aba === 'usuarios' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Especialidade</th>
                <th>Status</th>
                <th>Ações</th>
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
                      <button className="btn btn-outline btn-sm" onClick={() => abrirEdicao(u)}>✎ Editar</button>
                      {u.role !== ROLES.GESTORA && (
                        <button className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-outline'}`}
                          onClick={() => toggleActive(u.id, u.active)}>
                          {u.active ? 'Desativar' : 'Ativar'}
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

      {/* Aba Solicitações */}
      {aba === 'solicitacoes' && (
        solicitacoes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma solicitação recebida ainda.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil Solicitado</th>
                  <th>Especialidade</th>
                  <th>Status</th>
                  <th>Ações</th>
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
                          <button className="btn btn-gold btn-sm" onClick={() => aprovar(s)} disabled={saving}>
                            ✓ Aprovar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejeitar(s)}>
                            ✕ Rejeitar
                          </button>
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

      {/* Modal Edição */}
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
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Especialidade</label>
                <input className="form-control" value={editForm.especialidade}
                  onChange={(e) => setEditForm(p => ({ ...p, especialidade: e.target.value }))}
                  placeholder="Especialidade (opcional)" />
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
    </Layout>
  );
}
