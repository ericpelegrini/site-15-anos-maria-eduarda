import React, { useState, useRef, useEffect } from 'react';
import { Camera, Gift, CheckCircle, MapPin, Calendar, Clock, Info, Upload, Heart, Wine, Wand2, Loader2, MessageSquareText, Lock, Download, Users, LogOut } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";

// Configuração Firebase
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
  const [rsvpForm, setRsvpForm] = useState({ 
    name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' 
  });

  // Carrega dados ao abrir
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, "presencas"), orderBy("data", "desc")));
        setRsvps(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Erro ao ler Firebase: ", error);
      }
    };
    carregarDados();
  }, []);

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "presencas"), {
        ...rsvpForm,
        data: new Date().toISOString()
      });
      alert('Presença confirmada com sucesso!');
      setRsvpForm({ name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' });
    } catch (e) {
      alert('Erro ao enviar, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#C7A153]" translate="no">
      {/* Aqui entra o conteúdo do seu site */}
      <button onClick={() => setActiveTab('rsvp')}>Confirmar Presença</button>
      
      {activeTab === 'rsvp' && (
        <form onSubmit={handleRsvpSubmit} className="p-4 border border-[#C7A153]">
          <input 
            type="text" 
            placeholder="Nome"
            value={rsvpForm.name}
            onChange={(e) => setRsvpForm({...rsvpForm, name: e.target.value})}
            className="text-black"
          />
          <button type="submit">Enviar</button>
        </form>
      )}
    </div>
  );
}