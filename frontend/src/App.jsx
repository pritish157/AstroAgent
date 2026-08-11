import React, { useState, useEffect, useRef, useMemo } from 'react';

// Configure dynamic backend API URL for production deployment (Vercel + Render)
const API_BASE = import.meta.env.VITE_API_URL || '';

// Deterministic starfield for celestial ambient background
function Starfield() {
  const stars = useMemo(() => {
    const seeded = (n) => {
      const x = Math.sin(n * 999.13) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 110 }, (_, i) => ({
      top: seeded(i + 1) * 100,
      left: seeded(i + 50) * 100,
      size: seeded(i + 99) * 2.2 + 0.6,
      delay: seeded(i + 7) * 6,
      dur: seeded(i + 3) * 4 + 3,
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-amber-100/40"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Celestial circular SVG Natal Chart Visualizer
function NatalChartVisualizer({ planets, system = 'western' }) {
  if (!planets || planets.length === 0) return null;

  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  const PLANET_GLYPHS = {
    "Sun": "⊙", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
    "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
    "Ascendant": "Asc", "Rahu": "☊", "Ketu": "☋"
  };

  const center = 160;
  const radius = 125;

  const getCoords = (degree, r = radius) => {
    const angleRad = (degree - 180) * Math.PI / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
      labelX: center + (r - 22) * Math.cos(angleRad),
      labelY: center + (r - 22) * Math.sin(angleRad)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl glass-panel relative overflow-hidden">
      <div className="flex justify-between items-center w-full mb-3 pb-2 border-b border-amber-200/10">
        <h3 className="font-serif text-sm text-amber-200 font-semibold tracking-wide flex items-center gap-1.5">
          <span className="text-amber-400">✧</span> Natal Chart Wheel ({system.toUpperCase()})
        </h3>
        <span className="text-[10px] font-mono text-amber-300/60 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          Equal House
        </span>
      </div>
      
      <div className="relative w-[290px] h-[290px]">
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            <radialGradient id="chartBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1838" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0c0a18" stopOpacity="0.95" />
            </radialGradient>
            <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0b95b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#9d4edd" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f0b95b" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle cx={center} cy={center} r={radius} fill="url(#chartBg)" stroke="url(#goldRing)" strokeWidth="1.5" />
          <circle cx={center} cy={center} r={radius - 32} fill="none" stroke="#f0b95b" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
          <circle cx={center} cy={center} r={4} fill="#f0b95b" className="animate-pulse" />

          {/* 12 House spokes & sign labels */}
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const spokeEnd = {
              x: center + radius * Math.cos(deg * Math.PI / 180),
              y: center + radius * Math.sin(deg * Math.PI / 180)
            };
            
            return (
              <g key={i}>
                <line 
                  x1={center} y1={center} 
                  x2={spokeEnd.x} y2={spokeEnd.y} 
                  stroke="#f0b95b" strokeWidth="0.5" opacity="0.2" 
                />
                <text
                  x={center + (radius + 14) * Math.cos((deg + 15 - 180) * Math.PI / 180)}
                  y={center + (radius + 14) * Math.sin((deg + 15 - 180) * Math.PI / 180)}
                  textAnchor="middle" alignmentBaseline="middle"
                  className="fill-amber-200/50 text-[9px] font-mono font-medium"
                >
                  {SIGNS[i].substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Planet Placements */}
          {planets.map((p, idx) => {
            if (p.longitude === undefined || p.longitude === null) return null;
            const coords = getCoords(p.longitude);
            const glyph = PLANET_GLYPHS[p.name] || p.name[0];
            const isAscendant = p.name === 'Ascendant';
            
            return (
              <g key={idx} className="group cursor-pointer">
                <circle 
                  cx={coords.x} cy={coords.y} 
                  r={isAscendant ? "5" : "3.5"} 
                  fill={isAscendant ? "#f0b95b" : "#fafaf9"} 
                  stroke="#f0b95b" strokeWidth="1" 
                  className="transition-all duration-300 group-hover:r-6"
                />
                <text
                  x={coords.labelX}
                  y={coords.labelY + 3}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold transition-colors ${
                    isAscendant ? 'fill-amber-300 font-extrabold' : 'fill-stone-200 group-hover:fill-amber-300'
                  }`}
                >
                  {glyph}
                </text>
                <title>{`${p.name}: ${p.sign} ${p.degree.toFixed(2)}° (House ${p.house})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Placement List Table */}
      <div className="w-full mt-4 max-h-[150px] overflow-y-auto custom-scrollbar text-xs border-t border-amber-200/10 pt-3 space-y-1">
        <div className="grid grid-cols-4 font-mono text-[10px] uppercase text-amber-300/70 border-b border-amber-200/10 pb-1">
          <span>Body</span>
          <span>Sign</span>
          <span>Degree</span>
          <span className="text-right">House</span>
        </div>
        {planets.map((p, idx) => (
          <div key={idx} className="grid grid-cols-4 font-mono text-[11px] text-stone-400 py-0.5 hover:text-amber-100 transition-colors">
            <span className="text-amber-100/90 font-medium">{p.name}</span>
            <span>{p.sign}</span>
            <span>{p.degree ? p.degree.toFixed(1) : '0'}°</span>
            <span className="text-right font-semibold text-amber-300/80">H{p.house}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Elemental Balance Component
function ElementalBalance({ planets }) {
  if (!planets || planets.length === 0) return null;

  const ELEMENT_MAP = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
  };

  const counts = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  planets.forEach(p => {
    const el = ELEMENT_MAP[p.sign];
    if (el) counts[el]++;
  });

  const total = planets.length || 1;

  const COLORS = {
    Fire: { bar: 'from-orange-500 to-amber-400', text: 'text-orange-300' },
    Earth: { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-300' },
    Air: { bar: 'from-sky-500 to-cyan-300', text: 'text-sky-300' },
    Water: { bar: 'from-indigo-500 to-purple-400', text: 'text-purple-300' }
  };

  return (
    <div className="p-4 rounded-2xl glass-panel space-y-3 text-xs">
      <h3 className="font-serif text-sm text-amber-200 font-semibold border-b border-amber-200/10 pb-2">
        Elemental Balance
      </h3>
      <div className="space-y-2.5">
        {Object.entries(counts).map(([element, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={element} className="space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span className={COLORS[element].text}>{element}</span>
                <span className="text-stone-400">{count} ({pct}%)</span>
              </div>
              <div className="w-full h-1.5 bg-stone-900/80 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${COLORS[element].bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getMessageText(content) {
  if (typeof content === 'string') return content;
  if (content === null || content === undefined) return '';
  if (typeof content === 'object') return JSON.stringify(content, null, 2);
  return String(content);
}

function parseBold(text) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-amber-200/95">{part}</strong>;
    }
    return part;
  });
}

function renderMarkdown(content) {
  const textContent = getMessageText(content);
  const lines = textContent.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-2" />;

    if (trimmed.startsWith('###')) {
      return (
        <h4 key={lineIdx} className="text-sm font-sans font-bold text-amber-300 mt-3 mb-1">
          {parseBold(trimmed.replace(/^###\s*/, ''))}
        </h4>
      );
    }
    if (trimmed.startsWith('##')) {
      return (
        <h3 key={lineIdx} className="text-base font-serif font-bold text-amber-200 mt-4 mb-2">
          {parseBold(trimmed.replace(/^##\s*/, ''))}
        </h3>
      );
    }
    if (trimmed.startsWith('#')) {
      return (
        <h2 key={lineIdx} className="text-lg font-serif font-bold text-amber-100 mt-4 mb-2 border-b border-amber-200/10 pb-1">
          {parseBold(trimmed.replace(/^#\s*/, ''))}
        </h2>
      );
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      return (
        <li key={lineIdx} className="ml-4 list-disc pl-1 text-[14px] leading-relaxed text-stone-300 mb-1 font-news">
          {parseBold(trimmed.replace(/^[-*]\s*/, ''))}
        </li>
      );
    }

    return (
      <p key={lineIdx} className="mb-2 leading-relaxed text-stone-300/90 font-news text-[15px]">
        {parseBold(line)}
      </p>
    );
  });
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(message => ({
    role: message.role || 'assistant',
    content: getMessageText(message.content),
  }));
}

export default function App() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [system, setSystem] = useState('western');
  
  const [user, setUser] = useState(null);
  const [threadId, setThreadId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sidebarTab, setSidebarTab] = useState('chart'); // 'chart' | 'balance' | 'form'
  
  const [loading, setLoading] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  const chatEndRef = useRef(null);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Session init
  useEffect(() => {
    const savedThread = localStorage.getItem('astroagent_thread_id');
    const savedUser = localStorage.getItem('astroagent_user');
    
    if (savedThread) {
      setThreadId(savedThread);
      fetch(`${API_BASE}/api/chat/history/${savedThread}`)
        .then(res => res.ok ? res.json() : { messages: [] })
        .then(data => {
          setMessages(cleanMessages(data.messages));
        })
        .catch(() => setMessages([]));
    } else {
      const newThread = 'thread_' + Math.random().toString(36).substring(2, 11);
      setThreadId(newThread);
      localStorage.setItem('astroagent_thread_id', newThread);
    }

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.birthDetails) {
          setName(parsed.name || '');
          setDate(parsed.birthDetails.date || '');
          setTime(parsed.birthDetails.time || '');
          setPlace(parsed.birthDetails.place || '');
          setSystem(parsed.birthDetails.system || 'western');
        }
      } catch {
        localStorage.removeItem('astroagent_user');
      }
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolLogs]);

  // Handle Birth Details Form
  const handleDetailsSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name || !date || !time || !place) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setErrorMessage("Birth date cannot be in the future.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setToolLogs(["Resolving birth coordinates...", "Fetching astronomical ephemeris..."]);

    try {
      const response = await fetch(`${API_BASE}/api/users/birth-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, time, place, system })
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('astroagent_user', JSON.stringify(data.user));
        setSidebarTab('chart');
        await triggerAgentIntroduction(data.user);
      } else {
        setErrorMessage(data.error || "Failed to process birth details.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error processing birth details. Please verify backend is running.");
    } finally {
      setLoading(false);
      setToolLogs([]);
    }
  };

  // Quick Load Demo Profiles (Einstein / Jung)
  const loadDemoProfile = (demoType) => {
    if (demoType === 'einstein') {
      setName('Albert Einstein');
      setDate('1879-03-14');
      setTime('11:30');
      setPlace('Ulm, Germany');
      setSystem('western');
    } else if (demoType === 'jung') {
      setName('Carl Jung');
      setDate('1875-07-26');
      setTime('19:29');
      setPlace('Kesswil, Switzerland');
      setSystem('western');
    }
  };

  const triggerAgentIntroduction = async (userRecord) => {
    setLoading(true);
    setToolLogs([`✧ Mapping planetary placements for ${userRecord.name}...`]);

    const introQuery = `Namaste. I have entered my birth details: Born ${userRecord.birthDetails.date} at ${userRecord.birthDetails.time} in ${userRecord.birthDetails.place}. Please compute my natal chart, introduce my Ascendant/Lagna, and offer a warm spiritual welcome reading.`;
    
    setMessages(prev => [...prev, { role: 'user', content: `Computed natal chart for ${userRecord.birthDetails.place}.` }]);

    try {
      await streamAgentResponse(introQuery, userRecord._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const streamAgentResponse = async (userQuery, userIdOverride = null) => {
    setToolLogs([]);
    let assistantMessageIndex = -1;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          threadId,
          userId: userIdOverride || user?._id || null
        })
      });

      if (!response.ok) throw new Error("Failed to connect to agent stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith('event:')) continue;
          
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              if (parsed.text !== undefined) {
                setMessages(prev => {
                  const updated = [...prev];
                  if (assistantMessageIndex === -1) {
                    updated.push({ role: 'assistant', content: parsed.text });
                    assistantMessageIndex = updated.length - 1;
                  } else {
                    const prevContent = updated[assistantMessageIndex]?.content || "";
                    updated[assistantMessageIndex] = { 
                      role: 'assistant', 
                      content: prevContent + parsed.text 
                    };
                  }
                  return updated;
                });
              }

              if (parsed.error !== undefined) {
                setMessages(prev => [...prev, { role: 'assistant', content: getMessageText(parsed.error) }]);
              }
              
              if (parsed.log !== undefined) {
                setToolLogs(prev => [...prev, parsed.log]);
              }
              
              if (parsed.chart !== undefined) {
                setUser(prev => {
                  const updatedUser = { ...prev, natalChart: parsed.chart };
                  localStorage.setItem('astroagent_user', JSON.stringify(updatedUser));
                  return updatedUser;
                });
              }
            } catch (e) {
              console.error("Error parsing stream token data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Namaste. The chat stream encountered a network glitch. Please try again." }]);
    } finally {
      setLoading(false);
      setToolLogs([]);
      setCooldownSeconds(6);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const query = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    await streamAgentResponse(query);
  };

  const selectSuggestion = async (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    await streamAgentResponse(text);
  };

  const resetSession = () => {
    localStorage.removeItem('astroagent_thread_id');
    localStorage.removeItem('astroagent_user');
    setUser(null);
    setMessages([]);
    setName('');
    setDate('');
    setTime('');
    setPlace('');
    setSystem('western');
    setSidebarTab('form');
    const newThread = 'thread_' + Math.random().toString(36).substring(2, 11);
    setThreadId(newThread);
    localStorage.setItem('astroagent_thread_id', newThread);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between font-sans selection:bg-amber-400/20 selection:text-amber-200">
      <Starfield />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-amber-200/10 bg-[#080711]/80 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-purple-500 to-amber-600 flex items-center justify-center text-cosmic-dark font-cinzel font-bold text-lg shadow-goldGlow animate-glow">
              ✧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-lg tracking-wider text-amber-100 font-bold">Aradhana</h1>
                <span className="text-[10px] font-mono uppercase bg-amber-400/10 text-amber-300/80 px-2 py-0.5 rounded-full border border-amber-400/20">
                  AstroAgent 2.0
                </span>
              </div>
              <p className="text-[11px] font-sans text-stone-400">Agentic AI Spiritual Companion</p>
            </div>
          </div>

          {/* Quick Demo Loader & System Indicators */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {!user && (
              <div className="hidden md:flex items-center gap-2 border-r border-amber-200/10 pr-4">
                <span className="text-stone-400 text-[11px]">Quick Demo:</span>
                <button 
                  onClick={() => { loadDemoProfile('einstein'); setSidebarTab('form'); }}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border border-amber-400/20 transition-all text-[11px]"
                >
                  ✨ Einstein
                </button>
                <button 
                  onClick={() => { loadDemoProfile('jung'); setSidebarTab('form'); }}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-400/20 transition-all text-[11px]"
                >
                  🔮 Carl Jung
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-stone-900/60 px-3 py-1.5 rounded-full border border-amber-200/10 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-stone-300">LangGraph Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 w-full py-6 flex-grow grid gap-6 lg:grid-cols-[360px_1fr]">
        
        {/* Left Sidebar Panel */}
        <aside className="space-y-4">
          
          {/* User Profile Card */}
          {user ? (
            <div className="p-4 rounded-2xl glass-panel flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Active Soul Profile</p>
                <h2 className="font-serif text-base font-semibold text-stone-100">{user.name}</h2>
                <p className="text-xs text-stone-400 font-mono mt-0.5">{user.birthDetails.place} ({user.birthDetails.system})</p>
              </div>
              <button 
                onClick={resetSession}
                className="text-[11px] font-mono text-stone-400 hover:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200/10 bg-white/[0.02] hover:bg-amber-400/10 transition-all"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl glass-panel-gold">
              <h2 className="font-serif text-sm font-semibold text-amber-200 flex items-center gap-1.5">
                <span>✦</span> Welcome to Aradhana AstroAgent
              </h2>
              <p className="text-xs text-stone-300/80 mt-1 leading-relaxed">
                Enter your birth date, time, and place to calculate your exact astronomical natal chart and chat with your spiritual companion.
              </p>
            </div>
          )}

          {/* Sidebar Tab Navigation */}
          <div className="flex bg-stone-900/80 p-1 rounded-xl border border-amber-200/10 text-xs font-mono">
            <button
              onClick={() => setSidebarTab('chart')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                sidebarTab === 'chart' 
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-400/30' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Chart Wheel
            </button>
            <button
              onClick={() => setSidebarTab('balance')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                sidebarTab === 'balance' 
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-400/30' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Elements
            </button>
            <button
              onClick={() => setSidebarTab('form')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                sidebarTab === 'form' 
                  ? 'bg-amber-500/20 text-amber-200 font-semibold border border-amber-400/30' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Birth Details
            </button>
          </div>

          {/* Sidebar Content Panels */}
          {sidebarTab === 'chart' && (
            user?.natalChart ? (
              <NatalChartVisualizer planets={user.natalChart} system={user.birthDetails?.system || system} />
            ) : (
              <div className="p-8 rounded-2xl glass-panel text-center space-y-3">
                <span className="text-3xl text-amber-400/40 animate-pulse block">☉</span>
                <p className="text-xs font-mono text-stone-400">No chart mapped yet.</p>
                <button
                  onClick={() => setSidebarTab('form')}
                  className="text-xs font-mono text-amber-300 underline hover:text-amber-200"
                >
                  Enter birth details →
                </button>
              </div>
            )
          )}

          {sidebarTab === 'balance' && (
            user?.natalChart ? (
              <ElementalBalance planets={user.natalChart} />
            ) : (
              <div className="p-8 rounded-2xl glass-panel text-center text-xs font-mono text-stone-400">
                Map birth chart to view elemental balance.
              </div>
            )
          )}

          {sidebarTab === 'form' && (
            <div className="p-5 rounded-2xl glass-panel space-y-4">
              <h3 className="font-serif text-sm font-semibold text-amber-200 border-b border-amber-200/10 pb-2">
                Birth Details Capture
              </h3>
              <form onSubmit={handleDetailsSubmit} className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="block text-amber-300/80 mb-1">YOUR NAME</label>
                  <input 
                    type="text" required placeholder="e.g. Aradhana"
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-[#141328] border border-amber-200/15 rounded-xl px-3.5 py-2.5 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-amber-300/80 mb-1">DATE OF BIRTH</label>
                    <input 
                      type="date" required
                      value={date} onChange={e => setDate(e.target.value)}
                      className="w-full bg-[#141328] border border-amber-200/15 rounded-xl px-3 py-2.5 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300/80 mb-1">TIME (24-HR)</label>
                    <input 
                      type="time" required
                      value={time} onChange={e => setTime(e.target.value)}
                      className="w-full bg-[#141328] border border-amber-200/15 rounded-xl px-3 py-2.5 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">PLACE OF BIRTH</label>
                  <input 
                    type="text" required placeholder="e.g. Mumbai, India"
                    value={place} onChange={e => setPlace(e.target.value)}
                    className="w-full bg-[#141328] border border-amber-200/15 rounded-xl px-3.5 py-2.5 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">ZODIAC SYSTEM</label>
                  <select
                    value={system} onChange={e => setSystem(e.target.value)}
                    className="w-full bg-[#141328] border border-amber-200/15 rounded-xl px-3.5 py-2.5 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="western">Western (Tropical - Equal House)</option>
                    <option value="vedic">Vedic (Sidereal - Lahiri Ayanamsa)</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400 text-cosmic-dark font-bold py-3 tracking-wider uppercase transition-all transform active:scale-95 shadow-goldGlow disabled:opacity-50"
                >
                  {loading ? 'CALCULATING EPHEMERIS...' : 'MAP NATAL CHART ✦'}
                </button>
                {errorMessage && (
                  <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    {errorMessage}
                  </p>
                )}
              </form>
            </div>
          )}
        </aside>

        {/* Right Main Panel: Agent Chat Container */}
        <section className="flex flex-col h-[78vh] lg:h-[84vh] rounded-2xl glass-panel overflow-hidden relative border border-amber-200/10">
          
          {/* Chat Header Status Bar */}
          <div className="px-6 py-3.5 border-b border-amber-200/10 bg-[#0a0916]/80 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300/80 font-medium">Spiritual Stream</span>
            </div>
            <span className="text-[10px] font-mono text-stone-500">Session Thread: {threadId}</span>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-grow p-6 overflow-y-auto space-y-5 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 max-w-lg mx-auto py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-purple-500/20 flex items-center justify-center border border-amber-400/30 shadow-goldGlow animate-float">
                  <span className="text-2xl text-amber-300">✦</span>
                </div>
                <div>
                  <h3 className="font-cinzel text-xl text-stone-100 font-bold mb-2">Greetings from Aradhana</h3>
                  <p className="text-sm font-news text-stone-300/90 leading-relaxed italic">
                    "The planets are mirrors of the soul, signaling spiritual cycles and guiding us back to our true nature."
                  </p>
                </div>

                {/* Prompt Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left text-xs font-sans pt-2">
                  <button 
                    onClick={() => selectSuggestion("Calculate my birth chart and explain my Ascendant placement.")}
                    className="p-3.5 rounded-xl glass-card-interactive space-y-1"
                  >
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span>⊙</span> Natal Chart Reading
                    </span>
                    <p className="text-stone-400 text-[11px]">Map Ascendant sign, Sun, Moon, and core placements.</p>
                  </button>
                  
                  <button 
                    onClick={() => selectSuggestion("What does Saturn in my chart say about my career and life legacy?")}
                    className="p-3.5 rounded-xl glass-card-interactive space-y-1"
                  >
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span>♄</span> Career & Legacy
                    </span>
                    <p className="text-stone-400 text-[11px]">Explore 10th house Saturn, Midheaven, and vocational duty.</p>
                  </button>

                  <button 
                    onClick={() => selectSuggestion("What are the active planet transits energy for today?")}
                    className="p-3.5 rounded-xl glass-card-interactive space-y-1"
                  >
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span>☽</span> Daily Planet Transits
                    </span>
                    <p className="text-stone-400 text-[11px]">Fetch real-time transits for personal reflection.</p>
                  </button>

                  <button 
                    onClick={() => selectSuggestion("How does Venus influence my relationships and soul connections?")}
                    className="p-3.5 rounded-xl glass-card-interactive space-y-1"
                  >
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <span>♀</span> Love & Partnerships
                    </span>
                    <p className="text-stone-400 text-[11px]">Analyze 7th house and Venus relationship alignments.</p>
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] md:max-w-[80%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-amber-300/10 border border-amber-400/30 text-stone-100 rounded-tr-none shadow-md' 
                      : 'bg-[#121124] border border-amber-200/10 text-stone-200 rounded-tl-none font-news text-base leading-relaxed shadow-lg'
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              ))
            )}

            {/* Display active running tool logs */}
            {toolLogs.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-[#121124] border border-amber-400/20 rounded-2xl rounded-tl-none px-4 py-3 space-y-1 font-mono text-[11px] text-amber-300 animate-pulse shadow-md">
                  {toolLogs.map((log, idx) => (
                    <p key={idx} className="flex items-center gap-1.5">
                      <span>⚡</span> {log}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Pulsating Astro Buffering */}
            {loading && toolLogs.length === 0 && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-[#121124] border border-amber-200/10 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs font-mono text-amber-300/70 ml-1">Tuning into cosmic planetary positions...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-4 border-t border-amber-200/10 bg-[#0a0916]/90 relative space-y-3">
            
            {/* Suggestion Pills */}
            {messages.length > 0 && !loading && cooldownSeconds === 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-mono">
                <button 
                  onClick={() => selectSuggestion("Explain my Ascendant placement.")}
                  className="px-3 py-1.5 rounded-full border border-amber-200/15 hover:border-amber-400 hover:text-amber-200 bg-white/[0.02] transition-all whitespace-nowrap"
                >
                  ✦ Ascendant Analysis
                </button>
                <button 
                  onClick={() => selectSuggestion("What does Saturn say about my career?")}
                  className="px-3 py-1.5 rounded-full border border-amber-200/15 hover:border-amber-400 hover:text-amber-200 bg-white/[0.02] transition-all whitespace-nowrap"
                >
                  ✦ Career & Saturn
                </button>
                <button 
                  onClick={() => selectSuggestion("Check my active planet transits for today.")}
                  className="px-3 py-1.5 rounded-full border border-amber-200/15 hover:border-amber-400 hover:text-amber-200 bg-white/[0.02] transition-all whitespace-nowrap"
                >
                  ✦ Today's Transits
                </button>
              </div>
            )}

            {/* Cooldown bar */}
            {cooldownSeconds > 0 && (
              <div 
                className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear shadow-goldGlow"
                style={{ width: `${(cooldownSeconds / 6) * 100}%` }}
              />
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                disabled={loading || cooldownSeconds > 0}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder={
                  cooldownSeconds > 0 
                    ? `Reflecting on your chart... Please wait ${cooldownSeconds}s` 
                    : loading 
                      ? "AstroAgent is streaming cosmic wisdom..." 
                      : "Ask AstroAgent (e.g. 'What does Moon in 10th house mean?' or greetings)..."
                }
                className={`flex-grow bg-[#131226] border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-stone-500 text-stone-100 ${
                  cooldownSeconds > 0 
                    ? 'border-amber-500/30 text-amber-200/70 font-serif italic' 
                    : 'border-amber-200/15 focus:border-amber-400'
                }`}
              />
              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0 || !inputMessage.trim()}
                className={`rounded-xl px-6 py-3 font-bold font-mono tracking-wider transition-all text-xs ${
                  cooldownSeconds > 0
                    ? 'bg-amber-500/10 border border-amber-400/20 text-amber-300/40 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400 text-cosmic-dark shadow-goldGlow disabled:opacity-30'
                }`}
              >
                {cooldownSeconds > 0 ? `${cooldownSeconds}S` : 'SEND ✦'}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 text-center text-[11px] font-mono text-stone-500 py-4 border-t border-amber-200/5">
        <p>✦ Astrology is a tool for personal reflection and spiritual self-discovery. Readings do not constitute medical, legal, or financial advice. Namaste. ✦</p>
      </footer>
    </div>
  );
}
