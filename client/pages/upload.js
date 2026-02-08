import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Upload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [status, setStatus] = useState(''); // 'uploading', 'success', 'error'

  // ⚠️ CHANGE THIS TO YOUR LAPTOP IP!
  const API_URL = "http://192.168.1.37:8000"; 

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    // Auto-fill title from filename (removes .mp3)
    if (selected && !title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');

    const formData = new FormData();
    formData.append('songFile', file);
    formData.append('title', title);
    formData.append('artist', artist || 'Unknown Artist');

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setStatus('success');
        // Reset form after 2 seconds
        setTimeout(() => {
          setStatus('');
          setFile(null);
          setTitle('');
          setArtist('');
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
        <h1 style={styles.title}>📤 Upload Station</h1>
        
        <form onSubmit={handleUpload} style={styles.form}>
          
          {/* File Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Choose MP3 File</label>
            <input 
              type="file" 
              accept="audio/mp3, audio/mpeg" 
              onChange={handleFileChange}
              style={styles.fileInput}
            />
          </div>

          {/* Metadata Inputs */}
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

          {/* Upload Button */}
          <button 
            type="submit" 
            disabled={!file || status === 'uploading'}
            style={{
              ...styles.button,
              backgroundColor: status === 'uploading' ? '#555' : '#1DB954',
              cursor: status === 'uploading' ? 'not-allowed' : 'pointer'
            }}
          >
            {status === 'uploading' ? 'Uploading...' : 'Upload Song'}
          </button>

          {/* Status Messages */}
          {status === 'success' && <p style={{color: '#1DB954', textAlign: 'center'}}>✅ Upload Complete!</p>}
          {status === 'error' && <p style={{color: 'red', textAlign: 'center'}}>❌ Upload Failed</p>}
        </form>

        <button onClick={() => router.push('/')} style={styles.backLink}>
          ← Back to Player
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
  title: { textAlign: 'center', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '14px', color: '#b3b3b3' },
  fileInput: { color: '#ccc', fontSize: '14px' },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#3e3e3e',
    color: 'white',
    fontSize: '16px'
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
    width: '100%'
  }
};
