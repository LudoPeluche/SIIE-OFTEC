import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import Chip from '../components/Chip.jsx'
import { nowISODate } from '../lib/utils.js'

const STATUS = ['OPEN','IN_PROGRESS','CLOSED','CANCELED']
const toneByStatus = {
  OPEN: 'warn',
  IN_PROGRESS: 'warn',
  CLOSED: 'ok',
  CANCELED: 'bad'
}
const labelByStatus = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En proceso',
  CLOSED: 'Cerrada',
  CANCELED: 'Cancelada'
}

const PRIORITIES = ['ALTA','MEDIA','BAJA']
const priorityTone = {
  ALTA: 'bad',
  MEDIA: 'warn',
  BAJA: 'blue'
}
const priorityLabel = {
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja'
}

const SERVICE_OPTIONS = [
  'MONITOREO DE VIBRACIONES',
  'TERMOGRAFIA',
  'ALINEACION LASER DE EJES',
  'ALINEACION LASER DE POLEAS Y TENSADO DE CORREAS',
  'ALINEACION CON RELOJ COMPARADOR',
  'BALANCEO DINAMICO',
  'MONTAJE DE RODAMIENTOS',
  'ANALISIS DE ACEITE',
  'ULTRASONIDO',
  'FLUSHING DE ACEITE',
  'OTRO'
]

const CLIENTS = [
  'ACERICO','ALBINA GROUP','AREQUIPA','BIODIESEL','CADMA','CBN','CHURATA','CONFIFETROL','COPELME',
  'ELECTRICIDAD BALCAZAR','ELECTROSERVICE','EMBOL','EMPACAR','ENDE TRANSMISION','EPSA','FABOCE',
  'FRIGOR','GERONA','GEUMEC','GLADYMAR','GRUPO VENADO','GUABIRA','HOSPITAL MESSUTI','IMPASTAS',
  'INOLSA','INSERCOM','IPDN','ITACAMBA','ITALSA','JACIF','KUPPEL','LA SUPREMA','LAND SILVER',
  'LEVCORP','LURI','MARRIOT','NUTRIOIL','PABLO GARNICA','PIL','POPLAR','READYMIX','RODASUR',
  'MINERA SAN CRISTOBAL','SCANBIOTEK','SCHWARTZ VRENA','SIEMENS','SINOPEC','TECNOPOR','TENSOLINE','TEXPRO'
]

const PEOPLE = [
  'LUDWIN CABA',
  'JESSE PORRAS',
  'DIEGO ORTUÑO',
  'BRAYAN IBARRA',
  'JUAN CARLOS SALGUEIRO'
]

const TOOL_OPTIONS = [
  'VA3',
  'ALINEADOR LASER DE EJES',
  'ALINEADOR LASER DE POLEAS',
  'CAMARA TERMOGRAFICA',
  'DRAGON VISION',
  'LUBRI',
  'PISTOLA DE LUBRICACION',
  'CALENTADOR DE INDUCCION',
  'BOMBA DE ACEITE'
]

const seed = [
  {
    id:'WO-001',
    cliente:'EMPACAR',
    referencia:'MONTAR 2DO REDUCTOR',
    fechaPlan: nowISODate(),
    responsable:'JESSE PORRAS',
    asignados:['JESSE PORRAS'],
    prioridad:'ALTA',
    fechaCompromiso: nowISODate(),
    estado:'OPEN',
    pdv:'',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa:'PLANIFICACION',
    presupuesto:'',
    fechaInforme: nowISODate(),
    tipoServicios:['MONITOREO DE VIBRACIONES'],
    tipoServicioOtro:'',
    herramientas:'',
    horasPlanta:'4',
    horasGabinete:'2',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales:'0',
    horasExtraReales:'0',
    gastos:'0',
    observacionesCierre:'',
    alcance:'',
    observaciones:''
  },
  {
    id:'WO-002',
    cliente:'SOFIA',
    referencia:'CAMBIO DE CILINDRO',
    fechaPlan: nowISODate(),
    responsable:'BRAYAN IBARRA',
    asignados:['BRAYAN IBARRA'],
    prioridad:'MEDIA',
    fechaCompromiso: nowISODate(),
    estado:'IN_PROGRESS',
    pdv:'',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa:'EJECUCION',
    presupuesto:'',
    fechaInforme: nowISODate(),
    tipoServicios:['ALINEACION LASER DE EJES'],
    tipoServicioOtro:'',
    herramientas:'',
    horasPlanta:'6',
    horasGabinete:'1',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales:'0',
    horasExtraReales:'0',
    gastos:'0',
    observacionesCierre:'',
    alcance:'',
    observaciones:''
  },
  {
    id:'WO-003',
    cliente:'TECNOPOR',
    referencia:'PLAN DE MANTENIMIENTO',
    fechaPlan: nowISODate(),
    responsable:'DIEGO ORTUÑO',
    asignados:['DIEGO ORTUÑO'],
    prioridad:'MEDIA',
    fechaCompromiso: nowISODate(),
    estado:'OPEN',
    pdv:'',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa:'PLANIFICACION',
    presupuesto:'',
    fechaInforme: nowISODate(),
    tipoServicios:['ANALISIS DE ACEITE'],
    tipoServicioOtro:'',
    herramientas:'',
    horasPlanta:'3',
    horasGabinete:'2',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales:'0',
    horasExtraReales:'0',
    gastos:'0',
    observacionesCierre:'',
    alcance:'',
    observaciones:''
  },
]

