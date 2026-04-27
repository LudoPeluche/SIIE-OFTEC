import { useState, useRef } from 'react'
import { SAFETY_STATUS, CRITICAL_PERMITS } from '../../constants.js'

export default function TecnicoConfirmation({
  itemKey,
  itemLabel,
  currentValue,
  onChange,
  onPhotoUpload,
  isReadOnly = false
}) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const isCritical = CRITICAL_PERMITS.includes(itemKey)
  const status = currentValue?.status || SAFETY_STATUS.PENDIENTE
  const needsJustification = status === SAFETY_STATUS.NO || status === SAFETY_STATUS.NO_APLICA

  const handleStatusChange = (newStatus) => {
    if (isReadOnly) return
    onChange({
      ...currentValue,
      status: newStatus,
      timestamp: new Date().toISOString(),
      justificacion: newStatus === SAFETY_STATUS.SI ? null : (currentValue?.justificacion || ''),
      fotoUrl: currentValue?.fotoUrl || null
    })
  }

  const handleJustificacionChange = (text) => {
    if (isReadOnly) return
    onChange({
      ...currentValue,
      justificacion: text
    })
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoUpload) return

    setUploading(true)
    try {
      const url = await onPhotoUpload(itemKey, file)
      onChange({
        ...currentValue,
        fotoUrl: url
      })
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Error al subir foto: ' + err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removePhoto = () => {
    if (isReadOnly) return
    onChange({
      ...currentValue,
      fotoUrl: null
    })
  }

  const statusColors = {
    [SAFETY_STATUS.PENDIENTE]: { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.2)' },
    [SAFETY_STATUS.SI]: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    [SAFETY_STATUS.NO]: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
    [SAFETY_STATUS.NO_APLICA]: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
  }

  const colors = statusColors[status] || statusColors[SAFETY_STATUS.PENDIENTE]

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8
    }}>
      {/* Header con label y badge crítico */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{itemLabel}</span>
          {isCritical && (
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.15)',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              CRÍTICO
            </span>
          )}
        </div>
        {currentValue?.timestamp && (
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>
            {new Date(currentValue.timestamp).toLocaleString()}
          </span>
        )}
      </div>

      {/* Radio buttons */}
      <div style={{ display: 'flex', gap: 16, marginBottom: needsJustification ? 10 : 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isReadOnly ? 'default' : 'pointer' }}>
          <input
            type="radio"
            name={`safety_${itemKey}`}
            checked={status === SAFETY_STATUS.SI}
            onChange={() => handleStatusChange(SAFETY_STATUS.SI)}
            disabled={isReadOnly}
          />
          <span style={{ fontSize: 13, color: status === SAFETY_STATUS.SI ? '#10b981' : 'inherit', fontWeight: status === SAFETY_STATUS.SI ? 700 : 400 }}>
            Sí
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isReadOnly ? 'default' : 'pointer' }}>
          <input
            type="radio"
            name={`safety_${itemKey}`}
            checked={status === SAFETY_STATUS.NO}
            onChange={() => handleStatusChange(SAFETY_STATUS.NO)}
            disabled={isReadOnly}
          />
          <span style={{ fontSize: 13, color: status === SAFETY_STATUS.NO ? '#ef4444' : 'inherit', fontWeight: status === SAFETY_STATUS.NO ? 700 : 400 }}>
            No
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: isReadOnly ? 'default' : 'pointer' }}>
          <input
            type="radio"
            name={`safety_${itemKey}`}
            checked={status === SAFETY_STATUS.NO_APLICA}
            onChange={() => handleStatusChange(SAFETY_STATUS.NO_APLICA)}
            disabled={isReadOnly}
          />
          <span style={{ fontSize: 13, color: status === SAFETY_STATUS.NO_APLICA ? '#f59e0b' : 'inherit', fontWeight: status === SAFETY_STATUS.NO_APLICA ? 700 : 400 }}>
            No aplica
          </span>
        </label>
      </div>

      {/* Justificación (solo si No o No aplica) */}
      {needsJustification && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            Justificación {isCritical && status === SAFETY_STATUS.NO ? '(Requerirá aprobación de supervisor)' : ''}:
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="Explique por qué..."
            value={currentValue?.justificacion || ''}
            onChange={(e) => handleJustificacionChange(e.target.value)}
            disabled={isReadOnly}
            style={{
              fontSize: 12,
              background: 'rgba(0,0,0,0.2)',
              border: !currentValue?.justificacion ? '1px solid rgba(239,68,68,0.5)' : undefined
            }}
          />

          {/* Foto de evidencia */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            {!isReadOnly && (
              <>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: uploading ? 'wait' : 'pointer'
                }}>
                  <span>📷</span>
                  {uploading ? 'Subiendo...' : 'Adjuntar foto'}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </>
            )}

            {currentValue?.fotoUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={currentValue.fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#0ea5e9' }}
                >
                  Ver foto
                </a>
                {!isReadOnly && (
                  <button
                    onClick={removePhoto}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning para permisos críticos */}
      {isCritical && status === SAFETY_STATUS.NO && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'rgba(239,68,68,0.15)',
          borderRadius: 6,
          fontSize: 11,
          color: '#ef4444',
          fontWeight: 600
        }}>
          ⚠️ Este es un permiso crítico. Al marcarlo como "No", se bloqueará el guardado hasta que un supervisor apruebe.
        </div>
      )}
    </div>
  )
}
