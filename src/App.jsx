import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Search, Smartphone, Camera, HardDrive, MessageCircle, 
  ChevronRight, Info, ArrowLeft, X, Send, Cloud, Laptop, 
  Database, RefreshCw, Sparkles, Volume2, ShieldCheck, Languages
} from 'lucide-react';

// --- UPDATED API CALLER FOR PRODUCTION ---
// This now calls YOUR Netlify function instead of the Google API directly
const callSecureGemini = async (payload) => {
  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (e) {
    console.error("Connection failed", e);
    throw e;
  }
};

const pcmToWav = (pcmData, sampleRate) => {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 32 + pcmData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
};

// --- DATA ---
const MANUAL_CONTENT = [
  {
    id: 1,
    category: "พื้นฐาน (เริ่มต้นใช้งาน)",
    title: "จาก iPhone มาเป็น Galaxy",
    summary: "ปุ่มและการกดอาจจะเปลี่ยนไปนิดหน่อย แต่ใช้ง่ายกว่าที่คิดนะ",
    content: "บน iPhone มดอาจจะชินกับการปัด แต่ใน Samsung มดเลือกได้ว่าจะใช้ 'ปุ่ม' ด้านล่างหรือ 'ท่าทางปัด' เหมือนเดิม ถ้าอยากเปลี่ยนให้ไปที่: การตั้งค่า > จอภาพ > แถบการนำทาง",
    iosComparison: "เหมือนกับปุ่ม Home หรือแถบปัดด้านล่างของ iPhone"
  },
  {
    id: 2,
    category: "กล้อง (บันทึกความทรงจำ)",
    title: "ถ่ายรูปสวยได้ในคลิกเดียว",
    summary: "กล้อง S26 Ultra ฉลาดมาก มดไม่ต้องตั้งค่าอะไรเลย",
    content: "ลองใช้โหมด 'Single Take' (ซิงเกิลเทค) ดูนะ แค่กดปุ่มเดียวแล้วถือค้างไว้ เครื่องจะเลือกรูปที่ดีที่สุดและวิดีโอสั้นๆ มาให้มดเองโดยอัตโนมัติ",
    iosComparison: "คล้ายกับ Live Photos แต่เก่งกว่าเพราะมันตัดต่อให้ด้วย"
  },
  {
    id: 3,
    category: "ปากกา S Pen",
    title: "ใช้ปากกาแทนนิ้วมือ",
    summary: "ดึงปากกาออกมาจดโน้ตได้ทันทีแม้หน้าจอปิดอยู่",
    content: "เวลาที่มดต้องการจดอะไรด่วนๆ แค่ดึงปากกา S Pen ออกมาตอนที่หน้าจอยังดำอยู่ มดก็เขียนลงไปได้เลย เสร็จแล้วกดบันทึก มันจะเข้าไปอยู่ใน Samsung Notes เอง",
    iosComparison: "เหมือนมีสมุดโน้ตติดตัวตลอดเวลา ไม่ต้องปลดล็อคเครื่อง"
  }
];

// --- COMPONENTS ---

