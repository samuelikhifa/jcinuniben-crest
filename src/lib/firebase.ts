import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_AibooxgPKhzWtosPVaZjWJYvbB4dquA",
  authDomain: "jcin-uniben.firebaseapp.com",
  projectId: "jcin-uniben",
  storageBucket: "jcin-uniben.firebasestorage.app",
  messagingSenderId: "443872367757",
  appId: "1:443872367757:web:8f680957eeb2ef7f8bbec4",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
