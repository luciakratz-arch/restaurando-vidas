// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isGestora, isPastor, isAluno, isProfissional, userProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getRedirect = (profile) => {
    if (!profile) return '/dashboard';
    if (profile.role === 'gestora' || profile.role === 'pastor') return '/dashboard';
    if (profile.role === 'aluno') return '/atendimentos';
    if (profile.role === 'profissional') return '/meus-pacientes';
    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await login(email, password);
      // Pequeno delay para o perfil carregar
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setError('E-mail ou senha inválidos. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        {/* Logo área */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--gold-muted)',
            border: '2px solid var(--gold-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 32,
          }}>
            ✦
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 6 }}>Restaurando Vidas</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Cuidado da Alma · Apoio Psicológico
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-control"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              className="form-control"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold btn-lg"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 32 }}>
          Acesso restrito. Contate a gestora para cadastro.
        </p>
      </div>
    </div>
  );
}
