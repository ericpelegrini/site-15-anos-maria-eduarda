import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, MapPin, Calendar, Clock, Upload, Heart, HeartCrack, Wine, MessageSquareText, Lock, Download, Users, LogOut, XCircle, AlertCircle } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE (SEU BANCO DE DADOS OFICIAL) ---
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
  
  // --- ESTADOS DE DADOS (FIREBASE) ---
  const [rsvps, setRsvps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  
  // --- ESTADOS DO FORMULÁRIO DE PRESENÇA ---
  const [rsvpForm, setRsvpForm] = useState({ 
    name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' 
  });
  
  const fileInputRef = useRef(null);
  
  // --- ESTADOS DO LIVRO DE OURO ---
  const [currentMessage, setCurrentMessage] = useState({ author: '', text: '' });

  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminTab, setAdminTab] = useState('rsvps');
  const [isLoaded, setIsLoaded] = useState(false);

  // --- ESTADO DO MODAL FLUTUANTE (SUCESSO, PENA OU ERRO) ---
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });

  const showModal = (type, message) => setModal({ isOpen: true, type, message });
  const closeModal = () => setModal({ isOpen: false, type: 'success', message: '' });

  // --- EFEITO 1: CARREGAMENTO VISUAL TEMA DO BAILE ---
  useEffect(() => {
    document.title = "Aniversário 15 anos Maria Eduarda";
    document.documentElement.setAttribute('lang', 'pt-BR');
    document.documentElement.setAttribute('translate', 'no');

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = '/icone.png';

    const fallbackTimer = setTimeout(() => setIsLoaded(true), 1500);

    const existingScript = document.getElementById('tailwind-cdn');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      script.onload = () => { clearTimeout(fallbackTimer); setIsLoaded(true); };
      script.onerror = () => { clearTimeout(fallbackTimer); setIsLoaded(true); };
      document.head.appendChild(script);
    } else {
      clearTimeout(fallbackTimer);
      setIsLoaded(true);
    }

    return () => clearTimeout(fallbackTimer);
  }, []);

  // --- EFEITO 2: BUSCA DE DADOS DIRETAMENTE DO SEU FIREBASE ---
  useEffect(() => {
    let unsubRsvps = () => {};
    let unsubMessages = () => {};

    try {
      unsubRsvps = onSnapshot(collection(db, "presencas"), (snapshot) => {
        let dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dataList.sort((a, b) => {
          const tA = a.data ? new Date(a.data).getTime() : 0;
          const tB = b.data ? new Date(b.data).getTime() : 0;
          return tB - tA;
        });
        setRsvps(dataList);
      }, (error) => console.error("Erro ao ler RSVPs:", error));

      unsubMessages = onSnapshot(collection(db, "mensagens"), (snapshot) => {
        let dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        dataList.sort((a, b) => {
          const tA = a.data ? new Date(a.data).getTime() : 0;
          const tB = b.data ? new Date(b.data).getTime() : 0;
          return tB - tA;
        });
        setMessages(dataList);
      }, (error) => console.error("Erro ao ler Mensagens:", error));
    } catch(err) {
      console.error("Erro ao configurar banco de dados", err);
    }

    return () => {
      unsubRsvps();
      unsubMessages();
    };
  }, []);

  const handleMapOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open("https://maps.app.goo.gl/bdwsnZq7ipQEJhQL9", "_blank", "noopener,noreferrer");
  };

  // --- AÇÕES DO FORMULÁRIO DE PRESENÇA COM INTEGRAÇÃO WHATSAPP ---
  const handleRsvpSubmit = (e) => {
    e.preventDefault();

    const nomeDigitado = rsvpForm.name.trim();
    if (!nomeDigitado) {
        return showModal('error', "O Nome Completo é obrigatório.");
    }

    if (rsvpForm.child1Name.trim() && !rsvpForm.child1Age.trim()) {
        return showModal('error', "Por favor, preencha a idade do Filho 1.");
    }
    if (rsvpForm.child2Name.trim() && !rsvpForm.child2Age.trim()) {
        return showModal('error', "Por favor, preencha a idade do Filho 2.");
    }
    if (rsvpForm.child3Name.trim() && !rsvpForm.child3Age.trim()) {
        return showModal('error', "Por favor, preencha a idade do Filho 3.");
    }
    
    const isDuplicate = rsvps.some(r => r.name.toLowerCase().trim() === nomeDigitado.toLowerCase());
    if (isDuplicate) {
      return showModal('error', "Este nome já consta na nossa lista de presenças! Se precisar de alterar algo, entre em contato com a família.");
    }
    
    let totalGuests = 1; 
    if (rsvpForm.companion.trim()) totalGuests++;
    if (rsvpForm.child1Name.trim()) totalGuests++;
    if (rsvpForm.child2Name.trim()) totalGuests++;
    if (rsvpForm.child3Name.trim()) totalGuests++;
    
    // --- GERAÇÃO DA MENSAGEM AUTOMÁTICA PARA O WHATSAPP ---
    let wpText = `*NOVA RESPOSTA DE PRESENÇA - 15 ANOS DUDA* 🎭\n\n`;
    wpText += `*Convidado Principal:* ${rsvpForm.name}\n`;
    wpText += `*Status:* ${rsvpForm.attending === 'yes' ? '✅ CONFIRMADO' : '❌ NÃO PODERÁ IR'}\n`;
    
    if (rsvpForm.attending === 'yes') {
        if (rsvpForm.companion.trim()) wpText += `*Acompanhante:* ${rsvpForm.companion}\n`;
        if (rsvpForm.child1Name.trim()) wpText += `*Filho(a) 1:* ${rsvpForm.child1Name} (${rsvpForm.child1Age} anos)\n`;
        if (rsvpForm.child2Name.trim()) wpText += `*Filho(a) 2:* ${rsvpForm.child2Name} (${rsvpForm.child2Age} anos)\n`;
        if (rsvpForm.child3Name.trim()) wpText += `*Filho(a) 3:* ${rsvpForm.child3Name} (${rsvpForm.child3Age} anos)\n`;
        wpText += `\n*Total de pessoas:* ${totalGuests}`;
    }
    
    // Abrir o WhatsApp em uma nova aba antes do banco de dados (para evitar bloqueadores de pop-up)
    const numeroEsposa = "5511971030971";
    const wpUrl = `https://wa.me/${numeroEsposa}?text=${encodeURIComponent(wpText)}`;
    window.open(wpUrl, '_blank');

    // --- SALVAR NO BANCO DE DADOS FIREBASE ---
    const dataToSave = {
      ...rsvpForm,
      guests: totalGuests,
      data: new Date().toISOString()
    };
    
    addDoc(collection(db, "presencas"), dataToSave).catch((error) => {
      console.error("Erro no envio em segundo plano:", error);
    });

    // 1. ABRIR A CAIXA FLUTUANTE NO SITE
    if (rsvpForm.attending === 'yes') {
      showModal('success', "A sua presença foi confirmada com sucesso, vemo-nos no baile! (Enviamos também para o nosso WhatsApp para controle).");
    } else {
      showModal('pity', "Que pena que não poderá comparecer, a sua presença fará muita falta!");
    }
    
    // 2. LIMPAR O FORMULÁRIO
    setRsvpForm({ name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' });
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!currentMessage.author || !currentMessage.text) {
        return showModal('error', "Por favor, preencha o seu nome e a mensagem.");
    }
    
    const dataToSave = {
      author: currentMessage.author,
      text: currentMessage.text,
      data: new Date().toISOString()
    };

    showModal('success', "A sua mensagem foi deixada com carinho no Livro de Ouro!");
    setCurrentMessage({ author: '', text: '' });

    addDoc(collection(db, "mensagens"), dataToSave).catch((error) => {
      console.error("Erro ao salvar mensagem em segundo plano:", error);
    });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([{ id: Date.now(), url: reader.result, type: isVideo ? 'video' : 'image' }, ...photos]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'Maria_Eduarda' && loginForm.password === 'Duda114516!') {
      setIsAdmin(true);
    } else {
      showModal('error', 'Credenciais incorretas. Acesso negado.');
    }
  };

  const handleDownloadPhoto = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#0a0002', color: '#C7A153', fontFamily: 'sans-serif', flexDirection: 'column', gap: '20px' }}>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ width: '40px', height: '40px', border: '2px solid rgba(199, 161, 83, 0.2)', borderTop: '2px solid #C7A153', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ letterSpacing: '3px', fontSize: '10px', textTransform: 'uppercase' }}>A preparar o Baile...</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@200;300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          
          .font-script { font-family: 'Great Vibes', cursive; }
          .font-serif { font-family: 'Playfair Display', serif; }
          .font-sans { font-family: 'Montserrat', sans-serif; }
          
          .gold-gradient-text { background: linear-gradient(to right, #C7A153, #FFF0B3, #C7A153); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; }
          .glass-panel { background: rgba(20, 2, 6, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(199, 161, 83, 0.2); box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(199, 161, 83, 0.05); }
          .input-elegant { background: transparent; border: none; border-bottom: 1px solid rgba(199, 161, 83, 0.5); border-radius: 0; padding: 12px 0; color: #FFF0B3; transition: all 0.4s ease; }
          .input-elegant:focus { outline: none; border-bottom: 1px solid #C7A153; box-shadow: 0 1px 0 0 #C7A153; }
          .input-elegant::placeholder { color: rgba(199, 161, 83, 0.7); font-weight: 300; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(199, 161, 83, 0.5); border-radius: 10px; }
          
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <div className="min-h-screen text-[#C7A153] relative overflow-x-hidden font-sans custom-scrollbar" translate="no">
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/fundo.jpeg")' }}></div>
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#110103]/95 via-[#2a050b]/80 to-[#0a0002]/95"></div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 min-h-screen flex flex-col items-center">
          
          <header className="text-center mb-12 w-full flex flex-col items-center" style={{ animation: 'fadeInDown 0.8s ease-out forwards' }}>
            <h2 className="text-xs md:text-sm tracking-[0.4em] uppercase mb-6 text-[#C7A153] font-light">Os Meus 15 Anos</h2>
            <h1 className="text-7xl md:text-8xl lg:text-9xl mb-6 font-script gold-gradient-text drop-shadow-2xl font-normal tracking-wide" style={{ lineHeight: '1.2' }}>
              Maria Eduarda
            </h1>
            <div className="flex items-center justify-center gap-6 text-[#C7A153] w-full max-w-md">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#C7A153]/50"></div>
              <span className="text-sm md:text-base font-serif italic tracking-[0.1em]">Baile de Máscaras</span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#C7A153]/50"></div>
            </div>
          </header>

          <nav className="flex flex-wrap justify-center gap-6 md:gap-10 mb-12 w-full max-w-3xl relative z-10">
            {[
              { id: 'convite', label: 'Convite' },
              { id: 'presentes', label: 'Sugestões de Presente' },
              { id: 'rsvp', label: 'Presença' },
              { id: 'galeria', label: 'Galeria' },
              { id: 'recados', label: 'Livro de Ouro' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 uppercase tracking-[0.2em] text-[11px] md:text-xs transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]
                  ${activeTab === tab.id ? 'text-[#FFF0B3] border-b border-[#C7A153] font-medium drop-shadow-[0_0_8px_rgba(199,161,83,0.8)]' : 'text-[#C7A153] font-medium hover:text-[#FFF0B3] border-b border-transparent'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="w-full max-w-3xl glass-panel rounded-lg p-8 md:p-16 transition-all duration-700">
            
            {/* TAB: ADMIN (ÁREA DE CONTROLE REORGANIZADA) */}
            {activeTab === 'admin' && (
              <div className="space-y-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                {!isAdmin ? (
                  <div className="max-w-sm mx-auto text-center space-y-8">
                    <Lock className="mx-auto text-[#C7A153]" size={48} strokeWidth={1} />
                    <div>
                      <h3 className="text-3xl font-serif italic gold-gradient-text mb-2">Área Restrita</h3>
                      <p className="font-sans text-[#FFF0B3] font-light text-xs">Acesso exclusivo para a administração do evento.</p>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-6">
                      <input type="text" placeholder="Usuário" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full input-elegant text-sm text-center" />
                      <input type="password" placeholder="Senha" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full input-elegant text-sm text-center" />
                      <button type="submit" className="w-full border border-[#C7A153] text-[#FFF0B3] hover:bg-[#C7A153]/10 py-3 rounded-sm transition-all text-xs uppercase tracking-[0.2em]">Entrar</button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-[#C7A153]/20 pb-6">
                      <h3 className="text-2xl font-serif italic gold-gradient-text">Painel de Controle</h3>
                      <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#C7A153] hover:text-[#FFF0B3]"><LogOut size={14} /> Sair</button>
                    </div>

                    <div className="flex justify-center gap-4 border-b border-[#C7A153]/10 pb-4">
                      <button onClick={() => setAdminTab('rsvps')} className={`text-xs uppercase tracking-widest ${adminTab === 'rsvps' ? 'text-[#FFF0B3] font-medium border-b border-[#C7A153]' : 'text-[#C7A153] hover:text-[#FFF0B3]'}`}>Presenças</button>
                      <button onClick={() => setAdminTab('mensagens')} className={`text-xs uppercase tracking-widest ${adminTab === 'mensagens' ? 'text-[#FFF0B3] font-medium border-b border-[#C7A153]' : 'text-[#C7A153] hover:text-[#FFF0B3]'}`}>Mensagens</button>
                      <button onClick={() => setAdminTab('fotos')} className={`text-xs uppercase tracking-widest ${adminTab === 'fotos' ? 'text-[#FFF0B3] font-medium border-b border-[#C7A153]' : 'text-[#C7A153] hover:text-[#FFF0B3]'}`}>Fotos/Vídeos</button>
                    </div>

                    {adminTab === 'rsvps' && (
                      <div className="space-y-6">
                        <div className="bg-[#110103]/60 p-4 rounded-sm border border-[#C7A153]/20 flex justify-around text-center mb-4">
                          <div><span className="block text-2xl font-serif text-[#FFF0B3]">{rsvps.filter(r => r.attending === 'yes').length}</span><span className="text-[10px] text-[#C7A153] uppercase">Convites</span></div>
                          <div><span className="block text-2xl font-serif text-[#FFF0B3]">{rsvps.filter(r => r.attending === 'yes').reduce((acc, curr) => acc + (curr.guests || 1), 0)}</span><span className="text-[10px] text-[#C7A153] uppercase">Total Pessoas</span></div>
                          <div><span className="block text-2xl font-serif text-[#FFF0B3]">{rsvps.filter(r => r.attending === 'no').length}</span><span className="text-[10px] text-[#C7A153] uppercase">Ausentes</span></div>
                        </div>
                        
                        {rsvps.length === 0 ? <p className="text-center text-sm text-[#C7A153] italic">Nenhuma confirmação carregada.</p> : (
                          <div className="space-y-8">
                            
                            {/* LISTA DE CONFIRMADOS (ORGANIZADA) */}
                            <div>
                              <h4 className="text-[#FFF0B3] border-b border-[#C7A153]/30 pb-2 mb-4 text-sm uppercase tracking-widest flex items-center justify-between font-medium">
                                Lista de Convidados (Confirmados) <CheckCircle size={14} className="text-[#C7A153]" />
                              </h4>
                              
                              <div className="space-y-4">
                                {rsvps.filter(r => r.attending === 'yes').map((rsvp, idx) => (
                                  <div key={idx} className="bg-[#110103]/60 p-5 rounded-md border border-[#C7A153]/30 text-sm shadow-md transition-hover hover:border-[#C7A153]/70">
                                    
                                    {/* Cabeçalho do Card */}
                                    <div className="flex justify-between items-center mb-3 border-b border-[#C7A153]/20 pb-3">
                                      <div>
                                        <span className="text-[#FFF0B3] font-bold text-base md:text-lg block">{rsvp.name}</span>
                                        <span className="text-[10px] text-[#C7A153] uppercase tracking-wider">Convidado Principal</span>
                                      </div>
                                      <span className="text-[10px] text-[#110103] uppercase font-bold bg-[#C7A153] px-3 py-1 rounded-full">{rsvp.guests || 1} pessoa(s)</span>
                                    </div>
                                    
                                    {/* Detalhes de Acompanhantes e Filhos */}
                                    {(rsvp.companion || rsvp.child1Name || rsvp.child2Name || rsvp.child3Name) ? (
                                      <div className="space-y-2 mt-3 bg-black/30 p-3 rounded border border-[#C7A153]/10">
                                        {rsvp.companion && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-[#C7A153] font-semibold text-xs uppercase tracking-wider w-28">Acompanhante:</span> 
                                            <span className="text-[#FFF0B3] font-medium">{rsvp.companion}</span>
                                          </div>
                                        )}
                                        {rsvp.child1Name && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[#C7A153] font-semibold text-xs uppercase tracking-wider w-28">Filho(a) 1:</span> 
                                            <span className="text-[#FFF0B3] font-medium">{rsvp.child1Name} <span className="text-xs text-[#C7A153] ml-1">({rsvp.child1Age} anos)</span></span>
                                          </div>
                                        )}
                                        {rsvp.child2Name && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[#C7A153] font-semibold text-xs uppercase tracking-wider w-28">Filho(a) 2:</span> 
                                            <span className="text-[#FFF0B3] font-medium">{rsvp.child2Name} <span className="text-xs text-[#C7A153] ml-1">({rsvp.child2Age} anos)</span></span>
                                          </div>
                                        )}
                                        {rsvp.child3Name && (
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[#C7A153] font-semibold text-xs uppercase tracking-wider w-28">Filho(a) 3:</span> 
                                            <span className="text-[#FFF0B3] font-medium">{rsvp.child3Name} <span className="text-xs text-[#C7A153] ml-1">({rsvp.child3Age} anos)</span></span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-[#C7A153]/60 italic mt-3 bg-black/20 p-2 rounded">Irá sozinho(a). Sem acompanhantes ou filhos registrados.</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* LISTA DE AUSENTES */}
                            <div>
                              <h4 className="text-[#FFF0B3] border-b border-[#C7A153]/30 pb-2 mb-3 text-sm uppercase tracking-widest flex items-center justify-between font-medium">Não irão (Ausentes) <Users size={14} className="text-[#C7A153]" /></h4>
                              <div className="space-y-2">
                                {rsvps.filter(r => r.attending === 'no').map((rsvp, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-[#110103]/20 p-3 rounded-sm border border-[#C7A153]/10 text-sm opacity-70">
                                    <span className="text-[#FFF0B3] line-through">{rsvp.name}</span>
                                    <span className="text-[10px] text-red-400/80 uppercase">Não comparecerá</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {adminTab === 'mensagens' && (
                      <div className="space-y-4">
                        {messages.length === 0 ? <p className="text-center text-sm text-[#C7A153] italic">Nenhuma mensagem ainda.</p> : messages.map(msg => (
                          <div key={msg.id} className="bg-[#110103]/40 p-4 rounded-sm border border-[#C7A153]/10">
                            <p className="font-serif italic text-[#FFF0B3] text-sm mb-2">"{msg.text}"</p>
                            <p className="text-[10px] text-[#C7A153] text-right uppercase">De: {msg.author}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {adminTab === 'fotos' && (
                      <div className="space-y-4">
                        {photos.length === 0 ? <p className="text-center text-sm text-[#C7A153] italic">Nenhum registro enviado ainda.</p> : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {photos.map(photo => (
                              <div key={photo.id} className="relative group rounded-sm overflow-hidden border border-[#C7A153]/20 bg-black">
                                {photo.type === 'video' ? <video src={photo.url} className="w-full h-32 object-cover" muted /> : <img src={photo.url} className="w-full h-32 object-cover" alt="Upload" />}
                                <div className="absolute inset-0 bg-[#110103]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <button onClick={() => handleDownloadPhoto(photo.url, photo.type === 'video' ? `video_${photo.id}.mp4` : `foto_${photo.id}.jpg`)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#FFF0B3] border border-[#C7A153] px-3 py-2 bg-[#C7A153]/10"><Download size={14} /> Baixar</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: CONVITE */}
            {activeTab === 'convite' && (
              <div className="text-center space-y-12" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Venham comemorar este dia especial comigo.</h3>
                  <p className="text-[#FFF0B3] font-sans font-medium text-sm md:text-base max-w-xl mx-auto leading-loose opacity-95">
                    Será muito divertido. Separe uma roupa confortável, porém elegante, nada de calça jeans neste dia tão importante.<br/><br/>
                    <span className="italic">Não é obrigatório, mas seria interessante se for com uma máscara.</span>
                  </p>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C7A153]/50 to-transparent"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-4">
                  <div className="flex flex-col items-center gap-4">
                    <Calendar className="text-[#C7A153]" strokeWidth={1.5} size={36} />
                    <div className="space-y-1">
                      <span className="block text-xl font-serif font-medium text-[#FFF0B3]">20 de Junho</span>
                      <span className="block text-[10px] uppercase font-bold tracking-[0.3em] text-[#C7A153]">Sábado</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 relative">
                    <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#C7A153]/50 to-transparent"></div>
                    <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#C7A153]/50 to-transparent"></div>
                    <Clock className="text-[#C7A153]" strokeWidth={1.5} size={36} />
                    <div className="space-y-1">
                      <span className="block text-xl font-serif font-medium text-[#FFF0B3]">19:00h</span>
                      <span className="block text-[10px] uppercase font-bold tracking-[0.3em] text-[#C7A153]">Horário</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleMapOpen}
                    type="button"
                    className="flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300 cursor-pointer group bg-transparent border-none outline-none"
                  >
                    <MapPin className="text-[#C7A153] group-hover:text-[#FFF0B3] transition-colors" strokeWidth={1.5} size={36} />
                    <div className="space-y-1 text-center">
                      <span className="block text-xl font-serif font-medium text-[#FFF0B3] group-hover:text-[#C7A153] transition-colors">Clube Guarani</span>
                      <span className="block text-[10px] font-bold text-[#C7A153] tracking-wider group-hover:text-[#FFF0B3] transition-colors">
                        R. Taça Jules Rimet, 20<br />Salto - SP
                      </span>
                    </div>
                  </button>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C7A153]/50 to-transparent"></div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <Wine className="text-[#C7A153]" strokeWidth={1.5} size={32} />
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm leading-loose max-w-lg opacity-95">
                    Na festa serão servidos sucos, refrigerantes e águas, mas sinta-se à vontade para levar o seu cooler com a sua bebida alcoólica preferida.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: SUGESTÕES DE PRESENTE */}
            {activeTab === 'presentes' && (
              <div className="space-y-12" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                <div className="text-center space-y-4">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Sugestões de Presente</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Abaixo estão algumas sugestões com as minhas preferências. O que me der vou receber com muito amor!</p>
                </div>
                <div className="space-y-10">
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Roupa & Sapatos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Camiseta</span> <span>Tam M</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Calça/Shorts</span> <span>Tam M (Jeans 38)</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Vestido</span> <span>Tam M</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Sapatos/Tênis</span> <span>Tam 37</span></div>
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Acessórios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Brincos / Corrente / Pulseira</span> <span>Prata ou Dourado</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Anel</span> <span>Tam 16</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Bolsa</span> <span>Pequena</span></div>
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Cosméticos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex flex-col border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold mb-1">Perfumes / Cremes Hidratantes</span> <span className="text-xs">Nada amadeirado ou MUITO doce.</span></div>
                      <div className="flex flex-col border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold mb-1">Cabelo</span> <span className="text-xs">Produtos em geral.</span></div>
                      <div className="flex flex-col md:col-span-2 border-b border-[#C7A153]/30 pb-2 text-center items-center"><span className="text-[#C7A153] font-bold mb-1">Maquiagem</span> <span className="text-xs">Qualquer marca (exceto Max Love).</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center pt-8 border-t border-[#C7A153]/30">
                    <Heart className="mx-auto text-[#C7A153] mb-3" strokeWidth={1.5} size={24} />
                    <p className="text-xs font-bold text-[#C7A153] uppercase tracking-widest">Cores Favoritas: Vermelho, Rosa Bebê, Preto e Branco.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRESENÇA */}
            {activeTab === 'rsvp' && (
              <div className="max-w-md mx-auto space-y-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-serif italic gold-gradient-text font-semibold">Confirme a sua Presença</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm opacity-95">A sua presença é fundamental. Por favor, confirme até o dia 10 de Junho.</p>
                </div>

                <form onSubmit={handleRsvpSubmit} className="space-y-8 font-sans font-medium relative">
                  <div className="relative"><input type="text" required placeholder="O seu Nome Completo *" value={rsvpForm.name} onChange={(e) => setRsvpForm({...rsvpForm, name: e.target.value})} className="w-full input-elegant text-sm font-medium" /></div>
                  <div className="relative"><input type="text" placeholder="Nome do Acompanhante (Opcional)" value={rsvpForm.companion} onChange={(e) => setRsvpForm({...rsvpForm, companion: e.target.value})} className="w-full input-elegant text-sm font-medium" /></div>
                  <div className="pt-4 border-t border-[#C7A153]/40">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center drop-shadow-md">Filhos</h4>
                    <div className="space-y-4">
                      <div className="flex gap-4"><input type="text" placeholder="Nome do Filho 1" value={rsvpForm.child1Name} onChange={(e) => setRsvpForm({...rsvpForm, child1Name: e.target.value})} className="flex-1 input-elegant text-sm font-medium" /><input type="text" placeholder="Idade" value={rsvpForm.child1Age} onChange={(e) => setRsvpForm({...rsvpForm, child1Age: e.target.value})} className="w-16 input-elegant text-sm text-center font-medium" /></div>
                      <div className="flex gap-4"><input type="text" placeholder="Nome do Filho 2" value={rsvpForm.child2Name} onChange={(e) => setRsvpForm({...rsvpForm, child2Name: e.target.value})} className="flex-1 input-elegant text-sm font-medium" /><input type="text" placeholder="Idade" value={rsvpForm.child2Age} onChange={(e) => setRsvpForm({...rsvpForm, child2Age: e.target.value})} className="w-16 input-elegant text-sm text-center font-medium" /></div>
                      <div className="flex gap-4"><input type="text" placeholder="Nome do Filho 3" value={rsvpForm.child3Name} onChange={(e) => setRsvpForm({...rsvpForm, child3Name: e.target.value})} className="flex-1 input-elegant text-sm font-medium" /><input type="text" placeholder="Idade" value={rsvpForm.child3Age} onChange={(e) => setRsvpForm({...rsvpForm, child3Age: e.target.value})} className="w-16 input-elegant text-sm text-center font-medium" /></div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-[#C7A153]/40">
                    <label className="block text-center text-[#FFF0B3] font-bold mb-6 text-sm uppercase tracking-[0.3em] drop-shadow-md">Estará presente?</label>
                    <div className="flex gap-6 justify-center">
                      <label className="cursor-pointer group flex flex-col items-center gap-2">
                        <input type="radio" name="attending" value="yes" className="hidden" checked={rsvpForm.attending === 'yes'} onChange={() => setRsvpForm({...rsvpForm, attending: 'yes'})} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${rsvpForm.attending === 'yes' ? 'border-[#C7A153] bg-[#C7A153] shadow-[0_0_12px_#C7A153]' : 'border-[#C7A153] bg-transparent'}`}>{rsvpForm.attending === 'yes' && <div className="w-2 h-2 bg-[#110103] rounded-full"></div>}</div>
                        <span className={`text-xs uppercase tracking-wider transition-all ${rsvpForm.attending === 'yes' ? 'text-[#FFF0B3] font-bold' : 'text-[#C7A153] font-medium'}`}>Com certeza</span>
                      </label>
                      <label className="cursor-pointer group flex flex-col items-center gap-2">
                        <input type="radio" name="attending" value="no" className="hidden" checked={rsvpForm.attending === 'no'} onChange={() => setRsvpForm({...rsvpForm, attending: 'no'})} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${rsvpForm.attending === 'no' ? 'border-[#C7A153]' : 'border-[#C7A153] bg-transparent'}`}>{rsvpForm.attending === 'no' && <div className="w-2.5 h-2.5 bg-[#C7A153] rounded-full"></div>}</div>
                        <span className={`text-xs uppercase tracking-wider transition-all ${rsvpForm.attending === 'no' ? 'text-[#FFF0B3] font-bold' : 'text-[#C7A153] font-medium'}`}>Não poderei</span>
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="w-full mt-8 bg-gradient-to-r from-[#C7A153]/90 to-[#C7A153]/60 hover:from-[#C7A153] hover:to-[#C7A153]/80 text-[#110103] font-bold py-4 rounded-sm transition-all duration-500 text-xs uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(199,161,83,0.2)]">Enviar Resposta</button>
                </form>
              </div>
            )}

            {/* TAB: GALERIA */}
            {activeTab === 'galeria' && (
              <div className="space-y-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-serif italic gold-gradient-text font-semibold">Memórias Inesquecíveis</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Tirou uma foto ou gravou um vídeo lindo na festa? Envie aqui.</p>
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                  <div className="pt-6">
                    <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-3 border border-[#C7A153] text-[#FFF0B3] px-8 py-3 rounded-full font-bold hover:bg-[#C7A153]/20 transition-all text-xs uppercase tracking-widest"><Upload size={16} strokeWidth={2} /> Carregar</button>
                  </div>
                </div>
                {photos.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[#C7A153]/30 rounded-lg"><Camera className="mx-auto text-[#C7A153] mb-4" strokeWidth={1.5} size={40} /><p className="font-serif italic font-medium text-[#C7A153]">A galeria aguarda os primeiros registros...</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {photos.map(photo => (
                      <div key={photo.id} className="relative group rounded-sm overflow-hidden border border-[#C7A153]/20 bg-black">
                        {photo.type === 'video' ? <video src={photo.url} className="w-full h-32 object-cover" autoPlay muted loop playsInline /> : <img src={photo.url} alt="Festa" className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-[#110103]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button onClick={() => handleDownloadPhoto(photo.url, photo.type === 'video' ? `video_${photo.id}.mp4` : `foto_${photo.id}.jpg`)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#FFF0B3] border border-[#C7A153] px-3 py-2 bg-[#C7A153]/10"><Download size={14} /> Baixar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: LIVRO DE OURO SEM IA */}
            {activeTab === 'recados' && (
              <div className="space-y-10" style={{ animation: 'fadeIn 0.5s ease-out forwards' }}>
                <div className="text-center space-y-4">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Livro de Ouro</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Deixe uma mensagem especial para a Maria Eduarda.</p>
                </div>
                <div className="glass-panel p-6 md:p-10 rounded-sm space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7A153]/10 rounded-full blur-3xl"></div>
                  <div className="space-y-6 relative z-10">
                    <input type="text" placeholder="O seu Nome" value={currentMessage.author} onChange={(e) => setCurrentMessage({...currentMessage, author: e.target.value})} className="w-full input-elegant text-sm font-medium px-2" />
                    <textarea placeholder="Escreva a sua mensagem aqui..." value={currentMessage.text} onChange={(e) => setCurrentMessage({...currentMessage, text: e.target.value})} className="w-full input-elegant text-sm font-medium h-24 resize-none px-2 custom-scrollbar" />
                  </div>
                  <div className="pt-2 relative z-10 flex justify-center">
                    <button onClick={handleMessageSubmit} disabled={!currentMessage.author || !currentMessage.text} className="w-full bg-gradient-to-r from-[#C7A153]/90 to-[#C7A153]/60 hover:from-[#C7A153] hover:to-[#C7A153]/80 text-[#110103] font-bold py-4 rounded-sm transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-[0_0_15px_rgba(199,161,83,0.2)]">
                      Assinar Livro
                    </button>
                  </div>
                </div>

                <div className="space-y-6 mt-12">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-[#C7A153]/30 rounded-sm"><MessageSquareText className="mx-auto text-[#C7A153] mb-4" strokeWidth={1.5} size={48} /><p className="font-serif italic font-medium text-[#C7A153]">As páginas deste livro ainda estão em branco...</p></div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="border border-[#C7A153]/30 p-6 md:p-8 rounded-sm bg-[#110103]/60 relative group backdrop-blur-sm shadow-xl">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C7A153] to-transparent"></div>
                        <p className="font-serif italic text-[#FFF0B3] text-base md:text-lg leading-relaxed mb-6 font-medium">"{msg.text}"</p>
                        <p className="font-sans text-xs text-[#C7A153] uppercase tracking-[0.2em] text-right font-bold">~ {msg.author}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
          
          <footer className="mt-16 text-center pb-16 flex flex-col items-center gap-4 relative z-10 w-full">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C7A153]/60 font-bold">Maria Eduarda • Baile de Máscaras</p>
            <button onClick={() => setActiveTab('admin')} className="text-[#C7A153] hover:text-[#FFF0B3] transition-colors mt-2 p-2 flex items-center justify-center rounded-full hover:bg-[#C7A153]/20" title="Acesso da Administração"><Lock size={16} /></button>
          </footer>
        </div>

        {/* MODAL FLUTUANTE UNIFICADO COM AS VARIAÇÕES DE DESIGN (SUCESSO, PENA E ERRO) */}
        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0002]/90 backdrop-blur-sm p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-[#110103] border border-[#C7A153] shadow-[0_0_50px_rgba(199,161,83,0.3)] rounded-lg p-8 max-w-sm w-full text-center relative" style={{ animation: 'fadeInDown 0.4s ease-out' }}>
              <button 
                onClick={closeModal} 
                className="absolute top-4 right-4 text-[#C7A153] hover:text-[#FFF0B3] transition-colors"
                title="Fechar"
              >
                <XCircle size={24} strokeWidth={1.5} />
              </button>
              
              {/* ÍCONES: MUDA DE ACORDO COM O TIPO DE MENSAGEM */}
              {modal.type === 'success' && <CheckCircle className="mx-auto text-[#C7A153] mb-6 drop-shadow-[0_0_15px_rgba(199,161,83,0.5)]" size={64} strokeWidth={1.5} />}
              {modal.type === 'pity' && <HeartCrack className="mx-auto text-[#C7A153] mb-6 drop-shadow-[0_0_15px_rgba(199,161,83,0.5)]" size={64} strokeWidth={1.5} />}
              {modal.type === 'error' && <AlertCircle className="mx-auto text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" size={64} strokeWidth={1.5} />}
              
              <h4 className="text-3xl font-serif italic gold-gradient-text mb-4">
                {modal.type === 'success' && 'Obrigada!'}
                {modal.type === 'pity' && 'Ah, que pena...'}
                {modal.type === 'error' && 'Aviso'}
              </h4>
              
              <p className="text-sm font-sans text-[#FFF0B3] leading-relaxed mb-8 opacity-95">
                {modal.message}
              </p>
              
              <button 
                onClick={closeModal} 
                className={`w-full font-bold py-3 rounded-sm transition-all text-xs uppercase tracking-widest shadow-lg ${(modal.type === 'success' || modal.type === 'pity') ? 'bg-gradient-to-r from-[#C7A153]/90 to-[#C7A153]/60 hover:from-[#C7A153] hover:to-[#C7A153]/80 text-[#110103]' : 'border border-red-500 text-red-500 hover:bg-red-500/10'}`}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}