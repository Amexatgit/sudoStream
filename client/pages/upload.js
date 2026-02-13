import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Upload() {
  const router = useRouter();
  const [songFile, setSongFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isPrivate, setIsPrivate] = useState(false); // NEW: Privacy Toggle
  const [status, setStatus] = useState('');

  // ⚠️ Ensure this matches your backend
  const API_URL = "http://localhost:8000"; 

  // Security Check: If not logged in, kick them out!
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, []);

  const handleSongChange = (e) => {
    const selected = e.target.files[0];
    setSongFile(selected);
    if (selected && !title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!songFile) return;

    setStatus('uploading');
    const token = localStorage.getItem('token'); // Get the Key

    const formData = new FormData();
    formData.append('songFile', songFile);
    if (imageFile) formData.append('imageFile', imageFile);
    formData.append('title', title);
    formData.append('artist', artist || 'Unknown Artist');
    formData.append('isPrivate', isPrivate); // Send the privacy flag

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
            'auth-token': token // 🔑 SHOW THE BADGE!
        },
        body: formData,
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setStatus('');
          setSongFile(null);
          setImageFile(null);
          setTitle('');
          setArtist('');
          setIsPrivate(false);
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Upload Station</h1>
        
        <form onSubmit={handleUpload} style={styles.form}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Select MP3 File</label>
            <input 
              type="file" 
              accept="audio/mp3, audio/mpeg" 
              onChange={handleSongChange}
              style={styles.fileInput}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Cover Art</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files[0])}
              style={styles.fileInput}
            />
          </div>

          <input 
            type="text" 
            placeholder="Song Title" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            style={styles.input}
          />
          
          <input 
            type="text" 
            placeholder="Artist Name" 
            value={artist} 
            onChange={e => setArtist(e.target.value)}
            style={styles.input}
          />

          {/* PRIVACY CHECKBOX */}
          <div style={styles.checkboxContainer}>
            <input 
                type="checkbox" 
                id="privateCheck"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                style={{accentColor: '#1DB954', transform: 'scale(1.2)'}}
            />
            <label htmlFor="privateCheck" style={{color: '#ccc', fontSize: '14px'}}>
                Mark as Private (Admin Only)
            </label>
          </div>

          <button 
            type="submit" 
            disabled={!songFile || status === 'uploading'}
            style={{
              ...styles.button,
              backgroundColor: status === 'uploading' ? '#555' : '#1DB954',
              cursor: status === 'uploading' ? 'not-allowed' : 'pointer'
            }}
          >
            {status === 'uploading' ? 'Uploading...' : 'Upload Song'}
          </button>

          {status === 'success' && <p style={{color: '#1DB954', textAlign: 'center'}}>Upload Complete</p>}
          {status === 'error' && <p style={{color: 'red', textAlign: 'center'}}>Upload Failed</p>}
        </form>

        <button onClick={() => router.push('/')} style={styles.backLink}>
          Back to Player
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    color: 'white'
  },
  card: {
    backgroundColor: '#282828',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  title: { textAlign: 'center', marginBottom: '20px', fontSize: '22px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', color: '#1DB954', fontWeight: 'bold', textTransform: 'uppercase' },
  fileInput: { color: '#ccc', fontSize: '13px' },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#3e3e3e',
    color: 'white',
    fontSize: '16px'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px 0'
  },
  button: {
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  backLink: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    color: '#b3b3b3',
    cursor: 'pointer',
    width: '100%',
    textDecoration: 'underline'
  }
};
