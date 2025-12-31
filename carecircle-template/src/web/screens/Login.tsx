import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

export const WebLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('caregivers')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              name: email.split('@')[0],
            });

          if (profileError) throw profileError;
        }

        alert('Account created! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#0f172a',
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '24px',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '900',
            color: '#f8fafc',
            marginBottom: '8px',
          }}>CareCircle</h1>
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '0 16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginRight: '12px' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              style={{
                flex: 1,
                color: '#f8fafc',
                fontSize: '16px',
                padding: '16px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
              }}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            padding: '0 16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginRight: '12px' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              style={{
                flex: 1,
                color: '#f8fafc',
                fontSize: '16px',
                padding: '16px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
              }}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          <button
            style={{
              background: '#3b82f6',
              borderRadius: '16px',
              padding: '16px',
              alignItems: 'center',
              border: 'none',
              cursor: 'pointer',
              marginTop: '8px',
              color: '#f8fafc',
              fontSize: '16px',
              fontWeight: '900',
            }}
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          <button
            style={{
              textAlign: 'center',
              padding: '8px 0',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: '600',
            }}
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
