'use client';

import { useState } from 'react';

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

export default function ResendVerificationPage() {
  const [role, setRole] = useState('customer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', error: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', error: false });

    try {
      const res = await fetch(`/api/${role}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatus({
        loading: false,
        message: data.message || data.error || 'Something went wrong.',
        error: !res.ok,
      });
    } catch {
      setStatus({ loading: false, message: 'Network error. Please try again.', error: true });
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Resend verification email</h1>
        <p style={{ color: '#666', marginTop: 0 }}>
          Didn&apos;t get the email, or did your link expire? Request a new one.
        </p>

        <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="customer">Customer</option>
          <option value="owner">Owner</option>
        </select>

        <input
          style={styles.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button style={styles.button} type="submit" disabled={status.loading}>
          {status.loading ? 'Sending...' : 'Resend verification email'}
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
