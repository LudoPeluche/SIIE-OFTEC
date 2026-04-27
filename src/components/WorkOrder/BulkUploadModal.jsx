import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import Modal from '../Modal.jsx'
import { seedWorkOrders } from '../../lib/woService.js'
import { nowISODate } from '../../lib/utils.js'

const TEMPLATE_COLUMNS = [
  'codigo', 'cliente', 'referencia', 'responsable', 'asignados',
  'estado', 'prioridad', 'fechaInicio', 'fechaFin', 'fechaPlan',
  'fechaCompromiso', 'fechaInforme', 'tipoServicios', 'herramientas',
  'horasPlanta', 'horasGabinete', 'presupuesto', 'pdv', 'alcance', 'observaciones'
]

const HEADER_MAP = {
  codigo: 'code', code: 'code', 'código': 'code',
  cliente: 'cliente', client: 'cliente',
  referencia: 'referencia', contacto: 'referencia', reference: 'referencia',
  responsable: 'responsable', responsible: 'responsable',
  asignados: 'asignados', assigned: 'asignados',
  estado: 'estado', status: 'estado',
  prioridad: 'prioridad', priority: 'prioridad',
  fechainicio: 'fechaInicio', fecha_inicio: 'fechaInicio',
  fechafin: 'fechaFin', fecha_fin: 'fechaFin',
  fechaplan: 'fechaPlan', fecha_plan: 'fechaPlan',
  fechacompromiso: 'fechaCompromiso', fecha_compromiso: 'fechaCompromiso',
  fechainforme: 'fechaInforme', fecha_informe: 'fechaInforme',
  tiposervicios: 'tipoServicios', tipo_servicios: 'tipoServicios', servicios: 'tipoServicios',
  herramientas: 'herramientas', tools: 'herramientas',
  horasplanta: 'horasPlanta', horas_planta: 'horasPlanta',
  horasgabinete: 'horasGabinete', horas_gabinete: 'horasGabinete',
  presupuesto: 'presupuesto', budget: 'presupuesto',
  pdv: 'pdv', ubicacion: 'pdv',
  alcance: 'alcance', scope: 'alcance',
  observaciones: 'observaciones', notes: 'observaciones'
}

function splitCSV(val) {
  if (!val) return []
  return String(val).split(',').map(s => s.trim()).filter(Boolean)
}

function normalizeDate(val) {
  if (!val) return ''
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
    const [dd, mm, yyyy] = s.split('/')
    return `${yyyy}-${mm}-${dd}`
  }
  if (/^\d{2}-\d{2}-\d{4}/.test(s)) {
    const [dd, mm, yyyy] = s.split('-')
    return `${yyyy}-${mm}-${dd}`
  }
  return s
}

