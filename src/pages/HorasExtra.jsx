import { useMemo, useState } from 'react'
import { nowISODate } from '../lib/utils.js'
import Chip from '../components/Chip.jsx'

const TECHS = [
  'LUDWIN CABA',
  'JESSE PORRAS',
  'DIEGO ORTUÑO',
  'BRAYAN IBARRA',
  'JUAN CARLOS SALGUEIRO'
]

// Horas extra acumuladas por técnico (mock). En real: vendrá de cierres de OT.
const EARNED_HOURS = {
  'LUDWIN CABA': 12,
  'JESSE PORRAS': 18,
  'DIEGO ORTUÑO': 10,
  'BRAYAN IBARRA': 8,
  'JUAN CARLOS SALGUEIRO': 6
}

const seedRequests = [
  { id:'HX-001', tech:'JESSE PORRAS', fecha:'2025-12-21', horas:8, motivo:'Día libre por horas extra', estado:'PENDIENTE', nota:'' },
  { id:'HX-002', tech:'JESSE PORRAS', fecha:'2025-12-15', horas:2, motivo:'Trámite personal', estado:'APROBADA', nota:'Ok' },
  { id:'HX-003', tech:'LUDWIN CABA', fecha:'2025-12-10', horas:4, motivo:'Descanso post servicio', estado:'RECHAZADA', nota:'Reprogramar' },
]

const STATUS_LABEL = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada'
}
const STATUS_TONE = {
  PENDIENTE: 'warn',
  APROBADA: 'ok',
  RECHAZADA: 'bad'
}

