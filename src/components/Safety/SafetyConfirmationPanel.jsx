import { useMemo } from 'react'
import TecnicoConfirmation from './TecnicoConfirmation.jsx'
import {
  PELIGROS_ITEMS,
  PERMISOS_ALTO_RIESGO,
  EPPS_ITEMS,
  EQUIPO_EMERGENCIA
} from '../../constants.js'

function getItemLabel(key, items) {
  const item = items.find(i => i.key === key)
  return item?.label || key
}

export default function SafetyConfirmationPanel({
  safetyVerification,
  onConfirmItem,
  onPhotoUpload,
  isReadOnly = false
}) {
  const planificador = safetyVerification?.planificador
  const confirmaciones = safetyVerification?.tecnico?.confirmaciones || {}

  // Si no hay planificación, no mostrar nada
  if (!planificador?.completed) {
    return null
  }

  const hasRiesgos = planificador.riesgosRequeridos?.length > 0
  const hasPermisos = planificador.permisosRequeridos?.length > 0
  const hasEpps = planificador.eppRequeridos?.length > 0
  const hasEquipos = planificador.equiposRequeridos?.length > 0

  const handleConfirm = (itemKey, value) => {
    onConfirmItem(itemKey, value)
  }

  const sectionStyle = {
    marginBottom: 20,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px solid var(--line)'
  }

  const sectionTitleStyle = {
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8
  }

  return (
    <div>
      {/* RIESGOS */}
      {hasRiesgos && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>⚠️</span>
            Riesgos / Peligros Identificados
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
              ({planificador.riesgosRequeridos.length} ítems)
            </span>
          </div>
          {planificador.riesgosRequeridos.map(key => (
            <TecnicoConfirmation
              key={key}
              itemKey={key}
              itemLabel={getItemLabel(key, PELIGROS_ITEMS)}
              currentValue={confirmaciones[key]}
              onChange={(value) => handleConfirm(key, value)}
              onPhotoUpload={onPhotoUpload}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* PERMISOS DE ALTO RIESGO */}
      {hasPermisos && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>📋</span>
            Permisos de Alto Riesgo
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
              ({planificador.permisosRequeridos.length} ítems)
            </span>
          </div>
          {planificador.permisosRequeridos.map(key => (
            <TecnicoConfirmation
              key={key}
              itemKey={key}
              itemLabel={getItemLabel(key, PERMISOS_ALTO_RIESGO)}
              currentValue={confirmaciones[key]}
              onChange={(value) => handleConfirm(key, value)}
              onPhotoUpload={onPhotoUpload}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* EPPs */}
      {hasEpps && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>🦺</span>
            Equipos de Protección Personal (EPP)
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
              ({planificador.eppRequeridos.length} ítems)
            </span>
          </div>
          {planificador.eppRequeridos.map(key => (
            <TecnicoConfirmation
              key={key}
              itemKey={key}
              itemLabel={getItemLabel(key, EPPS_ITEMS)}
              currentValue={confirmaciones[key]}
              onChange={(value) => handleConfirm(key, value)}
              onPhotoUpload={onPhotoUpload}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* EQUIPOS DE EMERGENCIA */}
      {hasEquipos && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <span>🚨</span>
            Equipos de Emergencia
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>
              ({planificador.equiposRequeridos.length} ítems)
            </span>
          </div>
          {planificador.equiposRequeridos.map(key => (
            <TecnicoConfirmation
              key={key}
              itemKey={key}
              itemLabel={getItemLabel(key, EQUIPO_EMERGENCIA)}
              currentValue={confirmaciones[key]}
              onChange={(value) => handleConfirm(key, value)}
              onPhotoUpload={onPhotoUpload}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* Sin riesgos adicionales */}
      {planificador.sinRiesgosAdicionales && (
        <div style={{
          ...sectionStyle,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Sin riesgos adicionales identificados</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Justificación: {planificador.sinRiesgosJustificacion || 'No especificada'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje si no hay nada configurado */}
      {!hasRiesgos && !hasPermisos && !hasEpps && !hasEquipos && !planificador.sinRiesgosAdicionales && (
        <div style={{
          padding: 20,
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 13
        }}>
          No se han definido requisitos de seguridad para esta OT.
        </div>
      )}
    </div>
  )
}
