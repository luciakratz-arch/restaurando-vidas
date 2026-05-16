// src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBaJDEuOub7IBDVQMakk2rmyG6e8xRhP2E",
  authDomain: "anamnese-dralucia.firebaseapp.com",
  projectId: "anamnese-dralucia",
  storageBucket: "anamnese-dralucia.firebasestorage.app",
  messagingSenderId: "873511256571",
  appId: "1:873511256571:web:804e3038647a7005fe4b5e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
