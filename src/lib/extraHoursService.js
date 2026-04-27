import { supabase } from './supabase.js'

const TABLE = 'extra_hours'

export async function listExtraHours({ tech, estado } = {}){
  let query = supabase.from(TABLE).select('*').order('fecha', { ascending: false })
  if(tech) query = query.eq('tech', tech)
  if(estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if(error) throw new Error(`extra_hours list failed: ${error.message}`)
  return data || []
}

export async function createExtraHourRequest({ tech, fecha, horas, motivo }){
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      tech,
      fecha,
      horas,
      motivo,
      estado: 'PENDIENTE'
    })
    .select()
    .maybeSingle()
  if(error) throw new Error(`extra_hours create failed: ${error.message}`)
  return data
}

export async function updateExtraHourStatus(id, estado, nota = ''){
  if(!id) throw new Error('extra_hours update failed: id is required')
  const { data, error } = await supabase
    .from(TABLE)
    .update({ estado, nota })
    .eq('id', id)
    .select()
    .maybeSingle()
  if(error) throw new Error(`extra_hours status update failed: ${error.message}`)
  return data
}
