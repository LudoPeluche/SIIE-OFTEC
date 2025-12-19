import { useMemo, useState } from 'react'
import Chip from '../components/Chip.jsx'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

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

export default function Dashboard(){
  // Mock OT y tiempos por cliente/tecnico (2026)
  const baseOtRaw = [
    { mes:'Ene', cliente:'EMPACAR', tecnico:'JESSE', ot:4, horas:14 },
    { mes:'Ene', cliente:'SOFIA', tecnico:'BRAYAN', ot:3, horas:13 },
    { mes:'Ene', cliente:'TECNOPOR', tecnico:'DIEGO', ot:2, horas:15 },
    { mes:'Feb', cliente:'EMPACAR', tecnico:'JESSE', ot:5, horas:12 },
    { mes:'Feb', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:11 },
    { mes:'Feb', cliente:'G77', tecnico:'LUDWIN', ot:3, horas:13 },
    { mes:'Mar', cliente:'EMPACAR', tecnico:'JESSE', ot:6, horas:10 },
    { mes:'Mar', cliente:'SOFIA', tecnico:'BRAYAN', ot:5, horas:10 },
    { mes:'Mar', cliente:'G77', tecnico:'LUDWIN', ot:4, horas:12 },
    { mes:'Abr', cliente:'EMPACAR', tecnico:'DIEGO', ot:3, horas:16 },
    { mes:'Abr', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:15 },
    { mes:'Abr', cliente:'G77', tecnico:'LUDWIN', ot:3, horas:17 },
    { mes:'May', cliente:'EMPACAR', tecnico:'JESSE', ot:5, horas:11 },
    { mes:'May', cliente:'SOFIA', tecnico:'BRAYAN', ot:5, horas:10 },
    { mes:'May', cliente:'TECNOPOR', tecnico:'DIEGO', ot:4, horas:12 },
    { mes:'Jun', cliente:'EMPACAR', tecnico:'JESSE', ot:7, horas:9 },
    { mes:'Jun', cliente:'SOFIA', tecnico:'BRAYAN', ot:6, horas:9 },
    { mes:'Jun', cliente:'G77', tecnico:'LUDWIN', ot:4, horas:10 },
    { mes:'Jul', cliente:'EMPACAR', tecnico:'JESSE', ot:5, horas:11 },
    { mes:'Jul', cliente:'SOFIA', tecnico:'DIEGO', ot:4, horas:12 },
    { mes:'Jul', cliente:'G77', tecnico:'LUDWIN', ot:3, horas:13 },
    { mes:'Ago', cliente:'EMPACAR', tecnico:'JESSE', ot:4, horas:13 },
    { mes:'Ago', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:12 },
    { mes:'Ago', cliente:'TECNOPOR', tecnico:'DIEGO', ot:3, horas:14 },
    { mes:'Sep', cliente:'EMPACAR', tecnico:'JESSE', ot:5, horas:11 },
    { mes:'Sep', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:10 },
    { mes:'Sep', cliente:'G77', tecnico:'LUDWIN', ot:3, horas:12 },
    { mes:'Oct', cliente:'EMPACAR', tecnico:'DIEGO', ot:6, horas:10 },
    { mes:'Oct', cliente:'SOFIA', tecnico:'BRAYAN', ot:5, horas:11 },
    { mes:'Oct', cliente:'G77', tecnico:'LUDWIN', ot:4, horas:10 },
    { mes:'Nov', cliente:'EMPACAR', tecnico:'JESSE', ot:5, horas:12 },
    { mes:'Nov', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:12 },
    { mes:'Nov', cliente:'TECNOPOR', tecnico:'DIEGO', ot:3, horas:13 },
    { mes:'Dic', cliente:'EMPACAR', tecnico:'JESSE', ot:4, horas:11 },
    { mes:'Dic', cliente:'SOFIA', tecnico:'BRAYAN', ot:4, horas:9 },
    { mes:'Dic', cliente:'G77', tecnico:'LUDWIN', ot:3, horas:10 },
  ]

  const horasProd = [
    { label:'LUDWIN', prod: 118, prog: 140 },
    { label:'JESSE', prod: 124, prog: 140 },
    { label:'BRAYAN', prod: 110, prog: 140 },
    { label:'DIEGO', prod: 92, prog: 140 },
  ]
  const checklist = [
    { label:'Cumplimiento checklist', value: 86 },
    { label:'Calidad llenado', value: 78 },
  ]

  const monthOptions = MONTHS.map((m, idx) => ({ label: m, idx }))
  const clients = Array.from(new Set(baseOtRaw.map(o => o.cliente)))
  const [startMonth, setStartMonth] = useState(0)
  const [endMonth, setEndMonth] = useState(5) // primer semestre
  const [techFilter, setTechFilter] = useState('ALL')
  const [clientFilter, setClientFilter] = useState('ALL')
  const [otTechFilter, setOtTechFilter] = useState('ALL')

  const filteredOtRaw = useMemo(() => {
    return baseOtRaw.filter(o => {
      const idx = MONTHS.indexOf(o.mes)
      const inRange = idx >= startMonth && idx <= endMonth
      const clientOk = clientFilter === 'ALL' || o.cliente === clientFilter
      const techOk = otTechFilter === 'ALL' || o.tecnico === otTechFilter
      return inRange && clientOk && techOk
    })
  }, [baseOtRaw, startMonth, endMonth, clientFilter, otTechFilter])

  const otPorMes = useMemo(() => {
    return MONTHS.map((mes, idx) => {
      if(idx < startMonth || idx > endMonth) return null
      const rows = filteredOtRaw.filter(o => o.mes === mes)
      const total = rows.reduce((a,b)=>a + b.ot, 0)
      return { mes, ot: total }
    }).filter(Boolean)
  }, [filteredOtRaw, startMonth, endMonth])

  const tiempoProm = useMemo(() => {
    return MONTHS.map((mes, idx) => {
      if(idx < startMonth || idx > endMonth) return null
      const rows = filteredOtRaw.filter(o => o.mes === mes)
      const totalOt = rows.reduce((a,b)=>a + b.ot, 0)
      const weighted = rows.reduce((a,b)=>a + (b.horas * b.ot), 0)
      const prom = totalOt ? Math.round(weighted / totalOt) : 0
      return { mes, horas: prom }
    }).filter(Boolean)
  }, [filteredOtRaw, startMonth, endMonth])

  const horasProdFiltrado = useMemo(() => {
    if(techFilter === 'ALL') return horasProd
    return horasProd.filter(h => h.label === techFilter)
  }, [horasProd, techFilter])

  const avgHorasProd = Math.round((horasProdFiltrado.reduce((a,b)=>a + b.prod,0) / horasProdFiltrado.reduce((a,b)=>a + b.prog,0)) * 100)
  const avgTiempo = tiempoProm.length ? Math.round(tiempoProm.reduce((a,b)=>a + b.horas,0) / tiempoProm.length) : 0
  const avgOt = otPorMes.length ? Math.round(otPorMes.reduce((a,b)=>a+b.ot,0)/otPorMes.length) : 0
  const periodLabel = `${monthOptions[startMonth].label} - ${monthOptions[endMonth].label}`

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
    <div className="grid">
      <div className="col-12 card">
        <div className="row">
          <div>
            <p className="muted" style={{margin:'0 0 6px 0'}}>KPIs 2026 · Mock visual</p>
            <h1 className="h1">Panel Operación Técnica</h1>
            <p className="muted" style={{margin:'8px 0 0 0'}}>Listo para conectar a Firestore/Firebase.</p>
          </div>
          <Chip tone="blue">Demo</Chip>
        </div>
        <div className="row" style={{marginTop:12, gap:10, flexWrap:'wrap'}}>
          <div style={{minWidth:180}}>
            <label>Mes inicial</label>
            <select className="input" value={startMonth} onChange={(e)=>handleStartChange(e.target.value)}>
              {monthOptions.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>)}
            </select>
          </div>
          <div style={{minWidth:180}}>
            <label>Mes final</label>
            <select className="input" value={endMonth} onChange={(e)=>handleEndChange(e.target.value)}>
              {monthOptions.map(m => <option key={m.idx} value={m.idx}>{m.label}</option>)}
            </select>
          </div>
          <div style={{minWidth:200}}>
            <label>Filtrar cliente (OT/Tiempo)</label>
            <select className="input" value={clientFilter} onChange={(e)=>setClientFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              {clients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{minWidth:200}}>
            <label>Filtrar técnico (OT/Tiempo)</label>
            <select className="input" value={otTechFilter} onChange={(e)=>setOtTechFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              {Array.from(new Set(baseOtRaw.map(o=>o.tecnico))).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{minWidth:200}}>
            <label>Filtrar técnico (Horas prod)</label>
            <select className="input" value={techFilter} onChange={(e)=>setTechFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              {horasProd.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
            </select>
          </div>
          <div className="badge">Rango: {periodLabel}</div>
        </div>
      </div>

      <div className="col-6 card">
        <div className="row">
          <div>
            <div className="muted">OT definidas por mes</div>
            <div style={{fontSize:30, fontWeight:900}}>Ø {avgOt} / mes</div>
          </div>
          <Chip tone="warn">Operación</Chip>
        </div>
        <BarChart data={otPorMes} valueKey="ot" labelKey="mes" colorClass="bar-primary" />
      </div>

      <div className="col-6 card">
        <div className="row">
          <div>
            <div className="muted">Tiempo promedio de resolución (hrs)</div>
            <div style={{fontSize:30, fontWeight:900}}>{avgTiempo} h</div>
          </div>
          <Chip tone="ok">Mejorar</Chip>
        </div>
        <BarChart data={tiempoProm} valueKey="horas" labelKey="mes" colorClass="bar-green" suffix="h" />
      </div>

      <div className="col-12 card">
        <div className="row" style={{marginBottom:10}}>
          <h2 style={{margin:0}}>Eficiencia: Horas productivas vs programadas</h2>
          <span className="muted">Promedio {avgHorasProd}%</span>
        </div>
        <div className="mini-chart">
          {horasProdFiltrado.map((t) => {
            const pct = Math.min(120, Math.round((t.prod / t.prog) * 100))
            return (
              <div className="mini-chart-row" key={t.label}>
                <div className="mini-chart-label">{t.label}</div>
                <div className="mini-chart-bar dual" title={`${t.prod}h / ${t.prog}h`}>
                  <div className="mini-bar bar-muted" style={{width:'100%'}} />
                  <div className="mini-bar bar-primary" style={{width: Math.min(100, pct) + '%'}} />
                </div>
                <div className="mini-chart-value">{pct}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
