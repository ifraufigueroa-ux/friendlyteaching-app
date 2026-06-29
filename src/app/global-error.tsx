'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FT] Root layout error:', error.message, error.stack);
  }, [error]);

  return (
    <html lang="es-CL">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #F0E5FF 0%, #E0D5FF 50%, #FFE8F0 100%)',
          fontFamily: 'Nunito, sans-serif',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ color: '#5A3D7A', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Algo salió mal
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Error: {error.message || 'Error desconocido'}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                background: '#C8A8DC',
                color: 'white',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