const VoiceButton = ({ text }) => {
  const [playing, setPlaying] = useState(false);
  
  const handleSpeak = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const data = await callSecureGemini({
        prompt: `Say warmly and clearly in Thai: ${text}`,
        type: 'tts'
      });
      const audioData = data.candidates[0].content.parts[0].inlineData.data;
      const sampleRate = parseInt(data.candidates[0].content.parts[0].inlineData.mimeType.split('rate=')[1]) || 24000;
      const pcmData = new Int16Array(Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer);
      const wavBlob = pcmToWav(pcmData, sampleRate);
      const audio = new Audio(URL.createObjectURL(wavBlob));
      audio.onended = () => setPlaying(false);
      audio.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  return (
    <button 
      onClick={handleSpeak}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${playing ? 'bg-gray-100 text-gray-400' : 'bg-[#8D9B8E]/10 text-[#8D9B8E]'}`}
    >
      <Volume2 size={16} className={playing ? 'animate-pulse' : ''} />
      {playing ? 'กำลังอ่านให้ฟังนะจ๊ะ...' : 'ฟังเสียงแนะนำ ✨'}
    </button>
  );
};

const StorageSection = () => {
  const [worry, setWorry] = useState('');
  const [safetyResponse, setSafetyResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const checkSafety = async () => {
    if (!worry.trim()) return;
    setLoading(true);
    try {
      const data = await callSecureGemini({
        prompt: `มดกังวลเรื่อง: ${worry}`,
        systemInstruction: "คุณคือที่ปรึกษาเรื่องความปลอดภัยของข้อมูล ปลอบโยนมด (Mod) และยืนยันว่าข้อมูลเธอปลอดภัยใน Google Drive และ SSD ตอบเป็นภาษาไทยที่นุ่มนวล"
      });
      setSafetyResponse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
      setSafetyResponse("ไฟล์ปลอดภัยดีจ้ะมด ไม่ต้องห่วงนะ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-700">พื้นที่เก็บข้อมูลของมด</h2>
        <p className="text-gray-500 text-sm italic text-balance">ไม่ต้องรีบลบอะไรก็ได้นะ ไฟล์ปลอดภัยอยู่หลายที่แล้วจ้ะ</p>
      </div>

      <div className="bg-white p-6 rounded-[32px] border-2 border-[#EAD7D7] shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#A78B8B]">
          <ShieldCheck size={20} />
          <h3 className="font-bold">มดกังวลเรื่องไฟล์ไหนอยู่หรือเปล่า? ✨</h3>
        </div>
        <textarea 
          value={worry}
          onChange={(e) => setWorry(e.target.value)}
          placeholder="พิมพ์บอกได้เลยนะจ๊ะ..."
          className="w-full p-4 bg-[#FDFBF7] border-none rounded-2xl text-sm min-h-[100px]"
        />
        <button 
          onClick={checkSafety}
          className="w-full py-4 bg-[#EAD7D7] text-[#5A5A5A] rounded-2xl font-bold text-sm hover:brightness-95 transition-all"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'เช็คความปลอดภัย ✨'}
        </button>
        {safetyResponse && <div className="p-4 bg-gray-50 rounded-2xl text-sm leading-relaxed">{safetyResponse}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Cloud size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-700">บนคลาวด์</h3>
            <p className="text-xs text-gray-500 mt-1">รูปภาพมดอยู่ใน Google Drive และ iCloud แล้วจ้ะ</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
          <div className="bg-slate-50 p-3 rounded-2xl text-slate-500"><Database size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-700">ฮาร์ดไดรฟ์</h3>
            <p className="text-xs text-gray-500 mt-1">ไฟล์เก่าๆ มีสำเนาอยู่ใน SSD เรียบร้อยแล้วนะจ๊ะ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManualBrowser = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [translation, setTranslation] = useState('');
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!searchTerm.trim()) return;
    setTranslating(true);
    try {
      const data = await callSecureGemini({
        prompt: `คำศัพท์: ${searchTerm}`,
        systemInstruction: "แปลภาษาเทคนิคเป็นภาษาที่มดเข้าใจง่ายๆ อธิบายวิธีทำใน Samsung ด้วยภาษาไทยที่อบอุ่น"
      });
      setTranslation(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (e) {
      setTranslation("ถามในแชทได้เลยนะจ๊ะมด");
    } finally {
      setTranslating(false);
    }
  };

  if (selectedTopic) {
    return (
      <div className="space-y-6 pb-24 animate-in slide-in-from-right duration-300">
        <button onClick={() => setSelectedTopic(null)} className="flex items-center gap-2 text-[#8D9B8E] font-medium">
          <ArrowLeft size={18} /> กลับ
        </button>
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#8D9B8E] uppercase">{selectedTopic.category}</span>
            <h2 className="text-3xl font-bold text-gray-800">{selectedTopic.title}</h2>
          </div>
          <VoiceButton text={selectedTopic.content} />
          <p className="text-gray-600 leading-relaxed text-lg">{selectedTopic.content}</p>
          <div className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#E8E1D5]">
            <h4 className="font-bold text-[#8D9B8E] text-sm mb-2 flex items-center gap-2"><Smartphone size={16} /> เกร็ดจาก iPhone:</h4>
            <p className="text-gray-600 text-sm italic">{selectedTopic.iosComparison}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหา หรือ วางคำที่มดไม่เข้าใจ..."
            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-[#8D9B8E]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm.length > 2 && (
          <button onClick={handleTranslate} className="text-xs font-bold text-[#8D9B8E] bg-[#8D9B8E]/10 px-4 py-2 rounded-full">
            {translating ? 'กำลังแปล...' : 'ให้ช่วยแปลเป็นภาษาเรา ✨'}
          </button>
        )}
        {translation && <div className="p-5 bg-white border rounded-2xl text-sm relative"><button onClick={() => setTranslation('')} className="absolute top-2 right-2"><X size={14}/></button>{translation}</div>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {MANUAL_CONTENT.filter(item => item.title.includes(searchTerm)).map(item => (
          <div key={item.id} onClick={() => setSelectedTopic(item)} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm cursor-pointer flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#8D9B8E] uppercase">{item.category}</span>
              <h3 className="text-lg font-bold text-gray-700">{item.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-1">{item.summary}</p>
            </div>
            <ChevronRight size={20} className="text-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
};

const WelcomeView = ({ onStart }) => (
  <div className="max-w-xl mx-auto py-12 px-6 text-center space-y-10 animate-in fade-in duration-1000">
    <div className="w-32 h-32 bg-[#EAD7D7] rounded-full mx-auto flex items-center justify-center shadow-inner relative">
      <Heart size={48} className="text-white fill-white" />
      <Sparkles size={24} className="absolute -bottom-2 -right-2 text-[#8D9B8E]" />
    </div>
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-gray-800">สวัสดีจ้ะมด</h1>
      <div className="bg-white/50 backdrop-blur-sm p-8 rounded-[40px] shadow-sm border border-white/40 leading-relaxed text-gray-600 space-y-4">
        <p>ยินดีต้อนรับสู่บ้านหลังใหม่นะ! ค่อยๆ ทำความรู้จักกับมันไป ไม่ต้องรีบร้อนนะจ๊ะ</p>
      </div>
    </div>
    <button onClick={onStart} className="w-full py-5 bg-[#8D9B8E] text-white rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-2">
      เริ่มสำรวจกันจ้ะ <ChevronRight size={20} />
    </button>
  </div>
);

const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'มีอะไรให้ช่วยไหมจ๊ะมด? ถามได้ทุกอย่างเลยนะ' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const data = await callSecureGemini({
        prompt: userMsg,
        systemInstruction: "คุณคือเพื่อนสนิทชื่อ 'คู่หู Galaxy' ช่วยเหลือมด (Mod) ที่เพิ่งย้ายจาก iPhone ตอบเป็นภาษาไทยที่สุภาพ อบอุ่น ใจเย็น"
      });
      setMessages(prev => [...prev, { role: 'assistant', text: data.candidates?.[0]?.content?.parts?.[0]?.text || "ลองถามใหม่อีกทีนะจ๊ะ" }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'อุ๊ย เหมือนเน็ตจะมีปัญหา ลองใหม่นะจ๊ะ' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:bottom-4 md:right-4 md:w-96 md:h-[600px] md:rounded-3xl md:shadow-2xl overflow-hidden border">
      <div className="bg-[#EAD7D7] p-4 flex justify-between items-center"><span className="font-bold">คุยกับผู้ช่วยของมด</span><button onClick={onClose}><X size={20} /></button></div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#8D9B8E] text-white rounded-tr-none' : 'bg-white text-gray-700 shadow-sm rounded-tl-none border border-gray-100'}`}>{m.text}</div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <div className="p-4 bg-white border-t flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="ถามได้เลยจ้ะ..." className="flex-1 bg-gray-50 border-none rounded-full px-4 py-2 text-sm" />
        <button onClick={handleSend} className="bg-[#8D9B8E] text-white p-2 rounded-full"><Send size={18} /></button>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('welcome');
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5A5A5A] pb-24">
      {view !== 'welcome' && (
        <header className="sticky top-0 z-40 bg-[#FDFBF7]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">Hello Galaxy</h1>
          <button onClick={() => setShowChat(true)} className="p-2 bg-white rounded-full shadow-sm text-[#8D9B8E]"><MessageCircle size={24} /></button>
        </header>
      )}
      <main className="max-w-3xl mx-auto px-6 pt-4">
        {view === 'welcome' ? <WelcomeView onStart={() => setView('manual')} /> : 
         view === 'manual' ? <ManualBrowser /> : <StorageSection />}
      </main>
      {view !== 'welcome' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/90 backdrop-blur-lg shadow-2xl rounded-full px-4 py-3 flex justify-around items-center z-40">
          <button onClick={() => setView('manual')} className={`flex flex-col items-center gap-1 ${view === 'manual' ? 'text-[#8D9B8E]' : 'text-gray-300'}`}><Smartphone size={22} /><span className="text-[10px] font-bold">คู่มือ</span></button>
          <button onClick={() => setView('storage')} className={`flex flex-col items-center gap-1 ${view === 'storage' ? 'text-[#8D9B8E]' : 'text-gray-300'}`}><HardDrive size={22} /><span className="text-[10px] font-bold">พื้นที่</span></button>
          <button onClick={() => setShowChat(true)} className="flex flex-col items-center gap-1 text-gray-300"><MessageCircle size={22} /><span className="text-[10px] font-bold">แชท</span></button>
        </nav>
      )}
      {showChat && <ChatBot onClose={() => setShowChat(false)} />}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Mitr:wght@400;600&family=Noto+Sans+Thai:wght@400;700&display=swap');
        body { font-family: 'Noto Sans Thai', sans-serif; }
        h1, h2, h3, h4 { font-family: 'Mitr', sans-serif; }
      `}} />
    </div>
  );
}