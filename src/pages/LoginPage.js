// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const ROLE_LABELS = {
  pastor: 'Pastor / ADM',
  aluno: 'Estagiário de Psicologia',
  profissional: 'Profissional de Saúde',
};

const Logo = () => (
  <div style={{ textAlign: 'center', marginBottom: 32 }}>
    <img
      src={process.env.PUBLIC_URL + '/logo.png'}
      alt="Restaurando Vidas"
      onError={(e) => { e.target.style.display = 'none'; }}
      style={{ width: 120, marginBottom: 12 }}
    />
    <h1 style={{ fontSize: 20, marginBottom: 4 }}>Restaurando Vidas</h1>
    <p style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
      Cuidado da Alma · Apoio Psicológico
    </p>
  </div>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tela, setTela] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cadForm, setCadForm] = useState({ nome: '', email: '', password: '', password2: '', role: 'aluno', especialidade: '' });
  const [cadSuccess, setCadSuccess] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setTimeout(() => navigate('/dashboard'), 500);
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError('');
    if (cadForm.password !== cadForm.password2) { setError('As senhas não coincidem.'); return; }
    if (cadForm.password.length < 6) { setError('Senha mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cadForm.email, cadForm.password);
      await addDoc(collection(db, 'solicitacoes'), {
        uid: cred.user.uid,
        nome: cadForm.nome,
        email: cadForm.email,
        role: cadForm.role,
        especialidade: cadForm.especialidade || '',
        status: 'pendente',
        createdAt: serverTimestamp(),
      });
      setCadSuccess(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else setError('Erro ao solicitar acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (tela === 'cadastro') {
    return (
      <div className="login-page">
        <div className="login-box" style={{ maxWidth: 460 }}>
          <Logo />
          {cadSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 16 }}>✓</div>
              <h3 style={{ color: 'var(--gold)', marginBottom: 12 }}>Solicitação Enviada!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Sua solicitação foi enviada para a Gestora. Você receberá acesso após a aprovação.
              </p>
              <button className="btn btn-outline" onClick={() => { setTela('login'); setCadSuccess(false); }}>
                Voltar para o Login
              </button>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 16, color: 'var(--gold)', marginBottom: 20, textAlign: 'center' }}>Solicitar Acesso</h3>
              {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
              <form onSubmit={handleCadastro}>
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input className="form-control" value={cadForm.nome}
                    onChange={(e) => setCadForm(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Seu nome completo" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Perfil *</label>
                  <select className="form-control" value={cadForm.role}
                    onChange={(e) => setCadForm(p => ({ ...p, role: e.target.value }))}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                {cadForm.role === 'profissional' && (
                  <div className="form-group">
                    <label className="form-label">Especialidade</label>
                    <input className="form-control" value={cadForm.especialidade}
                      onChange={(e) => setCadForm(p => ({ ...p, especialidade: e.target.value }))}
                      placeholder="Ex: Psiquiatria, Neurologia..." />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input className="form-control" type="email" value={cadForm.email}
                    onChange={(e) => setCadForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="seu@email.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Senha *</label>
                  <input className="form-control" type="password" value={cadForm.password}
                    onChange={(e) => setCadForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar Senha *</label>
                  <input className="form-control" type="password" value={cadForm.password2}
                    onChange={(e) => setCadForm(p => ({ ...p, password2: e.target.value }))}
                    placeholder="Repita a senha" required />
                </div>
                <button type="submit" className="btn btn-gold btn-lg"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
                  {loading ? 'Enviando...' : '→ Solicitar Acesso'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                Já tem acesso?{' '}
                <span style={{ color: 'var(--gold)', cursor: 'pointer' }}
                  onClick={() => { setTela('login'); setError(''); }}>
                  Fazer login
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <Logo />
        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-control" type="email" placeholder="seu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-gold btn-lg"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Não tem acesso?{' '}
            <span style={{ color: 'var(--gold)', cursor: 'pointer' }}
              onClick={() => { setTela('cadastro'); setError(''); }}>
              Solicitar cadastro
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
