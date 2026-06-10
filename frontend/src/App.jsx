/**
 * @fileoverview CMA - Cuadro de Mando Analítico (Main App)
 *
 * Mayéutica Module: CMA (Analytical Dashboard)
 * Responsibilities: Human interface with scientific + executive views, RBAC
 * Dependencies: Backend WebSocket stream, @dewcore/shared/constants
 */

import { useState } from 'react';
import { useBackendStream } from './hooks/useBackendStream';
import { COLORS, ROLES } from '@dewcore/shared/constants';
import ScientificView from './views/ScientificView';
import ExecutiveView from './views/ExecutiveView';

// Mock authentication (documented as mock in production)
const MOCK_USERS = {
  auditor: { username: 'auditor', role: ROLES.AUDITOR, password: 'auditor123' },
  observer: { username: 'observer', role: ROLES.OBSERVER, password: 'observer123' },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [activeView, setActiveView] = useState('scientific');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const { data, history, status, connected, send } = useBackendStream();

  /**
   * Handle login (mock authentication)
   */
  const handleLogin = (e) => {
    e.preventDefault();
    const user = MOCK_USERS[loginForm.username];
    if (user && user.password === loginForm.password) {
      setSession(user);
    } else {
      alert('Invalid credentials. Try: auditor/auditor123 or observer/observer123');
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    setSession(null);
    setLoginForm({ username: '', password: '' });
  };

  /**
   * Control commands
   */
  const handleStart = () => send({ type: 'start' });
  const handleStop = () => send({ type: 'stop' });
  const handleReset = () => send({ type: 'reset' });
  const handleSpeedChange = (speed) => send({ type: 'set_speed', speed });

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================

  if (!session) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={styles.loginTitle}>CMA — DewCore</h1>
          <p style={styles.loginSubtitle}>Cuadro de Mando Analítico</p>

          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="text"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Login
            </button>
          </form>

          <div style={styles.loginHint}>
            <strong>Demo users:</strong><br />
            auditor / auditor123 (full access)<br />
            observer / observer123 (read-only)
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN DASHBOARD
  // =========================================================================

  const isAuditor = session.role === ROLES.AUDITOR;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>CMA — DewCore Validation</h1>
          <span style={styles.headerStatus}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>
            {session.username} ({session.role})
          </span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* View Switcher (only for Auditor) */}
      {isAuditor && (
        <div style={styles.viewSwitcher}>
          <button
            onClick={() => setActiveView('scientific')}
            style={{
              ...styles.viewButton,
              ...(activeView === 'scientific' ? styles.viewButtonActive : {}),
            }}
          >
            🔬 Scientific
          </button>
          <button
            onClick={() => setActiveView('executive')}
            style={{
              ...styles.viewButton,
              ...(activeView === 'executive' ? styles.viewButtonActive : {}),
            }}
          >
            💼 Executive
          </button>
        </div>
      )}

      {/* Controls */}
      <div style={styles.controls}>
        <button onClick={handleStart} disabled={status.running} style={styles.controlButton}>
          ▶ Start
        </button>
        <button onClick={handleStop} disabled={!status.running} style={styles.controlButton}>
          ⏸ Stop
        </button>
        <button onClick={handleReset} style={styles.controlButton}>
          ⏮ Reset
        </button>
        <span style={styles.controlInfo}>
          Hora: {status.hora.toFixed(1)}h | Speed: {status.speed}x
        </span>
        <select
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          value={status.speed}
          style={styles.select}
        >
          <option value="0.5">0.5x</option>
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="5">5x</option>
          <option value="10">10x</option>
        </select>
      </div>

      {/* View Content */}
      <div style={styles.content}>
        {activeView === 'scientific' && isAuditor && (
          <ScientificView data={data} history={history} />
        )}
        {activeView === 'executive' && (
          <ExecutiveView data={data} history={history} isAuditor={isAuditor} />
        )}
        {!isAuditor && (
          <ExecutiveView data={data} history={history} isAuditor={isAuditor} />
        )}
      </div>
    </div>
  );
}

// =========================================================================
// STYLES
// =========================================================================

const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryMid} 100%)`,
  },
  loginCard: {
    background: COLORS.card,
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '400px',
    maxWidth: '90%',
  },
  loginTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: '8px',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: '14px',
    color: COLORS.textMuted,
    marginBottom: '32px',
    textAlign: 'center',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '6px',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    background: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loginHint: {
    marginTop: '24px',
    padding: '16px',
    background: COLORS.bgSubtle,
    borderRadius: '6px',
    fontSize: '12px',
    color: COLORS.textDim,
    lineHeight: '1.6',
  },
  container: {
    minHeight: '100vh',
    background: COLORS.bgSubtle,
  },
  header: {
    background: COLORS.card,
    borderBottom: `1px solid ${COLORS.cardBorder}`,
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerStatus: {
    fontSize: '12px',
    color: COLORS.textDim,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    fontSize: '14px',
    color: COLORS.textDim,
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '12px',
    background: 'transparent',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '4px',
    cursor: 'pointer',
    color: COLORS.text,
  },
  viewSwitcher: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    background: COLORS.card,
    borderBottom: `1px solid ${COLORS.cardBorder}`,
  },
  viewButton: {
    padding: '8px 16px',
    fontSize: '14px',
    background: 'transparent',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '6px',
    cursor: 'pointer',
    color: COLORS.text,
  },
  viewButtonActive: {
    background: COLORS.primary,
    color: 'white',
    borderColor: COLORS.primary,
  },
  controls: {
    display: 'flex',
    gap: '12px',
    padding: '16px 24px',
    alignItems: 'center',
    background: COLORS.card,
    borderBottom: `1px solid ${COLORS.cardBorder}`,
  },
  controlButton: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    background: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  controlInfo: {
    fontSize: '12px',
    color: COLORS.textDim,
    fontFamily: 'JetBrains Mono, monospace',
    marginLeft: 'auto',
  },
  select: {
    padding: '6px 12px',
    fontSize: '12px',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '4px',
    fontFamily: 'JetBrains Mono, monospace',
  },
  content: {
    padding: '24px',
  },
};
