import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Aqui você cola exatamente o bloco que pegou no painel do Firebase
const firebaseConfig = {
  apiKey: "AIzaSy...", // substitua por todos os dados que você copiou
  authDomain: "site-maria-eduarda-....firebaseapp.com",
  projectId: "site-maria-eduarda-...",
  storageBucket: "site-maria-eduarda-...appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore (o nosso banco de dados)
export const db = getFirestore(app);