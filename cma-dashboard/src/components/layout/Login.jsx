import { useState } from 'react';
import { COLORS } from '../../constants';
import { login } from '../../utils/auth';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simular delay de autenticación
    setTimeout(() => {
      const session = login(email, password);
      if (session) {
        onLoginSuccess(session);
      } else {
        setError('Email o contraseña incorrectos');
      }
      setLoading(false);
    }, 300);
  };

  const fillDemo = (role) => {
    if (role === 'observer') {
      setEmail('observer@dewcore.com');
      setPassword('observer123');
    } else {
      setEmail('auditor@dewcore.com');
      setPassword('auditor123');
    }
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 50%, ${COLORS.primaryMid} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Red Hat Display', 'Inter', sans-serif",
    }}>
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 0,
        padding: 40,
        maxWidth: 450,
        width: '100%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Logo y título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.primary,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            CMA Dashboard
          </div>
          <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 4 }}>
            Cuadro de Mando Analítico
          </div>
          <div style={{ fontSize: 12, color: COLORS.textLight }}>
            DewCore Engineering · ES-3046193-A1
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.textDim,
              marginBottom: 6,
              letterSpacing: '0.02em',
            }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@dewcore.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 0,
                fontFamily: "'Red Hat Display', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.cardBorder}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.textDim,
              marginBottom: 6,
              letterSpacing: '0.02em',
            }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 0,
                fontFamily: "'Red Hat Display', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.primary}
              onBlur={(e) => e.target.style.borderColor = COLORS.cardBorder}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: COLORS.errorDim,
              border: `1px solid ${COLORS.error}`,
              color: COLORS.error,
              fontSize: 12,
              marginBottom: 20,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: loading ? COLORS.textMuted : COLORS.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: 0,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              fontFamily: "'Red Hat Display', sans-serif",
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = COLORS.primaryDark)}
            onMouseLeave={(e) => !loading && (e.target.style.background = COLORS.primary)}
          >
            {loading ? 'AUTENTICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        {/* Credenciales demo */}
        <div style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: `1px solid ${COLORS.cardBorder}`,
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12, fontWeight: 600, letterSpacing: '0.03em' }}>
            CREDENCIALES DE PRUEBA
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => fillDemo('observer')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: COLORS.bgSubtle,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 0,
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textDim,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Red Hat Display', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = COLORS.primaryDim;
                e.target.style.borderColor = COLORS.primary;
                e.target.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = COLORS.bgSubtle;
                e.target.style.borderColor = COLORS.cardBorder;
                e.target.style.color = COLORS.textDim;
              }}
            >
              OBSERVER
            </button>

            <button
              type="button"
              onClick={() => fillDemo('auditor')}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: COLORS.bgSubtle,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 0,
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textDim,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Red Hat Display', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = COLORS.successDim;
                e.target.style.borderColor = COLORS.success;
                e.target.style.color = COLORS.success;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = COLORS.bgSubtle;
                e.target.style.borderColor = COLORS.cardBorder;
                e.target.style.color = COLORS.textDim;
              }}
            >
              AUDITOR
            </button>
          </div>

          <div style={{ fontSize: 10, color: COLORS.textLight, marginTop: 12, lineHeight: 1.5 }}>
            <strong>Observer:</strong> Vista limitada (solo datos en tiempo real)<br />
            <strong>Auditor:</strong> Vista completa (histórico + exportación)
          </div>
        </div>
      </div>
    </div>
  );
}
