import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#666' }}>
        We couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          background: '#111',
          color: '#fff',
          textDecoration: 'none',
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