export default function BulkUploadModal({ open, onClose, existingItems, onSuccess }) {
  const fileRef = useRef(null)
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [fileName, setFileName] = useState('')

  function reset() {
    setRows([])
    setErrors([])
    setResult(null)
    setFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    reset()
    onClose()
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'OTs')
    XLSX.writeFile(wb, 'plantilla_OTs.xlsx')
  }

  function getNextCode(startFrom) {
    const existing = (existingItems || [])
      .map(it => String(it.code || ''))
      .filter(c => c.startsWith('OT-'))
      .map(c => Number(c.slice(3)))
      .filter(n => Number.isFinite(n))
    const max = existing.length ? Math.max(...existing) : 0
    return Math.max(max + 1, (existingItems || []).length + 1, startFrom)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result)
        const wb = XLSX.read(data, { type: 'array', cellDates: false })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (!json.length) {
          setErrors([{ row: 0, msg: 'El archivo está vacío' }])
          setRows([])
          return
        }

        const today = nowISODate()
        let codeCounter = getNextCode(1)
        const parsed = []
        const errs = []

        json.forEach((raw, idx) => {
          const mapped = {}
          Object.entries(raw).forEach(([key, val]) => {
            const norm = String(key).trim().toLowerCase().replace(/\s+/g, '')
            const field = HEADER_MAP[norm]
            if (field) mapped[field] = val
          })

          if (!mapped.cliente || !String(mapped.cliente).trim()) {
            errs.push({ row: idx + 2, msg: 'Falta "cliente"' })
          }
          if (!mapped.referencia || !String(mapped.referencia).trim()) {
            errs.push({ row: idx + 2, msg: 'Falta "referencia"' })
          }
          if (!mapped.responsable || !String(mapped.responsable).trim()) {
            errs.push({ row: idx + 2, msg: 'Falta "responsable"' })
          }

          const code = mapped.code && String(mapped.code).trim()
            ? String(mapped.code).trim().toUpperCase()
            : `OT-${String(codeCounter++).padStart(3, '0')}`

          const asignados = splitCSV(mapped.asignados)
          const responsable = String(mapped.responsable || '').trim()
          if (responsable && !asignados.includes(responsable)) {
            asignados.unshift(responsable)
          }

          parsed.push({
            code,
            cliente: String(mapped.cliente || '').trim().toUpperCase(),
            referencia: String(mapped.referencia || '').trim().toUpperCase(),
            responsable,
            asignados,
            estado: String(mapped.estado || 'OPEN').trim().toUpperCase(),
            prioridad: String(mapped.prioridad || 'MEDIA').trim().toUpperCase(),
            fechaInicio: normalizeDate(mapped.fechaInicio) || today,
            fechaFin: normalizeDate(mapped.fechaFin) || today,
            fechaPlan: normalizeDate(mapped.fechaPlan) || today,
            fechaCompromiso: normalizeDate(mapped.fechaCompromiso) || normalizeDate(mapped.fechaFin) || today,
            fechaInforme: normalizeDate(mapped.fechaInforme) || '',
            tipoServicios: splitCSV(mapped.tipoServicios),
            tipoServicioOtro: '',
            herramientas: splitCSV(mapped.herramientas),
            horasPlanta: String(mapped.horasPlanta || '0'),
            horasGabinete: String(mapped.horasGabinete || '0'),
            presupuesto: String(mapped.presupuesto || ''),
            pdv: String(mapped.pdv || '').trim(),
            alcance: String(mapped.alcance || '').trim(),
            observaciones: String(mapped.observaciones || '').trim(),
            horasReales: '0',
            horasExtraReales: '0',
            gastos: '0',
            observacionesCierre: '',
            reworkHistory: [],
            toolReady: false,
            toolsComplete: false,
            toolNote: ''
          })
        })

        setRows(parsed)
        setErrors(errs)
      } catch (err) {
        setErrors([{ row: 0, msg: `Error al leer archivo: ${err.message}` }])
        setRows([])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleUpload() {
    if (!rows.length || errors.length) return
    setUploading(true)
    try {
      const created = await seedWorkOrders(rows)
      setResult({ ok: true, count: created.length })
      if (onSuccess) onSuccess(created)
    } catch (err) {
      setResult({ ok: false, msg: err.message })
    } finally {
      setUploading(false)
    }
  }

  const previewCols = ['code', 'cliente', 'referencia', 'responsable', 'estado', 'prioridad', 'tipoServicios']

  return (
    <Modal open={open} title="Carga masiva de OTs" onClose={handleClose}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn" onClick={downloadTemplate} type="button">
            Descargar plantilla Excel
          </button>
          <label className="btn primary" style={{ cursor: 'pointer' }}>
            Seleccionar archivo
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
          </label>
          {fileName && <span className="muted" style={{ fontSize: 12 }}>{fileName}</span>}
        </div>

        <div className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
          <strong>Columnas requeridas:</strong> cliente, referencia, responsable<br />
          <strong>Opcionales:</strong> codigo, asignados, estado, prioridad, fechaInicio, fechaFin, fechaPlan, fechaCompromiso, fechaInforme, tipoServicios, herramientas, horasPlanta, horasGabinete, presupuesto, pdv, alcance, observaciones<br />
          <strong>Nota:</strong> Para campos con múltiples valores (asignados, tipoServicios, herramientas) separar con coma.
        </div>

        {errors.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#ef4444', fontSize: 13 }}>Errores de validación ({errors.length})</div>
            {errors.slice(0, 10).map((err, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>
                {err.row > 0 ? `Fila ${err.row}: ` : ''}{err.msg}
              </div>
            ))}
            {errors.length > 10 && <div className="muted" style={{ fontSize: 11 }}>...y {errors.length - 10} más</div>}
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              Vista previa: {rows.length} OTs
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 300 }}>
              <table className="table" style={{ fontSize: 11, minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    {previewCols.map(c => <th key={c}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {previewCols.map(c => (
                        <td key={c}>
                          {Array.isArray(row[c]) ? row[c].join(', ') : String(row[c] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && <div className="muted" style={{ fontSize: 11 }}>Mostrando 50 de {rows.length} filas</div>}
          </>
        )}

        {result && (
          <div style={{
            background: result.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontWeight: 700,
            fontSize: 13,
            color: result.ok ? '#10b981' : '#ef4444'
          }}>
            {result.ok
              ? `Se crearon ${result.count} OTs exitosamente`
              : `Error: ${result.msg}`}
          </div>
        )}

        <div className="modal-actions">
          {rows.length > 0 && !result?.ok && (
            <button
              className="btn primary"
              onClick={handleUpload}
              disabled={uploading || errors.length > 0}
              type="button"
            >
              {uploading ? 'Subiendo...' : `Subir ${rows.length} OTs`}
            </button>
          )}
          {result?.ok && (
            <button className="btn" onClick={handleClose} type="button">Listo</button>
          )}
        </div>
      </div>
    </Modal>
  )
}
