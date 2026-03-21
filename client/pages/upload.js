import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Upload() {
  const router = useRouter();
  const [songFile, setSongFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState('');
  
  // NEW: State for the Invite Code Generator
  const [inviteCode, setInviteCode] = useState('');

  // Download via URL state
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadStatus, setDownloadStatus] = useState(''); // idle | downloading | success | error
  const [downloadResult, setDownloadResult] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Security Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
    } else if (role !== 'admin') {
      router.push('/');
      alert("Only the Piracy King Amex can upload! 🏴‍☠️");
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
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('songFile', songFile);
    if (imageFile) formData.append('imageFile', imageFile);
    formData.append('title', title);
    formData.append('artist', artist || 'Unknown Artist');
    formData.append('isPrivate', isPrivate);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
            'auth-token': token
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

  // NEW: Function to generate the invite code
  const generateInviteCode = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/invites/generate`, {
            method: 'POST',
            headers: { 
                'auth-token': token
            }
        });

        const data = await res.json();
        
        if (res.ok) {
            setInviteCode(data.code);
        } else {
            alert(data.error || "Failed to generate code.");
        }
    } catch (err) {
        console.error("Error generating code:", err);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl.trim()) return;
    setDownloadStatus('downloading');
    setDownloadResult(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: downloadUrl.trim() })
      });

      const data = await res.json();

      if (res.ok) {
        setDownloadStatus('success');
        setDownloadResult(data.song);
        setDownloadUrl('');
      } else {
        setDownloadStatus('error');
        setDownloadResult({ error: data.error || 'Download failed.' });
      }
    } catch (err) {
      console.error(err);
      setDownloadStatus('error');
      setDownloadResult({ error: 'Could not reach server.' });
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
          Click here for copyright songs
        </button>

        {/* ⬇️ DOWNLOAD VIA URL PANEL */}
        <div style={styles.downloadPanel}>
          <h3 style={styles.vipTitle}>⬇️ Download via URL</h3>
          <p style={styles.vipDesc}>
            Paste a YouTube or Spotify URL. The server will download it,
            extract album art, and add it to the vault automatically.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={downloadUrl}
              onChange={e => setDownloadUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDownload()}
              disabled={downloadStatus === 'downloading'}
              style={{ ...styles.input, flexGrow: 1, fontSize: '13px', padding: '10px 12px' }}
            />
            <button
              onClick={handleDownload}
              disabled={!downloadUrl.trim() || downloadStatus === 'downloading'}
              style={{
                ...styles.generateBtn,
                padding: '10px 16px',
                fontSize: '13px',
                opacity: (!downloadUrl.trim() || downloadStatus === 'downloading') ? 0.5 : 1,
                cursor: (!downloadUrl.trim() || downloadStatus === 'downloading') ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {downloadStatus === 'downloading' ? '⏳ Downloading...' : '⬇️ Download'}
            </button>
          </div>

          {/* Loading bar */}
          {downloadStatus === 'downloading' && (
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '4px', overflow: 'hidden', height: '4px', marginBottom: '10px' }}>
              <div style={{
                height: '100%', width: '40%',
                backgroundColor: '#1DB954',
                borderRadius: '4px',
                animation: 'slide 1.5s ease-in-out infinite'
              }} />
              <style>{`@keyframes slide { 0%{margin-left:0;width:40%} 50%{margin-left:60%;width:40%} 100%{margin-left:0;width:40%} }`}</style>
            </div>
          )}

          {/* Success result */}
          {downloadStatus === 'success' && downloadResult && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: 'rgba(29,185,84,0.1)', borderRadius: '8px', border: '1px solid rgba(29,185,84,0.3)' }}>
              {downloadResult.image && (
                <img
                  src={`${API_URL}${downloadResult.image}`}
                  style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                  alt="cover"
                />
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#1DB954', fontWeight: 'bold', fontSize: '14px' }}>✅ Added to Vault!</div>
                <div style={{ color: '#ccc', fontSize: '12px' }}>{downloadResult.title} — {downloadResult.artist}</div>
                <div style={{ color: '#666', fontSize: '11px' }}>Saved as private. Toggle visibility from the library.</div>
              </div>
            </div>
          )}

          {/* Error result */}
          {downloadStatus === 'error' && downloadResult && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255,77,77,0.1)', borderRadius: '8px', border: '1px solid rgba(255,77,77,0.3)', color: '#ff6b6b', fontSize: '13px', textAlign: 'left' }}>
              ❌ {downloadResult.error}
            </div>
          )}

          <p style={{ color: '#555', fontSize: '11px', marginTop: '10px', marginBottom: 0 }}>
            ⚠️ Requires <code style={{color: '#888'}}>yt-dlp</code> and <code style={{color: '#888'}}>ffmpeg</code> installed on the server.
          </p>
        </div>

        {/* 🎟️ NEW: VIP ACCESS CONTROL PANEL */}
        <div style={styles.vipPanel}>
            <h3 style={styles.vipTitle}>🎟️ VIP Access Control</h3>
            <p style={styles.vipDesc}>Generate a single-use invite code for a friend.</p>
            
            <button onClick={generateInviteCode} style={styles.generateBtn}>
                Generate New Code
            </button>

            {inviteCode && (
                <div style={styles.codeContainer}>
                    <p style={styles.codeLabel}>Share this code:</p>
                    <div style={styles.codeDisplay}>{inviteCode}</div>
                    <p style={styles.codeWarning}>*This code will burn instantly after one use.</p>
                </div>
            )}
        </div>
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
    color: 'white',
    padding: '20px' // Added padding for smaller screens
  },
  card: {
    backgroundColor: '#282828',
    padding: '30px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '450px', // Slightly wider to fit the new panel nicely
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
  },
  downloadPanel: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    border: '1px solid rgba(29,185,84,0.4)',
    textAlign: 'center'
  },
  // NEW STYLES FOR VIP PANEL
  vipPanel: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker inset look
    borderRadius: '12px',
    border: '1px solid #1DB954',
    textAlign: 'center'
  },
  vipTitle: { margin: '0 0 10px 0', color: '#fff', fontSize: '18px' },
  vipDesc: { color: '#aaa', fontSize: '13px', marginBottom: '15px' },
  generateBtn: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#1DB954',
    border: '2px solid #1DB954',
    borderRadius: '25px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  codeContainer: { marginTop: '20px' },
  codeLabel: { color: '#fff', margin: '0 0 5px 0', fontSize: '14px' },
  codeDisplay: {
    padding: '15px',
    backgroundColor: '#121212',
    border: '1px dashed #1DB954',
    borderRadius: '8px',
    fontSize: '22px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#1DB954'
  },
  codeWarning: { color: '#ff4d4d', fontSize: '12px', marginTop: '10px' }
};
