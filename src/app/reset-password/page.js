'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const styles = {
  page: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  input: {
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  button: {
    padding: '0.7rem 1rem',
    borderRadius: '6px',
    background: '#111',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') || 'customer';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: false, done: false });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus({ loading: false, message: 'Passwords do not match.', error: true, done: false });
      return;
    }
    if (password.length < 8) {
      setStatus({ loading: false, message: 'Password must be at least 8 characters.', error: true, done: false });
      return;
    }

    setStatus({ loading: true, message: '', error: false, done: false });

    try {
      const res = await fetch(`/api/${role}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      setStatus({
        loading: false,
        message: data.message || data.error || 'Something went wrong.',
        error: !res.ok,
        done: res.ok,
      });
      if (res.ok) {
        setTimeout(() => router.push('/'), 2000);
      }
    } catch {
      setStatus({ loading: false, message: 'Network error. Please try again.', error: true, done: false });
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#dc2626' }}>
          This link is missing a reset token. Please use the link from your email.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Reset password</h1>
        <p style={{ color: '#666', marginTop: 0 }}>Choose a new password for your {role} account.</p>

        <input
          style={styles.input}
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button style={styles.button} type="submit" disabled={status.loading || status.done}>
          {status.loading ? 'Resetting...' : 'Reset password'}
        </button>

        {status.message && (
          <p style={{ color: status.error ? '#dc2626' : '#16a34a', fontSize: '0.9rem' }}>
            {status.message}
          </p>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={styles.page}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
