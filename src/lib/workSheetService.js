import { supabase } from './supabase'

/**
 * Crear nueva hoja de trabajo
 * @param {Object} data - Datos de la hoja de trabajo
 * @returns {Promise<Object>} Hoja creada
 */
export async function createWorkSheet(data) {
  const { data: result, error } = await supabase
    .from('work_sheets')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(`Error creating work sheet: ${error.message}`)
  return result
}

/**
 * Actualizar hoja de trabajo existente
 * @param {string} id - ID de la hoja
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Hoja actualizada
 */
export async function updateWorkSheet(id, data) {
  const { data: result, error } = await supabase
    .from('work_sheets')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error updating work sheet: ${error.message}`)
  return result
}

/**
 * Obtener hoja de trabajo por work_order_id
 * @param {string} workOrderId - ID de la orden de trabajo
 * @returns {Promise<Object|null>} Hoja encontrada o null
 */
export async function getWorkSheetByOrderId(workOrderId) {
  const { data, error } = await supabase
    .from('work_sheets')
    .select('*')
    .eq('work_order_id', workOrderId)
    .maybeSingle()

  if (error) throw new Error(`Error fetching work sheet: ${error.message}`)
  return data
}

/**
 * Listar todas las hojas de trabajo (con filtros opcionales)
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de hojas de trabajo
 */
export async function listWorkSheets(filters = {}) {
  let query = supabase
    .from('work_sheets')
    .select('*, work_order:work_orders(code, cliente, estado)')
    .order('created_at', { ascending: false })

  if (filters.workOrderId) {
    query = query.eq('work_order_id', filters.workOrderId)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error listing work sheets: ${error.message}`)
  return data || []
}

/**
 * Eliminar hoja de trabajo
 * @param {string} id - ID de la hoja
 * @returns {Promise<void>}
 */
export async function deleteWorkSheet(id) {
  const { error } = await supabase
    .from('work_sheets')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error deleting work sheet: ${error.message}`)
}

/**
 * Subir PDF a Supabase Storage
 * @param {string} workOrderCode - Código de la OT (ej: OT-001)
 * @param {Blob} pdfBlob - Blob del PDF generado
 * @returns {Promise<string>} URL pública del PDF
 */
export async function uploadWorkSheetPDF(workOrderCode, pdfBlob) {
  const fileName = `work-sheet-${workOrderCode}-${Date.now()}.pdf`

  const { data, error } = await supabase.storage
    .from('work-sheets')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false
    })

  if (error) throw new Error(`Error uploading PDF: ${error.message}`)

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('work-sheets')
    .getPublicUrl(fileName)

  return publicUrl
}

/**
 * Eliminar PDF de Supabase Storage
 * @param {string} pdfUrl - URL del PDF a eliminar
 * @returns {Promise<void>}
 */
export async function deleteWorkSheetPDF(pdfUrl) {
  // Extraer el nombre del archivo de la URL
  const urlParts = pdfUrl.split('/')
  const fileName = urlParts[urlParts.length - 1]

  const { error } = await supabase.storage
    .from('work-sheets')
    .remove([fileName])

  if (error) throw new Error(`Error deleting PDF: ${error.message}`)
}

/**
 * Obtener mapa de work_order_ids que tienen hojas de trabajo
 * @returns {Promise<Object>} Mapa { work_order_id: worksheet_id }
 */
export async function getWorkSheetsMap() {
  const { data, error } = await supabase
    .from('work_sheets')
    .select('id, work_order_id')

  if (error) throw new Error(`Error fetching work sheets map: ${error.message}`)

  const map = {}
  if (data) {
    data.forEach(ws => {
      if (ws.work_order_id) {
        map[ws.work_order_id] = ws.id
      }
    })
  }
  return map
}
