// src/pages/CadastroPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const ROLE_LABELS = {
  pastor: 'Pastor / ADM',
  aluno: 'Estagiário de Psicologia',
  profissional: 'Profissional de Saúde',
};

export default function CadastroPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', password: '', password2: '', role: 'aluno', especialidade: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) { setError('As senhas não coincidem.'); return; }
    if (form.password.length < 6) { setError('Senha mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await addDoc(collection(db, 'solicitacoes'), {
        uid: cred.user.uid,
        nome: form.nome,
        email: form.email,
        role: form.role,
        especialidade: form.especialidade || '',
        status: 'pendente',
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else setError('Erro ao solicitar acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0A0A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: 'Raleway, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#111', border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 16, padding: 48,
        boxShadow: '0 0 40px rgba(212,175,55,0.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/restaurando-vidas/logo.png" alt="Logo"
            onError={(e) => e.target.style.display = 'none'}
            style={{ width: 80, marginBottom: 12 }} />
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#D4AF37', marginBottom: 4 }}>
            Restaurando Vidas
          </h1>
          <p style={{ fontSize: 11, color: '#9A9080', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Cuidado da Alma · Apoio Psicológico
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, color: '#D4AF37', marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: '#D4AF37', marginBottom: 12 }}>Solicitação Enviada!</h3>
            <p style={{ color: '#9A9080', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
              Sua solicitação foi enviada para a Gestora. Você receberá acesso após a aprovação.
            </p>
            <button onClick={() => navigate('/')}
              style={{
                padding: '12px 32px', borderRadius: 8,
                background: 'transparent', border: '1px solid rgba(212,175,55,0.4)',
                color: '#D4AF37', cursor: 'pointer', fontFamily: 'Raleway', fontWeight: 600,
              }}>
              ← Voltar para a Página Inicial
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#D4AF37', marginBottom: 24, textAlign: 'center' }}>
              Solicitar Acesso
            </h3>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)',
                color: '#ff7070', fontSize: 14,
              }}>⚠ {error}</div>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nome Completo *', key: 'nome', type: 'text', placeholder: 'Seu nome completo' },
                { label: 'E-mail *', key: 'email', type: 'email', placeholder: 'seu@email.com' },
                { label: 'Senha *', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                { label: 'Confirmar Senha *', key: 'password2', type: 'password', placeholder: 'Repita a senha' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8 }}>
                    {f.label}
                  </label>
                  <input type={f.type} value={form[f.key]} placeholder={f.placeholder} required
                    onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 8, padding: '10px 14px', color: '#F5F0E8',
                      fontFamily: 'Raleway', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8 }}>
                  Perfil *
                </label>
                <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{
                    width: '100%', background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: 8, padding: '10px 14px', color: '#F5F0E8',
                    fontFamily: 'Raleway', fontSize: 14, outline: 'none', cursor: 'pointer',
                  }}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {form.role === 'profissional' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8 }}>
                    Especialidade
                  </label>
                  <input type="text" value={form.especialidade} placeholder="Ex: Psiquiatria, Neurologia..."
                    onChange={(e) => setForm(p => ({ ...p, especialidade: e.target.value }))}
                    style={{
                      width: '100%', background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.3)',
                      borderRadius: 8, padding: '10px 14px', color: '#F5F0E8',
                      fontFamily: 'Raleway', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 8, marginTop: 8,
                  background: '#D4AF37', border: 'none', color: '#000',
                  fontFamily: 'Raleway', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>
                {loading ? 'Enviando...' : '→ Solicitar Acesso'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 13, color: '#5A5048' }}>
                Já tem acesso?{' '}
                <span style={{ color: '#D4AF37', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                  Fazer login
                </span>
              </span>
              <br />
              <span style={{ fontSize: 13, color: '#5A5048', cursor: 'pointer' }} onClick={() => navigate('/')}>
                ← Voltar para a página inicial
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
