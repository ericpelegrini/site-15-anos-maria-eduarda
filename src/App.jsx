import React, { useState, useRef, useEffect } from 'react';
import { Camera, Gift, CheckCircle, MapPin, Calendar, Clock, Info, Upload, Heart, Wine, Wand2, Loader2, MessageSquareText, Lock, Download, Users, LogOut, XCircle } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
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
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [rsvpFeedbackMsg, setRsvpFeedbackMsg] = useState('');
  
  const fileInputRef = useRef(null);
  
  // --- ESTADOS DA INTELIGÊNCIA ARTIFICIAL (GEMINI) ---
  const apiKey = ""; // A API Key será providenciada pelo ambiente
  
  const [currentMessage, setCurrentMessage] = useState({ author: '', text: '' });
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const [maskStyle, setMaskStyle] = useState('');
  const [maskSuggestion, setMaskSuggestion] = useState('');
  const [isSuggestingMask, setIsSuggestingMask] = useState(false);

  // Novos estados para a IA de Presentes
  const [giftQuery, setGiftQuery] = useState('');
  const [giftSuggestion, setGiftSuggestion] = useState('');
  const [isSuggestingGift, setIsSuggestingGift] = useState(false);

  // Novos estados para a IA de Brindes (Discursos)
  const [toastRelation, setToastRelation] = useState('');
  const [toastSuggestion, setToastSuggestion] = useState('');
  const [isGeneratingToast, setIsGeneratingToast] = useState(false);

  // --- ESTADOS DA ÁREA RESTRITA E CARREGAMENTO ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminTab, setAdminTab] = useState('rsvps');
  const [isLoaded, setIsLoaded] = useState(false);

  // --- EFEITO INICIAL: CARREGAR DADOS E VISUAL ---
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

    // Leitura em tempo real do Firebase
    const unsubRsvps = onSnapshot(query(collection(db, "presencas"), orderBy("data", "desc")), (snapshot) => {
      setRsvps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMessages = onSnapshot(query(collection(db, "mensagens"), orderBy("data", "desc")), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubRsvps();
      unsubMessages();
    };
  }, []);

  // --- FUNÇÃO DA API DO GEMINI ---
  const callGemini = async (prompt, systemInstruction, retries = 5, delay = 1000) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(prompt, systemInstruction, retries - 1, delay * 2);
      }
      return 'Ops, a magia do baile falhou por um instante. Tente novamente mais tarde!';
    }
  };

  // --- AÇÕES DA INTELIGÊNCIA ARTIFICIAL ---
  const handleEnhanceMessage = async () => {
    if (!currentMessage.text) return;
    setIsEnhancing(true);
    const systemPrompt = "Você é um poeta de época, mestre de cerimônias de um baile de máscaras luxuoso. O utilizador escreveu uma mensagem de feliz aniversário para a Maria Eduarda, que está a fazer 15 anos. Reescreva a mensagem de forma elegante, poética, sofisticada e com um toque de mistério. Mantenha o sentimento original. Seja breve (máximo de 3 frases curtas). Responda APENAS com a mensagem reescrita sem aspas.";
    const enhanced = await callGemini(`Mensagem original: "${currentMessage.text}"`, systemPrompt);
    if (enhanced) setCurrentMessage({ ...currentMessage, text: enhanced.trim() });
    setIsEnhancing(false);
  };

  const handleMaskSuggestion = async () => {
    if (!maskStyle) return;
    setIsSuggestingMask(true);
    const systemPrompt = "Você é um figurinista de luxo especialista EXCLUSIVAMENTE em Bailes de Máscaras Venezianos. O convidado de uma festa de 15 anos descreveu o traje que vai usar. Sugira um tipo, formato e cor de máscara que combine perfeitamente. REGRA ABSOLUTA: A máscara sugerida DEVE OBRIGATORIAMENTE ser do estilo Veneziano Clássico. JAMAIS sugira máscaras de personagens de filmes, heróis ou cultura pop. Dê um nome misterioso para a máscara veneziana. Seja sofisticado. Máximo de 3 frases. Responda APENAS com a sugestão.";
    const suggestion = await callGemini(`O meu estilo/traje: "${maskStyle}"`, systemPrompt);
    if (suggestion) setMaskSuggestion(suggestion.replace(/"/g, '').trim());
    setIsSuggestingMask(false);
  };

  const handleGiftSuggestion = async () => {
    if (!giftQuery) return;
    setIsSuggestingGift(true);
    const systemPrompt = "Você é um assistente pessoal de compras para os convidados dos 15 anos da Maria Eduarda. A lista de preferências da aniversariante inclui: Roupas tam M (Calças 38, Blusas, Vestidos); Calçado tam 37; Acessórios em Prata ou Dourado (Anel tam 16, Malas pequenas); Cosméticos (Perfumes e Cremes suaves, produtos de cabelo, Maquilhagem de qualquer marca exceto Max Love); Cores favoritas: Vermelho, Rosa Bebé, Preto e Branco. O utilizador dirá quem ele é ou qual o orçamento dele. ATENÇÃO: Caso sugira algum valor, utilize SEMPRE a moeda Real (R$). Com base na lista de preferências da Duda, sugira UMA ideia de presente específica, criativa e amável. Máximo de 3 frases curtas. Responda de forma empolgante APENAS com a sugestão.";
    const suggestion = await callGemini(`O meu perfil/orçamento: "${giftQuery}"`, systemPrompt);
    if (suggestion) setGiftSuggestion(suggestion.replace(/"/g, '').trim());
    setIsSuggestingGift(false);
  };

  const handleGenerateToast = async () => {
    if (!toastRelation) return;
    setIsGeneratingToast(true);
    const systemPrompt = "Você é um mestre de cerimónias experiente de um Baile de Máscaras. O utilizador vai discursar nos 15 anos da Maria Eduarda e dirá qual é a relação que tem com ela. Escreva um brinde (discurso) muito curto (máximo de 3 a 4 frases), emocionante e sofisticado para ser lido com uma taça na mão. Responda APENAS com o texto do discurso, sem aspas.";
    const suggestion = await callGemini(`A minha relação com a Duda: "${toastRelation}"`, systemPrompt);
    if (suggestion) setToastSuggestion(suggestion.replace(/"/g, '').trim());
    setIsGeneratingToast(false);
  };

  // --- AÇÕES DE NEGÓCIO ---
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    const nomeDigitado = rsvpForm.name.trim();
    if (!nomeDigitado) {
        alert("O Nome Completo é obrigatório.");
        return;
    }

    if (rsvpForm.child1Name.trim() && !rsvpForm.child1Age.trim()) {
        alert("Por favor, preencha a idade do Filho 1.");
        return;
    }
    if (rsvpForm.child2Name.trim() && !rsvpForm.child2Age.trim()) {
        alert("Por favor, preencha a idade do Filho 2.");
        return;
    }
    if (rsvpForm.child3Name.trim() && !rsvpForm.child3Age.trim()) {
        alert("Por favor, preencha a idade do Filho 3.");
        return;
    }
    
    const isDuplicate = rsvps.some(r => r.name.toLowerCase().trim() === nomeDigitado.toLowerCase());
    if (isDuplicate) {
      alert("Este nome já consta na nossa lista de presenças! Se precisar de alterar algo, entre em contacto.");
      return;
    }
    
    try {
      let totalGuests = 1; 
      if (rsvpForm.companion.trim()) totalGuests++;
      if (rsvpForm.child1Name.trim()) totalGuests++;
      if (rsvpForm.child2Name.trim()) totalGuests++;
      if (rsvpForm.child3Name.trim()) totalGuests++;
      
      await addDoc(collection(db, "presencas"), {
        ...rsvpForm,
        guests: totalGuests,
        data: new Date().toISOString()
      });
      
      setRsvpStatus(rsvpForm.attending);
      if (rsvpForm.attending === 'yes') {
        setRsvpFeedbackMsg("A sua presença foi confirmada com sucesso, vemo-nos no baile!");
      } else {
        setRsvpFeedbackMsg("Que pena que não poderá comparecer, a sua presença fará muita falta!");
      }
      
      setRsvpForm({ name: '', companion: '', child1Name: '', child1Age: '', child2Name: '', child2Age: '', child3Name: '', child3Age: '', attending: 'yes' });
    } catch (error) {
      alert("Houve um erro ao enviar a sua confirmação. Verifique a sua ligação e tente novamente.");
    }
  };

  const handleMessageSubmit = async () => {
    if (!currentMessage.author || !currentMessage.text) {
        alert("Por favor, preencha o seu nome e a mensagem.");
        return;
    }
    try {
      await addDoc(collection(db, "mensagens"), {
        author: currentMessage.author,
        text: currentMessage.text,
        data: new Date().toISOString()
      });
      setCurrentMessage({ author: '', text: '' });
      alert("A sua mensagem foi deixada no Livro de Ouro!");
    } catch (error) {
      alert("Erro ao assinar o livro. Tente novamente.");
    }
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
      alert('Credenciais incorretas. Acesso negado.');
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
        `}
      </style>

      <div className="min-h-screen text-[#C7A153] relative overflow-x-hidden font-sans custom-scrollbar" translate="no">
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/fundo.jpeg")' }}></div>
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#110103]/95 via-[#2a050b]/80 to-[#0a0002]/95"></div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 min-h-screen flex flex-col items-center">
          
          <header className="text-center mb-12 w-full animate-fade-in-down flex flex-col items-center">
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
            
            {/* TAB: ADMIN */}
            {activeTab === 'admin' && (
              <div className="animate-fade-in space-y-10">
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

            {/* TAB: CONVITE */}
            {activeTab === 'convite' && (
              <div className="text-center space-y-12 animate-fade-in">
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Venham comemorar este dia especial comigo.</h3>
                  <p className="text-[#FFF0B3] font-sans font-medium text-sm md:text-base max-w-xl mx-auto leading-loose opacity-95">
                    Será muito divertido, separe uma roupa confortável, porém elegante, nada de calças de ganga neste dia tão importante.<br/><br/>
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
                  {/* --- ENDEREÇO CLICÁVEL --- */}
                  <a 
                    href="https://maps.app.goo.gl/tDbbY48G9B1fH6Pq8" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300 cursor-pointer group"
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
                    Na festa serão servidos sumos, refrigerantes e águas, mas sinta-se à vontade para levar a sua geleira com a sua bebida alcoólica preferida.
                  </p>
                </div>

                {/* --- IA CONSULTOR DE MÁSCARAS --- */}
                <div className="mt-12 pt-12 border-t border-[#C7A153]/30 flex flex-col items-center">
                  <h4 className="text-xl font-serif italic text-[#FFF0B3] mb-4 flex items-center gap-3 font-semibold">
                    <Wand2 size={24} className="text-[#C7A153]" /> Consultor de Máscaras
                  </h4>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm mb-6 max-w-md opacity-95">
                    Na dúvida sobre qual máscara usar? Descreva o estilo da sua roupa e a nossa Inteligência Artificial vai sugerir a máscara veneziana perfeita para a noite.
                  </p>
                  <div className="flex flex-col sm:flex-row w-full max-w-lg gap-4 relative">
                    <input type="text" value={maskStyle} onChange={(e) => setMaskStyle(e.target.value)} placeholder="Ex: Vestido comprido vinho..." className="flex-1 input-elegant text-sm text-center sm:text-left px-2" />
                    <button onClick={handleMaskSuggestion} disabled={isSuggestingMask || !maskStyle} className="border border-[#C7A153] text-[#FFF0B3] px-6 py-3 rounded-sm transition-all hover:bg-[#C7A153]/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest min-w-[140px] font-bold">
                      {isSuggestingMask ? <Loader2 size={16} className="animate-spin" /> : 'Sugerir ✨'}
                    </button>
                  </div>
                  {maskSuggestion && (
                    <div className="mt-8 p-6 glass-panel rounded-sm w-full max-w-lg animate-fade-in text-center sm:text-left relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C7A153] to-transparent"></div>
                      <p className="font-serif text-[#FFF0B3] font-medium leading-relaxed italic text-sm md:text-base">"{maskSuggestion}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SUGESTÕES DE PRESENTE */}
            {activeTab === 'presentes' && (
              <div className="animate-fade-in space-y-12">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Sugestões de Presente</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Abaixo estão algumas sugestões com as minhas preferências. O que me der vou receber com muito amor!</p>
                </div>
                <div className="space-y-10">
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Roupa & Sapatos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Camisola</span> <span>Tam M</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Calções/Calças</span> <span>Tam M (Ganga 38)</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Vestido</span> <span>Tam M</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Sapatos/Ténis</span> <span>Tam 37</span></div>
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Acessórios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Brincos / Fio / Pulseira</span> <span>Prata ou Dourado</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Anel</span> <span>Tam 16</span></div>
                      <div className="flex justify-between border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold">Mala</span> <span>Pequena</span></div>
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#FFF0B3] mb-6 text-center">Cosméticos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm font-medium text-[#FFF0B3]">
                      <div className="flex flex-col border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold mb-1">Perfumes / Cremes Hidratantes</span> <span className="text-xs">Nada amadeirado ou demasiado doce.</span></div>
                      <div className="flex flex-col border-b border-[#C7A153]/30 pb-2"><span className="text-[#C7A153] font-bold mb-1">Cabelo</span> <span className="text-xs">Produtos em geral.</span></div>
                      <div className="flex flex-col md:col-span-2 border-b border-[#C7A153]/30 pb-2 text-center items-center"><span className="text-[#C7A153] font-bold mb-1">Maquilhagem</span> <span className="text-xs">Qualquer marca (exceto Max Love).</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center pt-8 border-t border-[#C7A153]/30">
                    <Heart className="mx-auto text-[#C7A153] mb-3" strokeWidth={1.5} size={24} />
                    <p className="text-xs font-bold text-[#C7A153] uppercase tracking-widest">Cores Favoritas: Vermelho, Rosa Bebé, Preto e Branco.</p>
                  </div>
                </div>

                {/* --- IA ASSISTENTE DE PRESENTES --- */}
                <div className="mt-12 pt-12 border-t border-[#C7A153]/30 flex flex-col items-center">
                  <h4 className="text-xl font-serif italic text-[#FFF0B3] mb-4 flex items-center gap-3 font-semibold">
                    <Gift size={24} className="text-[#C7A153]" /> Assistente de Presentes
                  </h4>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm mb-6 max-w-md opacity-95 text-center">
                    Ainda com dúvidas do que oferecer? Descreva o seu orçamento ou quem é para a Duda, e a nossa IA encontra a opção ideal com base na lista de preferências!
                  </p>
                  <div className="flex flex-col sm:flex-row w-full max-w-lg gap-4 relative">
                    <input type="text" value={giftQuery} onChange={(e) => setGiftQuery(e.target.value)} placeholder="Ex: Sou a madrinha e posso gastar R$ 150..." className="flex-1 input-elegant text-sm text-center sm:text-left px-2" />
                    <button onClick={handleGiftSuggestion} disabled={isSuggestingGift || !giftQuery} className="border border-[#C7A153] text-[#FFF0B3] px-6 py-3 rounded-sm transition-all hover:bg-[#C7A153]/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest min-w-[140px] font-bold">
                      {isSuggestingGift ? <Loader2 size={16} className="animate-spin" /> : 'Descobrir ✨'}
                    </button>
                  </div>
                  {giftSuggestion && (
                    <div className="mt-8 p-6 glass-panel rounded-sm w-full max-w-lg animate-fade-in text-center sm:text-left relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C7A153] to-transparent"></div>
                      <p className="font-serif text-[#FFF0B3] font-medium leading-relaxed italic text-sm md:text-base">"{giftSuggestion}"</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: PRESENÇA (MENSAGEM DE SUCESSO OU FORMULÁRIO) */}
            {activeTab === 'rsvp' && (
              <div className="max-w-md mx-auto animate-fade-in space-y-10">
                {rsvpStatus ? (
                  <div className="text-center p-10 border border-[#C7A153]/40 rounded-sm bg-[#110103]/80 shadow-[0_0_20px_rgba(199,161,83,0.15)] animate-fade-in">
                    {rsvpStatus === 'yes' ? (
                      <CheckCircle className="mx-auto text-[#C7A153] mb-4" size={56} strokeWidth={1.5} />
                    ) : (
                      <XCircle className="mx-auto text-[#C7A153] mb-4" size={56} strokeWidth={1.5} />
                    )}
                    <h4 className="text-2xl font-serif italic text-[#FFF0B3] mb-4">Obrigada!</h4>
                    <p className="text-base font-sans text-[#FFF0B3] leading-relaxed">{rsvpFeedbackMsg}</p>
                    <button onClick={() => setRsvpStatus(null)} className="mt-8 text-[10px] uppercase tracking-[0.2em] font-bold text-[#C7A153] hover:text-[#FFF0B3] border-b border-[#C7A153] pb-1 transition-all">
                      Registar outra pessoa
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <h3 className="text-3xl font-serif italic gold-gradient-text font-semibold">Confirme a sua Presença</h3>
                      <p className="font-sans text-[#FFF0B3] font-medium text-sm opacity-95">A sua presença é fundamental. Por favor, confirme até ao dia 10 de Junho.</p>
                    </div>

                    <form onSubmit={handleRsvpSubmit} className="space-y-8 font-sans font-medium">
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
                      <button type="submit" className="w-full mt-8 border border-[#C7A153] hover:bg-[#C7A153]/20 text-[#FFF0B3] font-bold py-4 rounded-sm transition-all duration-500 text-xs uppercase tracking-[0.3em] shadow-[0_0_15px_rgba(199,161,83,0.2)]">Enviar Resposta</button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* TAB: GALERIA */}
            {activeTab === 'galeria' && (
              <div className="animate-fade-in space-y-10">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-serif italic gold-gradient-text font-semibold">Memórias Inesquecíveis</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Tirou uma foto ou gravou um vídeo lindo na festa? Envie aqui.</p>
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                  <div className="pt-6">
                    <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-3 border border-[#C7A153] text-[#FFF0B3] px-8 py-3 rounded-full font-bold hover:bg-[#C7A153]/20 transition-all text-xs uppercase tracking-widest"><Upload size={16} strokeWidth={2} /> Carregar</button>
                  </div>
                </div>
                {photos.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[#C7A153]/30 rounded-lg"><Camera className="mx-auto text-[#C7A153] mb-4" strokeWidth={1.5} size={40} /><p className="font-serif italic font-medium text-[#C7A153]">A galeria aguarda os primeiros registos...</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {photos.map(photo => (
                      <div key={photo.id} className="aspect-square overflow-hidden rounded-sm border border-[#C7A153]/30 group relative bg-black">
                        {photo.type === 'video' ? <video src={photo.url} className="w-full h-full object-cover" autoPlay muted loop playsInline /> : <img src={photo.url} alt="Festa" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: LIVRO DE OURO E IA */}
            {activeTab === 'recados' && (
              <div className="animate-fade-in space-y-10">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl md:text-4xl font-serif italic gold-gradient-text font-semibold">Livro de Ouro</h3>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm max-w-lg mx-auto opacity-95">Deixe uma mensagem especial para a Maria Eduarda.</p>
                </div>
                <div className="glass-panel p-6 md:p-10 rounded-sm space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C7A153]/10 rounded-full blur-3xl"></div>
                  <div className="space-y-6 relative z-10">
                    <input type="text" placeholder="O seu Nome" value={currentMessage.author} onChange={(e) => setCurrentMessage({...currentMessage, author: e.target.value})} className="w-full input-elegant text-sm font-medium px-2" />
                    <textarea placeholder="Escreva a sua mensagem simples aqui..." value={currentMessage.text} onChange={(e) => setCurrentMessage({...currentMessage, text: e.target.value})} className="w-full input-elegant text-sm font-medium h-24 resize-none px-2 custom-scrollbar" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-2">
                    <button onClick={handleEnhanceMessage} disabled={isEnhancing || !currentMessage.text} className="flex-1 border border-[#C7A153] text-[#FFF0B3] bg-[#C7A153]/10 hover:bg-[#C7A153]/30 font-bold py-4 rounded-sm transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                      {isEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} Deixar Poético ✨
                    </button>
                    <button onClick={handleMessageSubmit} disabled={!currentMessage.author || !currentMessage.text} className="flex-1 bg-gradient-to-r from-[#C7A153]/90 to-[#C7A153]/60 hover:from-[#C7A153] hover:to-[#C7A153]/80 text-[#110103] font-bold py-4 rounded-sm transition-all text-xs uppercase tracking-widest disabled:opacity-50">
                      Assinar Livro
                    </button>
                  </div>
                </div>

                {/* --- IA GERADOR DE BRINDES / DISCURSOS --- */}
                <div className="mt-12 pt-12 border-t border-[#C7A153]/30 flex flex-col items-center">
                  <h4 className="text-xl font-serif italic text-[#FFF0B3] mb-4 flex items-center gap-3 font-semibold">
                    <Wine size={24} className="text-[#C7A153]" /> Mestre de Cerimónias
                  </h4>
                  <p className="font-sans text-[#FFF0B3] font-medium text-sm mb-6 max-w-md opacity-95 text-center">
                    Vai erguer a sua taça durante a festa e está sem inspiração? Diga qual é a sua relação com a aniversariante e a IA escreverá um brinde emocionante para ler no momento!
                  </p>
                  <div className="flex flex-col sm:flex-row w-full max-w-lg gap-4 relative">
                    <input type="text" value={toastRelation} onChange={(e) => setToastRelation(e.target.value)} placeholder="Ex: Sou o padrinho babão..." className="flex-1 input-elegant text-sm text-center sm:text-left px-2" />
                    <button onClick={handleGenerateToast} disabled={isGeneratingToast || !toastRelation} className="border border-[#C7A153] text-[#FFF0B3] px-6 py-3 rounded-sm transition-all hover:bg-[#C7A153]/20 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest min-w-[140px] font-bold">
                      {isGeneratingToast ? <Loader2 size={16} className="animate-spin" /> : 'Escrever Brinde ✨'}
                    </button>
                  </div>
                  {toastSuggestion && (
                    <div className="mt-8 p-6 glass-panel rounded-sm w-full max-w-lg animate-fade-in text-center sm:text-left relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C7A153] to-transparent"></div>
                      <p className="font-serif text-[#FFF0B3] font-medium leading-relaxed italic text-sm md:text-base">"{toastSuggestion}"</p>
                    </div>
                  )}
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
      </div>
    </>
  );
}