import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const API_URL = "http://192.168.1.37:8000";

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
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          
          <button type="submit" style={styles.button}>Enter into Copyright Collection</button>

          {error && <p style={styles.error}>{error}</p>}
        </form>


        {/* 🎟️ THE FREE DEMO PASS UI */}
        <div style={styles.guestBox}>
            <p style={styles.guestTextTitle}>Want a Free Trial?</p>
            <p style={styles.guestText}>User: <strong style={styles.guestHighlight}>FreeTrial</strong></p>
            <p style={styles.guestText}>Pass: <strong style={styles.guestHighlight}>justcheckingout</strong></p>
            <p style={styles.guestDisclaimer}>*Free Trial Session auto-destructs in 5 minutes</p>
            <p style={styles.guestDisclaimer}>Contact me for invite codes & get permanent access for free</p>
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
