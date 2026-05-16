// src/pages/IndicarPacientePage.js
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function IndicarPacientePage() {
  const { currentUser, userProfile } = useAuth();
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    demanda: '',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addDoc(collection(db, 'pacientes'), {
        ...form,
        status: 'pendente',
        indicadoPor: currentUser.uid,
        indicadoPorNome: userProfile?.nome || 'Não identificado',
        alunoResponsavel: null,
        profissionalResponsavel: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setForm({ nome: '', telefone: '', demanda: '', observacoes: '' });
    } catch (err) {
      setError('Erro ao registrar indicação. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>Indicar Paciente</h1>
        <p>Registre um novo paciente para triagem pela Gestora</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        {success && (
          <div className="alert alert-success">
            <span>✓</span>
            Paciente indicado com sucesso! A Gestora receberá a notificação para triagem.
            <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              onClick={() => setSuccess(false)}>✕</button>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome Completo *</label>
              <input
                className="form-control"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Nome do paciente"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone / WhatsApp *</label>
              <input
                className="form-control"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(62) 9 0000-0000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Breve Descrição da Demanda *</label>
              <textarea
                className="form-control"
                name="demanda"
                value={form.demanda}
                onChange={handleChange}
                placeholder="Descreva brevemente a demanda ou situação que motiva o encaminhamento..."
                required
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observações Adicionais</label>
              <textarea
                className="form-control"
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                placeholder="Informações complementares (opcional)..."
                rows={2}
              />
            </div>

            <div className="divider" />

            <div style={{
              background: 'var(--gold-muted)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              <strong style={{ color: 'var(--gold)' }}>ℹ Fluxo de Triagem:</strong> Após o envio, a Gestora (Lúcia)
              receberá um alerta e fará a triagem antes de atribuir o caso a um estagiário ou profissional de saúde.
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading}
            >
              {loading ? 'Enviando...' : '✦ Registrar Indicação'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
