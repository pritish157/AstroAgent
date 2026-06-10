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
    return Array.from({ length: 80 }, (_, i) => ({
      top: seeded(i + 1) * 100,
      left: seeded(i + 50) * 100,
      size: seeded(i + 99) * 2 + 0.6,
      delay: seeded(i + 7) * 6,
      dur: seeded(i + 3) * 4 + 3,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-amber-100/50"
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
function NatalChartVisualizer({ planets }) {
  if (!planets || planets.length === 0) return null;

  // Sign names and standard colors
  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  const PLANET_GLYPHS = {
    "Sun": "⊙", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
    "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
    "Ascendant": "Asc", "Rahu": "☊", "Ketu": "☋"
  };

  const center = 150;
  const radius = 120;

  // Calculate coordinates on the circle
  const getCoords = (degree) => {
    // Math.cos/sin takes radians. Ecliptic longitude 0 starts at East (0 rad)
    // Astrological charts usually place Ascendant on Left (180 deg) or top
    // Let's place Ascendant precisely at the Left Horizon (180 degrees) for standard charting!
    const angleRad = (degree - 180) * Math.PI / 180;
    return {
      x: center + radius * Math.cos(angleRad),
      y: center + radius * Math.sin(angleRad),
      labelX: center + (radius - 20) * Math.cos(angleRad),
      labelY: center + (radius - 20) * Math.sin(angleRad)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-amber-200/10 rounded-2xl bg-white/[0.01] backdrop-blur-md">
      <h3 className="font-serif text-lg text-amber-200 mb-4">Your Natal Chart Placements</h3>
      
      <div className="relative w-[300px] h-[300px]">
        <svg viewBox="0 0 300 300" className="w-full h-full text-stone-600">
          {/* Outer circle */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#f0b95b" strokeWidth="1.5" className="opacity-40" />
          <circle cx={center} cy={center} r={radius - 30} fill="none" stroke="#f0b95b" strokeWidth="0.5" className="opacity-25" />
          <circle cx={center} cy={center} r={3} fill="#f0b95b" className="opacity-60" />

          {/* Draw 12 Zodiac House division lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            const outer = getCoords(deg);
            const inner = getCoords(deg + 180); // opposite point for cross lines
            
            // Draw radial spoke
            const spokeEnd = {
              x: center + radius * Math.cos(deg * Math.PI / 180),
              y: center + radius * Math.sin(deg * Math.PI / 180)
            };
            
            return (
              <g key={i}>
                <line 
                  x1={center} 
                  y1={center} 
                  x2={spokeEnd.x} 
                  y2={spokeEnd.y} 
                  stroke="#f0b95b" 
                  strokeWidth="0.5" 
                  className="opacity-20" 
                />
                {/* Zodiac Label */}
                <text
                  x={center + (radius + 15) * Math.cos((deg + 15 - 180) * Math.PI / 180)}
                  y={center + (radius + 15) * Math.sin((deg + 15 - 180) * Math.PI / 180)}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="fill-amber-300/40 text-[8px] font-mono"
                >
                  {SIGNS[i].substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Render Planet Placements */}
          {planets.map((p, idx) => {
            if (!p.longitude) return null;
            const coords = getCoords(p.longitude);
            const glyph = PLANET_GLYPHS[p.name] || p.name[0];
            
            return (
              <g key={idx} className="group cursor-pointer">
                {/* Placement Dot */}
                <circle cx={coords.x} cy={coords.y} r="4" fill="#fafaf9" stroke="#f0b95b" strokeWidth="1" />
                
                {/* Glyph Label */}
                <text
                  x={coords.labelX}
                  y={coords.labelY + 3}
                  textAnchor="middle"
                  className="fill-amber-100 text-[10px] font-mono font-bold hover:fill-amber-300 transition-colors"
                >
                  {glyph}
                </text>
                
                {/* SVG Tooltip */}
                <title>{`${p.name}: ${p.sign} ${p.degree.toFixed(2)}° (House ${p.house})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Placement List Table */}
      <div className="w-full mt-6 max-h-[160px] overflow-y-auto scrollbar-none text-xs border-t border-amber-200/10 pt-4 space-y-2">
        <div className="grid grid-cols-4 font-mono text-amber-300/70 border-b border-amber-200/5 pb-1">
          <span>Planet</span>
          <span>Zodiac Sign</span>
          <span>Degree</span>
          <span className="text-right">House</span>
        </div>
        {planets.map((p, idx) => (
          <div key={idx} className="grid grid-cols-4 font-mono text-stone-400 py-0.5 hover:text-stone-200 transition-colors">
            <span className="text-amber-100/90 font-medium">{p.name}</span>
            <span>{p.sign}</span>
            <span>{p.degree.toFixed(1)}°</span>
            <span className="text-right">H{p.house}</span>
          </div>
        ))}
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

    // Headers
    if (trimmed.startsWith('###')) {
      return (
        <h4 key={lineIdx} className="text-sm font-mono font-bold text-amber-400 mt-3 mb-1">
          {parseBold(trimmed.replace(/^###\s*/, ''))}
        </h4>
      );
    }
    if (trimmed.startsWith('##')) {
      return (
        <h3 key={lineIdx} className="text-base font-serif font-bold text-amber-300 mt-4 mb-2">
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

    // Bullet points
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      return (
        <li key={lineIdx} className="ml-4 list-disc pl-1 text-[13.5px] leading-relaxed text-stone-300 mb-1 font-news">
          {parseBold(trimmed.replace(/^[-*]\s*/, ''))}
        </li>
      );
    }

    // Regular paragraphs
    return (
      <p key={lineIdx} className="mb-2 leading-relaxed text-stone-300/90 font-news text-[14.5px]">
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
  
  const [loading, setLoading] = useState(false);
  const [toolLogs, setToolLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  
  const chatEndRef = useRef(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Initialize unique session thread
  useEffect(() => {
    const savedThread = localStorage.getItem('astroagent_thread_id');
    const savedUser = localStorage.getItem('astroagent_user');
    
    if (savedThread) {
      setThreadId(savedThread);
      // Fetch chat history
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
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('astroagent_user');
      }
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolLogs]);

  // Handle birth details form submission
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!name || !date || !time || !place) return;
    
    // Custom date validation
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      setErrorMessage("Birth date cannot be in the future.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setToolLogs(["Resolving birth coordinates...", "Fetching ephemeris elements..."]);

    try {
      // Step 1. Trigger backend geocode & birth chart calculations
      const response = await fetch(`${API_BASE}/api/users/birth-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, time, place, system })
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('astroagent_user', JSON.stringify(data.user));
        
        // Trigger agent to introduce their chart
        await triggerAgentIntroduction(data.user);
      } else {
        setErrorMessage(data.error || "Failed to process birth details.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error processing birth details. Please check that the backend is running.");
    } finally {
      setLoading(false);
      setToolLogs([]);
    }
  };

  // Agent Introduction after details submit
  const triggerAgentIntroduction = async (userRecord) => {
    setLoading(true);
    setToolLogs([`✧ Mapping planets for ${userRecord.name}...`]);

    const introQuery = `Namaste. I have entered my details: Born ${userRecord.birthDetails.date} at ${userRecord.birthDetails.time} in ${userRecord.birthDetails.place}. Please calculate my chart, present my Ascendant, and offer a warm welcome reading.`;
    
    // Add user prompt to local list
    const tempUserMsg = { role: 'user', content: `Computed my chart for ${userRecord.birthDetails.place}.` };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      await streamAgentResponse(introQuery, userRecord._id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // SSE token streaming client handler
  const streamAgentResponse = async (userQuery, userIdOverride = null) => {
    setToolLogs([]);
    
    let assistantMessageIndex = -1;
    
    // Set loading
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
        
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse event streams: event: name \n data: JSON
          if (line.startsWith('event:')) {
            // We read the event type
            continue;
          }
          
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              
              // Event 1: LLM text response token chunk (append incrementally)
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
              
              // Event 2: Running tool log lines
              if (parsed.log !== undefined) {
                setToolLogs(prev => [...prev, parsed.log]);
              }
              
              // Event 3: Fully calculated natal chart
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Apologies. The chat stream had an error. Please try again." }]);
    } finally {
      setLoading(false);
      setToolLogs([]);
      // Start cosmic cooldown of 8 seconds to pace requests and prevent 429 errors
      setCooldownSeconds(8);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const query = inputMessage;
    setInputMessage('');
    
    // Display user message in chat bubble
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
    const newThread = 'thread_' + Math.random().toString(36).substring(2, 11);
    setThreadId(newThread);
    localStorage.setItem('astroagent_thread_id', newThread);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden text-stone-300 font-sans pb-16 flex flex-col justify-between">
      <Starfield />

      {/* slow-rotating zodiac background ring */}
      <div className="pointer-events-none absolute -right-36 -top-36 h-[30rem] w-[30rem] rounded-full border border-amber-300/10 animate-drift">
        <div className="absolute inset-8 rounded-full border border-amber-300/10" />
        <div className="absolute inset-16 rounded-full border border-amber-300/[0.05]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 w-full pt-10 flex-grow grid gap-8 lg:grid-cols-[340px_1fr]">
        
        {/* Left Sidebar: Profile / Astrological Placements */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-mono text-lg">✧</span>
            <h1 className="font-serif text-2xl tracking-wide text-stone-100">Aradhana</h1>
          </div>
          
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-300/70 border-b border-amber-200/10 pb-4">
            Your Daily Spiritual Companion
          </p>

          {!user ? (
            <div className="rounded-2xl border border-amber-200/10 bg-white/[0.02] p-5 backdrop-blur-md">
              <h2 className="font-serif text-lg text-stone-100 mb-4">Enter Birth Details</h2>
              <form onSubmit={handleDetailsSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-amber-300/80 mb-1">YOUR NAME</label>
                  <input 
                    type="text" required placeholder="e.g. Aradhana"
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-[#16152a] border border-amber-200/15 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">DATE OF BIRTH</label>
                  <input 
                    type="date" required
                    value={date} onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#16152a] border border-amber-200/15 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">TIME OF BIRTH</label>
                  <input 
                    type="time" required
                    value={time} onChange={e => setTime(e.target.value)}
                    className="w-full bg-[#16152a] border border-amber-200/15 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">PLACE OF BIRTH</label>
                  <input 
                    type="text" required placeholder="e.g. Mumbai, India"
                    value={place} onChange={e => setPlace(e.target.value)}
                    className="w-full bg-[#16152a] border border-amber-200/15 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-amber-300/80 mb-1">ZODIAC SYSTEM</label>
                  <select
                    value={system} onChange={e => setSystem(e.target.value)}
                    className="w-full bg-[#16152a] border border-amber-200/15 rounded-lg px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="western">Western (Tropical)</option>
                    <option value="vedic">Vedic (Sidereal - Lahiri)</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full mt-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400 text-cosmic-dark font-bold py-2.5 tracking-wider uppercase transition-all transform active:scale-95 shadow-md shadow-amber-500/10"
                >
                  {loading ? 'CALCULATING CHART...' : 'MAP MY NATAL CHART'}
                </button>
                {errorMessage && (
                  <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-200">
                    {errorMessage}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200/10 bg-white/[0.02] p-5 backdrop-blur-md flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-500 font-mono">SOUL PATH PROFILE</p>
                  <h2 className="font-serif text-lg text-stone-100">{user.name}</h2>
                  <p className="text-[10px] text-amber-300/60 font-mono mt-1">{user.birthDetails.place}</p>
                </div>
                <button 
                  onClick={resetSession} 
                  className="text-[10px] font-mono text-stone-500 hover:text-amber-400 transition-colors uppercase border border-stone-800 rounded px-2 py-1 bg-stone-900/30"
                >
                  Reset
                </button>
              </div>

              {/* Natal Chart SVG Visualizer Panel */}
              <NatalChartVisualizer planets={user.natalChart || []} />
            </div>
          )}
        </div>

        {/* Right Main Panel: Agent Chat Container */}
        <div className="flex flex-col h-[76vh] lg:h-[84vh] border border-amber-200/10 rounded-2xl bg-white/[0.02] backdrop-blur-md overflow-hidden relative">
          
          {/* Top chat status bar */}
          <div className="px-6 py-4 border-b border-amber-200/10 bg-white/[0.01] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-stone-600'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300/70">Astro-Readings Stream</span>
            </div>
            <span className="text-[10px] font-mono text-stone-500">{threadId}</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-grow p-6 overflow-y-auto space-y-6 scrollbar-none">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-4 p-8">
                <span className="text-3xl text-amber-300/40 animate-pulse">✧</span>
                <h3 className="font-serif text-stone-200 text-lg">Greetings from Aradhana</h3>
                <p className="text-xs font-news max-w-sm text-stone-400/90 leading-relaxed italic">
                  "The planets are mirrors of the soul, signaling spiritual cycles and guiding us back to our true nature."
                </p>
                <p className="text-[11px] font-mono text-amber-300/50">
                  {!user ? 'Enter your birth details on the left to map your chart and begin.' : 'Ask me anything about your placements or active daily transits.'}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed text-[13.5px] ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-amber-500/20 to-amber-300/10 border border-amber-400/20 text-stone-200 rounded-tr-none' 
                      : 'bg-white/[0.025] border border-amber-200/5 text-stone-300/90 rounded-tl-none font-news text-base leading-relaxed'
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              ))
            )}

            {/* Display active running tool logs */}
            {toolLogs.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-[#131225] border border-amber-200/10 rounded-2xl rounded-tl-none px-5 py-3 space-y-1.5 font-mono text-[10px] text-amber-300/80 animate-pulse">
                  {toolLogs.map((log, idx) => (
                    <p key={idx}>{log}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Pulsating Astro-Buffering Indicator (bounces dots during retry/think cycles) */}
            {loading && toolLogs.length === 0 && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-white/[0.015] border border-amber-200/5 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs font-mono text-amber-300/70 ml-1 animate-pulse">Tuning into cosmic energies...</span>
                </div>
              </div>
            )}

            {/* Spacer to prevent questions/messages from hiding behind the suggestions or input box */}
            <div className="h-20" />
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form (marked flex-shrink-0 and styled to nest suggestions perfectly) */}
          <div className="p-4 border-t border-amber-200/10 bg-[#0f0e1d] relative flex-shrink-0 space-y-3">
            {/* Preset Prompts suggestions */}
            {user && messages.length > 0 && !loading && cooldownSeconds === 0 && (
              <div className="flex flex-nowrap gap-2 scrollbar-none overflow-x-auto whitespace-nowrap pb-1">
                <button 
                  onClick={() => selectSuggestion("Explain my Ascendant placement.")}
                  className="text-[10px] font-mono border border-amber-200/10 rounded-full px-3 py-1 hover:border-amber-400 hover:text-amber-200 bg-white/[0.01] transition-all"
                >
                  ⊙ Ascendant Analysis
                </button>
                <button 
                  onClick={() => selectSuggestion("What does Saturn say about my career legacy?")}
                  className="text-[10px] font-mono border border-amber-200/10 rounded-full px-3 py-1 hover:border-amber-400 hover:text-amber-200 bg-white/[0.01] transition-all"
                >
                  ♄ Career Placements
                </button>
                <button 
                  onClick={() => selectSuggestion("Check my active planet transits for today.")}
                  className="text-[10px] font-mono border border-amber-200/10 rounded-full px-3 py-1 hover:border-amber-400 hover:text-amber-200 bg-white/[0.01] transition-all"
                >
                  ☽ Today's Transits
                </button>
              </div>
            )}

            {/* Cosmic Cooldown Progress Bar */}
            {cooldownSeconds > 0 && (
              <div 
                className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(240,185,91,0.5)]"
                style={{ width: `${(cooldownSeconds / 8) * 100}%` }}
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
                      ? "AstroAgent is streaming cosmic insights..." 
                      : "Ask AstroAgent (e.g. 'What is my Moon in Sign saying?' or greetings)..."
                }
                className={`flex-grow bg-[#16152a] border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-stone-600 text-stone-200 ${
                  cooldownSeconds > 0 
                    ? 'border-amber-500/30 shadow-[0_0_10px_rgba(240,185,91,0.05)] text-amber-200/70 font-serif italic' 
                    : 'border-amber-200/10 focus:border-amber-400'
                }`}
              />
              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0 || !inputMessage.trim()}
                className={`rounded-xl px-5 py-3 font-bold font-mono tracking-wider transition-all ${
                  cooldownSeconds > 0
                    ? 'bg-amber-500/10 border border-amber-400/20 text-amber-300/40 opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400 text-cosmic-dark disabled:opacity-30 disabled:from-stone-800 disabled:to-stone-800'
                }`}
              >
                {cooldownSeconds > 0 ? `${cooldownSeconds}S` : 'SEND'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Astro Safety Disclaimer Footer */}
      <footer className="max-w-4xl mx-auto px-6 text-center text-[10px] font-mono text-stone-600 mt-10 leading-relaxed max-w-xl">
        <p>✦ Astrology is for reflection and personal self-discovery. readings do not represent financial, legal, or medical certainty. namaste. ✦</p>
      </footer>
    </div>
  );
}
