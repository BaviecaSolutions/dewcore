import { COLORS, ROLES } from '../../constants';
import logo from '../../assets/logo.png';

export default function Header({ session, onLogout }) {
  const isAuditor = session.role === ROLES.AUDITOR;

  return (
    <div style={{
      marginBottom: 20,
      borderBottom: `1px solid ${COLORS.cardBorder}`,
      paddingBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        {/* Logo y título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 300 }}>
          <img src={logo} alt="DewCore Logo" style={{ height: 50, width: 'auto' }} />
          <div>
            <h1 style={{
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              letterSpacing: '-0.02em',
              color: COLORS.primary,
              fontFamily: "'Red Hat Display', 'Inter', sans-serif"
            }}>
              CMA — Cuadro de Mando Analítico
            </h1>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0 0' }}>
              Dashboard Ejecutivo · Patente ES-3046193-A1
            </p>
          </div>
        </div>

        {/* User info y logout */}
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}>
          {/* Badge de rol */}
          <div style={{
            padding: '6px 12px',
            background: isAuditor ? `${COLORS.success}10` : `${COLORS.info}10`,
            border: `1px solid ${isAuditor ? COLORS.success : COLORS.info}`,
            borderRadius: 0,
          }}>
            <div style={{
              fontSize: 9,
              color: COLORS.textMuted,
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}>
              ROL
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: isAuditor ? COLORS.success : COLORS.info,
              letterSpacing: '0.02em',
            }}>
              {isAuditor ? 'AUDITOR' : 'OBSERVER'}
            </div>
          </div>

          {/* User info */}
          <div style={{
            padding: '6px 12px',
            background: COLORS.bgSubtle,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 0,
          }}>
            <div style={{
              fontSize: 9,
              color: COLORS.textMuted,
              fontWeight: 600,
              letterSpacing: '0.03em',
            }}>
              USUARIO
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.text,
            }}>
              {session.name}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            style={{
              padding: '10px 16px',
              background: COLORS.error,
              color: '#ffffff',
              border: 'none',
              borderRadius: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontFamily: "'Red Hat Display', sans-serif",
            }}
            onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.background = COLORS.error}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      {/* Permisos badge (solo para observers con restricciones) */}
      {!isAuditor && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: `${COLORS.warning}08`,
          border: `1px solid ${COLORS.warning}`,
          borderRadius: 0,
          fontSize: 10,
          color: COLORS.textDim,
        }}>
          <strong style={{ color: COLORS.warning }}>⚠ Vista limitada:</strong> Como Observer, solo puedes ver datos en tiempo real. Para acceso completo (histórico + exportación), contacta al administrador.
        </div>
      )}
    </div>
  );
}
