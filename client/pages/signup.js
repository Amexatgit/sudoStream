import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = "http://192.168.1.37:8000";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: username.trim(), 
            password: password.trim(), 
            inviteCode: inviteCode.trim().toUpperCase() // Force uppercase for safety
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Give them 2 seconds to read the success message, then send to login
        setTimeout(() => {
            router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Signup Failed');
      }
    } catch (err) {
      setError('Server Error. Is backend running?');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}> Club Access</h1>
        <p style={styles.subtitle}>Redeem your invite code to enter the Club.</p>
        
        {success ? (
            <div style={styles.successBox}>
                <h2>Access Granted! 🏴‍☠️</h2>
                <p>Welcome to SudoStream. Redirecting to login...</p>
            </div>
        ) : (
            <form onSubmit={handleSignup} style={styles.form}>
            
            <div style={styles.inputGroup}>
                <label style={styles.label}>Invite Code</label>
                <input 
                    type="text" 
                    placeholder="SUDO-XXXXXX" 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    style={{...styles.input, ...styles.codeInput}}
                    required
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Choose New Username</label>
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                    required
                />
            </div>

            <div style={styles.inputGroup}>
                <label style={styles.label}>Choose New Password</label>
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    required
                />
            </div>
            
            <button type="submit" style={styles.button}>Create Account</button>

            {error && <p style={styles.error}>{error}</p>}
            </form>
        )}
        
        <button onClick={() => router.push('/login')} style={styles.backLink}>
          Already have an account? Log in here.
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    color: 'white',
    padding: '20px'
  },
  card: {
    backgroundColor: '#282828',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },
  title: { marginBottom: '5px', fontSize: '26px' },
  subtitle: { color: '#aaa', fontSize: '14px', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' },
  label: { fontSize: '12px', color: '#1DB954', fontWeight: 'bold', textTransform: 'uppercase', marginLeft: '5px' },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #333',
    backgroundColor: '#3e3e3e',
    color: 'white',
    fontSize: '16px'
  },
  codeInput: {
    letterSpacing: '2px',
    fontWeight: 'bold',
    color: '#1DB954',
    textTransform: 'uppercase'
  },
  button: {
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: '#1DB954',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'transform 0.1s'
  },
  error: { color: '#ff4d4d', marginTop: '10px', fontSize: '14px' },
  successBox: {
    padding: '20px',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    border: '1px solid #1DB954',
    borderRadius: '8px',
    color: '#1DB954',
    marginBottom: '20px'
  },
  backLink: {
    marginTop: '25px',
    background: 'none',
    border: 'none',
    color: '#b3b3b3',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  }
};
