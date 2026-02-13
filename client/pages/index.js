import { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; 

// --- ICONS ---
const PlayIcon = ({ color = "currentColor", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = ({ color = "currentColor", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const NextIcon = ({ color = "white", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
);
const PrevIcon = ({ color = "white", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
);
const LockIcon = ({ color = "#b3b3b3", size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
);

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
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 🎬 Cinematic State
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgImage, setBgImage] = useState(null);

  const API_URL = "http://localhost:8000"; 
  const audioRef = useRef(null);

  // 1. FETCH SONGS
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAdmin(true);

    fetch(`${API_URL}/api/songs`, {
      headers: { 'auth-token': token || '' }
    })
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch:", err));
  }, []);

  // 2. CINEMATIC FADE LOGIC 🎬
  useEffect(() => {
    if (currentSong) {
      // Step 1: Fade to Black
      setBgOpacity(0);

      // Step 2: Swap Image while invisible (after 500ms)
      const timer = setTimeout(() => {
        setBgImage(currentSong.image);
        // Step 3: Fade Back In
        setBgOpacity(1);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentSong]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload(); 
  };

  const playSong = (song) => {
    if (currentSong?._id === song._id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      setTimeout(() => audioRef.current && audioRef.current.play(), 100);
    }
  };

  const playNext = () => {
    const currentIndex = songs.findIndex(s => s._id === currentSong._id);
    const nextSong = songs[currentIndex + 1] || songs[0]; 
    playSong(nextSong);
  };

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div style={styles.container}>
      <style jsx global>{` body { margin: 0; padding: 0; background-color: #121212; } `}</style>

      {/* 🎬 BACKGROUND LAYER (Behind Content) */}
      <div style={{
        position: 'fixed',
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        backgroundImage: bgImage ? `linear-gradient(rgba(0,0,0,0.85), #121212), url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: bgOpacity,             // controlled by state
        transition: 'opacity 1s ease-in-out', // The Smooth Fade
        zIndex: 0
      }}></div>

      {/* CONTENT LAYER (On Top) */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>
  Sudo<span style={{color: '#1DB954'}}>Stream</span>
</h1>
          <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px'}}>
              {isAdmin ? (
                  <>
                      <span style={{color: '#1DB954', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center'}}>
                        Admin Mode
                      </span>
                      <Link href="/upload"><button style={styles.navBtn}>Upload</button></Link>
                      <button onClick={handleLogout} style={styles.navBtn}>Logout</button>
                  </>
              ) : (
                  <Link href="/login"><button style={styles.navBtn}>Admin Login</button></Link>
              )}
          </div>
        </div>

        {/* SONG LIST */}
        <div style={styles.list}>
          {songs.length === 0 && <p style={{textAlign: 'center', color: '#555'}}>No public songs found.</p>}
          
          {songs.map((song) => (
            <div 
              key={song._id} 
              onClick={() => playSong(song)}
              style={{
                ...styles.songItem,
                backgroundColor: currentSong?._id === song._id ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 24, 24, 0.8)', 
                border: currentSong?._id === song._id ? '1px solid #1DB954' : 'none'
              }}
            >
              <img src={song.image || "https://picsum.photos/50"} style={styles.thumbnail} />
              <div style={styles.songInfo}>
                <strong style={{color: currentSong?._id === song._id ? '#1DB954' : '#fff'}}>
                  {song.title}
                </strong>
                <div style={styles.artist}>
                  {song.artist} 
                  {/* Private Indicator */}
                  {song.isPrivate && (
                    <span style={{marginLeft: '8px', display: 'inline-flex', alignItems: 'center'}} title="Private Song">
                      <LockIcon size={12} />
                    </span>
                  )}
                </div>
              </div>
              <span style={{display: 'flex', alignItems: 'center'}}>
                {currentSong?._id === song._id && isPlaying ? <PauseIcon color="#1DB954" size={20} /> : <PlayIcon color="#fff" size={20} />}
              </span>
            </div>
          ))}
        </div>

      </div> 
      {/* End Content Layer */}

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={styles.player}>
          <div style={styles.playerInfo}>
             <img src={currentSong.image} style={styles.playerArt} />
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
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} style={styles.slider} />
            <span style={styles.timeText}>{formatTime(duration)}</span>
          </div>
          <audio ref={audioRef} src={`${API_URL}/music/${currentSong.filename}`} onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={playNext} autoPlay />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#121212', color: '#fff', minHeight: '100vh', paddingBottom: '120px', fontFamily: 'sans-serif' },
  header: { padding: '20px', textAlign: 'center' },
  title: { margin: 0, color: '#fff' },
  navBtn: { marginLeft: '10px', padding: '5px 10px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  list: { padding: '10px' },
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
};