export default function WorkOrders({ role = 'ADMIN', tech = '' }){
  const [items, setItems] = useState(seed)
  const [open, setOpen] = useState(false)
  const [assigning, setAssigning] = useState(null)
  const [assignDraft, setAssignDraft] = useState({ asignados:[], prioridad:'MEDIA', fechaFin: nowISODate(), notify:true })
  const [viewing, setViewing] = useState(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [detailDraft, setDetailDraft] = useState({
    estado:'',
    prioridad:'MEDIA',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    fechaInforme: nowISODate()
  })
  const [toast, setToast] = useState(null)
  const [booting, setBooting] = useState(true)
  const [closing, setClosing] = useState(null)
  const [closeDraft, setCloseDraft] = useState({
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales:'0',
    horasExtraReales:'0',
    gastos:'0',
    observacionesCierre:''
  })
  const [draft, setDraft] = useState({
    cliente:'',
    clienteOtro:'',
    referencia:'',
    fechaPlan: nowISODate(),
    responsable:'',
    asignados:[],
    prioridad:'MEDIA',
    fechaCompromiso: nowISODate(),
    estado:'OPEN',
    pdv:'',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa:'PLANIFICACION',
    presupuesto:'',
    fechaInforme: nowISODate(),
    tipoServicios:[],
    tipoServicioOtro:'',
    herramientas:[],
    horasPlanta:'0',
    horasGabinete:'0',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales:'0',
    horasExtraReales:'0',
    gastos:'0',
    observacionesCierre:'',
    alcance:'',
    observaciones:''
  })
  const [techFilters, setTechFilters] = useState({ cliente:'ALL', servicio:'ALL' })

  const clientInput = draft.cliente || draft.clienteOtro
  const clientSuggestions = CLIENTS.filter(c => clientInput ? c.toLowerCase().includes(clientInput.toLowerCase()) : true).slice(0, 8)

  const isTech = role === 'TECH'
  const parseDate = (value) => {
    if(!value) return null
    const [y,m,d] = String(value).split('-').map(Number)
    if(!y || !m || !d) return null
    return new Date(y, m-1, d)
  }
  const baseItems = useMemo(() => {
    if(isTech && tech){
      return items.filter(it => (it.asignados || []).includes(tech))
    }
    return items
  }, [items, isTech, tech])

  const counts = useMemo(() => {
    const statuses = isTech ? ['OPEN','IN_PROGRESS'] : STATUS
    const c = Object.fromEntries(statuses.map(s => [s, 0]))
    for(const it of baseItems) c[it.estado] = (c[it.estado] ?? 0) + 1
    return c
  }, [baseItems, isTech])

  const myPendings = useMemo(() => {
    if(!tech) return []
    return items.filter(it => (it.asignados || []).includes(tech) && it.estado !== 'CLOSED')
  }, [items, tech])
  const techDashboard = useMemo(() => {
    if(!isTech) return { totalHours: 0, totalExtra: 0, topClients: [], topServices: [], serviceStats: [] }
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const soon = new Date(todayNoTime)
    soon.setDate(soon.getDate() + 3)
    const filterByCliente = techFilters.cliente !== 'ALL'
    const filterByServicio = techFilters.servicio !== 'ALL'
    const monthKey = (dateStr) => {
      const base = dateStr || ''
      const [y,m] = base.split('-')
      return y && m ? `${y}-${m}` : 'N/D'
    }
    const labelMonth = (key) => {
      if(!key || key === 'N/D') return 'N/D'
      const [y,m] = key.split('-')
      const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      const idx = Number(m) - 1
      const monthName = names[idx] || m
      return `${monthName} ${y}`
    }
    const filtered = baseItems.filter(it => {
      if(filterByCliente && it.cliente !== techFilters.cliente) return false
      if(filterByServicio && !(it.tipoServicios || []).includes(techFilters.servicio)) return false
      return true
    })
    const countsMap = new Map()
    const hoursMap = new Map()
    const clientAgg = new Map()
    const serviceAgg = new Map()
    let totalHours = 0
    let totalExtra = 0
    for(const it of filtered){
      const key = monthKey(it.fechaFin || it.fechaInicio || nowISODate())
      const prevCounts = countsMap.get(key) || { OPEN:0, IN_PROGRESS:0, CLOSED:0, CANCELED:0 }
      prevCounts[it.estado] = (prevCounts[it.estado] ?? 0) + 1
      countsMap.set(key, prevCounts)
      const hrs = Number(it.horasReales || 0)
      const extra = Number(it.horasExtraReales || 0)
      const hrsValid = (isNaN(hrs) ? 0 : hrs) + (isNaN(extra) ? 0 : extra)
      totalHours += hrsValid
      totalExtra += isNaN(extra) ? 0 : extra
      const prevHrs = hoursMap.get(key) || 0
      hoursMap.set(key, prevHrs + hrsValid)
      if(it.cliente){
        const prev = clientAgg.get(it.cliente) || { hours:0, ots:0 }
        clientAgg.set(it.cliente, { hours: prev.hours + hrsValid, ots: prev.ots + 1 })
      }
      for(const svc of it.tipoServicios || []){
        const prev = serviceAgg.get(svc) || { hours:0, ots:0 }
        serviceAgg.set(svc, { hours: prev.hours + hrsValid, ots: prev.ots + 1 })
      }
    }
    const topClients = Array.from(clientAgg.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a,b) => b.hours - a.hours || b.ots - a.ots)
      .slice(0, 3)
    const topServices = Array.from(serviceAgg.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a,b) => b.hours - a.hours || b.ots - a.ots)
      .slice(0, 3)
    const serviceStats = Array.from(serviceAgg.entries())
      .map(([name, data]) => ({ name, count: data.ots }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 6)
    return {
      totalHours,
      totalExtra,
      topClients,
      topServices,
      serviceStats
    }
  }, [baseItems, isTech, techFilters])
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('ALL')
  const [prioridadFilter, setPrioridadFilter] = useState('ALL')
  const [asignadoFilter, setAsignadoFilter] = useState('ALL')

  const filteredItems = useMemo(() => {
    return baseItems.filter(it => {
      if(estadoFilter !== 'ALL' && it.estado !== estadoFilter) return false
      if(prioridadFilter !== 'ALL' && (it.prioridad || 'MEDIA') !== prioridadFilter) return false
      if(asignadoFilter !== 'ALL' && !(it.asignados || []).includes(asignadoFilter)) return false
      if(search.trim()){
        const q = search.trim().toLowerCase()
        const target = `${it.cliente} ${it.referencia}`.toLowerCase()
        if(!target.includes(q)) return false
      }
      return true
    })
  }, [baseItems, estadoFilter, prioridadFilter, asignadoFilter, search])

  useEffect(() => {
    if(!toast) return
    const id = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const saved = localStorage.getItem('prefillOT')
    if(saved){
      try{
        const data = JSON.parse(saved)
        setDraft(prev => ({
          ...prev,
          cliente: (data.cliente || '').toUpperCase(),
          clienteOtro:'',
          referencia: (data.referencia || '').toUpperCase(),
          asignados: data.asignados || [],
          responsable: data.responsable || '',
          fechaPlan: data.fechaPlan || nowISODate(),
          fechaCompromiso: data.fechaCompromiso || data.fechaPlan || nowISODate(),
          prioridad: data.prioridad || 'MEDIA',
          estado:'OPEN'
        }))
        setOpen(true)
        setToast({ tone:'ok', msg:'OT precargada desde Plan Semanal' })
      }catch(_){}
      localStorage.removeItem('prefillOT')
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(()=>setBooting(false), 200)
    return () => clearTimeout(id)
  }, [])

  const horasTotales = (data) => {
    const base = Number(data.horasPlanta || 0) + Number(data.horasGabinete || 0)
    return Math.max(0, base)
  }

  function add(){
    if(!clientInput.trim()){
      setToast({ tone:'bad', msg:'Ingresa un cliente' })
      return
    }
    if(!draft.referencia.trim()){
      setToast({ tone:'bad', msg:'Ingresa el contacto en planta' })
      return
    }
    const nextId = `WO-${String(items.length+1).padStart(3,'0')}`
    const clienteFinal = draft.cliente || draft.clienteOtro || ''
    const clean = {
      ...draft,
      cliente: clienteFinal.trim().toUpperCase(),
      referencia: draft.referencia.trim().toUpperCase(),
      responsable: draft.responsable.trim(),
      estado: draft.estado || 'OPEN',
      asignados: Array.from(new Set(draft.asignados)),
      prioridad: draft.prioridad || 'MEDIA',
      fechaCompromiso: draft.fechaFin || draft.fechaCompromiso || draft.fechaPlan,
      pdv: draft.pdv.trim(),
      herramientas: draft.herramientas,
      alcance: draft.alcance.trim(),
      observaciones: draft.observaciones.trim(),
      horasPlanta: draft.horasPlanta || '0',
      horasGabinete: draft.horasGabinete || '0',
      realFechaInicio: draft.realFechaInicio || draft.fechaInicio,
      realFechaFin: draft.realFechaFin || draft.fechaFin,
      horasReales: draft.horasReales || '0',
      horasExtraReales: draft.horasExtraReales || '0',
      gastos: draft.gastos || '0',
      observacionesCierre: draft.observacionesCierre || '',
      tipoServicios: draft.tipoServicios,
      tipoServicioOtro: draft.tipoServicioOtro.trim().toUpperCase()
    }
    setItems(prev => [{ id: nextId, ...clean }, ...prev])
    setDraft({
      cliente:'',
      clienteOtro:'',
      referencia:'',
      fechaPlan: nowISODate(),
      responsable:'',
      asignados:[],
      prioridad:'MEDIA',
      fechaCompromiso: nowISODate(),
      estado:'OPEN',
      pdv:'',
      fechaInicio: nowISODate(),
      fechaFin: nowISODate(),
      realFechaInicio: nowISODate(),
      realFechaFin: nowISODate(),
      horasReales:'0',
      horasExtraReales:'0',
      gastos:'0',
      observacionesCierre:'',
      etapa:'PLANIFICACION',
      presupuesto:'',
      fechaInforme: nowISODate(),
      tipoServicios:[],
      tipoServicioOtro:'',
      herramientas:[],
      horasPlanta:'0',
      horasGabinete:'0',
      alcance:'',
      observaciones:''
    })
    setOpen(false)
    setToast({ tone:'ok', msg:'OT creada' })
  }

  function setStatus(id, estado){
    setItems(prev => prev.map(it => it.id === id ? { ...it, estado } : it))
  }

  function remove(id){
    const it = items.find(x => x.id === id)
    const confirmMsg = it ? `¿Borrar la OT ${it.id} (${it.referencia})?` : '¿Borrar OT?'
    if(typeof window !== 'undefined'){
      const ok = window.confirm(confirmMsg)
      if(!ok) return
    }
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function toggleService(key){
    setDraft(prev => {
      const exists = prev.tipoServicios.includes(key)
      const next = exists ? prev.tipoServicios.filter(k => k !== key) : [...prev.tipoServicios, key]
      return { ...prev, tipoServicios: next }
    })
  }

  function toggleTool(key){
    setDraft(prev => {
      const exists = prev.herramientas.includes(key)
      const next = exists ? prev.herramientas.filter(k => k !== key) : [...prev.herramientas, key]
      return { ...prev, herramientas: next }
    })
  }

  function toggleAssignedDraft(person){
    setDraft(prev => {
      const exists = prev.asignados.includes(person)
      const next = exists ? prev.asignados.filter(p => p !== person) : [...prev.asignados, person]
      return { ...prev, asignados: next }
    })
  }

  function toggleAssignedModal(person){
    setAssignDraft(prev => {
      const exists = prev.asignados.includes(person)
      const next = exists ? prev.asignados.filter(p => p !== person) : [...prev.asignados, person]
      return { ...prev, asignados: next }
    })
  }

  function openAssign(item){
    setAssigning(item)
    setAssignDraft({
      asignados: item.asignados || [],
      prioridad: item.prioridad || 'MEDIA',
      fechaFin: item.fechaFin || item.fechaInicio || nowISODate(),
      notify: true
    })
  }

  function openDetail(item){
    setViewing(item)
    setDetailDraft({
      estado: item.estado,
      prioridad: item.prioridad || 'MEDIA',
      fechaInicio: item.fechaInicio || nowISODate(),
      fechaFin: item.fechaFin || nowISODate(),
      fechaInforme: item.fechaInforme || nowISODate()
    })
  }

  function saveDetail(){
    if(!viewing) return
    setItems(prev => prev.map(it => {
      if(it.id !== viewing.id) return it
      return {
        ...it,
        estado: detailDraft.estado || it.estado,
        prioridad: detailDraft.prioridad || it.prioridad || 'MEDIA',
        fechaInicio: detailDraft.fechaInicio || it.fechaInicio,
        fechaFin: detailDraft.fechaFin || it.fechaFin,
        fechaInforme: detailDraft.fechaInforme || it.fechaInforme
      }
    }))
    setViewing(null)
    setToast({ tone:'ok', msg:'Cambios guardados' })
  }

  function openCloseModal(item){
    setClosing(item)
    setCloseDraft({
      realFechaInicio: item.realFechaInicio || item.fechaInicio || nowISODate(),
      realFechaFin: item.realFechaFin || item.fechaFin || nowISODate(),
      horasReales: item.horasReales || '0',
      horasExtraReales: item.horasExtraReales || '0',
      gastos: item.gastos || '0',
      observacionesCierre: item.observacionesCierre || ''
    })
  }

  function saveClose(){
    if(!closing) return
    if(!closeDraft.realFechaInicio || !closeDraft.realFechaFin){
      setToast({ tone:'bad', msg:'Completa fechas reales' })
      return
    }
    setItems(prev => prev.map(it => {
      if(it.id !== closing.id) return it
      return {
        ...it,
        estado:'CLOSED',
        realFechaInicio: closeDraft.realFechaInicio,
        realFechaFin: closeDraft.realFechaFin,
        horasReales: closeDraft.horasReales || '0',
        horasExtraReales: closeDraft.horasExtraReales || '0',
        gastos: closeDraft.gastos || '0',
        observacionesCierre: closeDraft.observacionesCierre || ''
      }
    }))
    setClosing(null)
    setToast({ tone:'ok', msg:'OT cerrada con datos reales' })
  }

  function saveAssign(){
    if(!assigning) return
    if(!assignDraft.asignados.length){
      setToast({ tone:'bad', msg:'Selecciona al menos un acompañante' })
      return
    }
    setItems(prev => prev.map(it => {
      if(it.id !== assigning.id) return it
      return {
        ...it,
        asignados: assignDraft.asignados,
        prioridad: assignDraft.prioridad || 'MEDIA',
        fechaFin: assignDraft.fechaFin || it.fechaFin,
        estado: it.estado || 'OPEN'
      }
    }))
    setAssigning(null)
    setToast({ tone:'ok', msg:'Asignación guardada' })
  }

  return (
    <div className="grid">
      {toast && (
        <div className={`toast ${toast.tone || 'blue'}`}>
          {toast.msg}
        </div>
      )}
      <div className="col-12 card">
        <div className="row" style={{alignItems:'center', flexWrap:'wrap'}}>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <h1 className="h1">Órdenes de Trabajo (OT)</h1>
            <p className="muted" style={{margin:0}}>
              Flujo formal: planificar → asignar → ejecutar → cerrar. (MVP con datos mock)
            </p>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {isTech && <span className="chip ok">Abiertas: <b style={{color:'#fff'}}>{baseItems.filter(i=>i.estado!=='CLOSED' && i.estado!=='CANCELED').length}</b></span>}
              {isTech && <span className="chip warn">Mis pendientes: <b style={{color:'#fff'}}>{myPendings.length}</b></span>}
              {!isTech && STATUS.map(s => (
                <span className="chip" key={s}>
                  {labelByStatus[s]}: <b style={{color:'#fff'}}>{counts[s] ?? 0}</b>
                </span>
              ))}
            </div>
          </div>
          <div style={{marginLeft:'auto', display:'flex', gap:8}}>
            {isTech && <button className="btn" onClick={()=>setShowDashboard(true)}>Ver dashboard</button>}
            {!isTech && <button className="btn primary" onClick={()=>setOpen(true)}>+ Nueva OT</button>}
          </div>
        </div>
      </div>

      {isTech && (
        <div className="col-12 card">
          <div className="row" style={{marginBottom:10}}>
            <h2 style={{margin:0}}>Mis pendientes</h2>
            <span className="muted">{tech || 'Técnico'}</span>
          </div>
          {!myPendings.length && (
            <div className="muted">Sin pendientes asignados.</div>
          )}
          {myPendings.length > 0 && (
            <div className="grid">
              {myPendings.map(it => (
                <div key={it.id} className="col-12 card" style={{background:'rgba(255,255,255,0.02)'}}>
                  <div className="row" style={{alignItems:'flex-start', gap:10}}>
                    <div>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                        <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>{priorityLabel[it.prioridad] ?? 'Media'}</Chip>
                        <Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip>
                      </div>
                      <h3 style={{margin:'8px 0 4px 0'}}>{it.referencia}</h3>
                      <div className="muted">{it.cliente}</div>
                      <div style={{marginTop:6, fontSize:13}}>
                        Fin: <b>{it.fechaFin || '-'}</b> · Responsable: {it.responsable || 'N/D'}
                      </div>
                    </div>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button className="btn" onClick={()=>setStatus(it.id, 'IN_PROGRESS')}>En proceso</button>
                      <button className="btn primary" onClick={()=>openCloseModal(it)}>Marcar completada</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="col-12 card">
        <div className="row" style={{marginBottom:10, alignItems:'center', flexWrap:'wrap', gap:10}}>
          <h2 style={{margin:0}}>Listado</h2>
          <span className="muted">{filteredItems.length} / {items.length} OTs</span>
        </div>

        <div className="grid" style={{marginBottom:12}}>
          <div className="col-6 field">
            <label>Buscar (cliente o contacto)</label>
            <input className="input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Ej: EMPACAR, NOMBRE DE CONTACTO..." />
          </div>
          <div className="col-6 field" style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <div style={{minWidth:140}}>
              <label>Estado</label>
              {isTech ? (
                <select className="input" value={estadoFilter} onChange={(e)=>setEstadoFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="OPEN">Abierta</option>
                  <option value="IN_PROGRESS">En proceso</option>
                  <option value="CLOSED">Cerrada</option>
                </select>
              ) : (
                <select className="input" value={estadoFilter} onChange={(e)=>setEstadoFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
                </select>
              )}
            </div>
            {!isTech && (
              <div style={{minWidth:160}}>
                <label>Asignado</label>
                <select className="input" value={asignadoFilter} onChange={(e)=>setAsignadoFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="desktop-only">
            <thead>
              <tr>
                <th style={{width:90}}>ID</th>
                <th style={{width:160}}>Cliente</th>
                <th>Contacto en planta</th>
                <th style={{width:130}}>Fecha inicio</th>
                <th style={{width:130}}>Fecha fin</th>
                <th style={{width:140}}>Entrega informe</th>
                <th style={{width:130}}>Responsable</th>
                <th style={{width:140}}>Acompañantes</th>
                <th style={{width:120}}>Prioridad</th>
                <th style={{width:140}}>Estado</th>
                <th style={{width:190}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {booting && (
                <>
                  {[1,2,3].map(k => (
                    <tr key={`sk-wo-${k}`} className="skeleton-row">
                      <td colSpan={11} style={{padding:0}}>
                        <div className="skeleton-line"></div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!booting && filteredItems.map(it => (
                <tr key={it.id}>
                  <td>{it.id}</td>
                  <td>{it.cliente}</td>
                  <td>{it.referencia}</td>
                  <td>{it.fechaInicio}</td>
                  <td>{it.fechaFin || '-'}</td>
                  <td>{it.fechaInforme || '-'}</td>
                  <td>{it.responsable || '-'}</td>
                  <td>
                    {it.asignados?.length ? (
                      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        {it.asignados.map(p => (
                          <span key={p} className="chip">{p}</span>
                        ))}
                      </div>
                    ) : <span className="muted">Sin asignar</span>}
                  </td>
                  <td>
                    <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>
                      {priorityLabel[it.prioridad] ?? 'Media'}
                    </Chip>
                  </td>
                  <td><Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip></td>
                  <td style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                    <button className="btn" onClick={()=>openDetail(it)}>Ver</button>
                    {!isTech && <button className="btn" onClick={()=>openAssign(it)}>Asignar</button>}
                    {!isTech && (
                      <select className="input" value={it.estado} onChange={(e)=>setStatus(it.id, e.target.value)}>
                        {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
                      </select>
                    )}
                    {isTech && (
                      <>
                        <button className="btn" onClick={()=>setStatus(it.id, 'IN_PROGRESS')}>En proceso</button>
                        <button className="btn primary" onClick={()=>openCloseModal(it)}>Completar</button>
                      </>
                    )}
                    {!isTech && <button className="btn danger" onClick={()=>remove(it.id)}>Borrar</button>}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={11} className="muted">Sin OTs</td></tr>
              )}
              {items.length > 0 && !filteredItems.length && (
                <tr><td colSpan={11} className="muted">No hay coincidencias con los filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-only">
          {booting && <div className="skeleton-line" style={{marginTop:8}}></div>}
          {!booting && filteredItems.map(it => (
            <div key={`card-${it.id}`} className="card" style={{marginBottom:10, background:'rgba(255,255,255,0.02)'}}>
              <div style={{display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap'}}>
                <div>
                  <div className="muted">{it.id} · {it.cliente}</div>
                  <div style={{fontWeight:700, marginTop:4}}>{it.referencia}</div>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
                    <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>{priorityLabel[it.prioridad] ?? 'Media'}</Chip>
                    <Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip>
                  </div>
                </div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  <button className="btn" onClick={()=>openDetail(it)}>Ver</button>
                  {!isTech && <button className="btn" onClick={()=>openAssign(it)}>Asignar</button>}
                </div>
              </div>
              <div className="muted" style={{marginTop:6}}>Fin: {it.fechaFin || '-'}</div>
              <div className="muted" style={{marginTop:2}}>Entrega informe: {it.fechaInforme || '-'}</div>
              <div style={{marginTop:6}}>
                Acompañantes:
                <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:4}}>
                  {it.asignados?.length ? it.asignados.map(a => <span key={a} className="chip">{a}</span>) : <span className="muted">Sin asignar</span>}
                </div>
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
                <button className="btn" onClick={()=>setStatus(it.id, 'IN_PROGRESS')}>En proceso</button>
                <button className="btn primary" onClick={()=>openCloseModal(it)}>Completar</button>
                {!isTech && <button className="btn danger" onClick={()=>remove(it.id)}>Borrar</button>}
              </div>
            </div>
          ))}
          {!booting && !filteredItems.length && <div className="muted">No hay coincidencias con los filtros.</div>}
        </div>

        <p className="muted" style={{marginTop:10}}>
          Próximo: detalle OT + cierre con horas/gastos/fotos + bitácora.
        </p>
    </div>

      <Modal open={!!assigning} title={`Asignar OT ${assigning?.id || ''}`} onClose={()=>setAssigning(null)}>
        <div className="grid">
          <div className="col-12 field">
            <label>Acompañantes</label>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {PEOPLE.map(p => {
                const active = assignDraft.asignados.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    className="btn"
                    style={{
                      borderColor: active ? 'rgba(110,231,183,.5)' : undefined,
                      background: active ? 'rgba(110,231,183,.12)' : undefined
                    }}
                    onClick={()=>toggleAssignedModal(p)}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="col-6 field">
            <label>Prioridad</label>
            <select className="input" value={assignDraft.prioridad} onChange={(e)=>setAssignDraft(d=>({...d,prioridad:e.target.value}))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
            </select>
          </div>
          <div className="col-6 field">
            <label>Fecha fin</label>
            <input className="input" type="date" value={assignDraft.fechaFin} onChange={(e)=>setAssignDraft(d=>({...d,fechaFin:e.target.value}))} />
          </div>
          <div className="col-12 field" style={{flexDirection:'row', alignItems:'center', gap:10}}>
            <input type="checkbox" checked={assignDraft.notify} onChange={(e)=>setAssignDraft(d=>({...d,notify:e.target.checked}))} />
            <label style={{margin:0}}>Enviar notificación (mock)</label>
          </div>
        </div>
      <div className="modal-actions">
        <button className="btn" onClick={()=>setAssigning(null)}>Cancelar</button>
        <button className="btn primary" onClick={saveAssign}>Guardar asignación</button>
      </div>
      </Modal>

      <Modal open={isTech && showDashboard} title="Dashboard técnico" onClose={()=>setShowDashboard(false)}>
        <div className="grid" style={{gap:10}}>
          <div className="col-12" style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
            <div className="field" style={{minWidth:180}}>
              <label>Filtrar por cliente</label>
              <select className="input" value={techFilters.cliente} onChange={(e)=>setTechFilters(f=>({...f,cliente:e.target.value}))}>
                <option value="ALL">Todos</option>
                {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{minWidth:200}}>
              <label>Filtrar por tipo de trabajo</label>
              <select className="input" value={techFilters.servicio} onChange={(e)=>setTechFilters(f=>({...f,servicio:e.target.value}))}>
                <option value="ALL">Todos</option>
                {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="col-12" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:12}}>
            <div className="card" style={{background:'rgba(255,255,255,0.02)', textAlign:'center', padding:'16px 12px'}}>
              <div className="muted">Horas trabajadas</div>
              <div style={{fontSize:28, fontWeight:700, marginTop:4}}>{techDashboard.totalHours.toFixed(1)}</div>
            </div>
            <div className="card" style={{background:'rgba(255,255,255,0.02)', textAlign:'center', padding:'16px 12px'}}>
              <div className="muted">Horas extras</div>
              <div style={{fontSize:28, fontWeight:700, marginTop:4}}>{techDashboard.totalExtra.toFixed(1)}</div>
            </div>
          </div>

          <div className="col-12 card" style={{background:'rgba(255,255,255,0.02)'}}>
            <h4 style={{margin:'0 0 6px 0'}}>Top clientes y Servicios</h4>
            <div className="grid" style={{gap:10}}>
              <div className="col-6">
                <div className="muted" style={{marginBottom:6}}>Clientes (top 3)</div>
                {techDashboard.topClients.length === 0 && <div className="muted">Sin datos</div>}
                {techDashboard.topClients.map((c, idx) => (
                  <div key={c.name} className="row" style={{alignItems:'center', marginBottom:6}}>
                    <span className="badge" style={{minWidth:20}}>{idx+1}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600}}>{c.name}</div>
                      <div className="muted" style={{fontSize:12}}>OTs: {c.ots} · Horas: {c.hours.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-6">
                <div className="muted" style={{marginBottom:6}}>Servicios (top 3)</div>
                {techDashboard.topServices.length === 0 && <div className="muted">Sin datos</div>}
                {techDashboard.topServices.map((s, idx) => (
                  <div key={s.name} className="row" style={{alignItems:'center', marginBottom:6}}>
                    <span className="badge" style={{minWidth:20}}>{idx+1}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600}}>{s.name}</div>
                      <div className="muted" style={{fontSize:12}}>OTs: {s.ots} · Horas: {s.hours.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 card" style={{background:'rgba(255,255,255,0.02)'}}>
            <h4 style={{margin:'0 0 6px 0'}}>Estadísticas del técnico</h4>
            {techDashboard.serviceStats.length === 0 && <div className="muted">Sin datos</div>}
            {techDashboard.serviceStats.map((s, idx) => {
              const max = Math.max(...techDashboard.serviceStats.map(x=>x.count), 1)
              const pct = (s.count / max) * 100
              return (
                <div key={s.name} style={{marginBottom:10}}>
                  <div className="muted" style={{fontSize:13}}>{idx+1}. {s.name} ({s.count} OTs)</div>
                  <div style={{height:8, background:'rgba(255,255,255,0.08)', borderRadius:6, overflow:'hidden'}}>
                    <div style={{height:8, width:`${pct}%`, background:'linear-gradient(90deg, rgba(167,139,250,0.9), rgba(59,130,246,0.9))'}}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={()=>setShowDashboard(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={!!viewing} title={`Detalle OT ${viewing?.id || ''}`} onClose={()=>setViewing(null)}>
        {viewing && (
          <div className="grid">
            <div className="col-6 field">
              <label>Cliente</label>
              <div className="badge">{viewing.cliente}</div>
            </div>
            <div className="col-6 field">
              <label>Contacto en planta (referencia)</label>
              <div className="badge">{viewing.referencia}</div>
            </div>
            <div className="col-6 field">
              <label>Estado</label>
              <select className="input" value={detailDraft.estado} onChange={(e)=>setDetailDraft(d=>({...d,estado:e.target.value}))}>
                {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
              </select>
            </div>
            <div className="col-6 field">
              <label>Prioridad</label>
              <select className="input" value={detailDraft.prioridad} onChange={(e)=>setDetailDraft(d=>({...d,prioridad:e.target.value}))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
              </select>
            </div>
            <div className="col-6 field">
              <label>Fecha inicio</label>
              <input className="input" type="date" value={detailDraft.fechaInicio} onChange={(e)=>setDetailDraft(d=>({...d,fechaInicio:e.target.value}))} />
            </div>
            <div className="col-6 field">
              <label>Fecha fin</label>
              <input className="input" type="date" value={detailDraft.fechaFin} onChange={(e)=>setDetailDraft(d=>({...d,fechaFin:e.target.value}))} />
            </div>
            <div className="col-6 field">
              <label>Fecha entrega de informe</label>
              <input className="input" type="date" value={detailDraft.fechaInforme} onChange={(e)=>setDetailDraft(d=>({...d,fechaInforme:e.target.value}))} />
            </div>
            <div className="col-6 field">
              <label>Responsable</label>
              <div className="badge">{viewing.responsable || 'N/D'}</div>
            </div>
            <div className="col-6 field">
              <label>Acompañantes</label>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {viewing.asignados?.length ? viewing.asignados.map(a => <span key={a} className="chip">{a}</span>) : <span className="muted">Sin asignar</span>}
              </div>
            </div>
            <div className="col-12 field">
              <label>Alcance</label>
              <div className="badge" style={{whiteSpace:'pre-wrap'}}>{viewing.alcance || 'Sin notas'}</div>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={()=>setViewing(null)}>Cerrar</button>
          <button className="btn primary" onClick={saveDetail}>Guardar</button>
        </div>
      </Modal>

      <Modal open={!!closing} title={`Cerrar OT ${closing?.id || ''}`} onClose={()=>setClosing(null)}>
        <div className="grid">
          <div className="col-6 field">
            <label>Fecha inicio real</label>
            <input className="input" type="date" value={closeDraft.realFechaInicio} onChange={(e)=>setCloseDraft(d=>({...d,realFechaInicio:e.target.value}))} />
          </div>
          <div className="col-6 field">
            <label>Fecha fin real</label>
            <input className="input" type="date" value={closeDraft.realFechaFin} onChange={(e)=>setCloseDraft(d=>({...d,realFechaFin:e.target.value}))} />
          </div>
          <div className="col-4 field">
            <label>Horas de trabajo</label>
            <input className="input" type="number" step="0.25" value={closeDraft.horasReales} onChange={(e)=>setCloseDraft(d=>({...d,horasReales:e.target.value}))} />
          </div>
          <div className="col-4 field">
            <label>Horas extra</label>
            <input className="input" type="number" step="0.25" value={closeDraft.horasExtraReales} onChange={(e)=>setCloseDraft(d=>({...d,horasExtraReales:e.target.value}))} />
          </div>
          <div className="col-4 field">
            <label>Gastos del servicio</label>
            <input className="input" type="number" step="0.01" value={closeDraft.gastos} onChange={(e)=>setCloseDraft(d=>({...d,gastos:e.target.value}))} />
          </div>
          <div className="col-12 field">
            <label>Observaciones / Comentarios</label>
            <textarea className="input" rows="3" value={closeDraft.observacionesCierre} onChange={(e)=>setCloseDraft(d=>({...d,observacionesCierre:e.target.value}))} placeholder="Notas relevantes del cierre" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={()=>setClosing(null)}>Cancelar</button>
          <button className="btn primary" onClick={saveClose}>Guardar y cerrar</button>
        </div>
      </Modal>

      <Modal open={open} title="Nueva OT (MVP)" onClose={()=>setOpen(false)}>
        <div className="grid">
          <div className="col-6 field">
            <label>Responsable del servicio</label>
            <select className="input" value={draft.responsable} onChange={(e)=>setDraft(d=>({...d,responsable:e.target.value}))}>
              <option value="">Selecciona...</option>
              {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-6 field">
            <label>Acompañantes (1 a 3)</label>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {PEOPLE.map(p => {
                const active = draft.asignados.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    className="btn"
                    style={{
                      borderColor: active ? 'rgba(110,231,183,.5)' : undefined,
                      background: active ? 'rgba(110,231,183,.12)' : undefined
                    }}
                    onClick={()=>toggleAssignedDraft(p)}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="col-6 field">
            <label>Cliente/Empresa</label>
            <input
              className="input"
              value={clientInput}
              onChange={(e)=>setDraft(d=>({...d,cliente:'',clienteOtro:e.target.value}))}
              placeholder="Buscar o escribir cliente"
            />
            <div style={{maxHeight:140, overflowY:'auto', marginTop:6, border:'1px solid var(--line)', borderRadius:10, background:'rgba(255,255,255,0.03)'}}>
              {clientSuggestions.map(c => (
                <div
                  key={c}
                  style={{padding:'8px 10px', cursor:'pointer'}}
                  onMouseDown={()=>setDraft(d=>({...d,cliente:c,clienteOtro:''}))}
                >
                  {c}
                </div>
              ))}
              {!clientSuggestions.length && (
                <div style={{padding:'8px 10px'}}>
                  <div className="muted">No hay coincidencias</div>
                  <div
                    className="badge"
                    style={{cursor:'pointer', display:'inline-block', marginTop:6}}
                    onMouseDown={()=>setDraft(d=>({...d,cliente:clientInput.toUpperCase(), clienteOtro:''}))}
                  >
                    Usar "{clientInput || 'nuevo cliente'}"
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="col-6 field">
            <label>PDV</label>
            <input className="input" value={draft.pdv} onChange={(e)=>setDraft(d=>({...d,pdv:e.target.value}))} placeholder="Ej: SANTA CRUZ" />
          </div>
          <div className="col-6 field">
            <label>Fecha inicio</label>
            <input className="input" type="date" value={draft.fechaInicio} onChange={(e)=>setDraft(d=>({...d,fechaInicio:e.target.value}))} />
          </div>
          <div className="col-6 field">
            <label>Fecha fin</label>
            <input className="input" type="date" value={draft.fechaFin} onChange={(e)=>setDraft(d=>({...d,fechaFin:e.target.value}))} />
          </div>
          <div className="col-6 field">
            <label>Prioridad</label>
            <select className="input" value={draft.prioridad} onChange={(e)=>setDraft(d=>({...d,prioridad:e.target.value}))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
            </select>
          </div>
          <div className="col-6 field">
            <label>Fecha entrega de informe</label>
            <input className="input" type="date" value={draft.fechaInforme} onChange={(e)=>setDraft(d=>({...d,fechaInforme:e.target.value}))} />
          </div>
          <div className="col-12 field">
            <label>Contacto en planta (referencia)</label>
            <input className="input" value={draft.referencia} onChange={(e)=>setDraft(d=>({...d,referencia:e.target.value}))} placeholder="Nombre de la persona de contacto" />
          </div>
          <div className="col-6 field">
            <label>Estado</label>
            <select className="input" value={draft.estado} onChange={(e)=>setDraft(d=>({...d,estado:e.target.value}))}>
              {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
            </select>
          </div>
          <div className="col-6 field">
            <label>Presupuesto planificado</label>
            <input className="input" type="number" value={draft.presupuesto} onChange={(e)=>setDraft(d=>({...d,presupuesto:e.target.value}))} placeholder="Ej: 1200" />
          </div>
          <div className="col-6 field">
            <label>Tipo de servicio</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:'6px 10px'}}>
              {SERVICE_OPTIONS.map(opt => (
                <label key={opt} style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
                  <input
                    type="checkbox"
                    checked={draft.tipoServicios.includes(opt)}
                    onChange={()=>toggleService(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {draft.tipoServicios.includes('OTRO') && (
              <input
                className="input"
                style={{marginTop:8}}
                value={draft.tipoServicioOtro}
                onChange={(e)=>setDraft(d=>({...d,tipoServicioOtro:e.target.value}))}
                placeholder="Describe el servicio"
              />
            )}
          </div>
          <div className="col-6 field">
            <label>Herramientas</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:'6px 10px'}}>
              {TOOL_OPTIONS.map(opt => (
                <label key={opt} style={{display:'flex', alignItems:'center', gap:8, fontSize:13}}>
                  <input
                    type="checkbox"
                    checked={draft.herramientas.includes(opt)}
                    onChange={()=>toggleTool(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="col-4 field">
            <label>Horas de trabajo en planta</label>
            <input className="input" type="number" step="0.25" value={draft.horasPlanta} onChange={(e)=>setDraft(d=>({...d,horasPlanta:e.target.value}))} />
          </div>
          <div className="col-4 field">
            <label>Horas de trabajo en gabinete</label>
            <input className="input" type="number" step="0.25" value={draft.horasGabinete} onChange={(e)=>setDraft(d=>({...d,horasGabinete:e.target.value}))} />
          </div>
          <div className="col-4 field">
            <label>Horas totales</label>
            <input className="input" value={horasTotales(draft).toFixed(2)} readOnly />
          </div>
          <div className="col-12 field">
            <label>Alcance técnico</label>
            <textarea className="input" rows="5" value={draft.alcance} onChange={(e)=>setDraft(d=>({...d,alcance:e.target.value}))} placeholder="Detalle técnico y consideraciones" />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={()=>setOpen(false)}>Cancelar</button>
          <button className="btn primary" onClick={add}>Guardar</button>
        </div>
      </Modal>
    </div>
  )
}
