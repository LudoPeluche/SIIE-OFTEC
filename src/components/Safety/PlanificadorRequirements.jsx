import { useState, useEffect, useMemo } from 'react'
import Modal from '../Modal.jsx'
import {
  PELIGROS_ITEMS,
  PERMISOS_ALTO_RIESGO,
  EPPS_ITEMS,
  EQUIPO_EMERGENCIA,
  SERVICE_SAFETY_MAPPING,
  CRITICAL_PERMITS
} from '../../constants.js'
import { getAutoSuggestions, createPlanificadorRequirements } from '../../lib/safetyService.js'

export default function PlanificadorRequirements({
  open,
  onClose,
  onSave,
  workOrder,
  currentUser,
  existingData
}) {
  const [riesgos, setRiesgos] = useState([])
  const [permisos, setPermisos] = useState([])
  const [epps, setEpps] = useState([])
  const [equipos, setEquipos] = useState([])
  const [sinRiesgos, setSinRiesgos] = useState(false)
  const [sinRiesgosJustificacion, setSinRiesgosJustificacion] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-sugerencias basadas en tipo de servicio
  const suggestions = useMemo(() => {
    return getAutoSuggestions(workOrder?.tipoServicios || [], SERVICE_SAFETY_MAPPING)
  }, [workOrder?.tipoServicios])

  // Cargar datos existentes o aplicar sugerencias
  useEffect(() => {
    if (existingData) {
      setRiesgos(existingData.riesgosRequeridos || [])
      setPermisos(existingData.permisosRequeridos || [])
      setEpps(existingData.eppRequeridos || [])
      setEquipos(existingData.equiposRequeridos || [])
      setSinRiesgos(existingData.sinRiesgosAdicionales || false)
      setSinRiesgosJustificacion(existingData.sinRiesgosJustificacion || '')
    } else if (suggestions) {
      // Aplicar sugerencias automáticas
      setRiesgos(suggestions.riesgos || [])
      setPermisos(suggestions.permisos || [])
      setEpps(suggestions.epps || [])
      setEquipos(suggestions.equipos || [])
    }
  }, [existingData, suggestions])

  const toggleItem = (list, setList, key) => {
    if (list.includes(key)) {
      setList(list.filter(k => k !== key))
    } else {
      setList([...list, key])
    }
  }

  const handleSave = async () => {
    // Validar
    if (riesgos.length === 0 && !sinRiesgos) {
      alert('Debe seleccionar al menos un riesgo o marcar "Sin riesgos adicionales"')
      return
    }
    if (sinRiesgos && !sinRiesgosJustificacion.trim()) {
      alert('Debe justificar por qué no hay riesgos adicionales')
      return
    }

    setSaving(true)
    try {
      const requirements = createPlanificadorRequirements(currentUser, {
        riesgos,
        permisos,
        epps,
        equipos,
        sinRiesgosAdicionales: sinRiesgos,
        sinRiesgosJustificacion: sinRiesgosJustificacion.trim()
      })
      await onSave(requirements)
      onClose()
    } catch (err) {
      console.error(err)
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const hasSuggestion = (key, category) => {
    return suggestions[category]?.includes(key)
  }

  return (
    <Modal open={open} title="Configurar Requisitos de Seguridad" onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Info de OT */}
        <div style={{ background: 'rgba(14,165,233,0.1)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
          <strong>OT:</strong> {workOrder?.code || 'Nueva'} | <strong>Cliente:</strong> {workOrder?.cliente || '-'} | <strong>Servicios:</strong> {(workOrder?.tipoServicios || []).join(', ') || 'No definidos'}
        </div>

        {suggestions.riesgos?.length > 0 && (
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--ok)' }}>
            Se aplicaron sugerencias automáticas basadas en el tipo de servicio. Puede modificarlas.
          </div>
        )}

        {/* RIESGOS */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            Riesgos / Peligros
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({riesgos.length} seleccionados)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            {PELIGROS_ITEMS.map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: riesgos.includes(item.key) ? 'rgba(16,185,129,0.15)' : hasSuggestion(item.key, 'riesgos') ? 'rgba(245,158,11,0.1)' : 'transparent',
                  border: hasSuggestion(item.key, 'riesgos') ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={riesgos.includes(item.key)}
                  onChange={() => toggleItem(riesgos, setRiesgos, item.key)}
                />
                {item.label}
              </label>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={sinRiesgos}
              onChange={(e) => setSinRiesgos(e.target.checked)}
            />
            Sin riesgos adicionales identificados
          </label>
          {sinRiesgos && (
            <textarea
              className="input"
              rows={2}
              placeholder="Justifique por qué no hay riesgos adicionales..."
              value={sinRiesgosJustificacion}
              onChange={(e) => setSinRiesgosJustificacion(e.target.value)}
              style={{ marginTop: 6 }}
            />
          )}
        </div>

        {/* PERMISOS DE ALTO RIESGO */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            Permisos de Alto Riesgo
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({permisos.length} seleccionados)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
            {PERMISOS_ALTO_RIESGO.map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: permisos.includes(item.key) ? 'rgba(16,185,129,0.15)' : hasSuggestion(item.key, 'permisos') ? 'rgba(245,158,11,0.1)' : 'transparent',
                  border: CRITICAL_PERMITS.includes(item.key) ? '1px solid rgba(239,68,68,0.4)' : hasSuggestion(item.key, 'permisos') ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={permisos.includes(item.key)}
                  onChange={() => toggleItem(permisos, setPermisos, item.key)}
                />
                {item.label}
                {CRITICAL_PERMITS.includes(item.key) && (
                  <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>CRITICO</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* EPPs */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            EPP Requerido
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({epps.length} seleccionados)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
            {EPPS_ITEMS.map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: epps.includes(item.key) ? 'rgba(16,185,129,0.15)' : hasSuggestion(item.key, 'epps') ? 'rgba(245,158,11,0.1)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={epps.includes(item.key)}
                  onChange={() => toggleItem(epps, setEpps, item.key)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* EQUIPOS DE EMERGENCIA */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            Equipos de Emergencia
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>({equipos.length} seleccionados)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
            {EQUIPO_EMERGENCIA.map(item => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: equipos.includes(item.key) ? 'rgba(16,185,129,0.15)' : hasSuggestion(item.key, 'equipos') ? 'rgba(245,158,11,0.1)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={equipos.includes(item.key)}
                  onChange={() => toggleItem(equipos, setEquipos, item.key)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="modal-actions" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="btn primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Requisitos'}
        </button>
      </div>
    </Modal>
  )
}
