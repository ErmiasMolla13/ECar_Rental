'use client';

import Link from 'next/link';

export default function Error({ error, reset }) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#666' }}>
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            background: '#111',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            background: '#eee',
            color: '#111',
            textDecoration: 'none',
          }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
