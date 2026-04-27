import { supabase } from './supabase.js'
import { CRITICAL_PERMITS, SAFETY_STATUS, SAFETY_VERIFICATION_STATUS } from '../constants.js'

/**
 * Sube una foto de evidencia a Supabase Storage
 */
export async function uploadSafetyEvidence(workOrderId, itemKey, file) {
  if (!file) return null

  const timestamp = Date.now()
  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `safety/${workOrderId}/${itemKey}_${timestamp}.${ext}`

  const { data, error } = await supabase.storage
    .from('safety-evidence')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(`Error subiendo evidencia: ${error.message}`)

  const { data: urlData } = supabase.storage
    .from('safety-evidence')
    .getPublicUrl(path)

  return urlData?.publicUrl || null
}

/**
 * Crea el objeto inicial de verificación de seguridad para el planificador
 */
export function createPlanificadorRequirements(user, requirements) {
  return {
    user: user || '',
    fecha: new Date().toISOString(),
    riesgosRequeridos: requirements.riesgos || [],
    permisosRequeridos: requirements.permisos || [],
    eppRequeridos: requirements.epps || [],
    equiposRequeridos: requirements.equipos || [],
    sinRiesgosAdicionales: requirements.sinRiesgosAdicionales || false,
    sinRiesgosJustificacion: requirements.sinRiesgosJustificacion || '',
    completed: true
  }
}

/**
 * Crea una confirmación de técnico para un ítem
 */
export function createTecnicoConfirmation(status, justificacion = null, fotoUrl = null) {
  const isCritical = false // Se determina externamente
  return {
    status,
    timestamp: new Date().toISOString(),
    justificacion: status === SAFETY_STATUS.SI ? null : justificacion,
    fotoUrl
  }
}

/**
 * Valida si se puede guardar la hoja de trabajo basado en la verificación de seguridad
 */
export function validateSafetyForSave(safetyVerification) {
  const result = {
    canSave: true,
    blockedReasons: [],
    blockedItems: [],
    requiresSupervisor: false
  }

  if (!safetyVerification) {
    return result // Sin configuración de seguridad, se puede guardar
  }

  const { planificador, tecnico, supervisorApproval } = safetyVerification

  // Si planificador no ha configurado, permitir guardar
  if (!planificador?.completed) {
    return result
  }

  // Verificar que técnico haya confirmado todos los ítems requeridos
  const allRequired = [
    ...(planificador.riesgosRequeridos || []),
    ...(planificador.permisosRequeridos || []),
    ...(planificador.eppRequeridos || []),
    ...(planificador.equiposRequeridos || [])
  ]

  const confirmaciones = tecnico?.confirmaciones || {}

  for (const itemKey of allRequired) {
    const conf = confirmaciones[itemKey]

    // Si no está confirmado
    if (!conf || conf.status === SAFETY_STATUS.PENDIENTE) {
      result.canSave = false
      result.blockedReasons.push(`"${itemKey}" no confirmado`)
      result.blockedItems.push(itemKey)
      continue
    }

    // Si es "No" o "No aplica" sin justificación
    if ((conf.status === SAFETY_STATUS.NO || conf.status === SAFETY_STATUS.NO_APLICA) && !conf.justificacion) {
      result.canSave = false
      result.blockedReasons.push(`"${itemKey}" requiere justificación`)
      result.blockedItems.push(itemKey)
      continue
    }

    // Si es un permiso CRÍTICO marcado como "No"
    if (CRITICAL_PERMITS.includes(itemKey) && conf.status === SAFETY_STATUS.NO) {
      // Verificar si supervisor lo aprobó
      const supervisorApproved = supervisorApproval?.approvedItems?.includes(itemKey)
      if (!supervisorApproved) {
        result.canSave = false
        result.requiresSupervisor = true
        result.blockedReasons.push(`Permiso crítico "${itemKey}" requiere aprobación de supervisor`)
        result.blockedItems.push(itemKey)
      }
    }
  }

  // Verificar que haya al menos 1 riesgo O "sin riesgos adicionales" con justificación
  if (planificador.riesgosRequeridos?.length === 0 && !planificador.sinRiesgosAdicionales) {
    // No hay riesgos configurados, verificar si técnico marcó alguno
    const riesgosConfirmados = Object.entries(confirmaciones)
      .filter(([key, val]) => val.status === SAFETY_STATUS.SI && key.startsWith('riesgo'))

    if (riesgosConfirmados.length === 0 && !planificador.sinRiesgosJustificacion) {
      result.canSave = false
      result.blockedReasons.push('Debe marcar al menos un riesgo o justificar "Sin riesgos adicionales"')
    }
  }

  return result
}

/**
 * Calcula el progreso de verificación por categoría
 */
