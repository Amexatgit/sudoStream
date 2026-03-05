import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

        {/* 💚 FREE PLATFORM NOTE */}
        <div style={styles.noteBox}>
          <div style={styles.noteBadge}>100% Free • Forever</div>
          <p style={styles.noteText}>
            sudoStream is a <strong style={{color: '#fff'}}>lifetime free platform</strong> for everyone.
            The invite code system exists purely to keep copyright strikers away, not to gatekeep anyone.
          </p>
          <p style={styles.noteText}>
            Need a code? Just reach out and I'll send one absolutely free:
          </p>
          <a href="mailto:professionalamex@gmail.com" style={styles.emailLink}>
            ✉️ professionalamex@gmail.com
          </a>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '12px' }}>
            <a href="https://github.com/Amexatgit" target="_blank" rel="noreferrer" style={styles.socialLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '6px'}}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/ameyatlinked/" target="_blank" rel="noreferrer" style={styles.socialLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '6px'}}>
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
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
  },
  noteBox: {
    marginTop: '24px',
    padding: '18px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(29,185,84,0.08) 0%, rgba(29,185,84,0.03) 100%)',
    border: '1px solid rgba(29,185,84,0.25)',
    textAlign: 'center'
  },
  noteBadge: {
    display: 'inline-block',
    padding: '3px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(29,185,84,0.15)',
    border: '1px solid rgba(29,185,84,0.4)',
    color: '#1DB954',
    fontSize: '11px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  noteText: {
    color: '#999',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0 0 8px 0'
  },
  emailLink: {
    display: 'inline-block',
    marginTop: '6px',
    color: '#1DB954',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(29,185,84,0.4)',
    backgroundColor: 'rgba(29,185,84,0.08)',
    transition: '0.2s'
  },
  socialLink: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 16px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ccc',
    fontSize: '13px',
    fontWeight: 'bold',
    textDecoration: 'none',
    transition: '0.2s'
  }
};
