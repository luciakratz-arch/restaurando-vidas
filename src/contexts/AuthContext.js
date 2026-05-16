// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Perfis disponíveis no sistema
export const ROLES = {
  GESTORA: 'gestora',      // Lúcia — acesso total
  PASTOR: 'pastor',        // Indicação e dashboard geral
  ALUNO: 'aluno',          // Atendimento clínico
  PROFISSIONAL: 'profissional', // Profissional de Saúde
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential;
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function registerUser(email, password, profileData) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', credential.user.uid), {
      ...profileData,
      uid: credential.user.uid,
      email,
      createdAt: serverTimestamp(),
      active: true,
    });
    return credential;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Helpers de permissão
  const isGestora = userProfile?.role === ROLES.GESTORA;
  const isPastor = userProfile?.role === ROLES.PASTOR;
  const isAluno = userProfile?.role === ROLES.ALUNO;
  const isProfissional = userProfile?.role === ROLES.PROFISSIONAL;

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    registerUser,
    isGestora,
    isPastor,
    isAluno,
    isProfissional,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