export default function HorasExtra({ role = 'TECH', tech = '' }){
  const [requests, setRequests] = useState(seedRequests)
  const [fecha, setFecha] = useState(nowISODate())
  const [horas, setHoras] = useState('8')
  const [motivo, setMotivo] = useState('')
  const [notaJefe, setNotaJefe] = useState('')
  const [selectedTech, setSelectedTech] = useState(tech || TECHS[0])
  const [message, setMessage] = useState(null)
  const [toastTimer, setToastTimer] = useState(null)

  const isTech = role === 'TECH'
  const activeTech = isTech ? tech : selectedTech

  const stats = useMemo(() => {
    const earned = EARNED_HOURS[activeTech] || 0
    let approved = 0
    let pending = 0
    requests.forEach(r => {
      if(r.tech !== activeTech) return
      if(r.estado === 'APROBADA') approved += Number(r.horas || 0)
      if(r.estado === 'PENDIENTE') pending += Number(r.horas || 0)
    })
    const available = Math.max(0, earned - approved - pending)
    return { earned, approved, pending, available }
  }, [requests, activeTech])

  const myRequests = useMemo(() => {
    return requests.filter(r => r.tech === activeTech)
  }, [requests, activeTech])

  function resetForm(){
    setFecha(nowISODate())
    setHoras('8')
    setMotivo('')
  }

  function handleSubmit(){
    const hoursNum = Number(horas || 0)
    const motivoClean = motivo.trim()
    if(!fecha){
      setMessage({ tone:'bad', text:'Elige una fecha' })
      return
    }
    if(isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 8){
      setMessage({ tone:'bad', text:'Horas entre 1 y 8' })
      return
    }
    if(hoursNum > stats.available){
      setMessage({ tone:'bad', text:'No tienes horas suficientes' })
      return
    }
    if(!motivoClean){
      setMessage({ tone:'bad', text:'Ingresa el motivo' })
      return
    }
    const nextId = `HX-${String(requests.length + 1).padStart(3,'0')}`
    const newReq = {
      id: nextId,
      tech: activeTech,
      fecha,
      horas: hoursNum,
      motivo: motivoClean,
      estado: 'PENDIENTE',
      nota: ''
    }
    setRequests(prev => [newReq, ...prev])
    setMessage({ tone:'ok', text:'Solicitud enviada al jefe' })
    if(toastTimer) clearTimeout(toastTimer)
    setToastTimer(setTimeout(()=>setMessage(null), 2400))
    resetForm()
  }

  function updateStatus(id, estado){
    setRequests(prev => prev.map(r => r.id === id ? { ...r, estado, nota: notaJefe.trim() } : r))
    setNotaJefe('')
    setMessage({ tone: estado === 'APROBADA' ? 'ok' : 'warn', text: `Solicitud ${estado.toLowerCase()}` })
    if(toastTimer) clearTimeout(toastTimer)
    setToastTimer(setTimeout(()=>setMessage(null), 2400))
  }

  return (
    <div className="grid">
      {message && (
        <div className={`toast ${message.tone || 'blue'}`}>
          {message.text}
        </div>
      )}

      <div className="col-12 card">
        <div className="row" style={{alignItems:'center', flexWrap:'wrap'}}>
          <div>
            <h1 className="h1">Horas Extra</h1>
            <p className="muted" style={{margin:'8px 0 0 0'}}>Solicita o aprueba uso de horas extra (mock).</p>
          </div>
          {!isTech && (
            <div style={{marginLeft:'auto'}}>
              <label style={{fontSize:12}}>Técnico</label>
              <select className="input" value={selectedTech} onChange={(e)=>setSelectedTech(e.target.value)}>
                <option value="ALL">Todos</option>
                {TECHS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="col-12 card">
        <div className="row" style={{alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <h3 style={{margin:0}}>Saldo de {activeTech}</h3>
          <Chip tone="ok">Acumuladas: {stats.earned.toFixed(1)}h</Chip>
          <Chip tone="warn">Pendientes: {stats.pending.toFixed(1)}h</Chip>
          <Chip tone="bad">Gastadas: {stats.approved.toFixed(1)}h</Chip>
          <Chip tone="blue">Disponible: {stats.available.toFixed(1)}h</Chip>
        </div>
      </div>

      {isTech && (
        <div className="col-12 card">
          <h3 style={{margin:'0 0 10px 0'}}>Solicitar horas extra</h3>
          <div className="grid">
            <div className="col-4 field">
              <label>Fecha a tomar</label>
              <input className="input" type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
            </div>
            <div className="col-4 field">
              <label>Horas a usar (1-8)</label>
              <input className="input" type="number" min="1" max="8" step="1" value={horas} onChange={(e)=>setHoras(e.target.value)} />
            </div>
            <div className="col-12 field">
              <label>Motivo</label>
              <textarea className="input" rows="3" value={motivo} onChange={(e)=>setMotivo(e.target.value)} placeholder="¿Por qué tomas tus horas extra?" />
            </div>
          </div>
          <div className="row" style={{marginTop:12}}>
            <button className="btn primary" onClick={handleSubmit}>Enviar solicitud</button>
          </div>
        </div>
      )}

      <div className="col-12 card">
        <div className="row" style={{marginBottom:8}}>
          <h3 style={{margin:0}}>{isTech ? 'Mis solicitudes' : 'Solicitudes del equipo'}</h3>
        </div>
        <div className="table-wrap">
          <table className="desktop-only">
            <thead>
              <tr>
                <th>ID</th>
                {!isTech && <th>Técnico</th>}
                <th>Fecha</th>
                <th>Horas</th>
                <th>Motivo</th>
                <th>Estado</th>
                {!isTech && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {(isTech ? myRequests : requests.filter(r => selectedTech === 'ALL' || r.tech === selectedTech)).map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  {!isTech && <td>{r.tech}</td>}
                  <td>{r.fecha}</td>
                  <td>{r.horas} h</td>
                  <td>{r.motivo}</td>
                  <td><Chip tone={STATUS_TONE[r.estado] || 'blue'}>{STATUS_LABEL[r.estado] || r.estado}</Chip></td>
                  {!isTech && (
                    <td style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                      <input className="input" placeholder="Nota" value={notaJefe} onChange={(e)=>setNotaJefe(e.target.value)} style={{minWidth:120}} />
                      <button className="btn primary" onClick={()=>updateStatus(r.id, 'APROBADA')}>Aprobar</button>
                      <button className="btn danger" onClick={()=>updateStatus(r.id, 'RECHAZADA')}>Rechazar</button>
                    </td>
                  )}
                </tr>
              ))}
              { (isTech ? myRequests.length === 0 : requests.filter(r => selectedTech === 'ALL' || r.tech === selectedTech).length === 0) && (
                <tr><td colSpan={isTech ? 5 : 7} className="muted">Sin solicitudes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
