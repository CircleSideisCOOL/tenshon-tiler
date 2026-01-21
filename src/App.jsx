import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Square, Plus, Trash2, Settings, Volume2, Music, Upload, 
  Keyboard, X, Repeat, MoreVertical, AlertCircle, Image as ImageIcon, 
  Layers, Download, FolderOpen, Loader2, Activity, Zap, Power, 
  Scissors, Github, Coffee, Heart 
} from 'lucide-react';

// --- 🔧 CONFIGURATION: EDIT THIS SECTION 🔧 ---
const APP_CONFIG = {
  // 1. Website Title (Browser Tab)
  title: "Tenshon Tiler",

  // 2. Favicon (Icon in Browser Tab & Header Logo)
  // Using the high-res PNG so it looks sharp in the Header and Credits
  favicon: "/android-chrome-192x192.png",
  
  // 3. Credits Popup Info
  credits: {
    appName: "Tenshon Tiler",
    description: "Created for Romeo & Juliet Act 1 Play.",
    footerText: "Made with Gemini, Idea by CircleSide",
    
    // Social Links (Leave empty "" to hide)
    links: {
      github: "https://github.com/CircleSideisCOOL",
      kofi: "https://ko-fi.com/circle_side"
    }
  }
};
// ----------------------------------------------

// --- Constants ---
const COLORS = [
  { name: 'Red', class: 'bg-red-500 hover:bg-red-400 border-red-700', active: 'bg-red-300', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]' },
  { name: 'Orange', class: 'bg-orange-500 hover:bg-orange-400 border-orange-700', active: 'bg-orange-300', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.6)]' },
  { name: 'Amber', class: 'bg-amber-500 hover:bg-amber-400 border-amber-700', active: 'bg-amber-300', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]' },
  { name: 'Green', class: 'bg-green-500 hover:bg-green-400 border-green-700', active: 'bg-green-300', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]' },
  { name: 'Emerald', class: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-700', active: 'bg-emerald-300', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)]' },
  { name: 'Teal', class: 'bg-teal-500 hover:bg-teal-400 border-teal-700', active: 'bg-teal-300', glow: 'shadow-[0_0_20px_rgba(20,184,166,0.6)]' },
  { name: 'Cyan', class: 'bg-cyan-500 hover:bg-cyan-400 border-cyan-700', active: 'bg-cyan-300', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]' },
  { name: 'Blue', class: 'bg-blue-500 hover:bg-blue-400 border-blue-700', active: 'bg-blue-300', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.6)]' },
  { name: 'Indigo', class: 'bg-indigo-500 hover:bg-indigo-400 border-indigo-700', active: 'bg-indigo-300', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.6)]' },
  { name: 'Violet', class: 'bg-violet-500 hover:bg-violet-400 border-violet-700', active: 'bg-violet-300', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.6)]' },
  { name: 'Purple', class: 'bg-purple-500 hover:bg-purple-400 border-purple-700', active: 'bg-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.6)]' },
  { name: 'Fuchsia', class: 'bg-fuchsia-500 hover:bg-fuchsia-400 border-fuchsia-700', active: 'bg-fuchsia-300', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.6)]' },
  { name: 'Pink', class: 'bg-pink-500 hover:bg-pink-400 border-pink-700', active: 'bg-pink-300', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.6)]' },
  { name: 'Rose', class: 'bg-rose-500 hover:bg-rose-400 border-rose-700', active: 'bg-rose-300', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.6)]' },
  { name: 'Slate', class: 'bg-slate-600 hover:bg-slate-500 border-slate-800', active: 'bg-slate-400', glow: 'shadow-[0_0_20px_rgba(71,85,105,0.6)]' },
];

// --- Web Audio Context Singleton ---
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

// --- Helper for File Conversion ---
const blobToDataURL = async (blobUrl) => {
  if (!blobUrl || blobUrl === 'demo_beep') return blobUrl;
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to convert blob:", e);
    return null;
  }
};

