import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // 🎉 SUCCESS! Save Token AND Role
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role); 

        // 🧨 THE TRAPDOOR SEQUENCE
        if (data.role === 'guest') {
            
            router.push('/'); // Send them to the music
        setTimeout(() => {
                alert("Welcome to the Vault! 🏴‍☠️ You have exactly 5 minutes before this session self-destructs.");
            }, 500);
            
            // Set the 5-minute timer (300,000 ms)
            setTimeout(() => {
                alert("⏳ Free Trial Expired! You are getting kicking you out... ");
                localStorage.clear(); // Wipe the token and role
                window.location.href = '/login'; // Force them back to the login screen
            }, 300000); 

            
        } 
        // 👑 ADMIN REDIRECT
        else if (data.role === 'admin') {
            router.push('/upload'); 
        } 
        // 🎧 NORMAL USER REDIRECT
        else {
            router.push('/'); 
        }
      } else {
        setError(data.error || 'Login Failed');
      }
    } catch (err) {
      setError('Server Error. Is backend running?');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Login </h1>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, paddingRight: '44px', width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 0,
                display: 'flex', alignItems: 'center', fontSize: '18px'
              }}
              tabIndex={-1}
            >
              {showPassword ? (
                // Eye-off icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Eye icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          
          <button type="submit" style={styles.button}>Enter into Copyright Collection</button>

          {error && <p style={styles.error}>{error}</p>}
        </form>


        {/* 🎟️ THE FREE DEMO PASS UI */}
        <div style={styles.guestBox}>
            <p style={styles.guestTextTitle}>Want a Free Trial?</p>
            <p style={styles.guestText}>User: <strong style={styles.guestHighlight}>FreeTrial</strong></p>
            <p style={styles.guestText}>Pass: <strong style={styles.guestHighlight}>justcheckingout</strong></p>
            <p style={styles.guestDisclaimer}>*Free Trial Session auto-destructs in 5 minutes</p>
            <p style={styles.guestDisclaimer}>Contact me on invite code page & get permanent access for free</p>
        </div>
        
        <button onClick={() => router.push('/')} style={styles.backLink}>
          ← Back to Free Music
        </button>
      </div>
    </div>
  );
}

// --- STYLES (Same Dark Theme, plus Guest Box) ---
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
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '350px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },
  title: { marginBottom: '20px', fontSize: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #333',
    backgroundColor: '#3e3e3e',
    color: 'white',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: '#1DB954',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: { color: '#ff4d4d', marginTop: '10px' },
  backLink: {
    marginTop: '20px',
    background: 'none',
    border: 'none',
    color: '#b3b3b3',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  // NEW STYLES FOR THE GUEST BOX
  guestBox: {
    marginTop: '25px',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid #333',
  },
  guestTextTitle: { color: '#aaa', margin: '0 0 10px 0', fontSize: '14px' },
  guestText: { margin: '5px 0', color: '#fff', fontSize: '15px' },
  guestHighlight: { color: '#1DB954' },
  guestDisclaimer: { color: '#888', margin: '10px 0 0 0', fontSize: '12px', fontStyle: 'italic' }
};
