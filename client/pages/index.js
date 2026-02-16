import { useState, useEffect, useRef } from 'react';
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
   
  // 🔐 ROLES STATE
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
   
  const [bgOpacity, setBgOpacity] = useState(0);
  const [bgImage, setBgImage] = useState(null);

  
  const API_URL = "http://192.168.1.37:8000"; 
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
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch:", err));
  }, []);

  // 2. CINEMATIC FADE LOGIC
  useEffect(() => {
    if (currentSong) {
      setBgOpacity(0);
      const timer = setTimeout(() => {
        setBgImage(currentSong.image);
        setBgOpacity(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSong]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
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
    // Logic: If logged in, play from all songs. If not, only public.
    const visibleSongs = isLoggedIn ? songs : songs.filter(s => !s.isPrivate);
    const currentIndex = visibleSongs.findIndex(s => s._id === currentSong._id);
    const nextSong = visibleSongs[currentIndex + 1] || visibleSongs[0]; 
    playSong(nextSong);
  };

  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const privateSongs = songs.filter(song => song.isPrivate);
  const publicSongs = songs.filter(song => !song.isPrivate);

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
      <img src={song.image || "https://picsum.photos/50"} style={styles.thumbnail} />
      <div style={styles.songInfo}>
        <strong style={{color: currentSong?._id === song._id ? '#1DB954' : '#fff'}}>
          {song.title}
        </strong>
        <div style={styles.artist}>
          {song.artist} 
          {song.isPrivate && <span style={{marginLeft: '8px', display: 'inline-flex', alignItems: 'center'}} title="Private Song"><LockIcon size={12} /></span>}
        </div>
      </div>
      <span style={{display: 'flex', alignItems: 'center'}}>
        {currentSong?._id === song._id && isPlaying ? <PauseIcon color="#1DB954" size={20} /> : <PlayIcon color="#fff" size={20} />}
      </span>
    </div>
  );

  return (
    <div style={styles.container}>
      <style jsx global>{` body { margin: 0; padding: 0; background-color: #121212; } `}</style>

      {/* BACKGROUND */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: bgImage ? `linear-gradient(rgba(0,0,0,0.85), #121212), url(${bgImage})` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: bgOpacity, transition: 'opacity 1s ease-in-out', zIndex: 0
      }}></div>

      {/* CONTENT */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* HEADER */}
        <div style={styles.header}>
            <h1 style={styles.title}>Sudo<span style={{color: '#1DB954'}}>Stream</span></h1>
          <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px'}}>
              
              {/* LOGGED IN NAV */}
              {isLoggedIn ? (
                  <>
                      {isAdmin && <span style={{color: '#1DB954', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center'}}>Admin Mode</span>}
                      {!isAdmin && <span style={{color: '#bbb', fontSize: '14px', display: 'flex', alignItems: 'center'}}>User Mode</span>}
                      
                      {/* Only Admin sees Upload */}
                      {isAdmin && <Link href="/upload"><button style={styles.navBtn}>Upload</button></Link>}
                      
                      <button onClick={handleLogout} style={styles.navBtn}>Logout</button>
                  </>
              ) : (
                  // LOGGED OUT NAV
                  <Link href="/login"><button style={styles.navBtn}>Login</button></Link>
              )}
          </div>
        </div>

        {/* SONG LISTS */}
        <div style={styles.list}>
          
          {/* 1. LOGGED IN VIEW: Private Collection ONLY */}
          {isLoggedIn && (
            <>
                {privateSongs.length > 0 ? (
                    <div>
                        <h2 style={styles.sectionTitle}>🏴‍☠️ Private Collection</h2>
                        {privateSongs.map(renderSongRow)}
                    </div>
                ) : (
                    <p style={{textAlign: 'center', color: '#555', marginTop: '40px'}}>No private songs yet.</p>
                )}
            </>
          )}

          {/* 2. LOGGED OUT VIEW: Public Library ONLY */}
          {!isLoggedIn && (
             <div>
               <h2 style={styles.sectionTitle}>Public Library</h2>
               <p style={{color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6'}}>
                    This section contains CopyRight free songs only. You need to login to access copyrighted songs.
                </p>
               {publicSongs.length > 0 ? publicSongs.map(renderSongRow) : <p style={{textAlign: 'center', color: '#555'}}>No public songs found.</p>}
             </div>
          )}

          {/* ABOUT SECTION (Only visible to Public Guests) */}
          {!isLoggedIn && (
            <div style={styles.aboutSection}>
                <h3 style={{color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px'}}>About SudoStream</h3>
                <p style={{color: '#b3b3b3', fontSize: '14px', lineHeight: '1.6'}}>
                    A End to End self-hosted music platform which streams music from a physical server at my home lab directly on the internet, Free of cost. This enabled me to access my songs anytime anywhere in the world.
                </p>
                <div style={styles.diagramContainer}>
                    <div style={styles.node}><span style={{fontSize: '24px'}}>🍓</span><span style={styles.nodeLabel}>RaspberryPi Server (at my home)</span></div>
                    <div style={styles.arrow}>----------▶</div>
                    <div style={styles.node}><span style={{fontSize: '24px'}}>☁️</span><span style={styles.nodeLabel}>Internet (cloud Tunneling)</span></div>
                    <div style={styles.arrow}>----------▶</div>
                    <div style={styles.node}><span style={{fontSize: '24px'}}>📱</span><span style={styles.nodeLabel}>Serving your Device as a client</span></div>
                </div>
                <div style={styles.socialLinks}>
                    <a href="https://github.com/Amexatgit" target="_blank" rel="noreferrer" style={styles.socialBtn}><GithubIcon /> GitHub</a>
                    <a href="https://www.linkedin.com/in/ameyatlinked/" target="_blank" rel="noreferrer" style={styles.socialBtn}><LinkedinIcon /> Linkedin</a>
                </div>
               <p style={{color: '#555', fontSize: '12px', marginTop: '20px'}}>
                    Built by Amex with Next.js, Node.js, MongoDB 
                </p>
            </div>
          )}

        </div>
      </div> 

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

// ✅ FIXED: Missing styles object restored below
const styles = {
  container: { backgroundColor: '#121212', color: '#fff', minHeight: '100vh', paddingBottom: '120px', fontFamily: 'sans-serif' },
  header: { padding: '20px', textAlign: 'center' },
  title: { margin: 0, color: '#fff', fontSize: '28px' },
  sectionTitle: { fontSize: '18px', color: '#b3b3b3', margin: '20px 0 10px', paddingLeft: '5px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: '5px' },
  navBtn: { marginLeft: '10px', padding: '5px 10px', backgroundColor: '#333', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  list: { padding: '10px', maxWidth: '800px', margin: '0 auto' },
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
