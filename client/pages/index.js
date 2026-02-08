import { useState, useEffect, useRef } from 'react';

// --- HELPER: Formats seconds into MM:SS ---
const formatTime = (seconds) => {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function Home() {
  // 1. STATE
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // NEW: Track time for the progress bar
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ⚠️ CHANGE THIS TO YOUR LOCAL IP!
  const API_URL = "http://192.168.1.37:8000"; 

  const audioRef = useRef(null);

  // 2. FETCH SONGS
  useEffect(() => {
    fetch(`${API_URL}/api/songs`)
      .then(res => res.json())
      .then(data => setSongs(data))
      .catch(err => console.error("Failed to fetch:", err));
  }, []);

  // 3. PLAY/PAUSE LOGIC
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
      // Wait for React to render the new src, then play
      setTimeout(() => audioRef.current && audioRef.current.play(), 100);
    }
  };

  const playNext = () => {
    const currentIndex = songs.findIndex(s => s._id === currentSong._id);
    // If there is a next song, play it. Otherwise, loop to start (optional)
    const nextSong = songs[currentIndex + 1] || songs[0]; 
    playSong(nextSong);
  };

  // 4. NEW: Handle Seeking (Dragging the bar)
  const handleSeek = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SudoStream 🐧</h1>
        <p style={{color: '#1DB954', fontSize: '14px'}}>Cloud Connected 🟢</p>
      </div>

      {/* SONG LIST */}
      <div style={styles.list}>
        {songs.map((song) => (
          <div 
            key={song._id} 
            onClick={() => playSong(song)}
            style={{
              ...styles.songItem,
              backgroundColor: currentSong?._id === song._id ? '#2a2a2a' : '#181818',
              border: currentSong?._id === song._id ? '1px solid #1DB954' : 'none'
            }}
          >
            {/* Album Art */}
            <img 
              src={song.image || "https://picsum.photos/50"} 
              style={styles.thumbnail} 
            />
            
            <div style={styles.songInfo}>
              <strong style={{color: currentSong?._id === song._id ? '#1DB954' : '#fff'}}>
                {song.title}
              </strong>
              <div style={styles.artist}>{song.artist}</div>
            </div>
            
            <span style={{fontSize: '20px'}}>
              {currentSong?._id === song._id && isPlaying ? '⏸' : '▶'}
            </span>
          </div>
        ))}
      </div>

      {/* PLAYER BAR */}
      {currentSong && (
        <div style={styles.player}>
          
          {/* 1. Top Row: Art + Title */}
          <div style={styles.playerInfo}>
             <img src={currentSong.image} style={styles.playerArt} />
             <div>
               <div style={{fontWeight: 'bold'}}>{currentSong.title}</div>
               <div style={{fontSize: '12px', color: '#ccc'}}>{currentSong.artist}</div>
             </div>
          </div>

          {/* 2. Middle Row: CONTROLS (New!) */}
          <div style={styles.controls}>
             {/* Previous Button */}
             <button style={styles.btn} onClick={() => playSong(songs[songs.findIndex(s => s._id === currentSong._id) - 1] || songs[songs.length - 1])}>⏮</button>
             
             {/* Play/Pause Button */}
             <button style={styles.playBtn} onClick={() => {
                if(isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
                else { audioRef.current.play(); setIsPlaying(true); }
             }}>
               {isPlaying ? '⏸' : '▶'}
             </button>
             
             {/* Next Button */}
             <button style={styles.btn} onClick={playNext}>⏭</button>
          </div>

          {/* 3. Bottom Row: Progress Bar */}
          <div style={styles.progressBarContainer}>
            <span style={styles.timeText}>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={currentTime} 
              onChange={handleSeek}
              style={styles.slider}
            />
            <span style={styles.timeText}>{formatTime(duration)}</span>
          </div>

          {/* HIDDEN AUDIO: Now with Autoplay! */}
          <audio 
            ref={audioRef}
            src={`${API_URL}/music/${currentSong.filename}`} 
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onEnded={playNext} 
            autoPlay
          />
        </div>
      )}
    </div> // <--- THIS WAS MISSING!
  );
}

// --- STYLES (CSS-in-JS) ---
const styles = {
  container: {
    backgroundColor: '#121212',
    color: '#fff',
    minHeight: '100vh',
    paddingBottom: '120px', // Space for player
    fontFamily: 'sans-serif',
  },
  header: { padding: '20px', textAlign: 'center' },
  title: { margin: 0, color: '#fff' },
  list: { padding: '10px' },
  songItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: '0.2s',
  },
  thumbnail: { width: '50px', height: '50px', borderRadius: '4px', marginRight: '15px', objectFit: 'cover' },
  songInfo: { flexGrow: 1 },
  artist: { fontSize: '12px', color: '#b3b3b3' },
  
  // PLAYER STYLES
  player: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    padding: '15px',
    borderTop: '1px solid #333',
    boxShadow: '0 -5px 20px rgba(0,0,0,0.5)',
  },
  playerInfo: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
  playerArt: { width: '40px', height: '40px', borderRadius: '4px', marginRight: '10px' },
  
  // CONTROLS STYLES
  controls: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '10px'
  },
  btn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer'
  },
  playBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  
  // PROGRESS BAR STYLES
  progressBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  slider: {
    flexGrow: 1,
    accentColor: '#1DB954', // Spotify Green
    cursor: 'pointer',
  },
  timeText: { fontSize: '12px', color: '#b3b3b3', minWidth: '35px' }
};
