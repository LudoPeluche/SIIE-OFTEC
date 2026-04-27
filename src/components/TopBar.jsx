export default function TopBar({ title, tech, onLogout }) {

  return (
    <div className="topbar-inner">
      <div className="brand">
        <img className="brand-logo" src="/siiewcim.png" alt="SIIEWCIM" />
        <div className="brand-text">
          <div className="brand-title">SIIE-OFTEC</div>
          <div className="brand-subtitle">{title}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          lineHeight: 1.3,
          padding: '8px 13px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(16,185,129,0.15)'
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', letterSpacing: '0.3px' }}>{tech}</span>
        </div>
        <button
          onClick={onLogout}
          className="btn danger"
          style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700 }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}
