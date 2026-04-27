import { useState, useMemo } from 'react'
import {
  calculateSafetyProgress,
  getSafetyVerificationStatus,
  validateSafetyForSave
} from '../../lib/safetyService.js'
import { SAFETY_VERIFICATION_STATUS } from '../../constants.js'

function CollapsibleSection({ title, confirmed, total, isOpen, onToggle, children, tone = 'default' }) {
  const toneStyles = {
    default: { bg: 'rgba(255,255,255,0.03)', border: 'var(--line)' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
    danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' }
  }

  const style = toneStyles[tone] || toneStyles.default
  const isComplete = confirmed === total && total > 0

  return (
    <div style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>{isOpen ? '▼' : '▶'}</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{title}</span>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 700,
          background: isComplete ? 'rgba(16,185,129,0.2)' : total === 0 ? 'rgba(100,100,100,0.2)' : 'rgba(245,158,11,0.2)',
          color: isComplete ? '#10b981' : total === 0 ? '#94a3b8' : '#f59e0b'
        }}>
          {total === 0 ? 'No requerido' : `${confirmed}/${total} confirmados`}
        </div>
      </div>
      {isOpen && total > 0 && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${style.border}` }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function SafetyVerificationBanner({
  safetyVerification,
  onRequestSupervisor,
  isReadOnly = false
}) {
  const [openSections, setOpenSections] = useState({
    riesgos: false,
    permisos: false,
    epps: false,
    equipos: false
  })

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const status = useMemo(() => getSafetyVerificationStatus(safetyVerification), [safetyVerification])
  const progress = useMemo(() => calculateSafetyProgress(safetyVerification), [safetyVerification])
  const validation = useMemo(() => validateSafetyForSave(safetyVerification), [safetyVerification])

  // No mostrar banner si no está configurado
  if (status === SAFETY_VERIFICATION_STATUS.NOT_CONFIGURED) {
    return (
      <div style={{
        background: 'rgba(100,100,100,0.1)',
        border: '1px solid rgba(100,100,100,0.2)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#94a3b8' }}>Seguridad no configurada</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              El planificador no ha definido requisitos de seguridad para esta OT.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bannerStyles = {
    [SAFETY_VERIFICATION_STATUS.PENDING]: {
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
      border: 'rgba(245,158,11,0.4)',
      icon: '⚠️',
      title: 'Verificación de seguridad pendiente',
      color: '#f59e0b'
    },
    [SAFETY_VERIFICATION_STATUS.IN_PROGRESS]: {
      bg: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))',
      border: 'rgba(14,165,233,0.4)',
      icon: '🔄',
      title: 'Verificación de seguridad en progreso',
      color: '#0ea5e9'
    },
    [SAFETY_VERIFICATION_STATUS.BLOCKED]: {
      bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
      border: 'rgba(239,68,68,0.5)',
      icon: '🚫',
      title: 'BLOQUEADO - Requiere aprobación de supervisor',
      color: '#ef4444'
    },
    [SAFETY_VERIFICATION_STATUS.COMPLETED]: {
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
      border: 'rgba(16,185,129,0.4)',
      icon: '✅',
      title: 'Verificación de seguridad completada',
      color: '#10b981'
    }
  }

  const bannerStyle = bannerStyles[status] || bannerStyles[SAFETY_VERIFICATION_STATUS.PENDING]
  const planificador = safetyVerification?.planificador

  return (
    <div style={{
      background: bannerStyle.bg,
      border: `2px solid ${bannerStyle.border}`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 16
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{bannerStyle.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: bannerStyle.color }}>{bannerStyle.title}</div>
            {planificador && (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Plan aprobado el {new Date(planificador.fecha).toLocaleDateString()} por {planificador.user}
              </div>
            )}
          </div>
        </div>
        <div style={{
          padding: '6px 14px',
          borderRadius: 16,
          fontSize: 13,
          fontWeight: 800,
          background: status === SAFETY_VERIFICATION_STATUS.COMPLETED ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
          color: status === SAFETY_VERIFICATION_STATUS.COMPLETED ? '#10b981' : 'var(--text)'
        }}>
          {progress.overall.confirmed}/{progress.overall.total}
        </div>
      </div>

      {/* Bloqueado - Mostrar botón de solicitar aprobación */}
      {status === SAFETY_VERIFICATION_STATUS.BLOCKED && !isReadOnly && (
        <div style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: 12 }}>
            <strong>Permisos críticos marcados como "No":</strong> {validation.blockedItems.join(', ')}
          </div>
          <button
            className="btn"
            onClick={onRequestSupervisor}
            style={{ background: '#ef4444', color: 'white', fontSize: 12, padding: '6px 12px' }}
          >
            Solicitar aprobación
          </button>
        </div>
      )}

      {/* Secciones colapsables */}
      <div style={{ display: 'grid', gap: 8 }}>
        <CollapsibleSection
          title="Riesgos identificados"
          confirmed={progress.riesgos.confirmed}
          total={progress.riesgos.total}
          isOpen={openSections.riesgos}
          onToggle={() => toggleSection('riesgos')}
          tone={progress.riesgos.confirmed === progress.riesgos.total && progress.riesgos.total > 0 ? 'success' : 'default'}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 10 }}>
            {(planificador?.riesgosRequeridos || []).map(key => (
              <div key={key} style={{ padding: '4px 0' }}>• {key}</div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Permisos / EPP requeridos"
          confirmed={progress.permisos.confirmed + progress.epps.confirmed}
          total={progress.permisos.total + progress.epps.total}
          isOpen={openSections.permisos}
          onToggle={() => toggleSection('permisos')}
          tone={validation.requiresSupervisor ? 'danger' : progress.permisos.confirmed + progress.epps.confirmed === progress.permisos.total + progress.epps.total && (progress.permisos.total + progress.epps.total) > 0 ? 'success' : 'default'}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Permisos:</div>
            {(planificador?.permisosRequeridos || []).map(key => (
              <div key={key} style={{ padding: '2px 0' }}>• {key}</div>
            ))}
            {(planificador?.permisosRequeridos || []).length === 0 && <div style={{ fontStyle: 'italic' }}>Ninguno</div>}
            <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 8 }}>EPPs:</div>
            {(planificador?.eppRequeridos || []).map(key => (
              <div key={key} style={{ padding: '2px 0' }}>• {key}</div>
            ))}
            {(planificador?.eppRequeridos || []).length === 0 && <div style={{ fontStyle: 'italic' }}>Ninguno</div>}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Equipos de emergencia"
          confirmed={progress.equipos.confirmed}
          total={progress.equipos.total}
          isOpen={openSections.equipos}
          onToggle={() => toggleSection('equipos')}
          tone={progress.equipos.confirmed === progress.equipos.total && progress.equipos.total > 0 ? 'success' : 'default'}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 10 }}>
            {(planificador?.equiposRequeridos || []).map(key => (
              <div key={key} style={{ padding: '4px 0' }}>• {key}</div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
