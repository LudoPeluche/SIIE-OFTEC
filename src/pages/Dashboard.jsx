import { useEffect, useMemo, useState } from 'react'
import Chip from '../components/Chip.jsx'
import Modal from '../components/Modal.jsx'
import { listWorkOrders } from '../lib/woService.js'
import { listExtraHours } from '../lib/extraHoursService.js'
import { CLIENTS, SERVICE_OPTIONS, PEOPLE } from '../constants.js'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const STORAGE_KEY = 'otData'

function parseNum(value){
  const n = Number(value)
  return isNaN(n) ? 0 : n
}

function BarChart({ data, valueKey, labelKey, maxValue, colorClass='bar-primary', suffix='' }){
  const max = maxValue ?? Math.max(...data.map(d => d[valueKey] ?? 0), 1)
  return (
    <div className="mini-chart">
      {data.map((d) => {
        const v = d[valueKey] ?? 0
        const pct = Math.max(2, Math.round((v / max) * 100))
        return (
          <div className="mini-chart-row" key={d[labelKey]}>
            <div className="mini-chart-label">{d[labelKey]}</div>
            <div className="mini-chart-bar">
              <div className={`mini-bar ${colorClass}`} style={{width: pct + '%'}} title={v + suffix} />
            </div>
            <div className="mini-chart-value">{v}{suffix}</div>
          </div>
        )
      })}
    </div>
  )
}

function Gauge({ label, value, suffix='%', tone='blue' }){
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="gauge">
      <div className="gauge-arc">
        <div className="gauge-fill" style={{width: pct + '%'}} />
      </div>
      <div className="gauge-meta">
        <div className="muted">{label}</div>
        <div style={{fontSize:28, fontWeight:900}}>{value}{suffix}</div>
        <Chip tone={tone}>{tone.toUpperCase()}</Chip>
      </div>
    </div>
  )
}

function DualHorizontalBars({ data, maxValue, suffix='h', onRowClick }){
  const max = maxValue ?? Math.max(...data.map(d => Math.max(d.prog || 0, d.real || 0)), 1)
  return (
    <div className="mini-chart">
      {data.map(row => {
        const progPct = Math.round((row.prog / max) * 100)
        const realPct = Math.round((row.real / max) * 100)
        return (
          <div
            className="mini-chart-row"
            key={row.tech}
            onClick={onRowClick ? () => onRowClick(row.tech) : undefined}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            <div className="mini-chart-label">{row.tech}</div>
            <div className="mini-chart-bar dual" title={`${row.real.toFixed(1)}${suffix} / ${row.prog.toFixed(1)}${suffix}`}>
              <div className="mini-bar bar-muted" style={{width: Math.max(4, progPct) + '%'}} />
              <div className="mini-bar bar-primary" style={{width: Math.max(4, realPct) + '%', position:'absolute', left:0}} />
            </div>
            <div className="mini-chart-value">{row.real.toFixed(1)} / {row.prog.toFixed(1)} {suffix}</div>
          </div>
        )
      })}
    </div>
  )
}

const DONUT_COLORS = ['#10b981','#0ea5e9','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#6366f1']

function DonutChart({ data, size=140, thickness=28 }){
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div className="muted" style={{textAlign:'center',padding:20}}>Sin datos</div>
  const r = size / 2
  const innerR = r - thickness
  let cumAngle = -90
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const angle = pct * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle
    cumAngle = endAngle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = r + r * Math.cos(startRad)
    const y1 = r + r * Math.sin(startRad)
    const x2 = r + r * Math.cos(endRad)
    const y2 = r + r * Math.sin(endRad)
    const ix1 = r + innerR * Math.cos(startRad)
    const iy1 = r + innerR * Math.sin(startRad)
    const ix2 = r + innerR * Math.cos(endRad)
    const iy2 = r + innerR * Math.sin(endRad)
    const large = angle > 180 ? 1 : 0
    const path = `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${innerR},${innerR} 0 ${large} 0 ${ix1},${iy1} Z`
    return <path key={i} d={path} fill={DONUT_COLORS[i % DONUT_COLORS.length]} opacity={0.85}><title>{d.label}: {d.value} ({Math.round(pct*100)}%)</title></path>
  })
  return (
    <div style={{display:'flex', alignItems:'center', gap:14}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
        {slices}
        <text x={r} y={r-6} textAnchor="middle" fill="var(--text)" fontSize="22" fontWeight="900">{total}</text>
        <text x={r} y={r+12} textAnchor="middle" fill="var(--muted)" fontSize="10" fontWeight="600">TOTAL</text>
      </svg>
      <div style={{display:'flex', flexDirection:'column', gap:3, minWidth:0}}>
        {data.slice(0,7).map((d,i) => (
          <div key={d.label} style={{display:'flex', alignItems:'center', gap:6, fontSize:11}}>
            <span style={{width:8, height:8, borderRadius:2, background:DONUT_COLORS[i % DONUT_COLORS.length], flexShrink:0}} />
            <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--muted)'}}>{d.label}</span>
            <span style={{fontWeight:700, marginLeft:'auto', flexShrink:0}}>{d.value}</span>
          </div>
        ))}
        {data.length > 7 && <div className="muted" style={{fontSize:10}}>+{data.length - 7} mas</div>}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, tone='blue', onClick }){
  return (
    <div className="kpi-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="kpi-card-icon">{icon}</div>
      <div className="kpi-card-value">{value}</div>
      <div className="kpi-card-label">{label}</div>
      {sub && <div className="kpi-card-sub">{sub}</div>}
    </div>
  )
}

