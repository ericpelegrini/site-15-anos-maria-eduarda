import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração oficial do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZ_JQZRNHMAoIXZ12Z3b9rTINf90t2ic1IAY",
  authDomain: "site-maria-eduarda-eaa2b.firebaseapp.com",
  projectId: "site-maria-eduarda-eaa2b",
  storageBucket: "site-maria-eduarda-eaa2b.appspot.com",
  messagingSenderId: "68809862594",
  appId: "1:68809862594:web:234f9e5f7689fbebeb2cb"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore (o nosso banco de dados)
export const db = getFirestore(app);