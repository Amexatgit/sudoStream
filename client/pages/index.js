import { useState, useEffect, useRef } from 'react';

export default function Home() {
  // 1. STATE: The memory of the app
  const [songs, setSongs] = useState([]); 
  const [currentSong, setCurrentSong] = useState(null); 
  const [isPlaying, setIsPlaying] = useState(false);

  // ⚠️ IMPORTANT: CHECK YOUR IP ADDRESS! 
  // Run 'hostname -I' in terminal if this doesn't work.
  const API_URL = "http://192.168.1.37:8000"; 

  const audioRef = useRef(null);

  // 2. EFFECT: Run this when the app loads
  useEffect(() => {
    fetch(`${API_URL}/api/songs`)
      .then(res => res.json())
      .then(data => {
        console.log("Songs fetched:", data);
        setSongs(data);
      })
      .catch(err => console.error("Failed to fetch songs:", err));
  }, []);

  // 3. FUNCTION: Handle Play/Pause
  const playSong = (song) => {
    if (currentSong?._id === song._id) {
      // Toggle Play/Pause for same song
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // Play NEW song
      setCurrentSong(song);
      setIsPlaying(true);
      // Tiny delay to let React load the new source
      setTimeout(() => audioRef.current.play(), 100);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>SudoStream 🐧</h1>
      <p style={styles.subtitle}>Cloud Database Connected 🟢</p>

      {/* THE PLAYLIST */}
      <div style={styles.list}>
        {songs.map((song) => (
          <div 
            key={song._id} 
            onClick={() => playSong(song)}
            style={{
              ...styles.songItem,
              backgroundColor: currentSong?._id === song._id ? '#1DB954' : '#333'
            }}
          >
            {/* ALBUM ART (Small) */}
            <img 
                src={song.image || "https://via.placeholder.com/50"} 
                alt="art"
                style={styles.listArt}
            />

            <div style={styles.songInfo}>
              <strong>{song.title}</strong>
              <br />
              <small style={{ color: '#ccc' }}>{song.artist}</small>
            </div>
            
            <span style={{ fontSize: '1.2rem' }}>
              {currentSong?._id === song._id && isPlaying ? '⏸' : '▶'}
            </span>
          </div>
        ))}
      </div>

      {/* THE MUSIC PLAYER (Bottom Bar) */}
      {currentSong && (
        <div style={styles.player}>
          {/* ALBUM ART (Big) */}
          <div style={styles.artContainer}>
             <img 
                src={currentSong.image || "https://via.placeholder.com/150"} 
                style={styles.playerArt}
             />
          </div>

          <h3 style={{ margin: '10px 0' }}>{currentSong.title}</h3>
          <p style={{ color: '#aaa', marginTop: '-10px', marginBottom: '15px' }}>
            {currentSong.artist}
          </p>
          
          <audio 
            ref={audioRef}
            controls 
            // This is the SMART link that asks for the specific file
            src={`${API_URL}/music/${currentSong.filename}`} 
            style={{ width: '100%', borderRadius: '30px' }}
          />
        </div>
      )}
      
      {/* Spacer to make sure the list isn't hidden behind the player */}
      <div style={{ height: '300px' }}></div>
    </div>
  );
}

// --- STYLES (Dark Mode) ---
const styles = {
  container: {
    backgroundColor: '#121212',
    color: '#fff',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'sans-serif',
    paddingBottom: '20px'
  },
  title: { textAlign: 'center', color: '#1DB954', fontSize: '2rem' },
  subtitle: { textAlign: 'center', color: '#888', marginBottom: '30px' },
  list: { maxWidth: '600px', margin: '0 auto' },
  songItem: {
    padding: '10px',
    marginBottom: '12px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  listArt: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    marginRight: '15px',
    objectFit: 'cover'
  },
  songInfo: { flexGrow: 1 },
  
  // Player Styles
  player: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.95)', // Slightly transparent
    backdropFilter: 'blur(10px)', // Blur effect behind player
    padding: '20px',
    borderTop: '1px solid #444',
    textAlign: 'center',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
  },
  artContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '-50px', // Pull the image up so it "pops out"
    marginBottom: '10px'
  },
  playerArt: {
    width: '120px',
    height: '120px',
    borderRadius: '15px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
    objectFit: 'cover',
    border: '4px solid #121212'
  }
};