export function calculateSafetyProgress(safetyVerification) {
  const progress = {
    riesgos: { confirmed: 0, total: 0 },
    permisos: { confirmed: 0, total: 0 },
    epps: { confirmed: 0, total: 0 },
    equipos: { confirmed: 0, total: 0 },
    overall: { confirmed: 0, total: 0 }
  }

  if (!safetyVerification?.planificador?.completed) {
    return progress
  }

  const { planificador, tecnico } = safetyVerification
  const confirmaciones = tecnico?.confirmaciones || {}

  // Contar riesgos
  progress.riesgos.total = planificador.riesgosRequeridos?.length || 0
  progress.riesgos.confirmed = planificador.riesgosRequeridos?.filter(
    key => confirmaciones[key]?.status && confirmaciones[key].status !== SAFETY_STATUS.PENDIENTE
  ).length || 0

  // Contar permisos
  progress.permisos.total = planificador.permisosRequeridos?.length || 0
  progress.permisos.confirmed = planificador.permisosRequeridos?.filter(
    key => confirmaciones[key]?.status && confirmaciones[key].status !== SAFETY_STATUS.PENDIENTE
  ).length || 0

  // Contar EPPs
  progress.epps.total = planificador.eppRequeridos?.length || 0
  progress.epps.confirmed = planificador.eppRequeridos?.filter(
    key => confirmaciones[key]?.status && confirmaciones[key].status !== SAFETY_STATUS.PENDIENTE
  ).length || 0

  // Contar equipos
  progress.equipos.total = planificador.equiposRequeridos?.length || 0
  progress.equipos.confirmed = planificador.equiposRequeridos?.filter(
    key => confirmaciones[key]?.status && confirmaciones[key].status !== SAFETY_STATUS.PENDIENTE
  ).length || 0

  // Total
  progress.overall.total = progress.riesgos.total + progress.permisos.total + progress.epps.total + progress.equipos.total
  progress.overall.confirmed = progress.riesgos.confirmed + progress.permisos.confirmed + progress.epps.confirmed + progress.equipos.confirmed

  return progress
}

/**
 * Determina el estado global de verificación de seguridad
 */
export function getSafetyVerificationStatus(safetyVerification) {
  if (!safetyVerification?.planificador?.completed) {
    return SAFETY_VERIFICATION_STATUS.NOT_CONFIGURED
  }

  const validation = validateSafetyForSave(safetyVerification)

  if (validation.requiresSupervisor) {
    return SAFETY_VERIFICATION_STATUS.BLOCKED
  }

  if (!validation.canSave) {
    const progress = calculateSafetyProgress(safetyVerification)
    if (progress.overall.confirmed === 0) {
      return SAFETY_VERIFICATION_STATUS.PENDING
    }
    return SAFETY_VERIFICATION_STATUS.IN_PROGRESS
  }

  return SAFETY_VERIFICATION_STATUS.COMPLETED
}

/**
 * Agrega una entrada al audit log
 */
export function addAuditLogEntry(safetyVerification, action, user, details = {}) {
  const auditLog = safetyVerification?.auditLog || []

  return [
    ...auditLog,
    {
      action,
      user,
      timestamp: new Date().toISOString(),
      details
    }
  ]
}

/**
 * Obtiene las auto-sugerencias de seguridad basadas en los tipos de servicio
 */
export function getAutoSuggestions(tipoServicios, serviceMapping) {
  const suggestions = {
    riesgos: new Set(),
    permisos: new Set(),
    epps: new Set(),
    equipos: new Set()
  }

  if (!Array.isArray(tipoServicios)) return suggestions

  for (const servicio of tipoServicios) {
    const mapping = serviceMapping[servicio]
    if (mapping) {
      mapping.riesgos?.forEach(r => suggestions.riesgos.add(r))
      mapping.permisos?.forEach(p => suggestions.permisos.add(p))
      mapping.epps?.forEach(e => suggestions.epps.add(e))
      mapping.equipos?.forEach(eq => suggestions.equipos.add(eq))
    }
  }

  return {
    riesgos: Array.from(suggestions.riesgos),
    permisos: Array.from(suggestions.permisos),
    epps: Array.from(suggestions.epps),
    equipos: Array.from(suggestions.equipos)
  }
}

/**
 * Verifica si un ítem es un permiso crítico
 */
export function isCriticalPermit(itemKey) {
  return CRITICAL_PERMITS.includes(itemKey)
}

/**
 * Obtiene los ítems que requieren aprobación de supervisor
 */
export function getItemsRequiringSupervisor(safetyVerification) {
  const items = []

  if (!safetyVerification?.tecnico?.confirmaciones) return items

  const { planificador, tecnico, supervisorApproval } = safetyVerification
  const confirmaciones = tecnico.confirmaciones
  const approvedItems = supervisorApproval?.approvedItems || []

  for (const itemKey of (planificador?.permisosRequeridos || [])) {
    if (CRITICAL_PERMITS.includes(itemKey)) {
      const conf = confirmaciones[itemKey]
      if (conf?.status === SAFETY_STATUS.NO && !approvedItems.includes(itemKey)) {
        items.push({
          key: itemKey,
          justificacion: conf.justificacion,
          fotoUrl: conf.fotoUrl,
          timestamp: conf.timestamp
        })
      }
    }
  }

  return items
}
