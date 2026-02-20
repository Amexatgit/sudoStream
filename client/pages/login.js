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
        localStorage.setItem('role', data.role); // <--- NEW!

        // Redirect based on role
        if (data.role === 'admin') {
            router.push('/upload'); // Admin goes to work
        } else {
            router.push('/'); // Users go to listen
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
          
          <button type="submit" style={styles.button}>Enter into the Copyright Collection</button>

          {error && <p style={styles.error}>{error}</p>}
        </form>
        
        <button onClick={() => router.push('/')} style={styles.backLink}>
          ← Back to Music
        </button>
      </div>
    </div>
  );
}

// --- STYLES (Same Dark Theme) ---
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
  }
};
