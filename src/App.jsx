import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, MapPin, Calendar, Clock, Upload, Heart, HeartCrack, Wine, MessageSquareText, Lock, Download, Users, LogOut, XCircle, AlertCircle } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

// --- NOVAS CREDENCIAIS DO FIREBASE DO ERIC ---
const firebaseConfig = {
  apiKey: "AIzaSyBlBK9Xne3t9JldmT5zfJd_JT007aaMPrg",
  authDomain: "site-maria-eduarda-novo.firebaseapp.com",
  projectId: "site-maria-eduarda-novo",
  storageBucket: "site-maria-eduarda-novo.firebasestorage.app",
  messagingSenderId: "396088146162",
  appId: "1:396088146162:web:186411df9f5a8cc5b8f86b",
  measurementId: "G-817HE2B0WC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('convite');
  
  const [rsvps, setRsvps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [photos, setPhotos] = useState([]);
  
  const [rsvpForm, setRsvpForm] = useState({ 
    name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' 
  });
  
  const fileInputRef = useRef(null);
  const [currentMessage, setCurrentMessage] = useState({ author: '', text: '' });

  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminTab, setAdminTab] = useState('rsvps');
  const [isLoaded, setIsLoaded] = useState(false);

  // Estado que gerencia a nossa Caixa Flutuante bonita
  const [modal, setModal] = useState({ isOpen: false, type: 'success', message: '' });

  const showModal = (type, message) => setModal({ isOpen: true, type, message });
  const closeModal = () => setModal({ isOpen: false, type: 'success', message: '' });

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
      return showModal('error', "Este nome já consta na nossa lista de presenças! Se precisar alterar algo, entre em contato com a família.");
    }
    
    let totalGuests = 1; 
    if (rsvpForm.companion.trim()) totalGuests++;
    if (rsvpForm.child1Name.trim()) totalGuests++;
    if (rsvpForm.child2Name.trim()) totalGuests++;
    if (rsvpForm.child3Name.trim()) totalGuests++;
    
    // Geração do texto para a sua esposa
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
    
    // Abrir o WhatsApp
    const numeroEsposa = "5511971030971";
    const wpUrl = `https://wa.me/${numeroEsposa}?text=${encodeURIComponent(wpText)}`;
    window.open(wpUrl, '_blank');

    // Dados a serem salvos em segundo plano
    const dataToSave = {
      ...rsvpForm,
      guests: totalGuests,
      data: new Date().toISOString()
    };
    
    addDoc(collection(db, "presencas"), dataToSave).catch((error) => {
      console.error("Erro no envio em segundo plano:", error);
    });

    // Abrir a caixa flutuante instantaneamente com as frases certas
    if (rsvpForm.attending === 'yes') {
      showModal('success', "Sua presença foi confirmada com sucesso, nos vemos no baile!");
    } else {
      showModal('pity', "Que pena que você não poderá comparecer, sua presença fará muita falta!");
    }
    
    // Limpar os campos do formulário
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

      {}
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
            
            {}
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
                      <input type="text" placeholder="Utilizador" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full input-elegant text-sm text-center" />
                      <input type="password" placeholder="Palavra-passe" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full input-elegant text-sm text-center" />
                      <button type="submit" className="w-full border border-[#C7A153] text-[#FFF0B3] hover:bg-[#C7A153]/10 py-3 rounded-sm transition-all text-xs uppercase tracking-[0.2em]">Entrar</button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center border-b border-[#C7A153]/20 pb-6">
                      <h3 className="text-2xl font-serif italic gold-gradient-text">Painel de Controlo</h3>
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
                          <div><span className="block text-2xl font-serif text-[#FFF0B3]">{rsvps.filter(r => r.attending === 'yes').reduce((acc, curr) => acc + (curr.guests || 1), 0)}</span><span className="text-[10px] text-[#C7A153] uppercase">Total de Pessoas</span></div>
                          <div><span className="block text-2xl font-serif text-[#FFF0B3]">{rsvps.filter(r => r.attending === 'no').length}</span><span className="text-[10px] text-[#C7A153] uppercase">Ausentes</span></div>
                        </div>
                        
                        {rsvps.length === 0 ? <p className="text-center text-sm text-[#C7A153] italic">Nenhuma confirmação ainda.</p> : (
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[#FFF0B3] border-b border-[#C7A153]/30 pb-2 mb-3 text-sm uppercase tracking-widest flex items-center justify-between font-medium">Lista de Convidados (Confirmados) <CheckCircle size={14} className="text-[#C7A153]" /></h4>
                              <div className="space-y-3">
                                {rsvps.filter(r => r.attending === 'yes').map((rsvp, idx) => (
                                  <div key={idx} className="flex flex-col bg-[#110103]/40 p-4 rounded-sm border border-[#C7A153]/10 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-[#FFF0B3] font-medium">{rsvp.name}</span>
                                      <span className="text-[10px] text-[#C7A153] uppercase font-bold bg-[#C7A153]/10 px-2 py-1 rounded-sm">{rsvp.guests || 1} pessoa(s)</span>
                                    </div>
                                    {(rsvp.companion || rsvp.child1Name || rsvp.child2Name || rsvp.child3Name) && (
                                      <div className="pl-3 border-l-2 border-[#C7A153]/20 space-y-1 mt-1">
                                        {rsvp.companion && <span className="block text-xs text-[#FFF0B3]"><span className="text-[#C7A153]">Companheiro(a):</span> {rsvp.companion}</span>}
                                        {rsvp.child1Name && <span className="block text-xs text-[#FFF0B3]"><span className="text-[#C7A153]">Filho(a) 1:</span> {rsvp.child1Name} <span className="text-[10px] text-[#C7A153]">({rsvp.child1Age} anos)</span></span>}
                                        {rsvp.child2Name && <span className="block text-xs text-[#FFF0B3]"><span className="text-[#C7A153]">Filho(a) 2:</span> {rsvp.child2Name} <span className="text-[10px] text-[#C7A153]">({rsvp.child2Age} anos)</span></span>}
                                        {rsvp.child3Name && <span className="block text-xs text-[#FFF0B3]"><span className="text-[#C7A153]">Filho(a) 3:</span> {rsvp.child3Name} <span className="text-[10px] text-[#C7A153]">({rsvp.child3Age} anos)</span></span>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[#FFF0B3] border-b border-[#C7A153]/30 pb-2 mb-3 text-sm uppercase tracking-widest flex items-center justify-between font-medium">Não irão (Ausentes) <Users size={14} className="text-[#C7A153]" /></h4>
                              <div className="space-y-2">
                                {rsvps.filter(r => r.attending === 'no').map((rsvp, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-[#110103]/20 p-3 rounded-sm border border-[#C7A153]/5 text-sm opacity-60">
                                    <span className="text-[#FFF0B3] line-through">{rsvp.name}</span>
                                    <span className="text-[10px] text-[#C7A153] uppercase">Não comparecerá</span>
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
                        {photos.length === 0 ? <p className="text-center text-sm text-[#C7A153] italic">Nenhum registo enviado ainda.</p> : (
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

            {}
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
                  
                  {/* ENDEREÇO CLICÁVEL (GOOGLE MAPS) */}
                  <a 
                    href="https://maps.app.goo.gl/bdwsnZq7ipQEJhQL9" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300 cursor-pointer group"
                    style={{ textDecoration: 'none' }}
                  >
                    <MapPin className="text-[#C7A153] group-hover:text-[#FFF0B3] transition-colors" strokeWidth={1.5} size={36} />
                    <div className="space-y-1 text-center">
                      <span className="block text-xl font-serif font-medium text-[#FFF0B3] group-hover:text-[#C7A153] transition-colors">Clube Guarani</span>
                      <span className="block text-[10px] font-bold text-[#C7A153] tracking-wider group-hover:text-[#FFF0B3] transition-colors">
                        R. Taça Jules Rimet, 20<br />Salto - SP
                      </span>
                    </div>
                  </a>
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

            {}
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

            {}
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
                  <div