import { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

export function AuthModal({ open, onClose, user, setUser }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      const demoUser = { id: email || 'demo-user', email: email || 'demo@sareeva.local' };
      localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setMessage('Demo login active. Add Supabase keys in .env for real accounts.');
      return;
    }

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(mode === 'login' ? 'Logged in successfully.' : 'Check your email to confirm registration.');
      if (result.data.user) setUser(result.data.user);
    }
  }

  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sareeva_user');
    setUser(null);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section className="auth-modal">
        <button className="icon-button modal-close" onClick={onClose}>
          <X />
        </button>
        {user ? (
          <>
            <h2>Your Account</h2>
            <p>{user.email || 'Demo account'}</p>
            {!isSupabaseConfigured && <p className="warning">Demo mode: configure Supabase env keys for real login.</p>}
            <button className="secondary-button icon-label" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            <h2>{mode === 'login' ? 'Login' : 'Register'} for saved cart</h2>
            <form onSubmit={submit}>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength="6"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                {mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>
            <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create a new account' : 'Already registered? Login'}
            </button>
            {message && <p className="form-message">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
}
