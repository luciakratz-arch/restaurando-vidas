// src/components/Layout.js
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
  const { isGestora } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isGestora) return;
    const q = query(
      collection(db, 'interconsultas'),
      where('status', '==', 'pendente')
    );
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size));
    return unsub;
  }, [isGestora]);

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <main className="main-content animate-in">
        {children}
      </main>
    </div>
  );
}
