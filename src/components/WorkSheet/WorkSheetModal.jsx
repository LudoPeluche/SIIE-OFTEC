import { useState, useEffect } from 'react'
import { pdf } from '@react-pdf/renderer'
import {
  PEOPLE,
  PLANIFICACION_ITEMS,
  EPPS_ITEMS
} from '../../constants'
import SignatureCanvasComponent from './SignatureCanvas'
import TaskTable from './TaskTable'
import WorkSheetPDF from './WorkSheetPDF'

export default function WorkSheetModal({ workOrder, open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    // SECCIÓN A - Inicio de servicio
    referencia: '',
    responsable: '',
    destino: '',
    pdv: '',
    acompanante_1: '',
    acompanante_2: '',
    cliente: '',
    fecha_servicio: new Date().toISOString().split('T')[0],
    area_ejecucion: '',
    equipos_intervenidos: '',

    // CHECK LIST - Planificación del Servicio (cada item tiene: si, no, noAplica)
    planificacion: {},

    // TAREAS REALIZADAS
    tareas_realizadas: [],

    // EPPs
    epps: {},

    // OBSERVACIONES
    observaciones: '',

    // RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD
    firma_tecnico: '',
    firma_cliente: '',
    nombre_tecnico: '',
    nombre_cliente: '',
    fecha_firma: new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [errors, setErrors] = useState({})

  // Estado inicial por defecto
  const defaultFormData = {
    referencia: '',
    responsable: '',
    destino: '',
    pdv: '',
    acompanante_1: '',
    acompanante_2: '',
    cliente: '',
    fecha_servicio: new Date().toISOString().split('T')[0],
    area_ejecucion: '',
    equipos_intervenidos: '',
    planificacion: {},
    tareas_realizadas: [],
    epps: {},
    observaciones: '',
    firma_tecnico: '',
    firma_cliente: '',
    nombre_tecnico: '',
    nombre_cliente: '',
    fecha_firma: new Date().toISOString().split('T')[0]
  }

  // Pre-llenar datos cuando se abre el modal
  useEffect(() => {
    if (open && workOrder) {
      // Si ya existe una hoja de trabajo guardada, cargar esos datos
      if (workOrder.work_sheet_data && Object.keys(workOrder.work_sheet_data).length > 0) {
        setFormData({
          ...defaultFormData,
          ...workOrder.work_sheet_data,
          referencia: workOrder.referencia || workOrder.work_sheet_data.referencia || '',
          pdv: workOrder.pdv || workOrder.work_sheet_data.pdv || ''
        })
      } else {
        // Pre-llenar con datos básicos de la OT
        setFormData({
          ...defaultFormData,
          referencia: workOrder.referencia || '',
          responsable: workOrder.responsable || '',
          cliente: workOrder.cliente || '',
          pdv: workOrder.pdv || '',
          acompanante_1: workOrder.asignados?.[1] || '',
          acompanante_2: workOrder.asignados?.[2] || '',
          area_ejecucion: workOrder.area || '',
          equipos_intervenidos: ''
        })
      }
    }
  }, [open, workOrder])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Para checkboxes simples
  const handleCheckboxChange = (section, key) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: !prev[section]?.[key] }
    }))
  }

  // Para items con opciones Si/No/NoAplica
  const handleTriStateChange = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.responsable) newErrors.responsable = 'Campo requerido'
    if (!formData.cliente) newErrors.cliente = 'Campo requerido'
    if (!formData.fecha_servicio) newErrors.fecha_servicio = 'Campo requerido'
    if (formData.tareas_realizadas.length === 0) {
      newErrors.tareas_realizadas = 'Debe agregar al menos una tarea'
    }
    if (!formData.firma_tecnico) newErrors.firma_tecnico = 'Firma del técnico requerida'
    if (!formData.firma_cliente) newErrors.firma_cliente = 'Firma del cliente requerida'
    if (!formData.nombre_tecnico) newErrors.nombre_tecnico = 'Campo requerido'
    if (!formData.nombre_cliente) newErrors.nombre_cliente = 'Campo requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSave({
        work_order_id: workOrder.id,
        ...formData
      })
      onClose()
    } catch (error) {
      console.error('Error saving work sheet:', error)
      alert('Error al guardar la hoja de trabajo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Generar y descargar PDF
  const handleDownloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      const blob = await pdf(
        <WorkSheetPDF data={formData} workOrderCode={workOrder?.code || 'OT-XXX'} />
      ).toBlob()

      // Crear link de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `HojaTrabajo-${workOrder?.code || 'OT'}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF: ' + error.message)
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (!open) return null

  // Componente reutilizable para radio buttons Si/No/NoAplica
  const TriStateRadio = ({ section, itemKey, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
          <input
            type="radio"
            name={`${section}-${itemKey}`}
            checked={formData[section]?.[itemKey] === 'si'}
            onChange={() => handleTriStateChange(section, itemKey, 'si')}
          />
          Sí
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
          <input
            type="radio"
            name={`${section}-${itemKey}`}
            checked={formData[section]?.[itemKey] === 'no'}
            onChange={() => handleTriStateChange(section, itemKey, 'no')}
          />
          No
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
          <input
            type="radio"
            name={`${section}-${itemKey}`}
            checked={formData[section]?.[itemKey] === 'noAplica'}
            onChange={() => handleTriStateChange(section, itemKey, 'noAplica')}
          />
          No Aplica
        </label>
      </div>
    </div>
  )

  // Estilos comunes
  const sectionTitleStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    background: 'var(--ok)',
    padding: '8px 12px',
    marginBottom: 16,
    borderRadius: 4
  }

  const subSectionStyle = {
    background: 'rgba(16,185,129,0.05)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 1000, maxHeight: '95vh', overflow: 'auto' }}
      >
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, var(--ok) 0%, #059669 100%)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 50,
              height: 50,
              background: '#fff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--ok)',
              fontSize: 10
            }}>
              SIENERGIA
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>REGISTRO</h2>
              <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: 700 }}>HOJA DE TRABAJO</h3>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#fff' }}>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Código</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>REG-SIE-02</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Revisión: 03</div>
          </div>
          <button
            className="close-btn"
            onClick={onClose}
            style={{ color: '#fff', fontSize: 24 }}
          >
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          {/* SECCIÓN A - INICIO DE SERVICIO */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>SECCIÓN A - Inicio de servicio</h3>

            <div style={subSectionStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="field">
                  <label>Cliente</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    style={{ borderColor: errors.cliente ? 'var(--bad)' : undefined }}
                  />
                  {errors.cliente && <span style={{ color: 'var(--bad)', fontSize: 11 }}>{errors.cliente}</span>}
                </div>
                <div className="field">
                  <label>Contacto en planta</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.referencia}
                    onChange={(e) => handleInputChange('referencia', e.target.value)}
                    placeholder="Nombre de contacto"
                  />
                </div>
                <div className="field">
                  <label>PDV</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.pdv}
                    onChange={(e) => handleInputChange('pdv', e.target.value)}
                    placeholder="Ej: PDV-01"
                  />
                </div>
                <div className="field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fecha_servicio}
                    onChange={(e) => handleInputChange('fecha_servicio', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="field">
                  <label>Responsable del servicio <span style={{ color: 'var(--bad)' }}>*</span></label>
                  <select
                    className="input"
                    value={formData.responsable}
                    onChange={(e) => handleInputChange('responsable', e.target.value)}
                    style={{ borderColor: errors.responsable ? 'var(--bad)' : undefined }}
                  >
                    <option value="">Seleccionar...</option>
                    {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.responsable && <span style={{ color: 'var(--bad)', fontSize: 11 }}>{errors.responsable}</span>}
                </div>
                <div className="field">
                  <label>Destino</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.destino}
                    onChange={(e) => handleInputChange('destino', e.target.value)}
                    placeholder="Ej: Planta San Felipe"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="field">
                  <label>Acompañante I</label>
                  <select
                    className="input"
                    value={formData.acompanante_1}
                    onChange={(e) => handleInputChange('acompanante_1', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Acompañante II</label>
                  <select
                    className="input"
                    value={formData.acompanante_2}
                    onChange={(e) => handleInputChange('acompanante_2', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Área de ejecución del Servicio</label>
                <input
                  type="text"
                  className="input"
                  value={formData.area_ejecucion}
                  onChange={(e) => handleInputChange('area_ejecucion', e.target.value)}
                  placeholder="Ej: Sala de control, Planta de producción..."
                />
              </div>
              <div className="field">
                <label>Equipos intervenidos</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.equipos_intervenidos}
                  onChange={(e) => handleInputChange('equipos_intervenidos', e.target.value)}
                  placeholder="Ej: Transformador T-01, Motor M-02, Panel PLC-03..."
                />
              </div>
            </div>
          </section>

          {/* CHECK LIST - PLANIFICACIÓN DEL SERVICIO */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>CHECK LIST - PLANIFICACIÓN DEL SERVICIO</h3>
            <div style={subSectionStyle}>
              {PLANIFICACION_ITEMS.map((item) => (
                <TriStateRadio key={item.key} section="planificacion" itemKey={item.key} label={item.label} />
              ))}
            </div>
          </section>

          {/* TAREAS REALIZADAS */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>TAREAS REALIZADAS</h3>
            <div style={subSectionStyle}>
              <TaskTable
                tasks={formData.tareas_realizadas}
                onChange={(tasks) => handleInputChange('tareas_realizadas', tasks)}
              />
              {errors.tareas_realizadas && (
                <span style={{ color: 'var(--bad)', fontSize: 12, display: 'block', marginTop: 8 }}>
                  {errors.tareas_realizadas}
                </span>
              )}
            </div>
          </section>

          {/* EPPs */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>EPPs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 16 }}>
              {EPPS_ITEMS.map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={!!formData.epps?.[item.key]}
                    onChange={() => handleCheckboxChange('epps', item.key)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </section>

          {/* OBSERVACIONES */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>Observaciones</h3>
            <div style={subSectionStyle}>
              <textarea
                className="input"
                rows="4"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                placeholder="Si tuviese alguna observación en la ejecución del servicio, descríbala aquí..."
              />
            </div>
          </section>

          {/* 2. RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={sectionTitleStyle}>2. RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD</h3>

            <div style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                Si tuviese alguna observación en la ejecución del servicio, descríbala aquí:
                <br /><br />
                <strong style={{ color: 'var(--ok)' }}>
                  Dejamos constancia de nuestra aceptación del servicio ofrecido ejecutado sin que exista reclamo presente ni futuro al respecto.
                </strong>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Firma Técnico */}
              <div>
                <SignatureCanvasComponent
                  label="Firma del Técnico"
                  value={formData.firma_tecnico}
                  onChange={(value) => handleInputChange('firma_tecnico', value)}
                  required
                />
                {errors.firma_tecnico && (
                  <span style={{ color: 'var(--bad)', fontSize: 11, display: 'block', marginTop: 4 }}>
                    {errors.firma_tecnico}
                  </span>
                )}
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Nombre y Fecha <span style={{ color: 'var(--bad)' }}>*</span></label>
                  <input
                    type="text"
                    className="input"
                    value={formData.nombre_tecnico}
                    onChange={(e) => handleInputChange('nombre_tecnico', e.target.value)}
                    placeholder="Nombre del técnico"
                    style={{ borderColor: errors.nombre_tecnico ? 'var(--bad)' : undefined }}
                  />
                  {errors.nombre_tecnico && (
                    <span style={{ color: 'var(--bad)', fontSize: 11 }}>{errors.nombre_tecnico}</span>
                  )}
                </div>
              </div>

              {/* Firma Cliente */}
              <div>
                <SignatureCanvasComponent
                  label="Firma del Cliente"
                  value={formData.firma_cliente}
                  onChange={(value) => handleInputChange('firma_cliente', value)}
                  required
                />
                {errors.firma_cliente && (
                  <span style={{ color: 'var(--bad)', fontSize: 11, display: 'block', marginTop: 4 }}>
                    {errors.firma_cliente}
                  </span>
                )}
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Nombre y Fecha <span style={{ color: 'var(--bad)' }}>*</span></label>
                  <input
                    type="text"
                    className="input"
                    value={formData.nombre_cliente}
                    onChange={(e) => handleInputChange('nombre_cliente', e.target.value)}
                    placeholder="Nombre del cliente"
                    style={{ borderColor: errors.nombre_cliente ? 'var(--bad)' : undefined }}
                  />
                  {errors.nombre_cliente && (
                    <span style={{ color: 'var(--bad)', fontSize: 11 }}>{errors.nombre_cliente}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 16, maxWidth: 200 }}>
              <label>Fecha de firma</label>
              <input
                type="date"
                className="input"
                value={formData.fecha_firma}
                onChange={(e) => handleInputChange('fecha_firma', e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="modal-footer" style={{
          borderTop: '1px solid var(--line)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            className="btn"
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            style={{
              background: 'rgba(16,185,129,0.1)',
              color: 'var(--ok)',
              border: '1px solid var(--ok)'
            }}
          >
            {generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Hoja de Trabajo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
