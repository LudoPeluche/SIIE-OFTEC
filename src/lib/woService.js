import { supabase } from './supabase.js'

const TABLE = 'work_orders'

// Helper to convert DB snake_case to App camelCase
function toApp(dbRecord) {
  if (!dbRecord) return null
  const checklist = dbRecord.checklist || {}
  return {
    ...dbRecord,
    observacionesCierre: dbRecord.observaciones_cierre ?? dbRecord.observacionesCierre ?? '',
    realFechaInicio: dbRecord.real_fecha_inicio ?? dbRecord.realFechaInicio ?? null,
    realFechaFin: dbRecord.real_fecha_fin ?? dbRecord.realFechaFin ?? null,
    fechaInicio: dbRecord.fecha_inicio,
    fechaFin: dbRecord.fecha_fin,
    fechaInforme: dbRecord.fecha_informe,
    fechaPlan: dbRecord.fecha_plan,
    fechaCompromiso: dbRecord.fecha_compromiso,
    horasPlanta: dbRecord.horas_planta,
    horasGabinete: dbRecord.horas_gabinete,
    horasReales: dbRecord.horas_reales,
    horasExtraReales: dbRecord.horas_extra,
    presupuesto: dbRecord.presupuesto ?? dbRecord.presupuestoPlan ?? '',
    reworkHistory: dbRecord.rework_history || [],
    tipoServicios: dbRecord.tipo_servicios || [],
    tipoServicioOtro: dbRecord.tipo_servicio_otro,
    // Checklist unpacking
    toolReady: checklist.toolReady ?? false,
    toolsComplete: checklist.toolsComplete ?? false,
    toolNote: checklist.toolNote ?? '',
    // Horas por técnico (array de {tech, horas, horasExtra})
    horasPorTecnico: checklist.horasPorTecnico || [],
    // Deuda: OTs legacy que no deben contar en KPIs
    esDeuda: checklist.esDeuda ?? false,
  }
}

// Helper to convert App camelCase to DB snake_case
function toDB(appRecord) {
  const db = { ...appRecord }
  const normalizeDateValue = (value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  // Mapping
  if (db.observacionesCierre !== undefined) db.observaciones_cierre = db.observacionesCierre
  if (db.realFechaInicio !== undefined) db.real_fecha_inicio = db.realFechaInicio
  if (db.realFechaFin !== undefined) db.real_fecha_fin = db.realFechaFin
  if (db.fechaInicio !== undefined) db.fecha_inicio = db.fechaInicio
  if (db.fechaFin !== undefined) db.fecha_fin = db.fechaFin
  if (db.fechaInforme !== undefined) db.fecha_informe = db.fechaInforme
  if (db.fechaPlan !== undefined) db.fecha_plan = db.fechaPlan
  if (db.horasPlanta !== undefined) db.horas_planta = db.horasPlanta
  if (db.horasGabinete !== undefined) db.horas_gabinete = db.horasGabinete
  if (db.tipoServicios !== undefined) db.tipo_servicios = db.tipoServicios
  if (db.tipoServicioOtro !== undefined) db.tipo_servicio_otro = db.tipoServicioOtro

  if (db.fechaCompromiso !== undefined) db.fecha_compromiso = db.fechaCompromiso
  if (db.horasReales !== undefined) db.horas_reales = db.horasReales
  if (db.horasExtraReales !== undefined) db.horas_extra = db.horasExtraReales
  if (db.presupuesto !== undefined) db.presupuesto = db.presupuesto
  if (db.reworkHistory !== undefined) db.rework_history = db.reworkHistory

  const dateFields = [
    'fecha_inicio',
    'fecha_fin',
    'fecha_informe',
    'fecha_plan',
    'fecha_compromiso',
    'real_fecha_inicio',
    'real_fecha_fin',
  ]
  for (const field of dateFields) {
    if (field in db) db[field] = normalizeDateValue(db[field])
  }

  // Pack Checklist (includes horasPorTecnico)
  db.checklist = {
    toolReady: db.toolReady ?? false,
    toolsComplete: db.toolsComplete ?? false,
    toolNote: db.toolNote ?? '',
    horasPorTecnico: db.horasPorTecnico || [],
    esDeuda: db.esDeuda ?? false,
  }

  // Clean up camelCase keys so we don't send garbage to DB
  delete db.fechaInicio
  delete db.fechaFin
  delete db.fechaInforme
  delete db.fechaPlan
  delete db.fechaCompromiso
  delete db.observacionesCierre
  delete db.realFechaInicio
  delete db.realFechaFin
  delete db.horasPlanta
  delete db.horasGabinete
  delete db.horasReales
  delete db.horasExtraReales
  delete db.reworkHistory
  delete db.tipoServicios
  delete db.tipoServicioOtro
  delete db.clienteOtro
  delete db.etapa

  // Clean up flat checklist fields
  delete db.toolReady
  delete db.toolsComplete
  delete db.toolNote
  delete db.horasPorTecnico
  delete db.esDeuda

  // Clean IDs and Codes if they are empty/garbage
  if (!db.id) delete db.id
  if (!db.code) delete db.code

  return db
}

export async function listWorkOrders() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`work_orders list failed: ${error.message}`)
  return (data || []).map(toApp)
}

export async function getWorkOrder(id) {
  if (!id) throw new Error('work_orders get failed: id is required')
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`work_orders get failed: ${error.message}`)
  return toApp(data)
}

export async function upsertWorkOrder(payload) {
  const dbPayload = toDB(payload)
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(dbPayload)
    .select()
    .maybeSingle()
  if (error) throw new Error(`work_orders upsert failed: ${error.message}`)
  return toApp(data)
}

export async function updateWorkOrder(id, patch) {
  if (!id) throw new Error('work_orders update failed: id is required')
  const dbPatch = toDB(patch)
  const { data, error } = await supabase
    .from(TABLE)
    .update(dbPatch)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw new Error(`work_orders update failed: ${error.message}`)
  return toApp(data)
}

export async function deleteWorkOrder(id) {
  if (!id) throw new Error('work_orders delete failed: id is required')
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw new Error(`work_orders delete failed: ${error.message}`)
  return true
}

export async function seedWorkOrders(items = []) {
  if (!Array.isArray(items) || !items.length) return []
  const payload = items.map(toDB)
  const { data, error } = await supabase.from(TABLE).insert(payload).select()
  if (error) throw new Error(`work_orders seed failed: ${error.message}`)
  return (data || []).map(toApp)
}