export default function SoundboardApp() {
  const [sounds, setSounds] = useState([
    {
      id: 'demo-1',
      name: 'Demo Sound',
      category: 'General',
      src: 'demo_beep',
      image: null,
      color: 7, // Blue
      keybind: '1',
      volume: 0.8,
      loop: false,
      mode: 'restart',
      overlap: true, 
      fadeIn: 0,
      fadeOut: 0.5
    }
  ]);
  
  // UI State
  const [activeSounds, setActiveSounds] = useState({}); 
  const [globalPlayCount, setGlobalPlayCount] = useState(0); 
  const [masterVolume, setMasterVolume] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSound, setEditingSound] = useState(null); 
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCredits, setShowCredits] = useState(false); 
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(false); 
  const [statusMsg, setStatusMsg] = useState(''); 
  
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null); 
  
  // --- ROBUST AUDIO ENGINE REFS ---
  const bufferCacheRef = useRef({}); 
  const activeSourcesRef = useRef({}); 
  const activeElementsRef = useRef({}); 
  const playCountsRef = useRef({}); 
  
  // --- Set Favicon & Title ---
  useEffect(() => {
    document.title = APP_CONFIG.title;

    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach(el => el.remove());

    const link = document.createElement('link');
    link.rel = 'icon';

    if (APP_CONFIG.favicon.trim().startsWith('<svg')) {
        link.type = 'image/svg+xml';
        link.href = `data:image/svg+xml,${encodeURIComponent(APP_CONFIG.favicon)}`;
    } else {
        link.href = APP_CONFIG.favicon;
        if (APP_CONFIG.favicon.endsWith('.png')) link.type = 'image/png';
        else if (APP_CONFIG.favicon.endsWith('.svg')) link.type = 'image/svg+xml';
        else link.type = 'image/x-icon';
    }
    
    document.head.appendChild(link);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(activeSourcesRef.current).forEach(sources => {
          sources.forEach(node => {
              try { node.stop(); } catch(e){}
              try { node.disconnect(); } catch(e){}
          });
      });
      Object.values(activeElementsRef.current).forEach(audio => {
          audio.pause(); 
          audio.src = ''; 
      });
      if (audioCtx) {
          audioCtx.close().then(() => { audioCtx = null; });
      }
      sounds.forEach(sound => {
        if (sound.src && sound.src.startsWith('blob:')) URL.revokeObjectURL(sound.src);
        if (sound.image && sound.image.startsWith('blob:')) URL.revokeObjectURL(sound.image);
      });
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Stop preview if modal closes
  useEffect(() => {
    if (!showModal) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setIsPreviewPlaying(false);
    }
  }, [showModal]);

  // Update preview volume dynamically when slider moves
  useEffect(() => {
    if (previewAudioRef.current && editingSound) {
        if (previewAudioRef.current.volume !== undefined) {
            previewAudioRef.current.volume = editingSound.volume;
        }
    }
  }, [editingSound]);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // --- LIVE VOLUME UPDATE ---
  useEffect(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    sounds.forEach(sound => {
        const targetVol = sound.volume * masterVolume;

        // 1. Update HTML Audio Elements (Toggles)
        const audioEl = activeElementsRef.current[sound.id];
        if (audioEl) {
            if (!audioEl._fadeInterval) {
               audioEl.volume = targetVol;
            }
        }

        // 2. Update Web Audio Gain Nodes (One-Shots)
        const sources = activeSourcesRef.current[sound.id];
        if (sources) {
            sources.forEach(({ gainNode }) => {
                try {
                    gainNode.gain.setTargetAtTime(targetVol, now, 0.05); 
                } catch(e) {}
            });
        }
    });
  }, [masterVolume, sounds]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const key = e.key.toUpperCase();
      const sound = sounds.find(s => s.keybind === key);
      if (sound) {
        playSound(sound.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sounds, masterVolume]);

  const updateVisualState = (id, increment) => {
      if (!playCountsRef.current[id]) playCountsRef.current[id] = 0;
      if (increment === 'reset') {
          playCountsRef.current[id] = 0;
      } else if (increment) {
          playCountsRef.current[id]++;
      } else {
          playCountsRef.current[id] = Math.max(0, playCountsRef.current[id] - 1);
      }
      const total = Object.values(playCountsRef.current).reduce((a, b) => a + b, 0);
      setGlobalPlayCount(total);
      setActiveSounds(prev => ({
          ...prev,
          [id]: playCountsRef.current[id] > 0
      }));
  };

  // --- AUDIO LOGIC ---
  const playSound = useCallback(async (id) => {
    const sound = sounds.find(s => s.id === id);
    if (!sound) return;

    if (sound.src === 'demo_beep') {
       const ctx = getAudioContext();
       if (ctx.state === 'suspended') ctx.resume();
       
       const osc = ctx.createOscillator();
       const gain = ctx.createGain();
       osc.connect(gain);
       gain.connect(ctx.destination);
       osc.frequency.setValueAtTime(440, ctx.currentTime);
       osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
       
       const beepVol = 0.3 * sound.volume * masterVolume;
       gain.gain.setValueAtTime(beepVol, ctx.currentTime);
       gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
       
       osc.start();
       osc.stop(ctx.currentTime + 0.5);

       updateVisualState(id, true);
       setTimeout(() => updateVisualState(id, false), 200);
       return;
    }

    if (!sound.src) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const targetVol = sound.volume * masterVolume;

    // --- MODE 1: TOGGLE ---
    if (sound.mode === 'toggle') {
        let audio = activeElementsRef.current[id];

        if (audio && !audio.paused) {
             const fadeTime = (sound.fadeOut || 0) * 1000;
             if (fadeTime > 0) {
                 const startVol = audio.volume;
                 const steps = 20;
                 const stepTime = fadeTime / steps;
                 const volStep = startVol / steps;
                 
                 const fadeInterval = setInterval(() => {
                     if (audio.volume > volStep) {
                         audio.volume -= volStep;
                     } else {
                         audio.volume = 0;
                         audio.pause();
                         audio.currentTime = 0;
                         clearInterval(fadeInterval);
                         updateVisualState(id, 'reset');
                     }
                 }, stepTime);
                 audio._fadeInterval = fadeInterval;
             } else {
                 audio.pause();
                 audio.currentTime = 0;
                 updateVisualState(id, 'reset');
             }
             return;
        }

        if (!audio || audio.src !== sound.src) {
            audio = new Audio(sound.src);
            activeElementsRef.current[id] = audio;
            audio.onended = () => updateVisualState(id, 'reset');
        }

        if (audio._fadeInterval) clearInterval(audio._fadeInterval);
        
        audio.loop = sound.loop;
        audio.currentTime = 0;
        
        const fadeTime = (sound.fadeIn || 0) * 1000;
        if (fadeTime > 0) {
            audio.volume = 0;
            audio.play().catch(e => console.error(e));
            updateVisualState(id, true);
            
            const steps = 20;
            const stepTime = fadeTime / steps;
            const volStep = targetVol / steps;
            
            let currentVol = 0;
            const fadeInterval = setInterval(() => {
                currentVol += volStep;
                if (currentVol >= targetVol) {
                    audio.volume = targetVol;
                    clearInterval(fadeInterval);
                } else {
                    audio.volume = currentVol;
                }
            }, stepTime);
            audio._fadeInterval = fadeInterval;
        } else {
            audio.volume = targetVol;
            audio.play().catch(e => console.error(e));
            updateVisualState(id, true);
        }
    } 
    
    // --- MODE 2: ONE-SHOT ---
    else {
        if (sound.overlap === false) {
             const existingSources = activeSourcesRef.current[id];
             if (existingSources && existingSources.length > 0) {
                 existingSources.forEach(({ source, gainNode }) => {
                     try {
                         const stopTime = ctx.currentTime + 0.05;
                         gainNode.gain.cancelScheduledValues(ctx.currentTime);
                         gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
                         gainNode.gain.linearRampToValueAtTime(0, stopTime);
                         source.stop(stopTime);
                     } catch(e){}
                 });
                 activeSourcesRef.current[id] = [];
             }
        }

        let buffer = bufferCacheRef.current[id];
        
        if (!buffer) {
            try {
                const response = await fetch(sound.src);
                const arrayBuffer = await response.arrayBuffer();
                buffer = await ctx.decodeAudioData(arrayBuffer);
                bufferCacheRef.current[id] = buffer;
            } catch (err) {
                console.error("Error decoding audio:", err);
                setStatusMsg("Error loading audio");
                return;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = sound.loop;

        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;
        const fadeIn = sound.fadeIn || 0;
        
        if (fadeIn > 0) {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(targetVol, now + fadeIn);
        } else {
            gainNode.gain.setValueAtTime(targetVol, now);
        }

        source.start(now);
        updateVisualState(id, true);

        if (!activeSourcesRef.current[id]) activeSourcesRef.current[id] = [];
        activeSourcesRef.current[id].push({ source, gainNode });

        source.onended = () => {
            if (activeSourcesRef.current[id]) {
                activeSourcesRef.current[id] = activeSourcesRef.current[id].filter(item => item.source !== source);
            }
            updateVisualState(id, false);
        };
    }

  }, [sounds, masterVolume]);

  const stopAll = () => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    Object.values(activeElementsRef.current).forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            if (audio._fadeInterval) clearInterval(audio._fadeInterval);
        }
    });

    Object.keys(activeSourcesRef.current).forEach(id => {
        const items = activeSourcesRef.current[id];
        if (items) {
            items.forEach(({ source, gainNode }) => {
                try {
                    gainNode.gain.cancelScheduledValues(now);
                    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
                    source.stop(now + 0.1);
                } catch (e) {}
            });
        }
        activeSourcesRef.current[id] = [];
    });

    playCountsRef.current = {};
    setActiveSounds({});
    setGlobalPlayCount(0);
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'audio') {
        setEditingSound(prev => ({ 
          ...prev, 
          src: url, 
          name: prev.name || file.name.replace(/\.[^/.]+$/, "") 
        }));
        if (editingSound && editingSound.id) {
            delete bufferCacheRef.current[editingSound.id];
        }
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            setIsPreviewPlaying(false);
        }
      } else if (type === 'image') {
        setEditingSound(prev => ({ ...prev, image: url }));
      }
    }
  };

  const exportConfig = async () => {
    setIsLoading(true);
    setStatusMsg("Packing Audio...");
    
    setTimeout(async () => {
      try {
        const serializedSounds = await Promise.all(sounds.map(async (sound) => {
          const src = sound.src.startsWith('blob:') ? await blobToDataURL(sound.src) : sound.src;
          const image = sound.image && sound.image.startsWith('blob:') ? await blobToDataURL(sound.image) : sound.image;
          return { ...sound, src, image };
        }));

        const jsonString = JSON.stringify(serializedSounds);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "soundboard_save.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
        
        setStatusMsg("Export Successful!");
      } catch (err) {
        console.error("Export failed:", err);
        setStatusMsg("Export Failed (Memory Limit?)");
      }
      setIsLoading(false);
    }, 100);
  };

  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSounds = JSON.parse(e.target.result);
        if (Array.isArray(importedSounds)) {
          stopAll();
          bufferCacheRef.current = {};
          sounds.forEach(s => {
             if (s.src.startsWith('blob:')) URL.revokeObjectURL(s.src);
             if (s.image && s.image.startsWith('blob:')) URL.revokeObjectURL(s.image);
          });
          setSounds(importedSounds);
          setSelectedCategory('All');
          setStatusMsg("Import Successful!");
        } else {
          setStatusMsg("Error: Invalid JSON");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Error: Invalid File");
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const togglePreview = () => {
    if (isPreviewPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setIsPreviewPlaying(false);
    } else {
      if (!editingSound.src) return;
      if (editingSound.src === 'demo_beep') {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        
        const beepVol = 0.3 * editingSound.volume;
        gain.gain.setValueAtTime(beepVol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        setIsPreviewPlaying(true);
        setTimeout(() => setIsPreviewPlaying(false), 500);
        return;
      }
      if (!previewAudioRef.current || previewAudioRef.current.src !== editingSound.src) {
        previewAudioRef.current = new Audio(editingSound.src);
        previewAudioRef.current.onended = () => setIsPreviewPlaying(false);
      }
      previewAudioRef.current.volume = editingSound.volume;
      previewAudioRef.current.play().catch(console.error);
      setIsPreviewPlaying(true);
    }
  };

  const saveSound = () => {
    const soundToSave = {
       ...editingSound,
       category: editingSound.category.trim() || 'General' 
    };

    if (soundToSave.id) {
      if (bufferCacheRef.current[soundToSave.id]) delete bufferCacheRef.current[soundToSave.id];
      setSounds(prev => prev.map(s => s.id === soundToSave.id ? soundToSave : s));
    } else {
      setSounds(prev => [...prev, { ...soundToSave, id: crypto.randomUUID() }]);
    }
    setShowModal(false);
    setEditingSound(null);
  };

  const deleteSound = (id) => {
    setSounds(prev => prev.filter(s => s.id !== id));
    if (activeElementsRef.current[id]) {
        activeElementsRef.current[id].pause();
        delete activeElementsRef.current[id];
    }
    if (activeSourcesRef.current[id]) {
        activeSourcesRef.current[id].forEach(({source}) => { try{ source.stop(); }catch(e){} });
        delete activeSourcesRef.current[id];
    }
    if (bufferCacheRef.current[id]) delete bufferCacheRef.current[id];
    if (editingSound?.id === id) {
      setShowModal(false);
      setEditingSound(null);
    }
  };

  const openNewSoundModal = () => {
    setEditingSound({
      name: '',
      category: selectedCategory === 'All' ? '' : selectedCategory,
      src: '',
      image: null,
      color: 0,
      keybind: '',
      volume: 1.0,
      loop: false,
      mode: 'restart',
      overlap: true,
      fadeIn: 0,
      fadeOut: 0.5
    });
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const openEditModal = (sound) => {
    setEditingSound({ 
        ...sound, 
        fadeIn: sound.fadeIn || 0, 
        fadeOut: sound.fadeOut || 0,
        overlap: sound.overlap !== undefined ? sound.overlap : true
    });
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const categories = ['All', ...new Set(sounds.map(s => s.category || 'General'))].sort();
  const filteredSounds = sounds.filter(s => 
    selectedCategory === 'All' || (s.category || 'General') === selectedCategory
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900 pb-20">
      
      <input type="file" accept=".json" ref={fileInputRef} onChange={importConfig} className="hidden" />

      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-md sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
          
          <div className="flex flex-col lg:flex-row items-center gap-4">
            
            {/* 1. LEFT SIDE - Logo */}
            <div className="flex items-center justify-between w-full lg:w-auto">
                <div 
                  onClick={() => setShowCredits(true)}
                  className="flex items-center gap-3 cursor-pointer group select-none"
                  title="View Credits"
                >
                  <div className="w-12 h-12 rounded-xl group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    {/* DYNAMIC HEADER LOGO */}
                    {APP_CONFIG.favicon.trim().startsWith('<') ? (
                       <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                       </div>
                    ) : (
                       <img src={APP_CONFIG.favicon} alt="Logo" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col">
                      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 hidden sm:block leading-none group-hover:to-cyan-300 transition-all">
                      {APP_CONFIG.title}
                      </h1>
                      {statusMsg && <span className="text-xs text-amber-400 font-medium animate-pulse">{statusMsg}</span>}
                  </div>
                </div>
                
                {/* Mobile Only Header Actions */}
                <div className="flex items-center gap-2 lg:hidden" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => fileInputRef.current.click()} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <FolderOpen className="w-5 h-5" />
                    </button>
                    <button onClick={exportConfig} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors">
                       {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* 2. CONTROLS BAR (Volume Left - Buttons Right) */}
            <div className="flex items-center justify-between w-full lg:flex-1 lg:ml-4">
                
                {/* LEFT: Volume */}
                <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700 flex-none shadow-inner">
                    <Volume2 className="w-5 h-5 text-slate-400" />
                    <input 
                      type="range" min="0" max="1" step="0.01" value={masterVolume}
                      onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                      className="w-20 lg:w-20 accent-cyan-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs font-mono font-medium text-cyan-400 w-9 text-right">
                        {Math.round(masterVolume * 100)}%
                    </span>
                </div>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-4">
                    
                    {/* Desktop Import/Export */}
                    <div className="hidden lg:flex items-center gap-1 border-r border-slate-700 pr-4">
                        <button 
                          onClick={() => fileInputRef.current.click()}
                          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          <FolderOpen className="w-4 h-4" /> Import
                        </button>
                        <button 
                          onClick={exportConfig}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} Export
                        </button>
                    </div>

                    <button 
                      onClick={stopAll}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg transition-all font-medium active:scale-95 whitespace-nowrap shadow-sm group"
                    >
                      <Square className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Stop All</span>
                      {globalPlayCount > 0 && (
                         <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                           {globalPlayCount}
                         </span>
                      )}
                    </button>

                    <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border font-medium ${isEditMode ? 'bg-cyan-500 text-slate-900 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-400'}`}
                      title="Toggle Edit Mode"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit Mode</span>
                    </button>
                </div>
            </div>

          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mask-gradient-right">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border
                  ${selectedCategory === cat 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        
        {filteredSounds.length === 0 && (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Layers className="w-16 h-16 mb-4 text-slate-600" />
            <p className="text-xl">No sounds in this category.</p>
            <button onClick={openNewSoundModal} className="mt-4 text-cyan-400 hover:underline">Add one?</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* Sound Pads */}
          {filteredSounds.map((sound) => {
            const color = COLORS[sound.color] || COLORS[0];
            const isActive = activeSounds[sound.id];
            
            const bgStyle = sound.image ? {
              backgroundImage: `url(${sound.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {};
            
            const ModeIcon = sound.mode === 'toggle' ? Power : (sound.overlap ? Layers : Scissors);
            const modeLabel = sound.mode === 'toggle' ? 'Toggle' : (sound.overlap ? 'Overlap' : 'Cut');

            return (
              <div key={sound.id} className="relative group h-full">
                <button
                  onClick={() => playSound(sound.id)}
                  style={bgStyle}
                  className={`
                    w-full aspect-square rounded-2xl p-4 flex flex-col justify-between items-start text-left relative overflow-hidden
                    transition-all duration-100 ease-out border-b-4 active:border-b-0 active:translate-y-1 shadow-lg
                    ${sound.image ? 'border-slate-800 bg-slate-800' : color.class}
                    ${isActive 
                        ? (sound.image 
                            ? 'border-b-0 translate-y-1 ring-4 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.5)]' 
                            : `${color.active} border-b-0 translate-y-1 ${color.glow} ring-2 ring-white/50`) 
                        : ''}
                  `}
                >
                  {sound.image && (
                     <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity ${isActive ? 'opacity-80' : 'opacity-60'}`} />
                  )}

                  {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 animate-pulse border border-white/20">
                              <Activity className="w-8 h-8 text-cyan-400" />
                          </div>
                      </div>
                  )}

                  <div className="flex justify-between items-start w-full relative z-20">
                    <div className="flex gap-1">
                        <div className={`p-1 rounded flex items-center gap-1 ${sound.image ? 'bg-black/40 text-cyan-400' : 'bg-black/20 text-white/90'}`} title={modeLabel}>
                           <ModeIcon className="w-3 h-3" />
                           <span className="text-[10px] font-bold uppercase tracking-wider">
                               {sound.mode === 'toggle' ? 'TOGGLE' : (sound.overlap ? 'OVERLAP' : 'CUT')}
                           </span>
                        </div>
                        {sound.loop && (
                            <div className={`p-1 rounded ${sound.image ? 'bg-black/40 text-cyan-400' : 'bg-black/20 text-white/90'}`} title="Looping">
                                <Repeat className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    {sound.keybind && (
                      <span className="bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold font-mono text-white border border-white/10">
                        {sound.keybind}
                      </span>
                    )}
                  </div>
                  
                  <div className="w-full relative z-20 mt-auto">
                    {isActive && <div className="text-[10px] font-bold text-cyan-300 animate-pulse mb-1 tracking-widest uppercase">PLAYING</div>}
                    <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 truncate ${sound.image ? 'text-cyan-400' : 'opacity-75 mix-blend-screen'}`}>
                      {sound.category || 'General'}
                    </p>
                    <h3 className="font-bold text-lg leading-tight text-white drop-shadow-md line-clamp-2">
                      {sound.name}
                    </h3>
                  </div>

                  {isActive && !sound.image && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse z-0"></div>
                  )}
                </button>

                {isEditMode && (
                  <button
                    onClick={() => openEditModal(sound)}
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                  >
                    <div className="bg-slate-800 p-3 rounded-full border border-slate-600 hover:scale-110 transition-transform shadow-xl">
                       <MoreVertical className="w-6 h-6 text-white" />
                    </div>
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={openNewSoundModal}
            className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-all group"
          >
            <div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-medium text-sm">Add Sound</span>
          </button>
        </div>
      </main>

      {/* Credits Modal */}
      {showCredits && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCredits(false)}>
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-sm w-full text-center relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setShowCredits(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
             
             <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center overflow-hidden">
                {/* DYNAMIC CREDITS LOGO */}
                {APP_CONFIG.favicon.trim().startsWith('<') ? (
                  <div className="w-full h-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <img src={APP_CONFIG.favicon} alt="Logo" className="w-full h-full object-cover" />
                )}
             </div>
             
             <h2 className="text-2xl font-bold text-white mb-2">{APP_CONFIG.credits.appName}</h2>
             <p className="text-slate-400 mb-8 text-sm">{APP_CONFIG.credits.description}</p>
             
             <div className="space-y-3">
                {APP_CONFIG.credits.links.github && (
                  <a href={APP_CONFIG.credits.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors font-medium text-white group">
                     <Github className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                     Visit GitHub
                  </a>
                )}
                {APP_CONFIG.credits.links.kofi && (
                  <a href={APP_CONFIG.credits.links.kofi} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full p-3 bg-[#FF5E5B] hover:bg-[#ff4f4c] rounded-xl transition-colors font-medium text-white group">
                     <Coffee className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                     Support on Ko-fi
                  </a>
                )}
             </div>

             <div className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-1">
                {APP_CONFIG.credits.footerText}
             </div>
          </div>
        </div>
      )}

      {showModal && editingSound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingSound.id ? 'Edit Button' : 'New Button'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400 uppercase tracking-wide">1. Audio Source</label>
                <div className="flex gap-4 items-start">
                  <label className="flex-1 cursor-pointer group">
                    <input type="file" accept="audio/*" onChange={(e) => handleFileSelect(e, 'audio')} className="hidden" />
                    <div className="border border-slate-600 bg-slate-700/30 rounded-lg p-3 text-center hover:bg-slate-700 hover:border-cyan-500 transition-all flex items-center justify-center gap-3">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                      <span className="text-sm text-slate-300 truncate max-w-[200px]">
                        {editingSound.src ? (editingSound.src === 'demo_beep' ? 'Using Demo Sound' : 'Audio Loaded') : 'Upload Audio File'}
                      </span>
                    </div>
                  </label>
                  {editingSound.src && (
                    <button 
                       onClick={togglePreview}
                       className={`p-3 rounded-lg transition-colors border border-slate-600 ${isPreviewPlaying ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-700 hover:bg-cyan-600 text-white'}`}
                       title={isPreviewPlaying ? "Stop" : "Preview"}
                    >
                      {isPreviewPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                {editingSound.src && (
                    <button onClick={() => {
                        setEditingSound({...editingSound, src: '', name: editingSound.name || ''});
                        if (previewAudioRef.current) { previewAudioRef.current.pause(); setIsPreviewPlaying(false); }
                    }} className="text-xs text-red-400 hover:text-red-300 mt-2 block">
                        Remove Audio
                    </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-400">Name</label>
                  <input
                    type="text"
                    value={editingSound.name}
                    onChange={e => setEditingSound({...editingSound, name: e.target.value})}
                    placeholder="e.g. Sword Clang"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-400">Category</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    value={editingSound.category}
                    onChange={e => setEditingSound({...editingSound, category: e.target.value})}
                    placeholder="e.g. Act 1"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400 uppercase tracking-wide">2. Appearance</label>
                
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden shrink-0 ${!editingSound.image && COLORS[editingSound.color].class}`}>
                        {editingSound.image ? (
                          <img src={editingSound.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-white/50" />
                        )}
                     </div>
                     <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                           <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                           <Upload className="w-4 h-4" /> 
                           {editingSound.image ? 'Change Image' : 'Upload Custom Image'}
                        </label>
                        <p className="text-xs text-slate-500 mt-1">Images override colors.</p>
                        {editingSound.image && (
                          <button onClick={() => setEditingSound({...editingSound, image: null})} className="text-xs text-red-400 hover:text-red-300 mt-2 block">
                            Remove Image
                          </button>
                        )}
                     </div>
                  </div>

                  {!editingSound.image && (
                    <div className="grid grid-cols-8 gap-2 mt-2">
                      {COLORS.map((c, idx) => (
                        <button
                          key={c.name}
                          onClick={() => setEditingSound({...editingSound, color: idx})}
                          className={`w-full aspect-square rounded-full ${c.class} ${editingSound.color === idx ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="block text-sm font-medium text-slate-400">Shortcut Key</label>
                   <div className="relative">
                      <Keyboard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        maxLength={1}
                        value={editingSound.keybind}
                        onChange={e => setEditingSound({...editingSound, keybind: e.target.value.toUpperCase()})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 px-3 py-2 font-mono uppercase text-center text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        placeholder="None"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-slate-400">Clip Volume</label>
                        <span className="text-xs font-mono font-medium text-cyan-400">
                            {Math.round(editingSound.volume * 100)}%
                        </span>
                   </div>
                   <input 
                      type="range" min="0" max="1" step="0.01"
                      value={editingSound.volume}
                      onChange={e => setEditingSound({...editingSound, volume: parseFloat(e.target.value)})}
                      className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-3"
                   />
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Fade In</span>
                            <span className="text-cyan-400">{editingSound.fadeIn || 0}s</span>
                        </div>
                        <input 
                            type="range" min="0" max="5" step="0.5"
                            value={editingSound.fadeIn || 0}
                            onChange={e => setEditingSound({...editingSound, fadeIn: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Fade Out</span>
                            <span className="text-cyan-400">{editingSound.fadeOut || 0}s</span>
                        </div>
                        <input 
                            type="range" min="0" max="5" step="0.5"
                            value={editingSound.fadeOut || 0}
                            onChange={e => setEditingSound({...editingSound, fadeOut: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex bg-slate-800 rounded-md p-0.5">
                      <button 
                        onClick={() => setEditingSound({...editingSound, mode: 'restart'})} 
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.mode === 'restart' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                         <Zap className="w-3 h-3" /> One-Shot
                      </button>
                      <button 
                        onClick={() => setEditingSound({...editingSound, mode: 'toggle'})} 
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.mode === 'toggle' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                         <Power className="w-3 h-3" /> Toggle
                      </button>
                  </div>

                  {editingSound.mode === 'restart' && (
                     <div className="flex bg-slate-800 rounded-md p-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                        <button 
                            onClick={() => setEditingSound({...editingSound, overlap: true})} 
                            className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.overlap ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            title="Stack sounds on top of each other"
                        >
                            <Layers className="w-3 h-3" /> Overlap
                        </button>
                        <button 
                            onClick={() => setEditingSound({...editingSound, overlap: false})} 
                            className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${!editingSound.overlap ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            title="Stop previous sound when pressed again"
                        >
                            <Scissors className="w-3 h-3" /> Cut
                        </button>
                     </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input type="checkbox" checked={editingSound.loop} onChange={e => setEditingSound({...editingSound, loop: e.target.checked})} className="rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-offset-0 focus:ring-0" />
                      <span className="text-sm text-slate-300">Loop Audio</span>
                  </label>
              </div>

            </div>

            <div className="p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-between gap-4">
               {editingSound.id ? (
                   !showDeleteConfirm ? (
                       <button 
                         onClick={() => setShowDeleteConfirm(true)}
                         className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-sm font-medium"
                       >
                           <Trash2 className="w-4 h-4" /> Delete
                       </button>
                   ) : (
                       <div className="flex items-center gap-2">
                           <span className="text-sm text-slate-400">Sure?</span>
                           <button 
                             onClick={() => deleteSound(editingSound.id)}
                             className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs font-bold transition-colors"
                           >
                             Yes
                           </button>
                           <button 
                             onClick={() => setShowDeleteConfirm(false)}
                             className="px-3 py-1 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded text-xs transition-colors"
                           >
                             No
                           </button>
                       </div>
                   )
               ) : <div/>}
               <div className="flex gap-3">
                   <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                   <button 
                     onClick={saveSound}
                     disabled={!editingSound.src && !editingSound.name}
                     className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                   >
                       Save Button
                   </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