function HorizontalBars({ data, valueKey='value', labelKey='label', suffix='' }){
  const max = Math.max(...data.map(d => d[valueKey] ?? 0), 1)
  return (
    <div className="mini-chart">
      {data.map(row => {
        const val = row[valueKey] ?? 0
        const pct = Math.max(4, Math.round((val / max) * 100))
        return (
          <div className="mini-chart-row" key={row[labelKey]}>
            <div className="mini-chart-label">{row[labelKey]}</div>
            <div className="mini-chart-bar">
              <div className="mini-bar bar-primary" style={{width: pct + '%'}} title={`${val}${suffix}`} />
            </div>
            <div className="mini-chart-value">{val}{suffix}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard(){
  const [otData, setOtData] = useState([])
  const [loading, setLoading] = useState(false)
  const [showChecklistIssues, setShowChecklistIssues] = useState(false)
  const [issueFilter, setIssueFilter] = useState('ALL')
  const [showTechModal, setShowTechModal] = useState(false)
  const [selectedTech, setSelectedTech] = useState('')
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [alertFilter, setAlertFilter] = useState('PENDING')
  const [showBudgetDetails, setShowBudgetDetails] = useState(false)
  const [budgetFilter, setBudgetFilter] = useState({ type: 'CLIENT', label: '' })
  const [showHorasModal, setShowHorasModal] = useState(false)
  const [showTotalOtsModal, setShowTotalOtsModal] = useState(false)
  const [showRatioModal, setShowRatioModal] = useState(false)
  const [showOtMesModal, setShowOtMesModal] = useState(false)
  const [extraRequests, setExtraRequests] = useState([])
  const [drillTech, setDrillTech] = useState(null)
  const [techFilters, setTechFilters] = useState({ cliente: 'ALL', servicio: 'ALL' })
  const [showWorkedHoursDetail, setShowWorkedHoursDetail] = useState(false)
  const [globalMonth, setGlobalMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filterCliente, setFilterCliente] = useState('ALL')
  const [filterTecnico, setFilterTecnico] = useState('ALL')
  const [filterServicio, setFilterServicio] = useState('ALL')
  useEffect(() => {
    async function fetchData(){
      try{
        setLoading(true)
        const remote = await listWorkOrders()
        if(Array.isArray(remote) && remote.length){
          const mapped = remote.map(it => ({
            ...it,
            fechaPlan: it.fecha_plan || it.fechaPlan,
            fechaInicio: it.fecha_inicio || it.fechaInicio,
            fechaFin: it.fecha_fin || it.fechaFin,
            fechaCompromiso: it.fecha_compromiso || it.fechaCompromiso,
            horasPlanta: it.horas_planta ?? it.horasPlanta ?? 0,
            horasGabinete: it.horas_gabinete ?? it.horasGabinete ?? 0,
            horasReales: it.horas_reales ?? it.horasReales ?? 0,
            horasExtraReales: it.horas_extra ?? it.horasExtraReales ?? 0,
            gastos: it.gastos ?? 0,
            presupuesto: it.presupuesto ?? it.presupuestoPlan ?? 0,
            asignados: it.asignados || [],
            responsable: it.responsable || '',
            toolReady: it.checklist?.toolReady ?? it.toolReady,
            toolsComplete: it.checklist?.toolsComplete ?? it.toolsComplete,
            toolNote: it.checklist?.toolNote ?? it.toolNote
          }))
          setOtData(mapped)
          return
        }
      }catch(_err){
        // fallback to local data
      }finally{
        setLoading(false)
      }
      try{
        const saved = localStorage.getItem(STORAGE_KEY)
        const parsed = JSON.parse(saved)
        if(Array.isArray(parsed)) setOtData(parsed)
      }catch(_){}
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchExtra() {
      try {
        const reqs = await listExtraHours()
        if (Array.isArray(reqs)) setExtraRequests(reqs)
      } catch (_) {
        setExtraRequests([])
      }
    }
    fetchExtra()
  }, [])

  useEffect(() => {
    if (selectedTech) {
      setTechFilters({ cliente: 'ALL', servicio: 'ALL' })
    }
  }, [selectedTech])

  const availableMonths = useMemo(() => {
    const list = Array.isArray(otData) ? otData : []
    const set = new Set()
    list.forEach(it => {
      if (it.estado === 'CANCELED') return
      const dateKey = it.fechaPlan || it.fechaInicio || ''
      const [y, m] = String(dateKey).split('-')
      if (y && m) set.add(`${y}-${m.padStart(2, '0')}`)
    })
    return Array.from(set).sort().reverse()
  }, [otData])

  const activeClients = useMemo(() => {
    const list = Array.isArray(otData) ? otData : []
    const set = new Set()
    list.forEach(it => { if (it.cliente) set.add(it.cliente) })
    return Array.from(set).sort()
  }, [otData])

  const activeServices = useMemo(() => {
    const list = Array.isArray(otData) ? otData : []
    const set = new Set()
    list.forEach(it => {
      const svcs = Array.isArray(it.tipoServicios) ? it.tipoServicios : []
      svcs.forEach(s => { if (s) set.add(s) })
    })
    return Array.from(set).sort()
  }, [otData])

  const otFiltered = useMemo(() => {
    const list = Array.isArray(otData) ? otData : []
    return list.filter(it => {
      if (it.esDeuda) return false
      if (globalMonth !== 'ALL') {
        const dateKey = it.fechaPlan || it.fechaInicio || ''
        const [y, m] = String(dateKey).split('-')
        if (!y || !m) return false
        if (`${y}-${m.padStart(2, '0')}` !== globalMonth) return false
      }
      if (filterCliente !== 'ALL' && it.cliente !== filterCliente) return false
      if (filterTecnico !== 'ALL') {
        const participants = [it.responsable, ...(it.asignados || [])].filter(Boolean)
        if (!participants.includes(filterTecnico)) return false
      }
      if (filterServicio !== 'ALL') {
        const svcs = Array.isArray(it.tipoServicios) ? it.tipoServicios : []
        if (!svcs.includes(filterServicio)) return false
      }
      return true
    })
  }, [otData, globalMonth, filterCliente, filterTecnico, filterServicio])

  const deudaCount = useMemo(() => {
    return (Array.isArray(otData) ? otData : []).filter(it => it.esDeuda).length
  }, [otData])

  const otPorMes = useMemo(() => {
    const map = new Map()
    otFiltered.forEach(it => {
      if(it.estado === 'CANCELED') return
      const dateKey = it.fechaPlan || it.fechaInicio || ''
      const [y,m] = String(dateKey).split('-')
      if(!y || !m) return
      const key = `${y}-${m.padStart(2,'0')}`
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([key, ot]) => {
        const [y,m] = key.split('-')
        return { mes: `${MONTHS[Number(m)-1] || m} ${y}`, ot }
      })
      .sort((a,b)=>a.mes.localeCompare(b.mes))
  }, [otFiltered])

  const tiempoProm = useMemo(() => {
    const map = new Map()
    otFiltered.forEach(it => {
      const dateKey = it.fechaPlan || it.fechaInicio || ''
      const [y,m] = String(dateKey).split('-')
      if(!y || !m) return
      const key = `${y}-${m.padStart(2,'0')}`
      const horas = parseNum(it.horasReales) + parseNum(it.horasExtraReales)
      const prev = map.get(key) || { total:0, count:0 }
      map.set(key, { total: prev.total + horas, count: prev.count + 1 })
    })
    return Array.from(map.entries())
      .map(([key, v]) => {
        const [y,m] = key.split('-')
        return { mes: `${MONTHS[Number(m)-1] || m} ${y}`, horas: v.count ? Math.round(v.total / v.count) : 0 }
      })
      .sort((a,b)=>a.mes.localeCompare(b.mes))
  }, [otFiltered])

  const avgTiempo = tiempoProm.length ? Math.round(tiempoProm.reduce((a,b)=>a + b.horas,0) / tiempoProm.length) : 0
  const avgOt = otPorMes.length ? Math.round(otPorMes.reduce((a,b)=>a+b.ot,0)/otPorMes.length) : 0

  const todayKey = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2,'0')
    const d = String(now.getDate()).padStart(2,'0')
    return `${y}-${m}-${d}`
  }, [])

  const alertData = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const pending = []
    const rework = []
    const overdue = []
    list.forEach(it => {
      const estado = it.estado
      if(['OPEN','IN_PROGRESS'].includes(estado)){
        pending.push(it)
      }else if(estado === 'REWORK'){
        rework.push(it)
      }
      const commitment = it.fechaCompromiso || it.fechaFin || it.fechaPlan || ''
      const isClosed = ['CLOSED','CANCELED'].includes(estado)
      if(!isClosed && commitment && commitment < todayKey){
        overdue.push(it)
      }
    })
    return { pending, rework, overdue }
  }, [otFiltered, todayKey])

  const filteredAlerts = useMemo(() => {
    if(alertFilter === 'REWORK') return alertData.rework
    if(alertFilter === 'OVERDUE') return alertData.overdue
    return alertData.pending
  }, [alertData, alertFilter])

  const reworkItems = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    return list.map(it => {
      const history = Array.isArray(it.reworkHistory) ? it.reworkHistory : []
      if(!history.length) return null
      const last = history[0]
      return {
        id: it.code || it.id,
        cliente: it.cliente || '',
        referencia: it.referencia || '',
        responsable: it.responsable || '',
        fechaRework: last?.date || '',
        motivo: (last?.reason || '').trim(),
        fechaCierre: it.realFechaFin || it.fechaFin || ''
      }
    }).filter(Boolean)
  }, [otFiltered])

  const budgetKpis = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const closed = list.filter(it => ['CLOSED','REWORK'].includes(it.estado))
    let totalPlan = 0
    let totalReal = 0
    const clientMap = new Map()
    const serviceMap = new Map()
    closed.forEach(it => {
      const plan = parseNum(it.presupuesto)
      const real = parseNum(it.gastos)
      totalPlan += plan
      totalReal += real
      if(it.cliente){
        clientMap.set(it.cliente, (clientMap.get(it.cliente) || 0) + real)
      }
      const services = []
      const listServices = Array.isArray(it.tipoServicios) ? it.tipoServicios : []
      listServices.forEach(svc => {
        if(svc && svc !== 'OTRO') services.push(svc)
      })
      if(it.tipoServicioOtro) services.push(it.tipoServicioOtro)
      services.forEach(svc => {
        serviceMap.set(svc, (serviceMap.get(svc) || 0) + real)
      })
    })
    const deltaPct = totalPlan ? Math.round(((totalReal - totalPlan) / totalPlan) * 100) : 0
    const topClients = Array.from(clientMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5)
    const topServices = Array.from(serviceMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5)
    return { totalPlan, totalReal, deltaPct, topClients, topServices }
  }, [otFiltered])

  const budgetDetails = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const closed = list.filter(it => ['CLOSED','REWORK'].includes(it.estado))
    const items = closed.filter(it => {
      if(budgetFilter.type === 'CLIENT') return it.cliente === budgetFilter.label
      if(budgetFilter.type === 'SERVICE') {
        const services = []
        const listServices = Array.isArray(it.tipoServicios) ? it.tipoServicios : []
        listServices.forEach(svc => {
          if(svc && svc !== 'OTRO') services.push(svc)
        })
        if(it.tipoServicioOtro) services.push(it.tipoServicioOtro)
        return services.includes(budgetFilter.label)
      }
      return false
    }).map(it => {
      const plan = parseNum(it.presupuesto)
      const real = parseNum(it.gastos)
      const diff = real - plan
      const pct = plan ? Math.round((diff / plan) * 100) : 0
      return {
        id: it.code || it.id,
        cliente: it.cliente || '',
        referencia: it.referencia || '',
        fecha: it.fechaFin || it.fechaInicio || '',
        plan,
        real,
        diff,
        pct
      }
    })
    return items
  }, [otFiltered, budgetFilter])

  const kpiReal = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const closed = list.filter(it => ['CLOSED','REWORK'].includes(it.estado))
    if(!closed.length){
      return { totalProg:0, totalReal:0, pct:0, byTech: [], checklist: null }
    }
    let totalProg = 0
    let totalReal = 0
    const map = new Map()
    let checklistTotal = 0
    let checklistOk = 0
    let missingTool = 0
    let badTool = 0
    const checklistIssues = []
    closed.forEach(it => {
      const prog = parseNum(it.horasPlanta) + parseNum(it.horasGabinete)
      const real = parseNum(it.horasReales) + parseNum(it.horasExtraReales)
      totalProg += prog
      totalReal += real

      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const hasDesglose = horasPorTecnico.length > 0

      participants.forEach(p => {
        const prev = map.get(p) || { tech: p, prog:0, real:0, ots:0 }
        let techReal
        if (hasDesglose) {
          const techEntry = horasPorTecnico.find(h => h.tech === p)
          techReal = techEntry ? parseNum(techEntry.horas) + parseNum(techEntry.horasExtra) : 0
        } else {
          techReal = real / Math.max(1, participants.length)
        }
        map.set(p, { ...prev, prog: prev.prog + prog, real: prev.real + techReal, ots: prev.ots + 1 })
      })
      const hasChecklist = typeof it.toolReady === 'boolean' || typeof it.toolsComplete === 'boolean' || (it.toolNote || '').trim()
      if(hasChecklist){
        checklistTotal += 1
        if(it.toolReady && it.toolsComplete) checklistOk += 1
        if(!it.toolsComplete) missingTool += 1
        if(!it.toolReady) badTool += 1
        if(!it.toolReady || !it.toolsComplete){
          checklistIssues.push({
            id: it.code || it.id,
            cliente: it.cliente || '',
            referencia: it.referencia || '',
            responsable: it.responsable || '',
            fecha: it.fechaFin || it.fechaInicio || '',
            toolReady: !!it.toolReady,
            toolsComplete: !!it.toolsComplete,
            toolNote: it.toolNote || ''
          })
        }
      }
    })
    const byTech = Array.from(map.values()).map(row => {
      const pct = row.prog ? Math.round((row.real / row.prog) * 100) : 0
      return { ...row, pct }
    }).sort((a,b)=>b.real - a.real)
    const pct = totalProg ? Math.round((totalReal / totalProg) * 100) : 0
    const checklistPct = checklistTotal ? Math.round((checklistOk / checklistTotal) * 100) : 0
    return {
      totalProg,
      totalReal,
      pct,
      byTech,
      checklist: checklistTotal ? { pct: checklistPct, total: checklistTotal, ok: checklistOk, missingTool, badTool, issues: checklistIssues } : null
    }
  }, [otFiltered])

  const filteredChecklistIssues = useMemo(() => {
    const issues = kpiReal.checklist?.issues || []
    return issues.filter(it => {
      if(issueFilter === 'BAD') return !it.toolReady
      if(issueFilter === 'MISSING') return !it.toolsComplete
      return true
    })
  }, [kpiReal.checklist, issueFilter])

  const techSummaries = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const closed = list.filter(it => ['CLOSED','REWORK'].includes(it.estado))
    const map = new Map()
    closed.forEach(it => {
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      if(!participants.length) return
      const prog = parseNum(it.horasPlanta) + parseNum(it.horasGabinete)
      const hasChecklist = typeof it.toolReady === 'boolean' || typeof it.toolsComplete === 'boolean' || (it.toolNote || '').trim()

      // Usar horasPorTecnico si está disponible, sino fallback al total dividido
      const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const hasDesglose = horasPorTecnico.length > 0

      participants.forEach(p => {
        const prev = map.get(p) || { tech: p, prog: 0, real: 0, extra: 0, ots: 0, checklistTotal: 0, checklistOk: 0, missingTool: 0, badTool: 0 }

        let techReal = 0
        let techExtra = 0
        if (hasDesglose) {
          // Buscar las horas específicas de este técnico
          const techEntry = horasPorTecnico.find(h => h.tech === p)
          if (techEntry) {
            techReal = parseNum(techEntry.horas) + parseNum(techEntry.horasExtra)
            techExtra = parseNum(techEntry.horasExtra)
          }
        } else {
          // Fallback: dividir entre participantes
          const numP = Math.max(1, participants.length)
          techReal = (parseNum(it.horasReales) + parseNum(it.horasExtraReales)) / numP
          techExtra = parseNum(it.horasExtraReales) / numP
        }

        const next = {
          ...prev,
          prog: prev.prog + prog,
          real: prev.real + techReal,
          extra: prev.extra + techExtra,
          ots: prev.ots + 1
        }
        if(hasChecklist){
          next.checklistTotal += 1
          if(it.toolReady && it.toolsComplete) next.checklistOk += 1
          if(!it.toolsComplete) next.missingTool += 1
          if(!it.toolReady) next.badTool += 1
        }
        map.set(p, next)
      })
    })
    return Array.from(map.values()).map(row => {
      const pct = row.prog ? Math.round((row.real / row.prog) * 100) : 0
      const checklistPct = row.checklistTotal ? Math.round((row.checklistOk / row.checklistTotal) * 100) : 0
      return { ...row, pct, checklistPct }
    }).sort((a,b) => b.real - a.real)
  }, [otFiltered])

  const extraByTech = useMemo(() => {
    if(!selectedTech) return []
    return (extraRequests || [])
      .filter(r => r.tech === selectedTech)
      .sort((a,b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
  }, [extraRequests, selectedTech])

  const techDashData = useMemo(() => {
    if(!selectedTech) return { totalHours: 0, totalExtra: 0, topClients: [], topServices: [], serviceStats: [], availableExtra: 0 }
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const participantsOf = (it) => Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
    const techItems = list.filter(it => participantsOf(it).includes(selectedTech))
    const filterByCliente = techFilters.cliente !== 'ALL'
    const filterByServicio = techFilters.servicio !== 'ALL'
    const filtered = techItems.filter(it => {
      if (filterByCliente && it.cliente !== techFilters.cliente) return false
      if (filterByServicio && !(it.tipoServicios || []).includes(techFilters.servicio)) return false
      return true
    })
    const clientAgg = new Map()
    const serviceAgg = new Map()
    let totalHours = 0
    let totalExtra = 0
    for (const it of filtered) {
      // Usar horasPorTecnico si está disponible
      const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const techEntry = horasPorTecnico.find(h => h.tech === selectedTech)
      let hrsValid = 0
      let extraValid = 0
      if (techEntry) {
        hrsValid = Number(techEntry.horas || 0) + Number(techEntry.horasExtra || 0)
        extraValid = Number(techEntry.horasExtra || 0)
      } else {
        // Fallback: dividir entre participantes
        const numP = Math.max(1, Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean))).length)
        const hrs = Number(it.horasReales || 0)
        const extra = Number(it.horasExtraReales || 0)
        hrsValid = ((isNaN(hrs) ? 0 : hrs) + (isNaN(extra) ? 0 : extra)) / numP
        extraValid = (isNaN(extra) ? 0 : extra) / numP
      }
      totalHours += hrsValid
      totalExtra += extraValid
      if (it.cliente) {
        const prev = clientAgg.get(it.cliente) || { hours: 0, ots: 0 }
        clientAgg.set(it.cliente, { hours: prev.hours + hrsValid, ots: prev.ots + 1 })
      }
      for (const svc of it.tipoServicios || []) {
        const prev = serviceAgg.get(svc) || { hours: 0, ots: 0 }
        serviceAgg.set(svc, { hours: prev.hours + hrsValid, ots: prev.ots + 1 })
      }
    }
    const topClients = Array.from(clientAgg.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.hours - a.hours || b.ots - a.ots)
      .slice(0, 3)
    const topServices = Array.from(serviceAgg.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.hours - a.hours || b.ots - a.ots)
      .slice(0, 3)
    const serviceStats = Array.from(serviceAgg.entries())
      .map(([name, data]) => ({ name, count: data.ots }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    const closed = techItems.filter(it => ['CLOSED', 'REWORK'].includes(it.estado))
    const earnedExtra = closed.reduce((sum, it) => {
      const perTech = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const techEntry = perTech.find(h => h.tech === selectedTech)
      if (techEntry) {
        const extra = Number(techEntry.horasExtra || 0)
        return sum + (isNaN(extra) ? 0 : extra)
      }
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      const totalExtra = Number(it.horasExtraReales || 0)
      if (isNaN(totalExtra)) return sum
      return sum + totalExtra / Math.max(1, participants.length)
    }, 0)
    const myReqs = (extraRequests || []).filter(r => r.tech === selectedTech)
    const approved = myReqs.filter(r => r.estado === 'APROBADA').reduce((s, r) => s + Number(r.horas || 0), 0)
    const pending = myReqs.filter(r => r.estado === 'PENDIENTE').reduce((s, r) => s + Number(r.horas || 0), 0)
    const availableExtra = Math.max(0, earnedExtra - approved - pending)
    return {
      totalHours,
      totalExtra,
      topClients,
      topServices,
      serviceStats,
      availableExtra,
      filteredOTs: filtered
    }
  }, [otFiltered, selectedTech, techFilters, extraRequests])

  const rankingPorMes = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const closed = list.filter(it => ['CLOSED', 'REWORK'].includes(it.estado))
    const map = new Map()
    closed.forEach(it => {
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const hasDesglose = horasPorTecnico.length > 0
      const totalReal = parseNum(it.horasReales) + parseNum(it.horasExtraReales)

      participants.forEach(p => {
        const prev = map.get(p) || { tech: p, servicios: 0, horas: 0 }
        let techHoras
        if (hasDesglose) {
          const techEntry = horasPorTecnico.find(h => h.tech === p)
          techHoras = techEntry ? parseNum(techEntry.horas) + parseNum(techEntry.horasExtra) : 0
        } else {
          techHoras = totalReal / Math.max(1, participants.length)
        }
        map.set(p, { ...prev, servicios: prev.servicios + 1, horas: prev.horas + techHoras })
      })
    })
    const rows = Array.from(map.values()).sort((a, b) => b.servicios - a.servicios || b.horas - a.horas)
    const totalServicios = closed.length
    return { rows, totalServicios }
  }, [otFiltered])

  const horasBreakdown = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const byTech = new Map()
    const byTechOts = new Map() // tech -> [{ id, codigo, cliente, servicios, fecha, horas, referencia }]
    const byClient = new Map()
    list.forEach(it => {
      const hrs = parseNum(it.horasReales) + parseNum(it.horasExtraReales)
      if (!hrs) return
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const hasDesglose = horasPorTecnico.length > 0
      const servicios = Array.isArray(it.tipoServicios) && it.tipoServicios.length > 0
        ? it.tipoServicios
        : (it.tipoServicioOtro ? [it.tipoServicioOtro] : ['Sin servicio'])
      const fecha = it.realFechaInicio || it.fechaInicio || it.fechaPlan || ''
      participants.forEach(p => {
        let techHrs
        if (hasDesglose) {
          const entry = horasPorTecnico.find(h => h.tech === p)
          techHrs = entry ? parseNum(entry.horas) + parseNum(entry.horasExtra) : 0
        } else {
          techHrs = hrs / Math.max(1, participants.length)
        }
        byTech.set(p, (byTech.get(p) || 0) + techHrs)
        if (techHrs > 0) {
          const arr = byTechOts.get(p) || []
          arr.push({ id: it.id, codigo: it.codigo || it.code || '', cliente: it.cliente || '', servicios, fecha, horas: techHrs, referencia: it.referencia || '' })
          byTechOts.set(p, arr)
        }
      })
      if (it.cliente) byClient.set(it.cliente, (byClient.get(it.cliente) || 0) + hrs)
    })
    const byTechOtsOut = {}
    byTechOts.forEach((arr, tech) => {
      byTechOtsOut[tech] = arr.sort((a, b) => b.horas - a.horas)
    })
    return {
      byTech: Array.from(byTech.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      byTechOts: byTechOtsOut,
      byClient: Array.from(byClient.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
    }
  }, [otFiltered])

  const techMaxReal = useMemo(() => {
    return Math.max(...techSummaries.map(t => t.real), 1)
  }, [techSummaries])

  const donutByStatus = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const map = new Map()
    list.forEach(it => {
      const st = it.estado || 'OPEN'
      map.set(st, (map.get(st) || 0) + 1)
    })
    const labels = { OPEN:'Abierta', IN_PROGRESS:'En proceso', REWORK:'Re-trabajo', CLOSED:'Cerrada', CANCELED:'Cancelada' }
    return Array.from(map.entries())
      .map(([k, v]) => ({ label: labels[k] || k, value: v }))
      .sort((a, b) => b.value - a.value)
  }, [otFiltered])

  const donutByService = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const map = new Map()
    list.forEach(it => {
      const svcs = Array.isArray(it.tipoServicios) ? it.tipoServicios : []
      svcs.forEach(s => { if (s) map.set(s, (map.get(s) || 0) + 1) })
    })
    return Array.from(map.entries())
      .map(([k, v]) => ({ label: k, value: v }))
      .sort((a, b) => b.value - a.value)
  }, [otFiltered])

  const kpiTotals = useMemo(() => {
    const list = Array.isArray(otFiltered) ? otFiltered : []
    const total = list.length
    const closed = list.filter(it => it.estado === 'CLOSED').length
    const rework = list.filter(it => it.estado === 'REWORK').length
    const pending = list.filter(it => ['OPEN','IN_PROGRESS'].includes(it.estado)).length
    const ratioCierre = total ? Math.round((closed / total) * 100) : 0
    let totalHoras = 0
    list.forEach(it => { totalHoras += parseNum(it.horasReales) + parseNum(it.horasExtraReales) })
    return { total, closed, rework, pending, ratioCierre, totalHoras }
  }, [otFiltered])

  function handleStartChange(v){
    const val = Number(v)
    if(val > endMonth){
      setStartMonth(val)
      setEndMonth(val)
    }else{
      setStartMonth(val)
    }
  }

  function handleEndChange(v){
    const val = Number(v)
    if(val < startMonth){
      setStartMonth(val)
      setEndMonth(val)
    }else{
      setEndMonth(val)
    }
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">
            Mes
            {globalMonth !== 'ALL' && <button className="sidebar-clear" onClick={() => setGlobalMonth('ALL')}>Limpiar</button>}
          </div>
          <div className="sidebar-list">
            {availableMonths.map(m => {
              const [y, mo] = m.split('-')
              return (
                <button
                  key={m}
                  className={`sidebar-item${globalMonth === m ? ' active' : ''}`}
                  onClick={() => setGlobalMonth(globalMonth === m ? 'ALL' : m)}
                >{MONTHS[Number(mo)-1]} {y}</button>
              )
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">
            Cliente
            {filterCliente !== 'ALL' && <button className="sidebar-clear" onClick={() => setFilterCliente('ALL')}>Limpiar</button>}
          </div>
          <div className="sidebar-list">
            {activeClients.map(c => (
              <button
                key={c}
                className={`sidebar-item${filterCliente === c ? ' active' : ''}`}
                onClick={() => setFilterCliente(filterCliente === c ? 'ALL' : c)}
                title={c}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">
            Técnico
            {filterTecnico !== 'ALL' && <button className="sidebar-clear" onClick={() => setFilterTecnico('ALL')}>Limpiar</button>}
          </div>
          <div className="sidebar-list">
            {PEOPLE.map(p => (
              <button
                key={p}
                className={`sidebar-item${filterTecnico === p ? ' active' : ''}`}
                onClick={() => setFilterTecnico(filterTecnico === p ? 'ALL' : p)}
              >{p}</button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">
            Tipo Servicio
            {filterServicio !== 'ALL' && <button className="sidebar-clear" onClick={() => setFilterServicio('ALL')}>Limpiar</button>}
          </div>
          <div className="sidebar-list">
            {activeServices.map(s => (
              <button
                key={s}
                className={`sidebar-item${filterServicio === s ? ' active' : ''}`}
                onClick={() => setFilterServicio(filterServicio === s ? 'ALL' : s)}
                title={s}
              >{s}</button>
            ))}
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
      <div className="grid">
      <div className="col-12 card">
        <div className="row" style={{gap:10, flexWrap:'wrap', alignItems:'center'}}>
          <div style={{flex:1}}>
            <h1 className="h1">Panel Operación Técnica</h1>
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {globalMonth !== 'ALL' && <Chip tone="blue">{(() => { const [y,mo] = globalMonth.split('-'); return `${MONTHS[Number(mo)-1]} ${y}` })()}</Chip>}
            {filterCliente !== 'ALL' && <Chip tone="blue">{filterCliente}</Chip>}
            {filterTecnico !== 'ALL' && <Chip tone="blue">{filterTecnico}</Chip>}
            {filterServicio !== 'ALL' && <Chip tone="blue">{filterServicio}</Chip>}
          </div>
          {loading ? <Chip tone="warn">Sincronizando</Chip> : null}
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className="col-12">
        <div className="kpi-strip">
          <KpiCard icon="📋" label="Total OTs" value={kpiTotals.total} sub={`${kpiTotals.closed} cerradas${deudaCount ? ` · ${deudaCount} deuda` : ''}`} onClick={() => setShowTotalOtsModal(true)} />
          <KpiCard icon="✅" label="Ratio cierre" value={`${kpiTotals.ratioCierre}%`} sub={`${kpiTotals.pending} pendientes`} onClick={() => setShowRatioModal(true)} />
          <KpiCard icon="⏱️" label="Horas totales" value={`${kpiTotals.totalHoras.toFixed(0)}h`} sub={`Prom ${avgTiempo}h/OT`} onClick={() => setShowHorasModal(true)} />
          <KpiCard icon="📊" label="OT / mes" value={avgOt} sub={`${otPorMes.length} meses`} onClick={() => setShowOtMesModal(true)} />
          <KpiCard icon="🔄" label="Re-trabajos" value={kpiTotals.rework} sub={alertData.overdue.length ? `${alertData.overdue.length} atrasadas` : 'Sin atrasos'} onClick={() => { setAlertFilter('OVERDUE'); setShowAlertsModal(true) }} />
        </div>
      </div>

      {/* ── DONUTS + BARS ROW ── */}
      <div className="col-12">
        <div className="bi-grid">
          <div className="card">
            <h3 style={{margin:'0 0 12px', fontSize:16, fontWeight:800}}>Estado de OTs</h3>
            <DonutChart data={donutByStatus} />
          </div>
          <div className="card">
            <h3 style={{margin:'0 0 12px', fontSize:16, fontWeight:800}}>Tipo de servicio</h3>
            <DonutChart data={donutByService} />
          </div>
        </div>
      </div>

      {/* ── OT POR MES + DURACION ── */}
      <div className="col-12">
        <div className="bi-grid">
          <div className="card card-hero">
            <div className="row">
              <div>
                <div className="muted" style={{fontSize:12, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600}}>
                  OT definidas por mes
                </div>
                <div className="stat-number-large" style={{fontSize:36}}>{avgOt}</div>
                <div className="muted" style={{fontSize:13}}>promedio / mes</div>
              </div>
            </div>
            <BarChart data={otPorMes} valueKey="ot" labelKey="mes" colorClass="bar-primary" />
          </div>
          <div className="card card-hero">
            <div className="row">
              <div>
                <div className="muted" style={{fontSize:12, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600}}>
                  Duración promedio OT
                </div>
                <div className="stat-number-large" style={{fontSize:36}}>{avgTiempo}h</div>
                <div className="muted" style={{fontSize:13}}>horas / OT</div>
              </div>
            </div>
            <BarChart data={tiempoProm} valueKey="horas" labelKey="mes" colorClass="bar-green" suffix="h" />
          </div>
        </div>
      </div>

      {/* ── HORAS PRODUCTIVAS + PRESUPUESTO ── */}
      <div className="col-12">
        <div className="bi-grid">
          <div className="card">
            <div className="row" style={{marginBottom:10, gap:8, flexWrap:'wrap'}}>
              <h3 style={{margin:0, fontSize:16, fontWeight:800}}>Horas productivas vs programadas</h3>
              <Chip tone={kpiReal.pct >= 100 ? 'ok' : kpiReal.pct >= 90 ? 'blue' : 'warn'}>{kpiReal.pct}%</Chip>
            </div>
            {kpiReal.byTech.length === 0 ? (
              <div className="muted">Sin OTs cerradas.</div>
            ) : (
              <DualHorizontalBars data={kpiReal.byTech} suffix="h" onRowClick={(tech) => { setSelectedTech(tech); setShowTechModal(true) }} />
            )}
          </div>
          <div className="card card-hero">
            <div className="row" style={{marginBottom:10, gap:8, flexWrap:'wrap'}}>
              <h3 style={{margin:0, fontSize:16, fontWeight:800}}>Presupuesto plan vs real</h3>
              <Chip tone={budgetKpis.deltaPct <= 0 ? 'ok' : 'bad'}>{budgetKpis.deltaPct >= 0 ? '+' : ''}{budgetKpis.deltaPct}%</Chip>
            </div>
            {budgetKpis.totalReal === 0 && budgetKpis.totalPlan === 0 ? (
              <div className="muted">Sin datos de presupuesto.</div>
            ) : (
              <div style={{display:'grid', gap:8}}>
                <div className="row" style={{gap:6}}><Chip tone="blue">Plan: {budgetKpis.totalPlan.toFixed(0)}</Chip><Chip tone="warn">Real: {budgetKpis.totalReal.toFixed(0)}</Chip></div>
                <div className="muted" style={{fontSize:11, marginTop:4}}>Top clientes</div>
                {budgetKpis.topClients.slice(0,3).map(row => (
                  <div className="mini-chart-row" key={row.label} onClick={() => { setBudgetFilter({type:'CLIENT',label:row.label}); setShowBudgetDetails(true) }} style={{cursor:'pointer'}}>
                    <div className="mini-chart-label">{row.label}</div>
                    <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{width: Math.max(4,Math.round((row.value/Math.max(...budgetKpis.topClients.map(d=>d.value),1))*100))+'%'}} /></div>
                    <div className="mini-chart-value">{row.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CHECKLIST + ALERTAS ── */}
      <div className="col-12">
        <div className="bi-grid">
          <div className="card">
            <div className="row" style={{marginBottom:10, gap:8, flexWrap:'wrap'}}>
              <h3 style={{margin:0, fontSize:16, fontWeight:800}}>Checklist técnico</h3>
              <Chip tone={kpiReal.checklist?.pct >= 90 ? 'ok' : 'warn'}>{kpiReal.checklist ? kpiReal.checklist.pct : 0}%</Chip>
            </div>
            {!kpiReal.checklist ? (
              <div className="muted">Sin checklist capturado.</div>
            ) : (
              <div style={{display:'grid', gap:8}}>
                <HorizontalBars data={[{label:'Cumplimiento', value:kpiReal.checklist.pct}]} valueKey="value" labelKey="label" suffix="%" />
                <div className="row" style={{gap:6, flexWrap:'wrap'}}>
                  <button type="button" className="chip warn" disabled={!kpiReal.checklist.missingTool} onClick={() => { setIssueFilter('MISSING'); setShowChecklistIssues(true) }} style={{cursor: kpiReal.checklist.missingTool ? 'pointer' : 'default'}}>Faltó: {kpiReal.checklist.missingTool}</button>
                  <button type="button" className="chip bad" disabled={!kpiReal.checklist.badTool} onClick={() => { setIssueFilter('BAD'); setShowChecklistIssues(true) }} style={{cursor: kpiReal.checklist.badTool ? 'pointer' : 'default'}}>Mal estado: {kpiReal.checklist.badTool}</button>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <h3 style={{margin:'0 0 10px', fontSize:16, fontWeight:800}}>Alertas operativas</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <button type="button" className="chip warn" disabled={!alertData.pending.length} onClick={() => { setAlertFilter('PENDING'); setShowAlertsModal(true) }} style={{cursor: alertData.pending.length ? 'pointer' : 'default', padding:'10px 14px', fontSize:14, fontWeight:700}}>⚠️ Pendientes: {alertData.pending.length}</button>
              <button type="button" className="chip bad" disabled={!alertData.rework.length} onClick={() => { setAlertFilter('REWORK'); setShowAlertsModal(true) }} style={{cursor: alertData.rework.length ? 'pointer' : 'default', padding:'10px 14px', fontSize:14, fontWeight:700}}>🔄 Re-trabajo: {alertData.rework.length}</button>
              <button type="button" className="chip warn" disabled={!alertData.overdue.length} onClick={() => { setAlertFilter('OVERDUE'); setShowAlertsModal(true) }} style={{cursor: alertData.overdue.length ? 'pointer' : 'default', padding:'10px 14px', fontSize:14, fontWeight:700}}>📅 Atrasadas: {alertData.overdue.length}</button>
            </div>
            {reworkItems.length > 0 && (
              <div style={{marginTop:12}}>
                <div className="muted" style={{fontSize:11, marginBottom:6}}>Últimos re-trabajos</div>
                {reworkItems.slice(0,2).map(it => (
                  <div key={it.id} style={{padding:'6px 0', borderBottom:'1px solid var(--line)', fontSize:12}}>
                    <span style={{fontWeight:700}}>{it.id}</span> <span className="muted">- {it.cliente}</span> <span className="chip bad" style={{fontSize:10, padding:'2px 6px'}}>{it.motivo || 'Sin motivo'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SEGUIMIENTO MENSUAL ── */}
      <div className="col-12 card">
        <h3 style={{margin:'0 0 12px', fontSize:16, fontWeight:800}}>Seguimiento mensual por servicio</h3>
        {donutByService.length === 0 ? (
          <div className="muted">Sin datos de servicios.</div>
        ) : (
          <div className="mini-chart">
            {donutByService.slice(0,8).map((svc, i) => {
              const max = Math.max(...donutByService.map(d => d.value), 1)
              const pct = Math.max(4, Math.round((svc.value / max) * 100))
              return (
                <div className="mini-chart-row" key={svc.label}>
                  <div className="mini-chart-label">{svc.label}</div>
                  <div className="mini-chart-bar">
                    <div className="mini-bar" style={{width: pct + '%', background: DONUT_COLORS[i % DONUT_COLORS.length], position:'absolute', left:0, top:0, bottom:0, borderRadius:'999px'}} title={`${svc.value} OTs`} />
                  </div>
                  <div className="mini-chart-value">{svc.value} OTs</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── KPIS TECNICO + RANKING ── */}
      <div className="col-12">
        <div className="bi-grid">
          <div className="card">
            <h3 style={{margin:'0 0 10px', fontSize:16, fontWeight:800}}>KPIs por técnico</h3>
            {techSummaries.length === 0 ? (
              <div className="muted">Sin datos por técnico.</div>
            ) : (
              <div className="mini-chart">
                {techSummaries.map(row => (
                  <div className="mini-chart-row" key={row.tech} onClick={() => { setSelectedTech(row.tech); setShowTechModal(true) }} style={{cursor:'pointer'}}>
                    <div className="mini-chart-label">{row.tech}</div>
                    <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{width: Math.max(4,Math.round((row.real/techMaxReal)*100))+'%'}} title={`${row.real.toFixed(1)}h`} /></div>
                    <div className="mini-chart-value">{row.real.toFixed(1)} / {row.prog.toFixed(1)}h</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <div className="row" style={{marginBottom:10, gap:8, flexWrap:'wrap', alignItems:'center'}}>
              <h3 style={{margin:0, fontSize:16, fontWeight:800}}>Ranking atención servicios</h3>
              <Chip tone="blue">{rankingPorMes.totalServicios} OTs</Chip>
            </div>
            {rankingPorMes.rows.length === 0 ? (
              <div className="muted">Sin servicios ejecutados.</div>
            ) : (
              <div className="mini-chart">
                {rankingPorMes.rows.map((row, idx) => {
                  const maxServ = Math.max(...rankingPorMes.rows.map(r => r.servicios), 1)
                  const pct = Math.max(4, Math.round((row.servicios / maxServ) * 100))
                  return (
                    <div className="mini-chart-row" key={row.tech}>
                      <div className="mini-chart-label" style={{display:'flex', alignItems:'center', gap:6}}>
                        <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, borderRadius:'50%', background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : idx === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(255,255,255,0.1)', fontSize:10, fontWeight:900, color:'#04101d'}}>{idx + 1}</span>
                        {row.tech}
                      </div>
                      <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{width: pct + '%'}} title={`${row.servicios} servicios`} /></div>
                      <div className="mini-chart-value">{row.servicios} OTs · {row.horas.toFixed(1)}h</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showChecklistIssues} title="Checklist con incidentes" onClose={() => setShowChecklistIssues(false)}>
        {!kpiReal.checklist?.issues?.length ? (
          <div className="muted">No hay incidencias registradas.</div>
        ) : (
          <>
            {!filteredChecklistIssues.length ? (
              <div className="muted">No hay incidencias para este filtro.</div>
            ) : (
              <div style={{ display:'grid', gap:10 }}>
                {filteredChecklistIssues.map(it => (
                  <div key={it.id} className="card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)' }}>
                    <div className="row" style={{ justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{it.id || 'OT'}</div>
                        <div className="muted">{it.cliente} - {it.referencia}</div>
                      </div>
                      <div className="muted">{it.fecha || 'N/D'}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                      <span className={`chip ${it.toolReady ? 'ok' : 'bad'}`}>{it.toolReady ? 'Herramienta OK' : 'Herramienta en mal estado'}</span>
                      <span className={`chip ${it.toolsComplete ? 'ok' : 'warn'}`}>{it.toolsComplete ? 'Completo' : 'Faltó herramienta'}</span>
                      {it.responsable && <span className="chip">{it.responsable}</span>}
                    </div>
                    {it.toolNote && <div className="muted" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{it.toolNote}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowChecklistIssues(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showAlertsModal} title="Alertas de OTs" onClose={() => setShowAlertsModal(false)}>
        {!filteredAlerts.length ? (
          <div className="muted">No hay OTs para este filtro.</div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {filteredAlerts.map(it => (
              <div key={it.id || it.code} className="card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)' }}>
                <div className="row" style={{ justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.code || it.id || 'OT'}</div>
                    <div className="muted">{it.cliente || ''} - {it.referencia || ''}</div>
                  </div>
                  <div className="muted">{it.fechaCompromiso || it.fechaFin || it.fechaPlan || 'N/D'}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                  <span className="chip">{it.estado || 'N/D'}</span>
                  {it.responsable && <span className="chip">{it.responsable}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowAlertsModal(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal
        open={showTechModal}
        title={
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px'
          }}>
            👤 Dashboard técnico: {selectedTech || 'N/D'}
          </span>
        }
        onClose={() => { setShowTechModal(false); setShowWorkedHoursDetail(false) }}
      >
        <div className="grid" style={{ gap: 10 }}>
          <div className="col-12" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="field" style={{ minWidth: 180 }}>
              <label>Técnico</label>
              <select className="input" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 180 }}>
              <label>Filtrar por cliente</label>
              <select className="input" value={techFilters.cliente} onChange={(e) => setTechFilters(f => ({ ...f, cliente: e.target.value }))}>
                <option value="ALL">Todos</option>
                {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 200 }}>
              <label>Filtrar por tipo de trabajo</label>
              <select className="input" value={techFilters.servicio} onChange={(e) => setTechFilters(f => ({ ...f, servicio: e.target.value }))}>
                <option value="ALL">Todos</option>
                {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="col-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
            <div
              className="card card-hero"
              style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', border: showWorkedHoursDetail ? '1px solid #10b981' : undefined }}
              onClick={() => setShowWorkedHoursDetail(v => !v)}
              title="Ver detalle de horas trabajadas"
            >
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>⏱️ Horas Trabajadas</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashData.totalHours.toFixed(1)}h</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{showWorkedHoursDetail ? '▲ ocultar detalle' : '▼ ver detalle'}</div>
            </div>
            <div className="card card-hero" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>⚡ Horas Extras</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashData.totalExtra.toFixed(1)}h</div>
            </div>
            <div className="card card-hero" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>✅ Disponibles</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashData.availableExtra.toFixed(1)}h</div>
            </div>
          </div>

          {showWorkedHoursDetail && (
            <div className="col-12 card" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⏱️ Detalle de horas trabajadas
                <span className="chip" style={{ fontSize: 12 }}>{techDashData.filteredOTs.length} OTs</span>
              </h4>
              {techDashData.filteredOTs.length === 0 ? (
                <div className="muted">Sin OTs con horas registradas.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                  {techDashData.filteredOTs.map((it, idx) => {
                    const horasPorTecnico = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
                    const techEntry = horasPorTecnico.find(h => h.tech === selectedTech)
                    const numP = Math.max(1, Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean))).length)
                    const hrsReal = techEntry
                      ? Number(techEntry.horas || 0)
                      : Number(it.horasReales || 0) / numP
                    const hrsExtra = techEntry
                      ? Number(techEntry.horasExtra || 0)
                      : Number(it.horasExtraReales || 0) / numP
                    const total = hrsReal + hrsExtra
                    return (
                      <div key={it.id || idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.07)',
                        gap: 10,
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{it.numeroOT || `OT-${idx + 1}`}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{it.cliente || '—'}</div>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 200, textAlign: 'right' }}>
                          {(it.tipoServicios || []).join(', ') || '—'}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 80 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>{total.toFixed(1)}h</div>
                          {hrsExtra > 0 && <div className="muted" style={{ fontSize: 11 }}>+{hrsExtra.toFixed(1)}h extra</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="col-12 card card-hero">
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              🏆 Top Clientes y Servicios
            </h4>
            <div className="grid" style={{ gap: 16 }}>
              <div className="col-6">
                <div className="muted" style={{ marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#cbd5e1' }}>🏢 Clientes (top 3)</div>
                {techDashData.topClients.length === 0 && <div className="muted">Sin datos</div>}
                {techDashData.topClients.map((c, idx) => (
                  <div key={c.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 10,
                    padding: '10px 12px',
                    background: 'rgba(16,185,129,0.08)',
                    borderRadius: 10,
                    border: '1px solid rgba(16,185,129,0.2)',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 15,
                      marginRight: 12,
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                      color: '#04101d'
                    }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{c.ots} OTs · {c.hours.toFixed(1)}h</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-6">
                <div className="muted" style={{ marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#cbd5e1' }}>🔧 Servicios (top 3)</div>
                {techDashData.topServices.length === 0 && <div className="muted">Sin datos</div>}
                {techDashData.topServices.map((s, idx) => (
                  <div key={s.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 10,
                    padding: '10px 12px',
                    background: 'rgba(14,165,233,0.08)',
                    borderRadius: 10,
                    border: '1px solid rgba(14,165,233,0.2)',
                    transition: 'all 0.2s ease',
                    cursor: 'default'
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0ea5e9, #10b981)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: 15,
                      marginRight: 12,
                      boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                      color: '#04101d'
                    }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>{s.ots} OTs · {s.hours.toFixed(1)}h</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 card">
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.3px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              📊 Estadísticas del Técnico
            </h4>
            {techDashData.serviceStats.length === 0 && <div className="muted">Sin datos</div>}
            {techDashData.serviceStats.map((s, idx) => {
              const max = Math.max(...techDashData.serviceStats.map(x => x.count), 1)
              const pct = (s.count / max) * 100
              return (
                <div key={s.name} style={{
                  marginBottom: 10,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 24,
                        height: 24,
                        lineHeight: '24px',
                        textAlign: 'center',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                        fontSize: 12,
                        fontWeight: 900,
                        marginRight: 8,
                        color: '#04101d'
                      }}>{idx + 1}</span>
                      {s.name}
                    </div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>{s.count} OTs</div>
                  </div>
                  <div style={{
                    height: 12,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    border: '1px solid var(--line)'
                  }}>
                    <div style={{
                      height: 12,
                      width: `${Math.max(4, pct)}%`,
                      background: 'linear-gradient(90deg, #10b981, #0ea5e9)',
                      boxShadow: '0 0 10px rgba(16,185,129,0.4)',
                      borderRadius: '999px'
                    }}></div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="col-12 card" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h4 style={{ margin: '0 0 6px 0' }}>Solicitudes de horas extra</h4>
            {!extraByTech.length ? (
              <div className="muted">Sin solicitudes registradas.</div>
            ) : (
              <div style={{ display:'grid', gap:8 }}>
                {extraByTech.map(req => (
                  <div key={req.id || `${req.tech}-${req.fecha}-${req.horas}`} className="card" style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}>
                    <div className="row" style={{ justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{req.fecha || 'N/D'}</div>
                        <div className="muted">{req.motivo || 'Sin motivo'}</div>
                      </div>
                      <div className="muted">{req.horas || 0}h</div>
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                      <span className="chip">{req.estado || 'N/D'}</span>
                      {req.nota && <span className="chip">{req.nota}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => { setShowTechModal(false); setShowWorkedHoursDetail(false) }}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showHorasModal} title={`Desglose de horas${globalMonth !== 'ALL' ? ` (${(() => { const [y,mo] = globalMonth.split('-'); return `${MONTHS[Number(mo)-1]} ${y}` })()})` : ' (todos los meses)'}`} onClose={() => { setShowHorasModal(false); setDrillTech(null) }}>
        <div style={{ marginBottom: 12 }}>
          <Chip tone="blue" style={{ fontSize: 14, fontWeight: 700 }}>{kpiTotals.totalHoras.toFixed(1)}h totales</Chip>
          {globalMonth === 'ALL' && <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>Usa el filtro de Mes en el sidebar para ver solo un mes.</div>}
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Por técnico</h4>
        {horasBreakdown.byTech.length === 0 ? (
          <div className="muted">Sin horas registradas.</div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div className="mini-chart">
              {horasBreakdown.byTech.map(row => {
                const max = Math.max(...horasBreakdown.byTech.map(r => r.value), 1)
                const pct = Math.max(4, Math.round((row.value / max) * 100))
                const isSelected = drillTech === row.label
                return (
                  <div
                    className="mini-chart-row"
                    key={row.label}
                    onClick={() => setDrillTech(isSelected ? null : row.label)}
                    style={{ cursor: 'pointer', borderRadius: 6, padding: '2px 4px', background: isSelected ? 'rgba(0,200,200,0.1)' : 'transparent', transition: 'background 0.15s' }}
                  >
                    <div className="mini-chart-label" style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--accent)' : undefined }}>{row.label}</div>
                    <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{ width: pct + '%' }} /></div>
                    <div className="mini-chart-value">{row.value.toFixed(1)}h</div>
                  </div>
                )
              })}
            </div>
            {drillTech && horasBreakdown?.byTechOts?.[drillTech]?.length > 0 && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(0,200,200,0.06)', borderRadius: 10, border: '1px solid rgba(0,200,200,0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: 'var(--accent)' }}>
                  Detalle de {drillTech} — {horasBreakdown.byTechOts[drillTech].length} OTs
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {horasBreakdown.byTechOts[drillTech].map((ot, i) => {
                    const fechaStr = ot.fecha ? (() => {
                      const [y, m, d] = ot.fecha.split('T')[0].split('-')
                      return d ? `${d}/${m}/${y}` : ot.fecha
                    })() : '—'
                    return (
                      <div key={ot.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12 }}>
                        <div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                            {ot.codigo && <span style={{ fontWeight: 800, fontSize: 11, color: 'var(--accent)', opacity: 0.8 }}>{ot.codigo}</span>}
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{ot.cliente || '—'}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{fechaStr}</span>
                          </div>
                          {ot.referencia && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{ot.referencia}</div>}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {ot.servicios.map(s => (
                              <span key={s} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,200,200,0.15)', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', alignSelf: 'center', whiteSpace: 'nowrap' }}>{ot.horas.toFixed(1)}h</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Por cliente (top 10)</h4>
        {horasBreakdown.byClient.length === 0 ? (
          <div className="muted">Sin horas registradas.</div>
        ) : (
          <div className="mini-chart">
            {horasBreakdown.byClient.map(row => {
              const max = Math.max(...horasBreakdown.byClient.map(r => r.value), 1)
              const pct = Math.max(4, Math.round((row.value / max) * 100))
              return (
                <div className="mini-chart-row" key={row.label}>
                  <div className="mini-chart-label">{row.label}</div>
                  <div className="mini-chart-bar"><div className="mini-bar bar-green" style={{ width: pct + '%' }} /></div>
                  <div className="mini-chart-value">{row.value.toFixed(1)}h</div>
                </div>
              )
            })}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => { setShowHorasModal(false); setDrillTech(null) }}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showTotalOtsModal} title="Total OTs - Detalle" onClose={() => setShowTotalOtsModal(false)}>
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Mide el total de Ordenes de Trabajo registradas en el periodo seleccionado (excluye OTs marcadas como deuda).</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip tone="ok">{kpiTotals.closed} Cerradas</Chip>
            <Chip tone="warn">{kpiTotals.pending} Pendientes</Chip>
            <Chip tone="bad">{kpiTotals.rework} Re-trabajo</Chip>
            {deudaCount > 0 && <Chip tone="blue">{deudaCount} Deuda (excluidas)</Chip>}
          </div>
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>OTs por estado</h4>
        {donutByStatus.length === 0 ? (
          <div className="muted">Sin OTs.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {donutByStatus.map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontWeight: 800 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        <h4 style={{ margin: '16px 0 8px', fontSize: 15, fontWeight: 800 }}>OTs por cliente</h4>
        {(() => {
          const clientMap = new Map()
          otFiltered.forEach(it => { if (it.cliente) clientMap.set(it.cliente, (clientMap.get(it.cliente) || 0) + 1) })
          const rows = Array.from(clientMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10)
          if (!rows.length) return <div className="muted">Sin datos.</div>
          const max = Math.max(...rows.map(r => r.value), 1)
          return (
            <div className="mini-chart">
              {rows.map(row => (
                <div className="mini-chart-row" key={row.label}>
                  <div className="mini-chart-label">{row.label}</div>
                  <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{ width: Math.max(4, Math.round((row.value / max) * 100)) + '%' }} /></div>
                  <div className="mini-chart-value">{row.value} OTs</div>
                </div>
              ))}
            </div>
          )
        })()}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowTotalOtsModal(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showRatioModal} title="Ratio de cierre - Detalle" onClose={() => setShowRatioModal(false)}>
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Mide el porcentaje de OTs cerradas vs el total. Las OTs pendientes (Abiertas + En proceso) son las que faltan por cerrar.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip tone="ok">Cerradas: {kpiTotals.closed} / {kpiTotals.total}</Chip>
            <Chip tone="blue">{kpiTotals.ratioCierre}%</Chip>
          </div>
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>OTs pendientes ({kpiTotals.pending})</h4>
        {alertData.pending.length === 0 ? (
          <div className="muted">Todas las OTs están cerradas.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {alertData.pending.map(it => (
              <div key={it.id || it.code} className="card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)' }}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.code || it.id}</div>
                    <div className="muted">{it.cliente} - {it.referencia}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="chip">{it.estado}</span>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Fin: {it.fechaFin || it.fechaCompromiso || 'N/D'}</div>
                  </div>
                </div>
                {it.responsable && <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>Responsable: {it.responsable}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowRatioModal(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showOtMesModal} title="OT por mes - Detalle" onClose={() => setShowOtMesModal(false)}>
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Mide cuántas OTs se crean por mes (basado en la fecha de planificación). El valor mostrado es el promedio mensual.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip tone="blue">Promedio: {avgOt} OTs/mes</Chip>
            <Chip tone="blue">{otPorMes.length} meses con datos</Chip>
          </div>
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 800 }}>Desglose mensual</h4>
        {otPorMes.length === 0 ? (
          <div className="muted">Sin datos mensuales.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {otPorMes.map(row => {
              const max = Math.max(...otPorMes.map(r => r.ot), 1)
              const pct = Math.max(4, Math.round((row.ot / max) * 100))
              return (
                <div className="mini-chart-row" key={row.mes}>
                  <div className="mini-chart-label">{row.mes}</div>
                  <div className="mini-chart-bar"><div className="mini-bar bar-primary" style={{ width: pct + '%' }} /></div>
                  <div className="mini-chart-value">{row.ot} OTs</div>
                </div>
              )
            })}
          </div>
        )}
        <h4 style={{ margin: '16px 0 8px', fontSize: 15, fontWeight: 800 }}>Duración promedio por mes</h4>
        {tiempoProm.length === 0 ? (
          <div className="muted">Sin datos.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {tiempoProm.map(row => (
              <div key={row.mes} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>{row.mes}</span>
                <span style={{ fontWeight: 800 }}>{row.horas}h promedio/OT</span>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowOtMesModal(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={showBudgetDetails} title={`Detalle presupuesto: ${budgetFilter.label || 'N/D'}`} onClose={() => setShowBudgetDetails(false)}>
        {!budgetDetails.length ? (
          <div className="muted">No hay OTs cerradas para este filtro.</div>
        ) : (
          <div style={{ display:'grid', gap:10 }}>
            {budgetDetails.map(it => (
              <div key={it.id} className="card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)' }}>
                <div className="row" style={{ justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.id || 'OT'}</div>
                    <div className="muted">{it.cliente} - {it.referencia}</div>
                  </div>
                  <div className="muted">{it.fecha || 'N/D'}</div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                  <span className="chip">Plan: {it.plan.toFixed(2)}</span>
                  <span className="chip">Real: {it.real.toFixed(2)}</span>
                  <span className={`chip ${it.diff <= 0 ? 'ok' : 'bad'}`}>
                    Dif: {it.diff >= 0 ? '+' : ''}{it.diff.toFixed(2)} ({it.pct >= 0 ? '+' : ''}{it.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowBudgetDetails(false)}>Cerrar</button>
        </div>
      </Modal>
    </div>
    </div>
    </div>
  )
}
