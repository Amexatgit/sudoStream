import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link'; 

// --- ICONS ---
const PlayIcon = ({ color = "currentColor", size = 24 }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = ({ color = "currentColor", size = 24 }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const NextIcon = ({ color = "white", size = 24 }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg> );
const PrevIcon = ({ color = "white", size = 24 }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg> );
const LockIcon = ({ color = "#b3b3b3", size = 14 }) => ( <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg> );
const GithubIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
const LinkedinIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>;

const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Home() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
   
  // 🔐 ROLES STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
   
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgImage, setBgImage] = useState(null);
  const [scrolled, setScrolled] = useState(false); // navbar condense trigger
  // 🔍 SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // 🎵 PLAYLIST STATE
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(null);

  // 🏠 DISCOVERY VIEW STATE
  const [view, setView] = useState('home'); // 'home' | 'vault' | 'artist'
  const [selectedArtist, setSelectedArtist] = useState(null);

  // ⭐ FEATURED / HOT RIGHT NOW
  const [featuredSongs, setFeaturedSongs] = useState([]);

  // 🎵 SONG REQUEST STATE
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState('song');
  const [requestName, setRequestName] = useState('');
  const [requestStatus, setRequestStatus] = useState('idle'); // idle | loading | success | error
  const [requestMsg, setRequestMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL; 
  const audioRef = useRef(null);

  // 1. FETCH SONGS & CHECK ROLES
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
        setIsLoggedIn(true);
        if (role === 'admin') setIsAdmin(true);
    }

    fetch(`${API_URL}/api/songs`, {
      headers: { 'auth-token': token || '' }
    })
      .then(res => res.json())
      .then(data => {
          // 🛡️ ARMOR ADDED: Verify data is an array before setting!
          if (Array.isArray(data)) {
              setSongs(data);
          } else {
              console.error("Backend sent an error instead of songs:", data);
              setSongs([]); // Fallback to empty array to prevent WSOD
          }
      })
      .catch(err => {
          console.error("Failed to fetch:", err);
          setSongs([]); // Fallback
      });

    // Fetch playlists for logged-in non-guest users
    if (token && localStorage.getItem('role') !== 'guest') {
        fetch(`${API_URL}/api/playlists`, {
            headers: { 'auth-token': token }
        })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setPlaylists(data); })
        .catch(() => {});
    }

    // ⭐ Fetch featured songs — visible to everyone including guests
    fetch(`${API_URL}/api/songs/featured`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setFeaturedSongs(data); })
        .catch(() => {});
  }, [API_URL]);

  // ⏳ GUEST TIMER ENFORCER
  useEffect(() => {
    const role = localStorage.getItem('role');
    
    if (role === 'guest') {
      const enforceTimer = () => {
        const expireTime = localStorage.getItem('trialExpiresAt');
        const currentMs = new Date().getTime();

        if (expireTime && currentMs > expireTime) {
          alert("⏳ Free Trial Expired! Kicking you out...");
          localStorage.clear();
          window.location.href = '/login';
        }
      };

      enforceTimer();
      const interval = setInterval(enforceTimer, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // 🎬 SCROLL LISTENER — condense navbar after 80px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 2. CINEMATIC FADE LOGIC
  useEffect(() => {
    if (currentSong) {
      setBgOpacity(0);
      const timer = setTimeout(() => {
        // 🛡️ ARMOR: Safely extract the full image URL for the background
        const fullImgUrl = currentSong.image?.startsWith('http') 
            ? currentSong.image 
            : `${API_URL}${currentSong.image}`;
        setBgImage(fullImgUrl);
        setBgOpacity(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSong, API_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('trialExpiresAt'); // Clean up timer just in case
    window.location.href = '/login'; 
  };

  const togglePrivacy = async (song, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/songs/${song._id}/toggle-privacy`, {
            method: 'PUT',
            headers: { 'auth-token': token }
        });
        if (res.ok) {
            const updatedSong = await res.json();
            setSongs(songs.map(s => s._id === song._id ? updatedSong : s));
        }
    } catch (err) {
        console.error("Failed to toggle privacy:", err);
    }
  };

  const toggleFeatured = async (song, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/songs/${song._id}/toggle-featured`, {
            method: 'PUT',
            headers: { 'auth-token': token }
        });
        if (res.ok) {
            const updatedSong = await res.json();
            setSongs(songs.map(s => s._id === song._id ? updatedSong : s));
            if (updatedSong.isFeatured) {
                setFeaturedSongs(prev => [updatedSong, ...prev.filter(s => s._id !== updatedSong._id)]);
            } else {
                setFeaturedSongs(prev => prev.filter(s => s._id !== updatedSong._id));
            }
        }
    } catch (err) {
        console.error("Failed to toggle featured:", err);
    }
  };

  const deleteSong = async (song, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete "${song.title}" forever? 🗑️`);
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/songs/${song._id}`, {
            method: 'DELETE',
            headers: { 'auth-token': token }
        });
        
        if (res.ok) {
            setSongs(songs.filter(s => s._id !== song._id));
            if (currentSong?._id === song._id) {
                setCurrentSong(null);
                setIsPlaying(false);
            }
        } else {
            alert("Failed to delete song. Is the backend route set up?");
        }
    } catch (err) {
        console.error("Failed to delete:", err);
    }
  };

  const submitRequest = async () => {
    if (!requestName.trim()) return;
    setRequestStatus('loading');
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/requests`, {
            method: 'POST',
            headers: { 'auth-token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: requestType, name: requestName.trim() })
        });
        const data = await res.json();
        if (res.ok) {
            setRequestStatus('success');
            setRequestMsg(data.message);
            setRequestName('');
            setTimeout(() => { setShowRequestDialog(false); setRequestStatus('idle'); setRequestMsg(''); }, 3000);
        } else {
            setRequestStatus('error');
            setRequestMsg(data.error || 'Something went wrong.');
        }
    } catch (err) {
        setRequestStatus('error');
        setRequestMsg('Could not reach server.');
    }
  };

  const playSong = useCallback((song) => {
    if (currentSong?._id === song._id) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.play(); setIsPlaying(true); }
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      setTimeout(() => audioRef.current && audioRef.current.play(), 100);
    }
  }, [currentSong, isPlaying]);

  const playNext = () => {
    const visibleSongs = isLoggedIn ? songs : songs.filter(s => !s.isPrivate);
    if (visibleSongs.length === 0) return; // Prevent crash if no songs
    const currentIndex = visibleSongs.findIndex(s => s._id === currentSong?._id);
    const nextSong = visibleSongs[currentIndex + 1] || visibleSongs[0]; 
    playSong(nextSong);
  };

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const addToPlaylist = async (playlistId, songId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            headers: { 'auth-token': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ songId })
        });
        const data = await res.json();
        if (res.ok) {
            setPlaylists(playlists.map(p => p._id === playlistId ? data : p));
        } else {
            alert(data.error || 'Failed to add song.');
        }
    } catch (err) {
        console.error(err);
    }
    setShowPlaylistMenu(null);
  };

  // 🎨 DERIVED DATA — memoized, only recomputes when dependencies change
  const artists = useMemo(() => Object.values(
    songs.reduce((acc, song) => {
      if (!acc[song.artist]) acc[song.artist] = { name: song.artist, image: song.image, count: 0 };
      acc[song.artist].count++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count), [songs]);

  const recentSongs  = useMemo(() => [...songs].slice(0, 12), [songs]);
  const artistSongs  = useMemo(() => selectedArtist ? songs.filter(s => s.artist === selectedArtist) : [], [songs, selectedArtist]);
  const privateSongs = useMemo(() => songs.filter(s => s.isPrivate), [songs]);
  const publicSongs  = useMemo(() => songs.filter(s => !s.isPrivate), [songs]);

  // 🔍 SEARCH FILTER — memoized on searchQuery
  const filterSongs = useCallback((list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      s.artist?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const renderSongRow = (song) => (
    <div 
      key={song._id} 
      onClick={() => playSong(song)}
      style={{
        ...styles.songItem,
        backgroundColor: currentSong?._id === song._id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 24, 24, 0.8)', 
        border: currentSong?._id === song._id ? '1px solid #1DB954' : 'none'
      }}
    >
      {/* 🛡️ ARMOR ADDED: Optional chaining on song.image */}
      <img 
        src={song.image?.startsWith('http') ? song.image : `${API_URL}${song.image}`} 
        style={styles.thumbnail} 
        alt="cover"
      />
      <div style={styles.songInfo}>
        <strong style={{color: currentSong?._id === song._id ? '#1DB954' : '#fff'}}>
          {song.title}
        </strong>
        <div style={styles.artist}>
          {song.artist}
        </div>
      </div>
      <span style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
        
        {isAdmin && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* ⭐ FEATURE TOGGLE */}
                <button
                    onClick={(e) => toggleFeatured(song, e)}
                    style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                        backgroundColor: song.isFeatured ? '#f59e0b' : 'transparent',
                        color: song.isFeatured ? '#000' : '#f59e0b',
                        border: '1px solid #f59e0b',
                        borderRadius: '12px', textTransform: 'uppercase', transition: '0.2s'
                    }}
                    title={song.isFeatured ? 'Remove from Hot Right Now' : 'Add to Hot Right Now'}
                >
                    {song.isFeatured ? '⭐ Featured' : '☆ Feature'}
                </button>

                <button 
                    onClick={(e) => togglePrivacy(song, e)}
                    style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                        backgroundColor: song.isPrivate ? '#1DB954' : '#ff4d4d', 
                        color: '#fff', border: 'none', borderRadius: '12px', textTransform: 'uppercase'
                    }}
                >
                    {song.isPrivate ? 'Make Public 🌍' : 'Hide in Vault 🏴‍☠️'}
                </button>

                <button 
                    onClick={(e) => deleteSong(song, e)}
                    style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                        backgroundColor: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', 
                        borderRadius: '12px', textTransform: 'uppercase', transition: '0.2s'
                    }}
                >
                    🗑️ Delete
                </button>
            </div>
        )}

        {currentSong?._id === song._id && isPlaying ? <PauseIcon color="#1DB954" size={20} /> : <PlayIcon color="#fff" size={20} />}

        {/* ➕ ADD TO PLAYLIST — logged-in non-guest users only */}
        {isLoggedIn && localStorage.getItem('role') !== 'guest' && (
            <div style={{ position: 'relative' }}>
                <button
                    onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(showPlaylistMenu === song._id ? null : song._id); }}
                    style={{
                        background: 'none', border: '1px solid #555', color: '#ccc',
                        borderRadius: '50%', width: '28px', height: '28px',
                        cursor: 'pointer', fontSize: '18px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', lineHeight: 1
                    }}
                    title="Add to Playlist"
                >+</button>

                {showPlaylistMenu === song._id && (
                    <div style={{
                        position: 'absolute', right: 0, bottom: '34px',
                        backgroundColor: '#282828', border: '1px solid #444',
                        borderRadius: '8px', minWidth: '180px', zIndex: 100,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.6)', padding: '8px 0'
                    }}>
                        <p style={{ color: '#888', fontSize: '11px', padding: '4px 14px', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Add to playlist
                        </p>
                        {playlists.length === 0 ? (
                            <p style={{ color: '#555', fontSize: '13px', padding: '8px 14px', margin: 0 }}>
                                No playlists yet.<br/>
                                <a href="/playlists" style={{ color: '#1DB954' }}>Create one</a>
                            </p>
                        ) : (
                            playlists.map(pl => (
                                <div
                                    key={pl._id}
                                    onClick={(e) => addToPlaylist(pl._id, song._id, e)}
                                    style={{ padding: '8px 14px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3e3e3e'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    🎵 {pl.name}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        )}
      </span>
    </div>
  );

  return (
    <div style={styles.container}>
      <style jsx global>{` body { margin: 0; padding: 0; background-color: #121212; } `}</style>

      {/* BACKGROUND */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: bgImage ? `linear-gradient(rgba(0,0,0,0.85), #121212), url('${bgImage}')` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: bgOpacity, transition: 'opacity 1s ease-in-out', zIndex: 0
      }}></div>

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* 🎵 FLOATING REQUEST BUTTON — bottom right corner */}
        {isLoggedIn && localStorage.getItem('role') !== 'guest' && (
          <button
            onClick={() => setShowRequestDialog(true)}
            title="Request a song or artist"
            style={{
              position: 'fixed', bottom: currentSong ? '110px' : '24px', right: '20px',
              zIndex: 50, width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: '#1DB954', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(29,185,84,0.5)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#000">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </button>
        )}

        {/* 🎵 REQUEST DIALOG */}
        {showRequestDialog && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowRequestDialog(false); setRequestStatus('idle'); setRequestName(''); }}}
          >
            <div style={{
              backgroundColor: '#1e1e1e', borderRadius: '16px', padding: '28px',
              width: '100%', maxWidth: '420px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '20px', fontWeight: '800' }}>
                    🎵 Request a Song
                  </h2>
                  <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                    Can't find what you're looking for? I can't make each and every song available Lol :) But i'll definitely add what you wish to see here, 😋 so just Let me know!!
                  </p>
                </div>
                <button onClick={() => { setShowRequestDialog(false); setRequestStatus('idle'); setRequestName(''); }}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 0 0 10px' }}>✕</button>
              </div>

              {requestStatus !== 'success' ? (
                <>
                  {/* Type selector */}
                  <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>What do you want to add?</p>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {['song', 'artist'].map(t => (
                      <button
                        key={t}
                        onClick={() => setRequestType(t)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                          border: `1px solid ${requestType === t ? '#1DB954' : 'rgba(255,255,255,0.1)'}`,
                          backgroundColor: requestType === t ? 'rgba(29,185,84,0.15)' : 'rgba(255,255,255,0.04)',
                          color: requestType === t ? '#1DB954' : '#888',
                          fontWeight: requestType === t ? 'bold' : 'normal',
                          fontSize: '14px', transition: '0.15s'
                        }}
                      >
                        {t === 'song' ? '🎵 A Song' : '🎤 An Artist'}
                      </button>
                    ))}
                  </div>

                  {/* Name input */}
                  <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {requestType === 'song' ? 'Song name' : 'Artist name'}
                  </p>
                  <input
                    autoFocus
                    type="text"
                    placeholder={requestType === 'song' ? 'e.g. Blinding Lights' : 'e.g. The Weeknd'}
                    value={requestName}
                    onChange={e => setRequestName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitRequest()}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: '#2a2a2a', color: '#fff', fontSize: '15px',
                      outline: 'none', boxSizing: 'border-box', marginBottom: '8px'
                    }}
                  />

                  {requestStatus === 'error' && (
                    <p style={{ color: '#ff6b6b', fontSize: '13px', margin: '0 0 12px' }}>❌ {requestMsg}</p>
                  )}

                  <button
                    onClick={submitRequest}
                    disabled={!requestName.trim() || requestStatus === 'loading'}
                    style={{
                      width: '100%', padding: '13px', borderRadius: '25px', border: 'none',
                      backgroundColor: (!requestName.trim() || requestStatus === 'loading') ? '#333' : '#1DB954',
                      color: (!requestName.trim() || requestStatus === 'loading') ? '#666' : '#000',
                      fontWeight: 'bold', fontSize: '15px', cursor: !requestName.trim() ? 'not-allowed' : 'pointer',
                      marginTop: '8px', transition: '0.2s'
                    }}
                  >
                    {requestStatus === 'loading' ? 'Sending...' : 'Submit Request'}
                  </button>

                  <p style={{ color: '#444', fontSize: '11px', textAlign: 'center', marginTop: '14px', marginBottom: 0 }}>
                    Requests are reviewed manually. Most songs added within 24-48 hours.
                  </p>
                </>
              ) : (
                /* Success state */
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
                  <h3 style={{ color: '#1DB954', margin: '0 0 8px', fontSize: '18px' }}>Request Received!</h3>
                  <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    {requestMsg}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: scrolled ? '10px 24px' : '0px 24px',
          height: scrolled ? '56px' : '0px',
          overflow: 'hidden',
          backgroundColor: scrolled ? 'rgba(18, 18, 18, 0.75)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Logo — slides in from left when scrolled */}
          <div style={{
            opacity: scrolled ? 1 : 0,
            transform: scrolled ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px', flexShrink: 0
          }}>
            sudo<span style={{ color: '#1DB954', textShadow: '0 0 20px rgba(29,185,84,0.5)' }}>Stream</span>
          </div>

          {/* Nav buttons + Search — slide in from right when scrolled */}
          <div style={{
            opacity: scrolled ? 1 : 0,
            transform: scrolled ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>

            {/* 🔍 SEARCH — lives inside navbar when scrolled */}
            {searchOpen && (
              <input
                autoFocus
                type="text"
                placeholder="Search title or artist..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && (setSearchOpen(false), setSearchQuery(''))}
                style={{
                  padding: '6px 12px', borderRadius: '20px',
                  border: '1px solid #1DB954',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '13px', outline: 'none', width: '180px'
                }}
              />
            )}
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}
              style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: searchOpen ? '#1DB954' : 'rgba(255,255,255,0.08)',
                border: '1px solid ' + (searchOpen ? '#1DB954' : 'rgba(255,255,255,0.15)'),
                color: searchOpen ? '#000' : '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'all 0.2s'
              }}
              title="Search songs"
            >
              {searchOpen
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              }
            </button>

            {/* divider */}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {isLoggedIn ? (
              <>
                {isAdmin && <span style={{color: '#1DB954', fontWeight: 'bold', fontSize: '13px'}}>Admin Mode</span>}
                {!isAdmin && <span style={{color: '#bbb', fontSize: '13px'}}>Premium Access</span>}
                {isAdmin && <Link href="/upload"><button style={styles.navBtn}>Upload</button></Link>}
                <Link href="/playlists"><button style={styles.navBtn}>My Playlists</button></Link>
                <button onClick={handleLogout} style={styles.navBtn}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/signup"><button style={{...styles.navBtn, backgroundColor: 'transparent', border: '1px solid #1DB954', color: '#1DB954'}}>Invite Code</button></Link>
                <Link href="/login"><button style={styles.navBtn}>Free Login</button></Link>
              </>
            )}
          </div>
        </div>

        {/* ===================== HERO HEADER ===================== */}
        <div style={{
          textAlign: 'center',
          padding: '60px 20px 40px',
          position: 'relative'
        }}>
          {/* Glow ring behind logo */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -60%)',
            width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Big logo */}
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: '900',
            letterSpacing: '-2px',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #ffffff 40%, #1DB954 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(29,185,84,0.3))'
          }}>
            sudo<span style={{color: '#1DB954', WebkitTextFillColor: '#1DB954'}}>Stream</span>
          </h1>

          {/* Tagline */}
          <p style={{
            margin: '0 0 12px 0',
            color: '#666',
            fontSize: '13px',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            Because music shouldn't have a monthly fee.
          </p>

          {/* Subtle song count */}
          {songs.length > 0 && (
            <p style={{
              margin: '0 0 20px 0',
              color: '#3a3a3a',
              fontSize: '12px',
              letterSpacing: '1.5px',
            }}>
              {songs.length} songs in the vault
            </p>
          )}

          {/* Glassmorphism nav pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            borderRadius: '40px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            {isLoggedIn ? (
              <>
                {isAdmin && <span style={{color: '#1DB954', fontWeight: 'bold', fontSize: '13px'}}> Admin Mode</span>}
                {!isAdmin && <span style={{color: '#bbb', fontSize: '13px'}}>✦ Premium Access</span>}
                {isAdmin && <Link href="/upload"><button style={styles.pillBtn}>Upload</button></Link>}
                <Link href="/playlists"><button style={styles.pillBtn}>My Playlists</button></Link>
                <button onClick={handleLogout} style={styles.pillBtn}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <button style={{...styles.pillBtn, border: '1px solid #1DB954', color: '#1DB954', backgroundColor: 'transparent'}}>
                    Invite Code
                  </button>
                </Link>
                <Link href="/login"><button style={styles.pillBtn}>Free Login</button></Link>
              </>
            )}

            {/* divider */}
            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

            {/* 🔍 Search in hero pill */}
            {searchOpen && (
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Escape' && (setSearchOpen(false), setSearchQuery(''))}
                style={{
                  padding: '4px 10px', borderRadius: '20px',
                  border: '1px solid #1DB954',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: '13px', outline: 'none', width: '160px'
                }}
              />
            )}
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(''); }}
              style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: searchOpen ? '#1DB954' : 'transparent',
                border: '1px solid ' + (searchOpen ? '#1DB954' : 'rgba(255,255,255,0.2)'),
                color: searchOpen ? '#000' : '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', transition: 'all 0.2s'
              }}
              title="Search songs"
            >
              {searchOpen
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              }
            </button>
          </div>
        </div>

        {/* ===================== DISCOVERY / VAULT CONTENT ===================== */}
        <div style={{ padding: '0 16px 20px', maxWidth: '1100px', margin: '0 auto' }}>

          {/* VIEW TOGGLE TABS — logged in users only */}
          {isLoggedIn && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid #222', paddingBottom: '12px', flexWrap: 'wrap' }}>
              {['home', 'vault'].map(v => (
                <button key={v} onClick={() => { setView(v); setSelectedArtist(null); }} style={{
                  padding: '7px 18px', borderRadius: '20px', border: 'none',
                  backgroundColor: view === v && !selectedArtist ? '#1DB954' : 'rgba(255,255,255,0.07)',
                  color: view === v && !selectedArtist ? '#000' : '#aaa',
                  fontWeight: view === v && !selectedArtist ? 'bold' : 'normal',
                  cursor: 'pointer', fontSize: '13px', transition: '0.2s'
                }}>
                  {v === 'home' ? '✦ Discover' : '☰ Full Vault'}
                </button>
              ))}
              {selectedArtist && (
                <button onClick={() => { setView('home'); setSelectedArtist(null); }} style={{
                  padding: '7px 18px', borderRadius: '20px',
                  border: '1px solid rgba(29,185,84,0.4)',
                  backgroundColor: 'rgba(29,185,84,0.1)', color: '#1DB954',
                  cursor: 'pointer', fontSize: '13px'
                }}>
                  ← Back
                </button>
              )}
            </div>
          )}

          {/* ══════════ DISCOVER HOME VIEW ══════════ */}
          {view === 'home' && isLoggedIn && !selectedArtist && (
            <>
              {/* ⭐ HOT RIGHT NOW — curator picked, visible to all */}
              {featuredSongs.length > 0 && (
                <div style={{ marginBottom: '44px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <h2 style={{ ...styles.sectionTitle, margin: 0, borderBottom: 'none' }}>⭐ streaming Hot on sudo Right Now</h2>
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '10px',
                      fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px',
                      backgroundColor: 'rgba(245,158,11,0.15)',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: '#f59e0b'
                    }}>Trending Live</span>
                  </div>

                  {/* Horizontal scroll strip */}
                  <div style={{
                    display: 'flex', gap: '14px',
                    overflowX: 'auto', paddingBottom: '10px',
                    scrollbarWidth: 'none', msOverflowStyle: 'none'
                  }}>
                    {featuredSongs.map((song, idx) => (
                      <div
                        key={song._id}
                        onClick={() => playSong(song)}
                        style={{
                          flexShrink: 0, width: '160px', cursor: 'pointer',
                          borderRadius: '12px', overflow: 'hidden',
                          backgroundColor: currentSong?._id === song._id ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${currentSong?._id === song._id ? '#f59e0b' : 'rgba(255,255,255,0.07)'}`,
                          transition: 'all 0.2s', position: 'relative'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        {/* Rank badge */}
                        <div style={{
                          position: 'absolute', top: '8px', left: '8px', zIndex: 2,
                          width: '22px', height: '22px', borderRadius: '50%',
                          backgroundColor: idx < 3 ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                          color: idx < 3 ? '#000' : '#fff',
                          fontSize: '11px', fontWeight: 'bold',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {idx + 1}
                        </div>

                        <div style={{ position: 'relative' }}>
                          <img
                            src={song.image?.startsWith('http') ? song.image : `${API_URL}${song.image}`}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                            alt={song.title}
                          />
                          {/* Play overlay */}
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: currentSong?._id === song._id ? 1 : 0, transition: '0.2s'
                          }}>
                            {currentSong?._id === song._id && isPlaying
                              ? <PauseIcon color="#f59e0b" size={28} />
                              : <PlayIcon color="#fff" size={28} />}
                          </div>
                        </div>

                        <div style={{ padding: '10px 10px 12px' }}>
                          <div style={{
                            color: currentSong?._id === song._id ? '#f59e0b' : '#fff',
                            fontSize: '12px', fontWeight: 'bold',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{song.title}</div>
                          <div style={{
                            color: '#777', fontSize: '11px', marginTop: '2px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>{song.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* RECENTLY ADDED FLASHCARDS */}
              {recentSongs.length > 0 && (
                <div style={{ marginBottom: '44px' }}>
                  <h2 style={styles.sectionTitle}>🔥 Recently Added</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
                    {recentSongs.map(song => (
                      <div
                        key={song._id}
                        onClick={() => playSong(song)}
                        style={{
                          backgroundColor: currentSong?._id === song._id ? 'rgba(29,185,84,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${currentSong?._id === song._id ? '#1DB954' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '10px', cursor: 'pointer', overflow: 'hidden',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ position: 'relative' }}>
                          <img
                            src={song.image?.startsWith('http') ? song.image : `${API_URL}${song.image}`}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                            alt={song.title}
                          />
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: currentSong?._id === song._id ? 1 : 0, transition: '0.2s'
                          }}>
                            {currentSong?._id === song._id && isPlaying
                              ? <PauseIcon color="#1DB954" size={28} />
                              : <PlayIcon color="#fff" size={28} />}
                          </div>
                        </div>
                        <div style={{ padding: '9px 10px 11px' }}>
                          <div style={{ color: currentSong?._id === song._id ? '#1DB954' : '#fff', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
                          <div style={{ color: '#777', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.artist}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ARTISTS GRID */}
              {artists.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h2 style={styles.sectionTitle}>🎤 Artists — {artists.length} in your vault</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                    {artists.map(artist => (
                      <div
                        key={artist.name}
                        onClick={() => { setSelectedArtist(artist.name); setView('artist'); }}
                        style={{
                          textAlign: 'center', cursor: 'pointer', padding: '18px 10px 14px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '14px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(29,185,84,0.08)'; e.currentTarget.style.borderColor = 'rgba(29,185,84,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <img
                          src={artist.image?.startsWith('http') ? artist.image : `${API_URL}${artist.image}`}
                          style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', border: '2px solid rgba(29,185,84,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                          alt={artist.name}
                        />
                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.name}</div>
                        <div style={{ color: '#555', fontSize: '11px', marginTop: '3px' }}>{artist.count} songs</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══════════ ARTIST VIEW ══════════ */}
          {view === 'artist' && selectedArtist && (
            <div>
              {/* Artist hero banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '22px', marginBottom: '28px',
                padding: '22px', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(29,185,84,0.12) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(29,185,84,0.2)'
              }}>
                <img
                  src={artistSongs[0]?.image?.startsWith('http') ? artistSongs[0]?.image : `${API_URL}${artistSongs[0]?.image}`}
                  style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1DB954', boxShadow: '0 0 24px rgba(29,185,84,0.4)', flexShrink: 0 }}
                  alt={selectedArtist}
                />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ color: '#1DB954', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Artist</div>
                  <div style={{ color: '#fff', fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>{selectedArtist}</div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{artistSongs.length} songs in your vault</div>
                </div>
                <button
                  onClick={() => playSong(artistSongs[0])}
                  style={{ padding: '10px 24px', backgroundColor: '#1DB954', border: 'none', color: '#000', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}
                >
                  ▶ Play All
                </button>
              </div>
              <h2 style={styles.sectionTitle}>Songs</h2>
              {filterSongs(artistSongs).map(renderSongRow)}
            </div>
          )}

          {/* ══════════ FULL VAULT VIEW ══════════ */}
          {view === 'vault' && isLoggedIn && (
            <div>
              {filterSongs(privateSongs).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={styles.sectionTitle}>🏴‍☠️ Private — {filterSongs(privateSongs).length} songs</h2>
                  {filterSongs(privateSongs).map(renderSongRow)}
                </div>
              )}
              {filterSongs(publicSongs).length > 0 && (
                <div>
                  <h2 style={styles.sectionTitle}>🌍 Public — {filterSongs(publicSongs).length} songs</h2>
                  {filterSongs(publicSongs).map(renderSongRow)}
                </div>
              )}
              {filterSongs(privateSongs).length === 0 && filterSongs(publicSongs).length === 0 && (
                <p style={{ textAlign: 'center', color: '#555', marginTop: '60px' }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'Vault is empty.'}
                </p>
              )}
            </div>
          )}

          {/* NOT LOGGED IN */}
          {!isLoggedIn && (
            <div>
              <h2 style={styles.sectionTitle}>Public Library</h2>
              <p style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                Non-copyright songs only. Login to access the full vault, create playlists, and stream 800+ songs.
              </p>
              {filterSongs(publicSongs).length > 0
                ? filterSongs(publicSongs).map(renderSongRow)
                : <p style={{ textAlign: 'center', color: '#555' }}>
                    {searchQuery ? `No results for "${searchQuery}"` : 'No public songs found.'}
                  </p>}
              <div style={styles.aboutSection}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>About SudoStream</h3>
                <p style={{ color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6' }}>
                  A self-hosted music platform streaming from a home lab server. Access your entire library anywhere in the world, free forever.
                </p>
                <div style={styles.diagramContainer}>
                  <div style={styles.node}><span style={{ fontSize: '24px' }}>🍓</span><span style={styles.nodeLabel}>RaspberryPi Server</span></div>
                  <div style={styles.arrow}>──────▶</div>
                  <div style={styles.node}><span style={{ fontSize: '24px' }}>☁️</span><span style={styles.nodeLabel}>Cloudflare Tunnel</span></div>
                  <div style={styles.arrow}>──────▶</div>
                  <div style={styles.node}><span style={{ fontSize: '24px' }}>📱</span><span style={styles.nodeLabel}>Your Device</span></div>
                </div>
                <div style={styles.socialLinks}>
                  <a href="https://github.com/Amexatgit" target="_blank" rel="noreferrer" style={styles.socialBtn}><GithubIcon /> GitHub</a>
                  <a href="https://www.linkedin.com/in/ameyatlinked/" target="_blank" rel="noreferrer" style={styles.socialBtn}><LinkedinIcon /> LinkedIn</a>
                </div>
                <p style={{ color: '#555', fontSize: '12px', marginTop: '20px' }}>Built by Amex · Next.js · Node.js · MongoDB</p>
              </div>
            </div>
          )}

        </div>
      </div> 

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={styles.player}>
          <div style={styles.playerInfo}>
             {/* 🛡️ ARMOR ADDED: Optional chaining here too */}
             <img 
                src={currentSong.image?.startsWith('http') ? currentSong.image : `${API_URL}${currentSong.image}`} 
                style={styles.playerArt} 
                alt="cover"
             />
             <div>
               <div style={{fontWeight: 'bold'}}>{currentSong.title}</div>
               <div style={{fontSize: '12px', color: '#ccc'}}>{currentSong.artist}</div>
             </div>
          </div>
          <div style={styles.controls}>
             <button style={styles.btn} onClick={() => playSong(songs[songs.findIndex(s => s._id === currentSong._id) - 1] || songs[songs.length - 1])}><PrevIcon /></button>
             <button style={styles.playBtn} onClick={() => { if(isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else { audioRef.current.play(); setIsPlaying(true); } }}>
               {isPlaying ? <PauseIcon color="#000" size={28} /> : <PlayIcon color="#000" size={28} />}
             </button>
             <button style={styles.btn} onClick={playNext}><NextIcon /></button>
          </div>
          <div style={styles.progressBarContainer}>
            <span style={styles.timeText}>{formatTime(currentTime)}</span>

            {/* LAYERED PROGRESS BAR */}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const newTime = ((e.clientX - rect.left) / rect.width) * duration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }}
              style={{ position: 'relative', flexGrow: 1, height: '4px', borderRadius: '2px', backgroundColor: '#3e3e3e', cursor: 'pointer' }}
            >
              {/* Layer 1 — Buffered (light green) */}
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${buffered}%`, borderRadius: '2px',
                backgroundColor: 'rgba(29,185,84,0.25)',
                transition: 'width 0.4s ease'
              }} />
              {/* Layer 2 — Played (bright green) */}
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                borderRadius: '2px', backgroundColor: '#1DB954',
                transition: 'width 0.1s linear'
              }} />
              {/* Layer 3 — Scrubber dot */}
              <div style={{
                position: 'absolute', top: '50%',
                left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                transform: 'translate(-50%, -50%)',
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                transition: 'left 0.1s linear'
              }} />
            </div>

            <span style={styles.timeText}>{formatTime(duration)}</span>
          </div>
          <audio
            ref={audioRef}
            src={`${API_URL}/music/${currentSong.filename}`}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onProgress={(e) => {
              const audio = e.target;
              if (audio.buffered.length > 0 && audio.duration) {
                const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
                setBuffered((bufferedEnd / audio.duration) * 100);
              }
            }}
            onEnded={playNext}
            autoPlay
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#121212', color: '#fff', minHeight: '100vh', paddingBottom: '120px', fontFamily: 'sans-serif' },
  header: { padding: '20px', textAlign: 'center' },
  title: { margin: 0, color: '#fff', fontSize: '28px' },
  sectionTitle: { fontSize: '18px', color: '#b3b3b3', margin: '20px 0 10px', paddingLeft: '5px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: '5px' },
  navBtn: { padding: '5px 12px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
  pillBtn: { padding: '5px 12px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
  list: { padding: '10px', maxWidth: '1100px', margin: '0 auto' },
  songItem: { display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' },
  thumbnail: { width: '50px', height: '50px', borderRadius: '4px', marginRight: '15px', objectFit: 'cover' },
  songInfo: { flexGrow: 1 },
  artist: { fontSize: '12px', color: '#b3b3b3', display: 'flex', alignItems: 'center' },
  player: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(24, 24, 24, 0.95)', backdropFilter: 'blur(10px)', padding: '15px', borderTop: '1px solid #333', boxShadow: '0 -5px 20px rgba(0,0,0,0.5)', zIndex: 10 },
  playerInfo: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
  playerArt: { width: '40px', height: '40px', borderRadius: '4px', marginRight: '10px' },
  controls: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '10px' },
  btn: { background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  playBtn: { width: '50px', height: '50px', borderRadius: '50%', border: 'none', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  progressBarContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  slider: { flexGrow: 1, accentColor: '#1DB954', cursor: 'pointer' },
  timeText: { fontSize: '12px', color: '#b3b3b3', minWidth: '35px' },
  aboutSection: { marginTop: '60px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' },
  diagramContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '20px 0', flexWrap: 'wrap' },
  node: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '8px', minWidth: '80px' },
  nodeLabel: { fontSize: '12px', color: '#bbb', marginTop: '5px' },
  arrow: { color: '#1DB954', fontWeight: 'bold', fontSize: '14px' },
  socialLinks: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' },
  socialBtn: { display: 'flex', alignItems: 'center', gap: '8px', color: 'white', textDecoration: 'none', fontSize: '14px', backgroundColor: '#333', padding: '8px 16px', borderRadius: '20px', transition: '0.2s' }
};
