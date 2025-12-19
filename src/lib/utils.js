export function hoursBetween(startHHMM, endHHMM){
  // Simple: same-day difference. MVP only.
  if(!startHHMM || !endHHMM) return 0
  const [sh, sm] = startHHMM.split(':').map(Number)
  const [eh, em] = endHHMM.split(':').map(Number)
  const start = sh*60 + sm
  const end = eh*60 + em
  const diff = end - start
  return diff > 0 ? diff/60 : 0
}

export function nowISODate(){
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
