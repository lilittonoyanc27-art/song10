/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, ChangeEvent } from 'react';
import { 
  Play, 
  Pause, 
  Search, 
  Music2, 
  Volume2, 
  SkipBack, 
  SkipForward, 
  Folder,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Song {
  id: string;
  title: string;
  style?: string;
  number?: number;
  audioUrl: string;
  coverUrl?: string;
}

interface SongFolder {
  id: string;
  title: string;
  songs: Song[];
}

// Supabase-backed folder dataset
const FOLDERS: SongFolder[] = [
  {
    id: "ka-mi-ashxarh",
    title: "Ka mi ashxarh",
    songs: [
      {
        id: "ka-mi-ashxarh-1",
        title: "Ka mi ashxarh",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Ka%20mi%20ashxarh/Ka%20mi%20ashxarh.mp3"
      },
      {
        id: "ka-mi-ashxarh-2",
        title: "Ka mi ashxarh 1",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Ka%20mi%20ashxarh/Ka%20mi%20ashxarh%20(1).mp3"
      },
      {
        id: "ka-mi-ashxarh-3",
        title: "Ka mi ashxarh 3",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Ka%20mi%20ashxarh/Ka%20mi%20ashxarh%20(3).mp3"
      },
      {
        id: "ka-mi-ashxarh-4",
        title: "Ka mi ashxarh 4",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Ka%20mi%20ashxarh/Ka%20mi%20ashxarh%20(4).mp3"
      }
    ]
  },
  {
    id: "qez-hishelis",
    title: "Qez hishelis",
    songs: [
      {
        id: "qez-hishelis-1",
        title: "Du kas indz hamar 2",
        audioUrl: "https://xheftaljhwusyssqcwvpg.supabase.co/storage/v1/object/public/songs/Qez%20hishelis/Du%20kas%20indz%20hamar%20%282%29.mp3"
      },
      {
        id: "qez-hishelis-2",
        title: "Du kas indz hamar 3",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Qez%20hishelis/Du%20kas%20indz%20hamar%20(2).mp3"
      },
      {
        id: "qez-hishelis-3",
        title: "Du kas indz hamar 4",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Qez%20hishelis/Du%20kas%20indz%20hamar%20(4).mp3"
      },
      {
        id: "qez-hishelis-4",
        title: "Du kas indz hamar 5",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Qez%20hishelis/Du%20kas%20indz%20hamar%20(5).mp3"
      }
    ]
  },
  {
    id: "tarorinak-ser",
    title: "Tarorinak ser",
    songs: [
      {
        id: "tarorinak-ser-1",
        title: "Folk 9",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Tarorinak%20ser/folk%20(9).mp3"
      },
      {
        id: "tarorinak-ser-2",
        title: "Folk 10",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Tarorinak%20ser/folk%20(10).mp3"
      },
      {
        id: "tarorinak-ser-3",
        title: "Folk 11",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Tarorinak%20ser/folk%20(11).mp3"
      },
      {
        id: "tarorinak-ser-4",
        title: "Folk 12",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Tarorinak%20ser/folk%20(12).mp3"
      }
    ]
  },
  {
    id: "vremena",
    title: "Vremena",
    songs: [
      {
        id: "vremena-1",
        title: "Vremena",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Vremena/Vremena.mp3"
      },
      {
        id: "vremena-2",
        title: "Vremena 2",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Vremena/Vremena2.mp3"
      },
      {
        id: "vremena-3",
        title: "Vremena 3",
        audioUrl: "https://xheftaljhwusyssqcwpg.supabase.co/storage/v1/object/public/songs/Vremena/Vremena3.mp3"
      }
    ]
  }
];

export default function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [failedSongs, setFailedSongs] = useState<Record<string, boolean>>({});
  
  // Real blob cache and loading states to bypass CORS & content-type limitations
  const [blobCache, setBlobCache] = useState<Record<string, string>>({});
  const [loadingSongs, setLoadingSongs] = useState<Record<string, boolean>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Flattened songs array from all folders for convenience
  const allSongs = useMemo(() => {
    return FOLDERS.flatMap(f => f.songs);
  }, []);

  const selectedFolder = useMemo(() => {
    return FOLDERS.find(f => f.id === selectedFolderId) || null;
  }, [selectedFolderId]);

  // Derived active playlist based on the screen context
  const playlist = useMemo(() => {
    if (selectedFolder) {
      return selectedFolder.songs;
    }
    return allSongs;
  }, [selectedFolder, allSongs]);

  const currentSong = useMemo(() => 
    allSongs.find(s => s.id === currentSongId), 
    [currentSongId, allSongs]
  );

  // Search logic
  const filteredFolders = useMemo(() => {
    if (selectedFolderId) return [];
    return FOLDERS.filter(folder => 
      folder.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, selectedFolderId]);

  const filteredSongs = useMemo(() => {
    if (!selectedFolder) return [];
    return selectedFolder.songs.filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedFolder, searchQuery]);

  // Lazy preloading of the active song via Blob URL
  const fetchSongBlob = async (song: Song): Promise<string> => {
    if (blobCache[song.id]) {
      return blobCache[song.id];
    }

    setLoadingSongs(prev => ({ ...prev, [song.id]: true }));
    setFailedSongs(prev => ({ ...prev, [song.id]: false }));
    setAudioError(null);

    try {
      const response = await fetch(song.audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const rawBlob = await response.blob();
      // Force correct MIME type for flawless decoding on iOS, Safari, and Chrome
      const audioBlob = new Blob([rawBlob], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(audioBlob);

      setBlobCache(prev => ({ ...prev, [song.id]: blobUrl }));
      setLoadingSongs(prev => ({ ...prev, [song.id]: false }));
      return blobUrl;
    } catch (error) {
      console.error('Error fetching song blob:', song.title, error);
      setLoadingSongs(prev => ({ ...prev, [song.id]: false }));
      setFailedSongs(prev => ({ ...prev, [song.id]: true }));
      setAudioError('Failed to load audio source.');
      throw error;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Control playback of the main/global audio player
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSongId && isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Playback error:', error.message || error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [currentSongId, isPlaying]);

  // Synchronized toggler for custom playback UI and control
  const togglePlay = async (id?: string) => {
    setAudioError(null);
    const targetId = id || currentSongId;
    
    if (!targetId) {
      const defaultSong = playlist[0] || allSongs[0];
      if (defaultSong) {
        await playSongWithBlob(defaultSong);
      }
      return;
    }

    const song = allSongs.find(s => s.id === targetId);
    if (!song) return;

    if (targetId !== currentSongId) {
      await playSongWithBlob(song);
    } else {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      if (nextPlaying) {
        // Intercept and pause card players to prevent dual-playback echo
        allSongs.forEach(s => {
          const el = document.getElementById(`audio-card-${s.id}`) as HTMLAudioElement;
          if (el) el.pause();
        });
        setTimeout(() => {
          audioRef.current?.play().catch((err) => {
            if (err.name !== 'AbortError') {
              console.error('Playback trigger error:', err);
            }
          });
        }, 50);
      } else {
        audioRef.current?.pause();
        allSongs.forEach(s => {
          const el = document.getElementById(`audio-card-${s.id}`) as HTMLAudioElement;
          if (el) el.pause();
        });
      }
    }
  };

  const playSongWithBlob = async (song: Song) => {
    setCurrentSongId(song.id);
    setIsPlaying(false);

    // Turn off native card-level players
    allSongs.forEach(s => {
      const el = document.getElementById(`audio-card-${s.id}`) as HTMLAudioElement;
      if (el) el.pause();
    });

    try {
      await fetchSongBlob(song);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Playback trigger error:', err);
          }
        });
      }, 50);
    } catch (e) {
      console.error('Could not initiate playing:', e);
    }
  };

  // Event handlers for the native `<audio controls>` components in song cards
  const onCardAudioPlay = (songId: string) => {
    // 1. Pause global player
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 2. Pause other card players
    allSongs.forEach(s => {
      if (s.id !== songId) {
        const el = document.getElementById(`audio-card-${s.id}`) as HTMLAudioElement;
        if (el) el.pause();
      }
    });

    setCurrentSongId(songId);
    setIsPlaying(true);
    setAudioError(null);
  };

  const onCardAudioPause = (songId: string) => {
    if (currentSongId === songId) {
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const val = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(val) ? 0 : val);
    }
  };

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextProgress = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (nextProgress / 100) * audioRef.current.duration;
      setProgress(nextProgress);
    }
  };

  const handleNext = () => {
    const currentIndex = playlist.findIndex(s => s.id === currentSongId);
    if (currentIndex === -1) return;
    if (currentIndex < playlist.length - 1) {
      const nextSong = playlist[currentIndex + 1];
      playSongWithBlob(nextSong);
    } else {
      const firstSong = playlist[0];
      playSongWithBlob(firstSong);
    }
  };

  const handlePrev = () => {
    const currentIndex = playlist.findIndex(s => s.id === currentSongId);
    if (currentIndex === -1) return;
    if (currentIndex > 0) {
      const prevSong = playlist[currentIndex - 1];
      playSongWithBlob(prevSong);
    } else {
      const lastSong = playlist[playlist.length - 1];
      playSongWithBlob(lastSong);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#0a0502] text-gray-100 font-sans selection:bg-amber-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="immersive-glow immersive-glow-top" />
        <div className="immersive-glow immersive-glow-bottom" />
        
        {/* Stylized Instrument Strings */}
        <div className="instrument-strings">
          <div className="string-line" />
          <div className="string-line" />
          <div className="string-line" />
          <div className="string-line" />
          <div className="string-line" />
        </div>
      </div>
      
      <main className="relative z-10 container mx-auto px-8 py-10 pb-40">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h1 className="text-3xl font-light tracking-widest uppercase text-amber-500 mb-1">
              Song Collection
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Digital Archive v2.4</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input 
                type="text" 
                placeholder={selectedFolderId ? "Search songs..." : "Search folders..."}
                className="bg-white/5 border border-white/10 rounded-full py-2.5 px-6 w-full md:w-72 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm backdrop-blur-md transition-all group-focus-within:bg-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
            </div>
          </div>
        </header>

        {/* Back to Folders bar if a folder is open */}
        {selectedFolder && (
          <div className="flex items-center justify-between gap-4 mb-8">
            <button 
              onClick={() => {
                setSelectedFolderId(null);
                setSearchQuery('');
              }}
              className="btn-pill btn-pill-inactive flex items-center gap-2 cursor-pointer py-2 px-5 hover:border-amber-500/50"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
              <span>Назад к папкам</span>
            </button>
            <div className="text-right">
              <span className="text-xs uppercase tracking-widest text-amber-500/70 font-semibold block">Активная Папка</span>
              <h2 className="text-lg font-medium text-white">{selectedFolder.title}</h2>
            </div>
          </div>
        )}

        {/* Main Content Areas */}
        <AnimatePresence mode="wait">
          {!selectedFolderId ? (
            // FOLDERS VIEW (Main Grid of Folders)
            <motion.div 
              key="folders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-sm uppercase tracking-widest text-amber-500 font-semibold mb-6">Папки музыкального сборника</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFolders.map((folder, index) => {
                  const songCount = folder.songs.length;
                  return (
                    <motion.div 
                      key={folder.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group relative glass-morphism rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-between hover:bg-white/10 hover:border-amber-500/30 transition-all duration-500 min-h-[220px] cursor-pointer"
                      onClick={() => {
                        setSelectedFolderId(folder.id);
                        setSearchQuery('');
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors border border-amber-500/10">
                          <Folder className="w-8 h-8 text-amber-500" />
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded border border-amber-500/20 text-amber-500 uppercase tracking-widest font-semibold bg-amber-500/5">
                          {songCount} {songCount === 1 ? 'песня' : 'песен'}
                        </span>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-xl font-medium mb-1 text-white group-hover:text-amber-400 transition-colors">
                          {folder.title}
                        </h3>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                          Сборник альбома
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredFolders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 italic">
                  <p className="text-lg tracking-widest uppercase opacity-40">Папки не найдены</p>
                </div>
              )}
            </motion.div>
          ) : (
            // SONGS VIEW (Inside Selected Folder)
            <motion.div 
              key="songs"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSongs.map((song, index) => (
                  <motion.div 
                    layout
                    key={song.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className={`group relative glass-morphism rounded-2xl p-6 backdrop-blur-xl flex flex-col hover:bg-white/10 transition-all duration-500 min-h-[260px] ${currentSongId === song.id ? 'ring-1 ring-amber-500/50 bg-white/10' : ''}`}
                    onClick={() => togglePlay(song.id)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[36px] font-light leading-none tracking-tighter transition-colors duration-500 ${currentSongId === song.id ? 'text-amber-500/20' : 'text-white/10'}`}>
                        {((song.number !== undefined) ? song.number : (index + 1)).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-500 uppercase tracking-widest font-semibold bg-amber-500/5">
                        {song.style || 'поп'}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium mb-1 truncate text-white">
                      {song.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
                      {currentSongId === song.id && isPlaying ? 'Now Playing' : 'Альбомный трек'}
                    </p>

                    <div className="mt-auto flex flex-col gap-3">
                      <button 
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg cursor-pointer ${
                          currentSongId === song.id && isPlaying 
                          ? 'bg-white text-black shadow-white/10' 
                          : 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-600/20'
                        }`}
                      >
                        {loadingSongs[song.id] ? (
                          <Loader2 size={18} className="animate-spin text-amber-500" />
                        ) : currentSongId === song.id && isPlaying ? (
                          <Pause size={18} fill="currentColor" />
                        ) : (
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                      
                      {song.audioUrl && (
                        <div className="w-full mt-2" onClick={(e) => e.stopPropagation()}>
                          <audio 
                            id={`audio-card-${song.id}`}
                            controls 
                            preload="none"
                            src={blobCache[song.id] || song.audioUrl} 
                            className="w-full h-8 opacity-40 hover:opacity-100 transition-opacity"
                            onPlay={() => onCardAudioPlay(song.id)}
                            onPause={() => onCardAudioPause(song.id)}
                            onError={() => {
                              setFailedSongs(prev => ({ ...prev, [song.id]: true }));
                            }}
                          />
                          {loadingSongs[song.id] && (
                            <div className="flex items-center gap-2 text-[10px] text-amber-500 mt-1 justify-center bg-amber-500/5 py-1 rounded border border-amber-500/10">
                              <Loader2 size={12} className="animate-spin" />
                              <span>Загрузка аудио...</span>
                            </div>
                          )}
                          {failedSongs[song.id] && (
                            <p className="text-[10px] text-red-400 font-semibold mt-1">
                              Не удалось загрузить аудио
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredSongs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 italic">
                  <p className="text-lg tracking-widest uppercase opacity-40">Папка пуста или песня не найдена</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistence Audio Element */}
      <audio 
        key={currentSongId || 'none'}
        ref={audioRef}
        src={currentSong ? (blobCache[currentSong.id] || currentSong.audioUrl) : undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onError={(e) => {
          const target = e.target as HTMLAudioElement;
          console.error('Audio execution error for source:', target.src);
          setAudioError('Failed to load audio source. The link may be broken.');
          setIsPlaying(false);
          if (currentSongId) {
            setFailedSongs(prev => ({ ...prev, [currentSongId]: true }));
          }
        }}
        onPlay={() => {
          setAudioError(null);
          if (currentSongId) {
            setFailedSongs(prev => ({ ...prev, [currentSongId]: false }));
          }
        }}
        preload="auto"
      />

      {/* Persistent Audio Player */}
      <AnimatePresence>
        {currentSong && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="fixed bottom-0 inset-x-0 z-50 h-28 bg-black/80 backdrop-blur-3xl border-t border-white/10 px-8 py-2 flex flex-col md:flex-row items-center gap-4 transition-all"
          >
            <div className="flex items-center gap-4 w-full md:w-1/4 relative">
              <div className={`w-14 h-14 bg-amber-900/30 rounded-lg flex items-center justify-center border border-amber-500/20 flex-shrink-0 transition-all duration-500 ${isPlaying ? 'scale-105 border-amber-500/50 shadow-lg shadow-amber-500/10' : ''}`}>
                <Music2 className={`w-8 h-8 ${isPlaying ? 'text-amber-500' : 'text-amber-500/40'}`} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest truncate">{currentSong.style || 'поп'}</p>
              </div>
              <AnimatePresence>
                {audioError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-14 left-0 right-[-100px] md:right-0 bg-red-950/90 border border-red-500/50 text-red-200 text-[10px] py-2 px-3 rounded-xl backdrop-blur-xl shadow-2xl z-[60]"
                  >
                    <p className="font-bold mb-0.5">Ошибка Воспроизведения</p>
                    <p className="opacity-80 leading-tight">Не удалось загрузить аудио</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 flex flex-col items-center w-full max-w-xl mx-auto space-y-3">
              <div className="flex items-center gap-8">
                <button onClick={handlePrev} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={handleNext} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>
              <div className="w-full flex items-center gap-3 px-4">
                <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
                  {audioRef.current ? Math.floor(audioRef.current.currentTime / 60) + ":" + Math.floor(audioRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"}
                </span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progress}%`, marginLeft: '-6px' }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-mono w-8">
                   {audioRef.current && !isNaN(audioRef.current.duration) ? Math.floor(audioRef.current.duration / 60) + ":" + Math.floor(audioRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}
                </span>
              </div>
            </div>

            <div className="hidden md:flex w-1/4 justify-end items-center gap-4">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <div className="w-24 h-1.5 bg-white/10 rounded-full relative group">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="h-full bg-white/60 rounded-full transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${volume * 100}%`, marginLeft: '-5px' }}
                />
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
