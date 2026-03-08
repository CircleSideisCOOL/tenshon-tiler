import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, Plus, Trash2, Settings, Volume2, Music, Upload,
  Keyboard, X, Repeat, MoreVertical, AlertCircle, Image as ImageIcon,
  Layers, Download, FolderOpen, Loader2, Activity, Zap, Power,
  Scissors, Github, Coffee, Heart, Pause, HelpCircle, BookOpen, ExternalLink, Sparkles, MessageSquare, RotateCcw,
  Folder, ChevronRight, Home, FolderPlus, PlusCircle
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 🔧 CONFIGURATION: EDIT THIS SECTION 🔧 ---
const APP_CONFIG = {
  // 1. Website Title (Browser Tab)
  title: "Tenshon Tiler",
  version: "1.2.2",

  // 2. Favicon (Icon in Browser Tab & Header Logo)
  // Modified to use an inline SVG so it works in the preview immediately
  favicon: "tiler.png",

  // 3. Credits Popup Info
  credits: {
    appName: "Tenshon Tiler",
    description: "Soundboard created for our Romeo & Juliet Act 1 Play lol",
    footerText: "Made with Gemini, Idea by CircleSide",

    // Social Links (Leave empty "" to hide)
    links: {
      github: "https://github.com/CircleSideisCOOL/tenshon-tiler/",
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

// --- Web Audio Context Singleton with Master Gain ---
let audioCtx = null;
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Create a GLOBAL Master Gain Node
    // All one-shot sounds will route through this before reaching the speakers.
    audioCtx.masterGain = audioCtx.createGain();
    audioCtx.masterGain.connect(audioCtx.destination);
    audioCtx.masterGain.gain.value = 1; // Start at 100%
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

// --- IndexedDB Helper for Persistence ---
const initDB = () => {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open('TenshonDB', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('tenshon_store');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const saveToDB = async (key, val) => {
  try {
    const db = await initDB();
    const tx = db.transaction('tenshon_store', 'readwrite');
    tx.objectStore('tenshon_store').put(val, key);
  } catch (e) {
    console.error("IDB Save Error", e);
  }
};

const loadFromDB = async (key) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('tenshon_store', 'readonly');
      const req = tx.objectStore('tenshon_store').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error("IDB Load Error", e);
    return null;
  }
};

function SortableCategory({ category, fullName, selectedCategory, setSelectedCategory, isEditMode, isFolder, handleFolderClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fullName,
    disabled: !isEditMode || fullName === 'All'
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isActive = selectedCategory === category;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        onClick={() => isFolder ? handleFolderClick(category) : setSelectedCategory(category)}
        {...listeners}
        className={`
          px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-2
          ${isActive
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'}
          ${isEditMode && category !== 'All' ? 'cursor-grab active:cursor-grabbing hover:ring-2 ring-cyan-500/50 touch-none' : ''}
        `}
      >
        {isFolder ? <Folder className="w-3.5 h-3.5 fill-current opacity-60" /> : (category === 'All' ? <Sparkles className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5 opacity-60" />)}
        {category}
        {isFolder && <ChevronRight className="w-3 h-3 opacity-40 ml-1" />}
      </button>
    </div>
  );
}

function SortableSoundTile({ sound, isEditMode, isActive, isGlobalPaused, playSound, openEditModal, fadeInfo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sound.id,
    disabled: !isEditMode
  });

  const [localRemaining, setLocalRemaining] = useState(0);

  useEffect(() => {
    let animId;
    if (fadeInfo) {
      const update = () => {
        const rem = Math.max(0, fadeInfo.duration - (Date.now() - fadeInfo.startTime) / 1000);
        setLocalRemaining(rem);
        if (rem > 0) {
          animId = requestAnimationFrame(update);
        } else {
          setLocalRemaining(0);
        }
      };
      update();
    }
    return () => cancelAnimationFrame(animId);
  }, [fadeInfo]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
    position: 'relative',
    height: '100%',
    touchAction: isEditMode ? 'none' : 'auto'
  };

  const color = COLORS[sound.color] || COLORS[0];
  const bgStyle = sound.image ? {
    backgroundImage: `url(${sound.image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  const ModeIcon = (sound.mode === 'toggle' || sound.mode === 'toggle-restart') ? Power : Zap;
  const modeLabel = (sound.mode === 'toggle' || sound.mode === 'toggle-restart')
    ? (sound.mode === 'toggle' ? 'PAUSABLE' : 'RESTART')
    : (sound.overlap ? 'OVERLAP' : 'CUT');

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="h-full group">
      <div
        className="h-full w-full relative"
        {...(isEditMode ? listeners : {})}
      >
        <div
          role="button"
          tabIndex={0}
          onPointerDown={(e) => {
            if (!isEditMode) {
              // Ensure we only trigger on primary button (left click) for mouse
              if (e.pointerType === 'mouse' && e.button !== 0) return;
              playSound(sound.id);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              !isEditMode && playSound(sound.id);
            }
          }}
          onContextMenu={(e) => !isEditMode && e.preventDefault()}
          style={bgStyle}
          className={`
            w-full aspect-square rounded-2xl p-3 sm:p-4 flex flex-col justify-between items-start text-left relative overflow-hidden
            transition-none duration-100 ease-out border-b-4 shadow-lg select-none
            ${!isEditMode ? 'touch-manipulation cursor-pointer' : 'touch-auto'}
            ${sound.image ? 'border-slate-800 bg-slate-800' : color.class}
            ${!isEditMode && 'active:border-b-0 active:translate-y-1'}
            ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-4 ring-cyan-500' : ''}
            ${isActive && !isEditMode
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
              <div className={`bg-black/60 backdrop-blur-sm rounded-full p-3 border border-white/20 ${!isGlobalPaused && 'animate-Pulse'}`}>
                {isGlobalPaused ? <Pause className="w-8 h-8 text-amber-400" /> : <Activity className="w-8 h-8 text-cyan-400" />}
              </div>
            </div>
          )}

          <div className="flex justify-between items-start w-full relative z-20 pointer-events-none">
            <div className="flex gap-1">
              <div className={`p-1 rounded flex items-center gap-1 ${sound.image ? 'bg-black/40 text-cyan-400' : 'bg-black/20 text-white/90'}`} title={modeLabel}>
                <ModeIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="opacity-60 font-medium">
                    {(sound.mode === 'toggle' || sound.mode === 'toggle-restart') ? 'TOGGLABLE:' : 'ONE-SHOT:'}
                  </span>
                  {modeLabel}
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

          <div className="w-full relative z-20 mt-auto pointer-events-none">
            {isActive && (
              <div className={`text-[10px] font-bold ${isGlobalPaused ? 'text-amber-400' : 'text-cyan-300'} mb-1 tracking-widest uppercase flex items-center gap-1.5`}>
                {localRemaining > 0.01 ? (
                  <>
                    <span className="animate-pulse">{fadeInfo?.type || 'FADING'}</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[9px] border border-white/10">
                      {localRemaining.toFixed(1)}s
                    </span>
                  </>
                ) : (
                  <span className={!isGlobalPaused ? 'animate-pulse' : ''}>
                    {isGlobalPaused ? 'PAUSED' : 'PLAYING'}
                  </span>
                )}
              </div>
            )}
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 truncate ${sound.image ? 'text-cyan-400' : 'opacity-75 mix-blend-screen'}`}>
              {sound.category || 'General'}
            </p>
            <h3 className={`font-bold text-lg leading-tight text-white drop-shadow-md ${sound.note ? 'truncate' : 'line-clamp-4'}`}>
              {sound.name}
            </h3>
            {sound.note && (
              <p className={`text-[10px] mt-0.5 leading-snug line-clamp-4 italic font-medium ${sound.image ? 'text-white drop-shadow-md' : 'text-white/80 mix-blend-screen'}`}>
                {sound.note}
              </p>
            )}
          </div>

          {isActive && !sound.image && (
            <div className={`absolute inset-0 bg-white/20 ${!isGlobalPaused && 'animate-pulse'} z-0`}></div>
          )}
        </div>

        {isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(sound); }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
          >
            <div className="bg-slate-800 p-3 rounded-full border border-slate-600 hover:scale-110 transition-transform shadow-xl pointer-events-auto cursor-pointer">
              <Settings className="w-8 h-8 text-cyan-400" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

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
      fadeOut: 0.5,
      pauseFade: 0.1,
      resumeFade: 0.1
    }
  ]);

  // Dedicated states for Tutorial-only sounds (cannot be deleted)
  const [tutorialSound1, setTutorialSound1] = useState({
    id: 'tutorial-demo-1',
    name: 'Tutorial SFX',
    category: 'Tutorial',
    src: '/tutorial-sfx.mp3', // Updated to load external MP3
    image: null,
    color: 8, // Indigo
    keybind: '',
    volume: 0.7,
    loop: false,
    mode: 'restart',
    overlap: true,
    fadeIn: 0,
    fadeOut: 0.5,
    pauseFade: 0.1,
    resumeFade: 0.1
  });

  const [tutorialSound2, setTutorialSound2] = useState({
    id: 'tutorial-demo-2',
    name: 'Tutorial Ambient',
    category: 'Tutorial',
    src: '/tutorial-ambient.mp3', // Updated to load external MP3
    image: null,
    color: 1, // Cyan
    keybind: '',
    volume: 0.5,
    loop: true,
    mode: 'toggle',
    overlap: true,
    fadeIn: 1.5,
    fadeOut: 1.5,
    pauseFade: 1.0,
    resumeFade: 1.0
  });


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
  const [navigationPath, setNavigationPath] = useState([]); // Folders path
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isGlobalPaused, setIsGlobalPaused] = useState(false);
  const [activeFades, setActiveFades] = useState({});
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNewCatModal, setShowNewCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCategoryOrder, setCustomCategoryOrder] = useState([]);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);
  const pauseFadeTimeoutRef = useRef(null);

  // --- ROBUST AUDIO ENGINE REFS ---
  const bufferCacheRef = useRef({});
  const activeSourcesRef = useRef({});
  const activeElementsRef = useRef({});
  const playCountsRef = useRef({});
  const pausedHtmlAudioRef = useRef(new Set()); // Tracks active toggles that we paused manually

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

  // --- COMPONENT MOUNT LOAD ---
  useEffect(() => {
    const loadState = async () => {
      const savedMasterVol = await loadFromDB('masterVolume');
      if (savedMasterVol !== null && savedMasterVol !== undefined) setMasterVolume(savedMasterVol);

      const savedSounds = await loadFromDB('sounds');
      if (savedSounds && savedSounds.length > 0) {
        setSounds(savedSounds);
      }

      const savedCategoryOrder = await loadFromDB('customCategoryOrder');
      if (savedCategoryOrder) {
        setCustomCategoryOrder(savedCategoryOrder);
      }

      setIsLoaded(true);
    };
    loadState();
  }, []);

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(async () => {
      saveToDB('masterVolume', masterVolume);

      const serializedSounds = await Promise.all(sounds.map(async (sound) => {
        const src = sound.src.startsWith('blob:') ? await blobToDataURL(sound.src) : sound.src;
        const image = sound.image && sound.image.startsWith('blob:') ? await blobToDataURL(sound.image) : sound.image;
        return { ...sound, src, image };
      }));
      saveToDB('sounds', serializedSounds);
      saveToDB('customCategoryOrder', customCategoryOrder);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sounds, masterVolume, customCategoryOrder, isLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(activeSourcesRef.current).forEach(sources => {
        sources.forEach(node => {
          try { node.stop(); } catch (e) { }
          try { node.disconnect(); } catch (e) { }
        });
      });
      Object.values(activeElementsRef.current).forEach(audio => {
        audio.pause();
        audio.src = '';
        if (audio._fadeInterval) {
          clearInterval(audio._fadeInterval);
          audio._fadeInterval = null;
        }
      });
      if (audioCtx) {
        audioCtx.close().then(() => { audioCtx = null; });
      }
      if (pauseFadeTimeoutRef.current) clearTimeout(pauseFadeTimeoutRef.current);
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
        // APPLY MASTER VOLUME TO PREVIEW AS WELL
        previewAudioRef.current.volume = editingSound.volume * masterVolume;
      }
    }
  }, [editingSound, masterVolume]);

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

    // 1. UPDATE GLOBAL MASTER GAIN
    if (ctx.masterGain) {
      // Only update if NOT currently in a global pause/resume fade transition
      if (!isGlobalPaused) {
        ctx.masterGain.gain.setTargetAtTime(masterVolume, now, 0.015);
        if (masterVolume === 0) {
          ctx.masterGain.gain.setValueAtTime(0, now + 0.05);
        }
      }
    }

    // 2. UPDATE INDIVIDUAL SOUNDS
    sounds.forEach(sound => {
      // A. HTML Audio Elements (Toggle Sounds)
      const audioEl = activeElementsRef.current[sound.id];
      if (audioEl) {
        // Only update volume if not actively fading or globally paused
        if (!audioEl._fadeInterval && !isGlobalPaused) {
          const calculatedVol = sound.volume * masterVolume;
          const finalVol = calculatedVol < 0.001 ? 0 : calculatedVol;
          if (Math.abs(audioEl.volume - finalVol) > 0.001) {
            audioEl.volume = finalVol;
          }
        }
      }

      // B. Web Audio One-Shots (Individual Nodes)
      const sources = activeSourcesRef.current[sound.id];
      if (sources) {
        sources.forEach(({ gainNode }) => {
          try {
            gainNode.gain.setTargetAtTime(sound.volume, now, 0.05);
          } catch (e) { }
        });
      }
    });

    // 3. UPDATE TUTORIAL SOUNDS (HIDDEN)
    [tutorialSound1, tutorialSound2].forEach(ts => {
      const tAudioEl = activeElementsRef.current[ts.id];
      if (tAudioEl && !tAudioEl._fadeInterval && !isGlobalPaused) {
        const calculatedVol = ts.volume * masterVolume;
        const finalVol = calculatedVol < 0.001 ? 0 : calculatedVol;
        tAudioEl.volume = finalVol;
      }
      const tSources = activeSourcesRef.current[ts.id];
      if (tSources) {
        tSources.forEach(({ gainNode }) => {
          gainNode.gain.setTargetAtTime(ts.volume * masterVolume, now, 0.05);
        });
      }
    });

    // Also update preview audio if playing
    if (previewAudioRef.current && isPreviewPlaying && editingSound) {
      const pVol = editingSound.volume * masterVolume;
      previewAudioRef.current.volume = pVol < 0.001 ? 0 : pVol;
    }

  }, [masterVolume, sounds, tutorialSound1, tutorialSound2, editingSound, isPreviewPlaying, isGlobalPaused]);

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

  const startFadeTimer = useCallback((id, type, duration) => {
    if (!duration || duration <= 0.05) return;
    const now = Date.now();
    setActiveFades(prev => ({
      ...prev,
      [id]: { type, duration, startTime: now }
    }));

    setTimeout(() => {
      setActiveFades(prev => {
        if (prev[id] && prev[id].startTime === now) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return prev;
      });
    }, duration * 1000 + 100);
  }, []);

  const toggleGlobalPause = async () => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Default global fade if individual sounds don't have settings, 
    // but we will try to use individual resumeFades where possible.
    const DEFAULT_GLOBAL_FADE = 0.5;

    if (isGlobalPaused) {
      // --- RESUME (Fade In) ---
      if (ctx.state === 'suspended') await ctx.resume();

      // 1. Resume Web Audio
      if (ctx.masterGain) {
        ctx.masterGain.gain.setValueAtTime(0, now);
        ctx.masterGain.gain.linearRampToValueAtTime(masterVolume, now + DEFAULT_GLOBAL_FADE);
      }

      // 2. Resume HTML Audio (Toggles)
      pausedHtmlAudioRef.current.forEach(id => {
        const audio = activeElementsRef.current[id];
        let sound;
        if (id === 'tutorial-demo-1') sound = tutorialSound1;
        else if (id === 'tutorial-demo-2') sound = tutorialSound2;
        else sound = sounds.find(s => s.id === id);

        if (audio && sound) {
          audio.volume = 0;
          audio.play().catch(e => console.error("Resume error", e));

          // Use sound-specific resume fade or default to 0.1 (quick) if undefined
          const fadeDuration = sound.resumeFade !== undefined ? sound.resumeFade : 0.1;
          const targetVol = sound.volume * masterVolume;

          if (fadeDuration > 0.05) {
            startFadeTimer(id, 'RESUMING', fadeDuration);
          }

          const steps = 20;
          const stepTime = (fadeDuration * 1000) / steps;
          const volStep = targetVol / steps;

          // Clear existing fade to prevent conflicts
          if (audio._fadeInterval) clearInterval(audio._fadeInterval);

          let currentVol = 0;
          const fadeInterval = setInterval(() => {
            currentVol += volStep;
            if (currentVol >= targetVol) {
              audio.volume = targetVol;
              clearInterval(fadeInterval);
              audio._fadeInterval = null;
            } else {
              audio.volume = currentVol;
            }
          }, stepTime);
          audio._fadeInterval = fadeInterval;
        }
      });
      pausedHtmlAudioRef.current.clear();
      setIsGlobalPaused(false);

    } else {
      // --- PAUSE (Fade Out) ---
      setIsGlobalPaused(true);

      // 1. Fade Out Web Audio
      if (ctx.masterGain) {
        ctx.masterGain.gain.cancelScheduledValues(now);
        ctx.masterGain.gain.setValueAtTime(ctx.masterGain.gain.value, now);
        ctx.masterGain.gain.linearRampToValueAtTime(0, now + DEFAULT_GLOBAL_FADE);
      }

      // 2. Fade Out HTML Audio (Active Toggles)
      let maxFadeTime = 0;
      // Combine both sound lists for global pause
      const allActive = { ...activeElementsRef.current };
      Object.entries(allActive).forEach(([id, audio]) => {
        let sound;
        if (id === 'tutorial-demo-1') sound = tutorialSound1;
        else if (id === 'tutorial-demo-2') sound = tutorialSound2;
        else sound = sounds.find(s => s.id === id);

        if (audio && !audio.paused && sound) {
          pausedHtmlAudioRef.current.add(id);

          // Use sound-specific pause fade or default
          const fadeDuration = sound.pauseFade !== undefined ? sound.pauseFade : 0.1;
          maxFadeTime = Math.max(maxFadeTime, fadeDuration);

          if (fadeDuration > 0.05) {
            startFadeTimer(id, 'PAUSING', fadeDuration);
          }

          const startVol = audio.volume;
          const steps = 20;
          const stepTime = (fadeDuration * 1000) / steps;
          const volStep = startVol / steps;

          if (audio._fadeInterval) clearInterval(audio._fadeInterval);

          const fadeInterval = setInterval(() => {
            if (audio.volume > volStep) {
              audio.volume -= volStep;
            } else {
              audio.volume = 0;
              clearInterval(fadeInterval);
              audio._fadeInterval = null;
            }
          }, stepTime);
          audio._fadeInterval = fadeInterval;
        }
      });

      // 3. Suspend after longest fade completes (or default)
      const waitTime = Math.max(maxFadeTime, DEFAULT_GLOBAL_FADE) * 1000;

      if (pauseFadeTimeoutRef.current) clearTimeout(pauseFadeTimeoutRef.current);
      pauseFadeTimeoutRef.current = setTimeout(async () => {
        pausedHtmlAudioRef.current.forEach(id => {
          const audio = activeElementsRef.current[id];
          if (audio) audio.pause();
        });
        await ctx.suspend();
      }, waitTime);
    }
  };

  // --- AUDIO LOGIC ---
  const playSound = useCallback(async (id) => {
    // If global paused, auto-resume (with fade in)
    if (isGlobalPaused) {
      await toggleGlobalPause();
    }

    // Check if it's the hidden tutorial sounds first
    let sound;
    if (id === 'tutorial-demo-1') sound = tutorialSound1;
    else if (id === 'tutorial-demo-2') sound = tutorialSound2;
    else sound = sounds.find(s => s.id === id);

    if (!sound) return;

    // Demo Beep Logic
    if (sound.src === 'demo_beep') {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.masterGain);

      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

      const beepVol = 0.3 * sound.volume;
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

    const currentSoundList = id.startsWith('tutorial-demo') ? [tutorialSound1, tutorialSound2] : sounds;
    const toggleTargetVol = sound.volume * masterVolume;

    // --- MODE 1: TOGGLE (Now uses independent Pause/Resume fades) ---
    if (sound.mode === 'toggle' || sound.mode === 'toggle-restart') {
      let audio = activeElementsRef.current[id];

      // CHECK IF PLAYING -> PAUSE IT
      if (audio && !audio.paused) {
        const pauseDuration = sound.pauseFade !== undefined ? sound.pauseFade : 0.1;
        const fadeTime = pauseDuration * 1000;

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
              clearInterval(fadeInterval);
              audio._fadeInterval = null;
              updateVisualState(id, 'reset');
            }
          }, stepTime);
          audio._fadeInterval = fadeInterval;
          startFadeTimer(id, 'PAUSING', pauseDuration);
        } else {
          audio.pause();
          updateVisualState(id, 'reset');
        }
        return;
      }

      // CHECK IF STOPPED/PAUSED -> RESUME IT
      if (!audio || audio.src !== sound.src) {
        audio = new Audio(sound.src);
        activeElementsRef.current[id] = audio;
        audio.onended = () => {
          audio.currentTime = 0;
          updateVisualState(id, 'reset');
        };
      }

      if (audio._fadeInterval) {
        clearInterval(audio._fadeInterval);
        audio._fadeInterval = null;
      }

      audio.loop = sound.loop;

      // Determine if starting from 0 or resuming
      let isResuming = audio.currentTime > 0 && !audio.ended;

      // FORCED RESTART LOGIC
      if (sound.mode === 'toggle-restart') {
        isResuming = false;
        audio.currentTime = 0;
      }

      // Use resumeFade if resuming, otherwise fadeIn
      const fadeDuration = isResuming
        ? (sound.resumeFade !== undefined ? sound.resumeFade : 0.1)
        : (sound.fadeIn || 0);

      const safeVol = toggleTargetVol < 0.001 ? 0 : toggleTargetVol;
      const fadeTime = fadeDuration * 1000;

      if (fadeTime > 0) {
        audio.volume = 0;
        audio.play().catch(e => console.error(e));
        updateVisualState(id, true);

        const steps = 20;
        const stepTime = fadeTime / steps;
        const volStep = safeVol / steps;

        let currentVol = 0;
        const fadeInterval = setInterval(() => {
          currentVol += volStep;
          if (currentVol >= safeVol) {
            audio.volume = safeVol;
            clearInterval(fadeInterval);
            audio._fadeInterval = null;
          } else {
            audio.volume = currentVol;
          }
        }, stepTime);
        audio._fadeInterval = fadeInterval;
        startFadeTimer(id, isResuming ? 'RESUMING' : 'FADE IN', fadeDuration);
      } else {
        audio.volume = safeVol;
        audio.play().catch(e => console.error(e));
        updateVisualState(id, true);
      }
    }

    // --- MODE 2: ONE-SHOT (Web Audio) ---
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
            } catch (e) { }
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
      gainNode.connect(ctx.masterGain);

      const now = ctx.currentTime;
      const fadeIn = sound.fadeIn || 0;
      const oneShotTargetVol = sound.volume;

      if (fadeIn > 0) {
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(oneShotTargetVol, now + fadeIn);
        startFadeTimer(id, 'FADE IN', fadeIn);
      } else {
        gainNode.gain.setValueAtTime(oneShotTargetVol, now);
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

  }, [sounds, masterVolume, isGlobalPaused]);

  const stopAll = () => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    setIsGlobalPaused(false);
    pausedHtmlAudioRef.current.clear();
    setActiveFades({});
    if (pauseFadeTimeoutRef.current) clearTimeout(pauseFadeTimeoutRef.current);

    if (ctx.state === 'suspended') ctx.resume();
    // Restore master gain in case it was faded out by global pause
    if (ctx.masterGain) {
      ctx.masterGain.gain.cancelScheduledValues(now);
      ctx.masterGain.gain.setValueAtTime(masterVolume, now);
    }

    Object.values(activeElementsRef.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        if (audio._fadeInterval) {
          clearInterval(audio._fadeInterval);
          audio._fadeInterval = null;
        }
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
          } catch (e) { }
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
    setStatusMsg("Packing & Compressing...");

    setTimeout(async () => {
      try {
        const serializedSounds = await Promise.all(sounds.map(async (sound) => {
          const src = sound.src.startsWith('blob:') ? await blobToDataURL(sound.src) : sound.src;
          const image = sound.image && sound.image.startsWith('blob:') ? await blobToDataURL(sound.image) : sound.image;
          return { ...sound, src, image };
        }));

        const jsonString = JSON.stringify(serializedSounds);
        let blob;
        let filename = "tenshon_tiler_data.json";

        if ('CompressionStream' in window) {
          try {
            const stream = new Blob([jsonString]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
            const response = await new Response(compressedStream);
            blob = await response.blob();
            filename = "tenshon_tiler_save.ttsave";
          } catch (e) {
            console.warn("Compression failed, falling back to JSON", e);
            blob = new Blob([jsonString], { type: "application/json" });
          }
        } else {
          blob = new Blob([jsonString], { type: "application/json" });
        }

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", URL.createObjectURL(blob));
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

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

    const processImport = async () => {
      try {
        let jsonString;

        if (file.name.endsWith('.ttsave') && 'DecompressionStream' in window) {
          try {
            const stream = file.stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
            const response = await new Response(decompressedStream);
            jsonString = await response.text();
          } catch (e) {
            console.warn("Decompression failed, trying plain text", e);
            jsonString = await file.text();
          }
        } else {
          jsonString = await file.text();
        }

        const importedSounds = JSON.parse(jsonString);
        if (Array.isArray(importedSounds)) {
          stopAll();
          bufferCacheRef.current = {};
          sounds.forEach(s => {
            if (s.src.startsWith('blob:')) URL.revokeObjectURL(s.src);
            if (s.image && s.image.startsWith('blob:')) URL.revokeObjectURL(s.image);
          });

          // MIGRATION LOGIC: Copy old fades if new ones are missing
          const migratedSounds = importedSounds.map(s => ({
            ...s,
            pauseFade: s.pauseFade !== undefined ? s.pauseFade : (s.fadeOut || 0),
            resumeFade: s.resumeFade !== undefined ? s.resumeFade : (s.fadeIn || 0)
          }));

          setSounds(migratedSounds);
          setSelectedCategory('All');
          setStatusMsg("Import Successful!");
        } else {
          setStatusMsg("Error: Invalid Format");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Error: Corrupt File");
      }
      setIsLoading(false);
    };

    processImport();
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
        gain.connect(ctx.masterGain); // Connect to master gain
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

        // Just sound volume, master handled by masterGain
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

      const pVol = editingSound.volume * masterVolume; // Manual calc for preview
      previewAudioRef.current.volume = pVol < 0.001 ? 0 : pVol;

      previewAudioRef.current.play().catch(console.error);
      setIsPreviewPlaying(true);
    }
  };

  const saveSound = () => {
    const soundToSave = {
      ...editingSound,
      category: editingSound.category.trim() || 'General',
      isPlaceholder: false // Any time we save, it's a real sound now
    };

    if (editingSound.id === 'tutorial-demo-1') {
      setTutorialSound1({ ...soundToSave });
      setShowModal(false);
      setEditingSound(null);
      setStatusMsg("Tutorial SFX Updated");
      return;
    }
    if (editingSound.id === 'tutorial-demo-2') {
      setTutorialSound2({ ...soundToSave });
      setShowModal(false);
      setEditingSound(null);
      setStatusMsg("Tutorial Ambient Updated");
      return;
    }

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
      activeSourcesRef.current[id].forEach(({ source }) => { try { source.stop(); } catch (e) { } });
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
      fadeOut: 0.5,
      pauseFade: 0.1, // Default
      resumeFade: 0.1 // Default
    });
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const openEditModal = (sound) => {
    setEditingSound({
      ...sound,
      fadeIn: sound.fadeIn || 0,
      fadeOut: sound.fadeOut || 0,
      // Fallback to original fades if new ones are undefined
      pauseFade: sound.pauseFade !== undefined ? sound.pauseFade : (sound.fadeOut || 0),
      resumeFade: sound.resumeFade !== undefined ? sound.resumeFade : (sound.fadeIn || 0),
      overlap: sound.overlap !== undefined ? sound.overlap : true
    });
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const uniqueRelevantCategories = ['All', ...new Set(sounds.map(s => s.category || 'General'))];

  // Calculate items for current navigation level
  const navItems = uniqueRelevantCategories.filter(cat => {
    if (cat === 'All') return true;
    const parts = cat.split('/');
    // Item is in the current navigation path if its prefix matches navigationPath
    return navigationPath.every((p, i) => parts[i] === p);
  }).map(cat => {
    if (cat === 'All') return { name: 'All', isFolder: false, fullName: 'All' };
    const parts = cat.split('/');
    const currentPart = parts[navigationPath.length];
    const isFolder = parts.length > navigationPath.length + 1;
    // fullName represents the target navigation/category
    const fullName = navigationPath.concat(currentPart).join('/');
    return { name: currentPart, isFolder, fullName };
  }).filter(item => item.name !== undefined);

  // Group by name to identify Folders vs Final Categories
  const currentLevelItems = [];
  const seenNames = new Set();

  navItems.forEach(item => {
    if (!seenNames.has(item.name)) {
      currentLevelItems.push(item);
      seenNames.add(item.name);
    } else if (item.isFolder) {
      // If we see a folder later, ensure the entry is marked as folder
      const existing = currentLevelItems.find(i => i.name === item.name);
      if (existing) existing.isFolder = true;
    }
  });

  const categories = currentLevelItems.sort((a, b) => {
    if (a.name === 'All') return -1;
    if (b.name === 'All') return 1;
    const indexA = customCategoryOrder.indexOf(a.fullName);
    const indexB = customCategoryOrder.indexOf(b.fullName);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredSounds = sounds.filter(s => {
    if (s.id.startsWith('tutorial-demo')) return true; // Keep tutorial sounds
    if (s.id === 'tutorial-demo') return false;
    // Hide placeholders in Play Mode
    if (!isEditMode && s.isPlaceholder) return false;
    return true;
  }).filter(s => {
    const cat = s.category || 'General';
    if (selectedCategory === 'All') return true;

    // If we pick a category, show sounds IN that category
    if (!selectedCategory.endsWith('/')) {
      return cat === selectedCategory;
    } else {
      // If we pick a folder, show all sounds starting with that folder
      return cat.startsWith(selectedCategory);
    }
  }); // Final cleanup

  const handleFolderClick = (folderName) => {
    const newPath = [...navigationPath, folderName];
    setNavigationPath(newPath);
    setSelectedCategory(newPath.join('/') + '/');
  };

  const traverseToPath = (index) => {
    const newPath = navigationPath.slice(0, index + 1);
    setNavigationPath(newPath);
    setSelectedCategory(newPath.join('/') + '/');
  };

  const resetNav = () => {
    setNavigationPath([]);
    setSelectedCategory('All');
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEndCategories = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id && over.id !== 'All') {
      const targetItem = categories.find(c => c.fullName === over.id);
      const sourceItem = categories.find(c => c.fullName === active.id);

      // NESTING LOGIC: Drag onto a folder to move inside it
      if (targetItem?.isFolder && sourceItem) {
        const oldBase = sourceItem.fullName;
        const newBase = targetItem.fullName + '/' + sourceItem.name;

        setSounds(prev => prev.map(s => {
          const cat = s.category || 'General';
          if (cat === oldBase || cat.startsWith(oldBase + '/')) {
            return { ...s, category: cat.replace(oldBase, newBase) };
          }
          return s;
        }));
        setStatusMsg(`Moved to ${targetItem.name}`);
        setTimeout(() => setStatusMsg(''), 2000);
        return;
      }

      const oldItems = [...categories].filter(c => c.fullName !== 'All');
      const activeIndex = oldItems.findIndex(c => c.fullName === active.id);
      const overIndex = oldItems.findIndex(c => c.fullName === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newOrder = arrayMove(oldItems.map(c => c.fullName), activeIndex, overIndex);
        setCustomCategoryOrder(newOrder);
      }
    }
  };

  const handleDragEndSounds = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSounds((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900 pb-20">

      <input type="file" accept=".json,.ttsave" ref={fileInputRef} onChange={importConfig} className="hidden" />

      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-md sticky top-0 z-40 shadow-lg">
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
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 2. CONTROLS BAR (Volume Left - Buttons Right) */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full lg:flex-1 lg:ml-4 gap-3">

              {/* LEFT: Volume */}
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-inner w-full sm:w-auto flex-1">
                <Volume2 className="w-5 h-5 text-slate-400" />
                <input
                  type="range" min="0" max="1" step="0.01" value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-full sm:w-20 lg:w-24 accent-cyan-500 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer flex-1"
                />
                <div className="flex items-center bg-slate-900/50 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={parseFloat((masterVolume * 100).toFixed(2))}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (!isNaN(val)) setMasterVolume(val / 100);
                    }}
                    className="text-xs font-mono font-bold text-cyan-400 w-10 text-right bg-transparent focus:outline-none appearance-none hide-arrows"
                    title="Edit Master Volume"
                  />
                  <span className="text-xs font-mono font-bold text-cyan-400">%</span>
                </div>
              </div>

              {/* RIGHT: Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">

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
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  {/* PAUSE / RESUME BUTTON */}
                  <button
                    onClick={toggleGlobalPause}
                    className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg transition-all font-bold active:scale-95 whitespace-nowrap shadow-sm group border
                            ${isGlobalPaused
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-white'}
                          `}
                    title={isGlobalPaused ? "Resume All Sounds" : "Pause All Sounds"}
                  >
                    {isGlobalPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
                    <span className="hidden sm:inline">{isGlobalPaused ? "Resume" : "Pause"}</span>
                  </button>

                  <button
                    onClick={stopAll}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl sm:rounded-lg transition-all font-bold active:scale-95 whitespace-nowrap shadow-sm group"
                  >
                    <Square className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Stop</span>
                    {globalPlayCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                        {globalPlayCount}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-lg transition-all border font-bold ${isEditMode ? 'bg-cyan-500 text-slate-900 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-400'}`}
                  title="Toggle Edit Mode"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Mode</span>
                </button>
              </div>
            </div>

          </div>

          {/* Navigation Breadcrumbs & Items */}
          <div className="flex flex-col gap-3">
            {navigationPath.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                <button onClick={resetNav} className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
                  <Home className="w-3 h-3" /> Home
                </button>
                {navigationPath.map((segment, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <button
                      onClick={() => traverseToPath(idx)}
                      className={`hover:text-cyan-400 transition-colors ${idx === navigationPath.length - 1 ? 'text-cyan-500' : ''}`}
                    >
                      {segment}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mask-gradient-right">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategories}>
                <SortableContext items={categories.map(c => c.fullName)} strategy={horizontalListSortingStrategy}>
                  {categories.map(cat => (
                    <SortableCategory
                      key={cat.fullName}
                      category={cat.name}
                      fullName={cat.fullName}
                      selectedCategory={selectedCategory === cat.fullName ? cat.name : (selectedCategory === cat.fullName + '/' ? cat.name : null)}
                      setSelectedCategory={() => {
                        setSelectedCategory(cat.fullName);
                      }}
                      handleFolderClick={() => handleFolderClick(cat.name)}
                      isFolder={cat.isFolder}
                      isEditMode={isEditMode}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {isEditMode && (
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => setShowNewCatModal(true)}
                    className="flex items-center justify-center p-2 min-w-[36px] bg-slate-800/50 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-full transition-all shrink-0"
                    title="Add Folder/Category"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSounds}>
            <SortableContext items={filteredSounds.map(s => s.id)} strategy={rectSortingStrategy}>
              {filteredSounds.map((sound) => (
                <SortableSoundTile
                  key={sound.id}
                  sound={sound}
                  isEditMode={isEditMode}
                  isActive={activeSounds[sound.id]}
                  isGlobalPaused={isGlobalPaused}
                  playSound={playSound}
                  openEditModal={openEditModal}
                  fadeInfo={activeFades[sound.id]}
                />
              ))}
            </SortableContext>
          </DndContext>

          {isEditMode && (
            <button
              onClick={openNewSoundModal}
              className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-all group"
            >
              <div className="p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-medium text-sm">Add Sound</span>
            </button>
          )}
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
              <button
                onClick={() => {
                  setShowCredits(false);
                  setShowTutorial(true);
                }}
                className="flex items-center justify-center gap-3 w-full p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl transition-all font-medium text-cyan-400 hover:text-cyan-300 group"
              >
                <BookOpen className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                View App Tutorial
              </button>
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

            <div className="mt-8 text-xs text-slate-500 flex flex-col items-center justify-center gap-1">
              <p>{APP_CONFIG.credits.footerText}</p>
              <p className="opacity-50 font-mono">v{APP_CONFIG.version}</p>
            </div>

            <div className="mt-6 border-t border-slate-700/50 pt-6">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to completely erase your soundboard? This cannot be undone!")) {
                    window.indexedDB.deleteDatabase('TenshonDB');
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex items-center justify-center gap-2 w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/50 rounded-xl transition-all font-bold group"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Factory Reset All Data
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Tutorial Modal */}
      {
        showTutorial && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowTutorial(false)}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>

              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Application Tutorial</h2>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Getting Started Guide</p>
                  </div>
                </div>
                <button onClick={() => setShowTutorial(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-10 selection:bg-cyan-500/30">

                {/* Introduction */}
                <section className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Welcome
                  </div>
                  <h3 className="text-3xl font-black text-white italic">Tenshon Tiler 🎵</h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    A professional, web-based soundboard application designed for theater productions, live events, and podcasts.
                    Experience zero-latency audio with a powerful custom engine.
                  </p>
                </section>

                {/* Features */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> Core Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: "Low Latency", desc: "Uses Web Audio API for instant response.", icon: Zap, color: "text-amber-400" },
                      { title: "Hierarchy", desc: "Use '/' in categories to create folders.", icon: Folder, color: "text-cyan-400" },
                      { title: "Fades & Timers", desc: "Live countdowns for every transition.", icon: Activity, color: "text-indigo-400" },
                      { title: "Dual Toggles", desc: "Choice between Pausable or Restart.", icon: Power, color: "text-rose-400" }
                    ].map((f, i) => (
                      <div key={i} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors">
                        <f.icon className={`w-5 h-5 mb-2 ${f.color}`} />
                        <h5 className="font-bold text-slate-200">{f.title}</h5>
                        <p className="text-sm text-slate-400">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* How to Use */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> How To Use
                  </h4>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">1</div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">Adding Sounds</p>
                        <p className="text-sm text-slate-400">Click the <span className="text-cyan-400">+ Add Sound</span> button. Upload MP3/WAV, set a color, and assign a <span className="text-white font-mono">Keyboard Shortcut</span>.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">2</div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">Edit Mode</p>
                        <p className="text-sm text-slate-400">Toggle <span className="text-cyan-400">Gear Icon ⚙️</span> to enter Edit Mode. Hover over tiles to adjust volume, fades, or playback modes.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-none w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">3</div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">Saving Your Board</p>
                        <p className="text-sm text-slate-400">Use <span className="text-cyan-400">Export</span> to download your <span className="text-white font-mono">.ttsave</span> file. Everything is stored locally!</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Playback Modes */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> Mode Examples
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h5 className="font-bold text-white uppercase text-xs tracking-widest">One-Shot Mode</h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">Best for short, punchy sounds. High-performance "stacking" allows for rapid fire effects.</p>
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-500/10 mt-2 pt-3">
                        <button
                          onClick={() => playSound('tutorial-demo-1')}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold transition-all active:scale-95 border border-amber-500/20"
                        >
                          <Play className="w-3 h-3" /> Play SFX
                        </button>
                      </div>
                    </div>
                    <div className="p-5 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Power className="w-5 h-5 text-cyan-400" />
                          <h5 className="font-bold text-white uppercase text-xs tracking-widest">Togglable : Pausable</h5>
                        </div>
                        <div className="flex gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${activeSounds['tutorial-demo-2'] ? 'bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan]' : 'bg-slate-700'}`} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">Resumes from where you left off. Perfect for long ambient loops or background tracks.</p>
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-cyan-500/10 mt-2 pt-3">
                        <button
                          onClick={() => {
                            setTutorialSound2(prev => ({ ...prev, mode: 'toggle' }));
                            playSound('tutorial-demo-2');
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border ${activeSounds['tutorial-demo-2'] && tutorialSound2.mode === 'toggle' ? 'bg-cyan-500 text-slate-900 border-cyan-400' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/30'}`}
                        >
                          <Pause className="w-3 h-3" /> {activeSounds['tutorial-demo-2'] && tutorialSound2.mode === 'toggle' ? 'Pause Ambient' : 'Start Ambient'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Restart vs Pausable */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> Togglable Comparison
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3 group hover:border-slate-500 transition-colors">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-bold text-slate-200 text-cyan-400 uppercase tracking-widest">Togglable : Restart</p>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Always starts from the beginning (0:00). Ideal for stingers or repetitive music beds.</p>
                      <button
                        onClick={() => {
                          setTutorialSound2(prev => ({ ...prev, mode: 'toggle-restart' }));
                          if (!activeSounds['tutorial-demo-2']) playSound('tutorial-demo-2');
                        }}
                        className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeSounds['tutorial-demo-2'] && tutorialSound2.mode === 'toggle-restart' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20'}`}
                      >
                        Test Restart
                      </button>
                    </div>
                    <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3 group hover:border-slate-500 transition-colors">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-cyan-400" />
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">Hierarchy & Nesting</p>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Use "/" in Categories to nest. In Edit Mode, drag a category INTO a folder to group them instantly!</p>
                      <div className="flex gap-2 pt-2">
                        <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-400">
                          Act 1/Props/Sword
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Stack vs Cut */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> Overlay vs Cut
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3 group hover:border-slate-500 transition-colors">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-bold text-slate-200">Overlay (Stacking)</p>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Sounds stack on each other. Spam the button to hear multiple beeps at once.</p>
                      <button
                        onClick={() => {
                          setTutorialSound1(prev => ({ ...prev, overlap: true }));
                          playSound('tutorial-demo-1');
                        }}
                        className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Test Overlay
                      </button>
                    </div>
                    <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3 group hover:border-slate-500 transition-colors">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <p className="text-xs font-bold text-slate-200">Cut (Choke Group)</p>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">New sound stops the old one instantly. No overlap, keeps things clean and tight.</p>
                      <button
                        onClick={() => {
                          setTutorialSound1(prev => ({ ...prev, overlap: false }));
                          playSound('tutorial-demo-1');
                        }}
                        className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Test Cut
                      </button>
                    </div>
                  </div>
                </section>

                {/* Edit Mode Demo Guide */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="h-px w-8 bg-slate-800"></div> Edit Mode Guide
                  </h4>
                  <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Settings className="w-24 h-24" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-cyan-400">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm">1. Toggle Edit</p>
                          <p className="text-xs text-slate-500 mt-1">Click the Gear icon in the header to enter Edit Mode.</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm">2. Hover Tile</p>
                          <p className="text-xs text-slate-500 mt-1">While in Edit Mode, hover over any sound board tile.</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <MoreVertical className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm">3. Customize</p>
                          <p className="text-xs text-slate-500 mt-1">Click the vertical dots icon to adjust volume, fades, and modes.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Edit Playground */}
                <section className="p-6 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-6 shadow-inner">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Live Experiment (SFX)
                        </h4>
                        <p className="text-[11px] text-slate-500">Try changing the volume or color of the SFX sound!</p>
                      </div>
                      <button
                        onClick={() => openEditModal(tutorialSound1)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg text-[10px] font-bold shadow-lg hover:shadow-indigo-500/20 hover:scale-105 transition-all active:scale-95"
                      >
                        <Settings className="w-3.5 h-3.5" /> Edit SFX
                      </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                      <div className={`w-12 h-12 rounded-lg ${COLORS[tutorialSound1.color].class} flex items-center justify-center shadow-lg`}>
                        <Music className="w-6 h-6 text-white/50" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{tutorialSound1.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Current Mode: {tutorialSound1.mode === 'toggle' ? 'Toggle' : 'One-Shot'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => playSound('tutorial-demo-1')} className="p-2 hover:bg-slate-700 rounded-lg text-cyan-400 transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Live Experiment (Ambient)
                        </h4>
                        <p className="text-[11px] text-slate-500">Try changing the volume or color of the Ambient sound!</p>
                      </div>
                      <button
                        onClick={() => openEditModal(tutorialSound2)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-[10px] font-bold shadow-lg hover:shadow-cyan-500/20 hover:scale-105 transition-all active:scale-95"
                      >
                        <Settings className="w-3.5 h-3.5" /> Edit Ambient
                      </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                      <div className={`w-12 h-12 rounded-lg ${COLORS[tutorialSound2.color].class} flex items-center justify-center shadow-lg relative`}>
                        <Music className="w-6 h-6 text-white/50" />
                        {activeSounds['tutorial-demo-2'] && (
                          <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{tutorialSound2.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Current Mode: {tutorialSound2.mode === 'toggle' ? 'Toggle' : 'One-Shot'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => playSound('tutorial-demo-2')} className="p-2 hover:bg-slate-700 rounded-lg text-cyan-400 transition-colors">
                          <Power className={`w-4 h-4 ${activeSounds['tutorial-demo-2'] ? 'text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex justify-center">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
                >
                  Let's Go!
                </button>
              </div>

            </div>
          </div>
        )
      }

      {
        showModal && editingSound && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">

              <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">
                  {editingSound.id ? 'Edit Button' : 'New Button'}
                </h2>
                <div className="flex items-center gap-2">
                  {editingSound.id && editingSound.src && editingSound.src !== 'demo_beep' && !editingSound.id.startsWith('tutorial-demo') && (
                    <button
                      onClick={async () => {
                        try {
                          let urlToDownload = editingSound.src;
                          // Attempt to make sure it's downloadable if it's already a regular link
                          // If it's data/blob, just use it
                          const a = document.createElement('a');
                          a.href = urlToDownload;
                          a.download = `${editingSound.name || 'sound'}.mp3`; // Fallback extension
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } catch (e) {
                          console.error("Download failed", e);
                        }
                      }}
                      className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Download Individual Sound File"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-white transition-colors p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
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
                      setEditingSound({ ...editingSound, src: '', name: editingSound.name || '' });
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
                      onChange={e => setEditingSound({ ...editingSound, name: e.target.value })}
                      placeholder="e.g. Sword Clang"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400">Category</label>
                    <input
                      type="text"
                      list="category-suggestions"
                      value={editingSound.category}
                      onChange={e => setEditingSound({ ...editingSound, category: e.target.value })}
                      placeholder="e.g. Act 1"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white"
                    />
                    <datalist id="category-suggestions">
                      {uniqueRelevantCategories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                    <MessageSquare className="w-4 h-4" /> Notes & Cues
                  </label>
                  <textarea
                    value={editingSound.note || ''}
                    onChange={e => setEditingSound({ ...editingSound, note: e.target.value })}
                    placeholder="e.g. Play this when she says '...'"
                    className="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none text-white resize-y custom-scrollbar"
                  />
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
                          <button onClick={() => setEditingSound({ ...editingSound, image: null })} className="text-xs text-red-400 hover:text-red-300 mt-2 block">
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
                            onClick={() => setEditingSound({ ...editingSound, color: idx })}
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
                        onChange={e => setEditingSound({ ...editingSound, keybind: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 px-3 py-2 font-mono uppercase text-center text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        placeholder="None"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-slate-400">Clip Volume</label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={parseFloat((editingSound.volume * 100).toFixed(2))}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            if (!isNaN(val)) setEditingSound({ ...editingSound, volume: val / 100 });
                          }}
                          className="text-xs font-mono font-medium text-cyan-400 w-12 text-right bg-transparent focus:outline-none appearance-none hover:bg-slate-900 px-1 rounded transition-colors hide-arrows"
                          title="Edit Clip Volume"
                        />
                        <span className="text-xs font-mono font-medium text-cyan-400">%</span>
                      </div>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={editingSound.volume}
                      onChange={e => setEditingSound({ ...editingSound, volume: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-3"
                    />
                  </div>
                </div>

                {/* FADE CONTROLS */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                  {/* Standard Fades (Start/End) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Fade In (Start)</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="5"
                            value={parseFloat((editingSound.fadeIn || 0).toFixed(2))}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value);
                              if (!isNaN(val)) setEditingSound({ ...editingSound, fadeIn: val });
                            }}
                            className="text-cyan-400 w-12 text-right bg-transparent focus:outline-none appearance-none hover:bg-slate-900 px-1 rounded transition-colors hide-arrows"
                            title="Edit Fade In Time"
                          />
                          <span className="text-cyan-400 ml-0.5">s</span>
                        </div>
                      </div>
                      <input
                        type="range" min="0" max="5" step="0.5"
                        value={editingSound.fadeIn || 0}
                        onChange={e => setEditingSound({ ...editingSound, fadeIn: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Fade Out (End)</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="5"
                            value={parseFloat((editingSound.fadeOut || 0).toFixed(2))}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value);
                              if (!isNaN(val)) setEditingSound({ ...editingSound, fadeOut: val });
                            }}
                            className="text-cyan-400 w-12 text-right bg-transparent focus:outline-none appearance-none hover:bg-slate-900 px-1 rounded transition-colors hide-arrows"
                            title="Edit Fade Out Time"
                          />
                          <span className="text-cyan-400 ml-0.5">s</span>
                        </div>
                      </div>
                      <input
                        type="range" min="0" max="5" step="0.5"
                        value={editingSound.fadeOut || 0}
                        onChange={e => setEditingSound({ ...editingSound, fadeOut: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Pause/Resume Fades (Only for Toggle Mode) */}
                  {editingSound.mode === 'toggle' && (
                    <div className="grid grid-cols-2 gap-6 pt-2 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Resume Fade</span>
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="5"
                              value={parseFloat((editingSound.resumeFade ?? 0.1).toFixed(2))}
                              onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (!isNaN(val)) setEditingSound({ ...editingSound, resumeFade: val });
                              }}
                              className="text-indigo-400 w-12 text-right bg-transparent focus:outline-none appearance-none hover:bg-slate-900 px-1 rounded transition-colors hide-arrows"
                              title="Edit Resume Fade Time"
                            />
                            <span className="text-indigo-400 ml-0.5">s</span>
                          </div>
                        </div>
                        <input
                          type="range" min="0" max="5" step="0.1"
                          value={editingSound.resumeFade ?? 0.1}
                          onChange={e => setEditingSound({ ...editingSound, resumeFade: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Pause Fade</span>
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              max="5"
                              value={parseFloat((editingSound.pauseFade ?? 0.1).toFixed(2))}
                              onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (!isNaN(val)) setEditingSound({ ...editingSound, pauseFade: val });
                              }}
                              className="text-amber-400 w-12 text-right bg-transparent focus:outline-none appearance-none hover:bg-slate-900 px-1 rounded transition-colors hide-arrows"
                              title="Edit Pause Fade Time"
                            />
                            <span className="text-amber-400 ml-0.5">s</span>
                          </div>
                        </div>
                        <input
                          type="range" min="0" max="5" step="0.1"
                          value={editingSound.pauseFade ?? 0.1}
                          onChange={e => setEditingSound({ ...editingSound, pauseFade: parseFloat(e.target.value) })}
                          className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex bg-slate-800 rounded-md p-0.5">
                    <button
                      onClick={() => setEditingSound({ ...editingSound, mode: 'restart' })}
                      className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.mode === 'restart' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Zap className="w-3 h-3" /> One-Shot
                    </button>
                    <button
                      onClick={() => setEditingSound({ ...editingSound, mode: (editingSound.mode === 'toggle-restart' ? 'toggle-restart' : 'toggle') })}
                      className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${(editingSound.mode === 'toggle' || editingSound.mode === 'toggle-restart') ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Power className="w-3 h-3" /> Toggle
                    </button>
                  </div>

                  {(editingSound.mode === 'toggle' || editingSound.mode === 'toggle-restart') && (
                    <div className="flex bg-slate-800 rounded-md p-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                      <button
                        onClick={() => setEditingSound({ ...editingSound, mode: 'toggle' })}
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.mode === 'toggle' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Pause and resume from where it left off"
                      >
                        <Pause className="w-3 h-3" /> Pausable
                      </button>
                      <button
                        onClick={() => setEditingSound({ ...editingSound, mode: 'toggle-restart' })}
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.mode === 'toggle-restart' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Always start from the beginning when toggled ON"
                      >
                        <RotateCcw className="w-3 h-3" /> Restart
                      </button>
                    </div>
                  )}

                  {editingSound.mode === 'restart' && (
                    <div className="flex bg-slate-800 rounded-md p-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                      <button
                        onClick={() => setEditingSound({ ...editingSound, overlap: true })}
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${editingSound.overlap ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Stack sounds on top of each other"
                      >
                        <Layers className="w-3 h-3" /> Overlap
                      </button>
                      <button
                        onClick={() => setEditingSound({ ...editingSound, overlap: false })}
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-2 ${!editingSound.overlap ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        title="Stop previous sound when pressed again"
                      >
                        <Scissors className="w-3 h-3" /> Cut
                      </button>
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input type="checkbox" checked={editingSound.loop} onChange={e => setEditingSound({ ...editingSound, loop: e.target.checked })} className="rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-offset-0 focus:ring-0" />
                    <span className="text-sm text-slate-300">Loop Audio</span>
                  </label>
                </div>

              </div>

              <div className="p-5 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-between gap-4">
                {editingSound.id && !editingSound.id.startsWith('tutorial-demo') ? (
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
                ) : <div />}
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
        )
      }

      {/* New Folder/Category Modal */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-700 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" /> Create Folder/Cat
              </h3>
              <button onClick={() => setShowNewCatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Name (Use / for depth)</p>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Act 2/Scene 1"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 ring-cyan-500 outline-none"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCatName.trim()) {
                    const finalCat = (navigationPath.length > 0 ? navigationPath.join('/') + '/' : '') + newCatName;
                    setSounds(prev => [...prev, {
                      id: 'new-cat-' + Date.now(),
                      name: 'Folder Placeholder',
                      category: finalCat,
                      src: 'demo_beep',
                      volume: 0.5,
                      mode: 'restart',
                      isPlaceholder: true
                    }]);
                    setNewCatName('');
                    setShowNewCatModal(false);
                  }
                }}
              />
              <p className="text-[10px] text-slate-500 italic">Adding a category creates an empty placeholder beep.</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowNewCatModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium">Cancel</button>
              <button
                onClick={() => {
                  if (!newCatName.trim()) return;
                  const finalCat = (navigationPath.length > 0 ? navigationPath.join('/') + '/' : '') + newCatName;
                  setSounds(prev => [...prev, {
                    id: 'new-cat-' + Date.now(),
                    name: 'Folder Placeholder',
                    category: finalCat,
                    src: 'demo_beep',
                    volume: 0.5,
                    mode: 'restart',
                    isPlaceholder: true
                  }]);
                  setNewCatName('');
                  setShowNewCatModal(false);
                }}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-900/40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
