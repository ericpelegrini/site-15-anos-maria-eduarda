import React, { useState, useRef, useEffect } from 'react';
import { Camera, Gift, CheckCircle, MapPin, Calendar, Clock, Info, Upload, Heart, Wine, Wand2, Loader2, MessageSquareText, Lock, Download, Users, LogOut } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

// Conexão Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZ_JQZRNHMAoIXZ12Z3b9rTINf90t2ic1IAY",
  authDomain: "site-maria-eduarda-eaa2b.firebaseapp.com",
  projectId: "site-maria-eduarda-eaa2b",
  storageBucket: "site-maria-eduarda-eaa2b.appspot.com",
  messagingSenderId: "68809862594",
  appId: "1:68809862594:web:234f9e5f7689fbebeb2cb"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('convite');
  const [rsvps, setRsvps] = useState([]);
  const [messages, setMessages] = useState([]);
  
  const [rsvpForm, setRsvpForm] = useState({ 
    name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' 
  });

  // Carregar dados reais do Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const rsvpSnapshot = await getDocs(query(collection(db, "presencas"), orderBy("data", "desc")));
        setRsvps(rsvpSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const msgSnapshot = await getDocs(query(collection(db, "mensagens"), orderBy("data", "desc")));
        setMessages(msgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("Erro ao conectar Firebase", e); }
    };
    fetchData();
  }, []);

  // Enviar confirmação para o Firebase
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "presencas"), { ...rsvpForm, data: new Date().toISOString() });
      alert('Confirmação enviada!');
      setRsvpForm({ name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' });
    } catch (e) { alert('Erro ao salvar'); }
  };

  return (
    <div className="min-h-screen text-[#C7A153] font-sans" translate="no">
      {/* AQUI VOCÊ MANTÉM SEU DESIGN - O código abaixo ilustra a integração funcional */}
      
      {activeTab === 'rsvp' && (
        <form onSubmit={handleRsvpSubmit} className="max-w-md mx-auto p-6 bg-[#110103] border border-[#C7A153]">
          <input className="block w-full mb-2 bg-black border border-[#C7A153] p-2" placeholder="Nome" value={rsvpForm.name} onChange={(e) => setRsvpForm({...rsvpForm, name: e.target.value})} />
          <button type="submit" className="w-full bg-[#C7A153] text-black py-2">Confirmar Presença</button>
        </form>
      )}

      {activeTab === 'restrita' && (
        <div className="p-6">
          <h2 className="text-2xl mb-4">Lista de Convidados</h2>
          {rsvps.map(r => <div key={r.id} className="p-2 border-b border-[#C7A153]/30">{r.name}</div>)}
        </div>
      )}
    </div>
  );
}