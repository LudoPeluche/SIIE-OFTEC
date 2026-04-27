import { supabase } from './supabase.js'

const TABLE = 'weekly_plan'

function cleanPayload(payload = {}){
  const clean = { ...payload }
  if(!clean.id) delete clean.id
  return clean
}

export async function listWeeklyPlan(){
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: true })
  if(error) throw new Error(`weekly_plan list failed: ${error.message}`)
  return data || []
}

export async function upsertWeeklyRow(row){
  const payload = cleanPayload(row)
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload)
    .select()
    .maybeSingle()
  if(!error) return data

  // Supabase/PostgREST puede devolver distintos mensajes cuando una columna no existe
  // (PGRST204 "not present in the schema cache", 42703 "does not exist", etc.)
  // Si el error menciona alguna columna opcional o es un 400 genérico de columna,
  // reintentamos sin las columnas opcionales.
  const isOptionalColError =
    /\bnota\b|\btipo\b/i.test(error.message || '') ||
    error.code === 'PGRST204' ||
    /schema.cache|not present|does not exist/i.test(error.message || '')

  if(isOptionalColError){
    const { nota, tipo, ...fallback } = payload
    const retry = await supabase
      .from(TABLE)
      .upsert(fallback)
      .select()
      .maybeSingle()
    if(retry.error) throw new Error(`weekly_plan upsert failed: ${retry.error.message}`)
    return retry.data
  }

  throw new Error(`weekly_plan upsert failed: ${error.message}`)
}

export async function deleteWeeklyRow(id){
  if(!id) throw new Error('weekly_plan delete failed: id is required')
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if(error) throw new Error(`weekly_plan delete failed: ${error.message}`)
  return true
}

export async function seedWeeklyPlan(rows = []){
  if(!Array.isArray(rows) || !rows.length) return []
  const payload = rows.map(cleanPayload)
  const { data, error } = await supabase.from(TABLE).insert(payload).select()
  if(error) throw new Error(`weekly_plan seed failed: ${error.message}`)
  return data || []
}
