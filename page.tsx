export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050508', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', fontWeight: 900, color: '#000',
      }}>T</div>
      <h1 style={{ color: '#f8f8f8', fontSize: '1.5rem', fontFamily: 'Playfair Display, serif' }}>You're offline</h1>
      <p style={{ color: '#8888aa', fontSize: '0.9rem' }}>Please check your connection and try again.</p>
      <button onClick={() => window.location.reload()} style={{
        padding: '0.625rem 1.5rem', borderRadius: '10px', cursor: 'pointer',
        background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', color: '#000', fontWeight: 600,
      }}>Retry</button>
    </div>
  );
}
