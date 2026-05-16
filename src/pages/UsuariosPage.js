// src/pages/UsuariosPage.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth, ROLES } from '../contexts/AuthContext';

const ROLE_LABELS = {
  [ROLES.GESTORA]: 'Gestora',
  [ROLES.PASTOR]: 'Pastor / ADM',
  [ROLES.ALUNO]: 'Estagiário',
  [ROLES.PROFISSIONAL]: 'Prof. de Saúde',
};

export default function UsuariosPage() {
  const { isGestora, registerUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: '', email: '', password: '', role: ROLES.ALUNO, especialidade: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (s) => {
      setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(form.email, form.password, {
        nome: form.nome,
        role: form.role,
        especialidade: form.especialidade,
        active: true,
      });
      setSuccess(`Usuário "${form.nome}" cadastrado com sucesso!`);
      setForm({ nome: '', email: '', password: '', role: ROLES.ALUNO, especialidade: '' });
      setShowForm(false);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError('Erro ao cadastrar usuário. Verifique os dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (uid, current) => {
    await updateDoc(doc(db, 'users', uid), {
      active: !current,
      updatedAt: serverTimestamp(),
    });
  };

  const roleMap = {
    [ROLES.GESTORA]: { cls: 'badge-gold' },
    [ROLES.PASTOR]: { cls: 'badge-info' },
    [ROLES.ALUNO]: { cls: 'badge-success' },
    [ROLES.PROFISSIONAL]: { cls: 'badge-warning' },
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Usuários</h1>
          <p>Gerenciamento de acesso ao sistema Restaurando Vidas</p>
        </div>
        <button className="btn btn-gold" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
          {showForm ? '✕ Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <span>✓</span> {success}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 600 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Cadastrar Novo Usuário</h3>

          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input className="form-control" value={form.nome}
                  onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Perfil de Acesso *</label>
                <select className="form-control" value={form.role}
                  onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input className="form-control" type="email" value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Senha Provisória *</label>
                <input className="form-control" type="password" value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  minLength={6} required />
              </div>
              {form.role === ROLES.PROFISSIONAL && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Especialidade</label>
                  <input className="form-control" value={form.especialidade}
                    onChange={(e) => setForm(p => ({ ...p, especialidade: e.target.value }))}
                    placeholder="Ex: Psiquiatria, Neurologia, Assistência Social..." />
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              {loading ? 'Cadastrando...' : '✦ Cadastrar Usuário'}
            </button>
          </form>
        </div>
      )}

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
            {users.map((u) => {
              const rm = roleMap[u.role] || { cls: 'badge-gold' };
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.nome}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${rm.cls}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.especialidade || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`status-dot ${u.active ? 'active' : 'inactive'}`} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {u.role !== ROLES.GESTORA && (
                      <button
                        className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-outline'}`}
                        onClick={() => toggleActive(u.id, u.active)}
                      >
                        {u.active ? 'Desativar' : 'Ativar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
