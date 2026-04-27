import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import Modal from '../components/Modal.jsx'
import Chip from '../components/Chip.jsx'
import { nowISODate } from '../lib/utils.js'
import { listWeeklyPlan, upsertWeeklyRow, deleteWeeklyRow } from '../lib/weeklyPlanService.js'

const TECHS = ['LUDWIN CABA', 'JESSE PORRAS', 'BRAYAN IBARRA', 'DIEGO ORTUÑO']
const PRIORITIES = ['ALTA', 'MEDIA', 'BAJA']
const PRIORITY_LABEL = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }
const PRIORITY_TONE = { ALTA: 'bad', MEDIA: 'warn', BAJA: 'blue' }
const TIPOS = ['SERVICIO', 'INTERNO']
const TIPO_LABEL = { SERVICIO: 'Servicio', INTERNO: 'Tarea Interna' }
const TIPO_TONE = { SERVICIO: 'blue', INTERNO: 'ok' }

const LEGACY_TECH_MAP = {
  LUDWIN:'LUDWIN CABA',
  JESSE:'JESSE PORRAS',
  BRAYAN:'BRAYAN IBARRA',
  DIEGO:'DIEGO ORTUÑO',
  ORTUNO:'DIEGO ORTUÑO'
}

function normalizeAssigned(assigned){
  const base = Object.fromEntries(TECHS.map(t => [t, false]))
  if(!assigned) return base
  Object.entries(assigned).forEach(([k,v]) => {
    const target = LEGACY_TECH_MAP[k] || k
    if(Object.prototype.hasOwnProperty.call(base, target)) base[target] = !!v
  })
  return base
}

const seedRows = []

export default function PlanSemanal({ role = 'ADMIN', tech = '' }){
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(nowISODate())
  const [rows, setRows] = useState(seedRows)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ empresa:'', tarea:'', prioridad: 'MEDIA', tipo: 'SERVICIO' })
  const [filterPrioridad, setFilterPrioridad] = useState('ALL')
  const [filterTipo, setFilterTipo] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const legacyStorageKey = 'planSemanalRowsV2'
  const [booting, setBooting] = useState(true)
  const [dragIdx, setDragIdx] = useState(null)
  const notaTimers = useRef({})

  useEffect(() => {
    let active = true
    async function fetchRemote(){
      try{
        const data = await listWeeklyPlan()
        if(!active) return
        let normalized = (Array.isArray(data) ? data : []).map(r => ({
          ...r,
          status: r.status || (r.done ? 'COMPLETADO' : 'PENDIENTE'),
          assigned: normalizeAssigned(r.assigned),
          prioridad: r.prioridad || 'MEDIA',
          tipo: r.tipo || 'SERVICIO',
          nota: String(r.nota || ''),
          done: undefined
        }))
        if(normalized.length === 0){
          const saved = localStorage.getItem(legacyStorageKey)
          if(saved){
            try{
              const parsed = JSON.parse(saved)
              if(Array.isArray(parsed) && parsed.length){
                const payloads = parsed.map(r => ({
                  numero: String(r.numero || '').trim(),
                  empresa: String(r.empresa || '').trim().toUpperCase(),
                  tarea: String(r.tarea || '').trim().toUpperCase(),
                  assigned: normalizeAssigned(r.assigned),
                  status: r.status || (r.done ? 'COMPLETADO' : 'PENDIENTE'),
                  prioridad: r.prioridad || 'MEDIA',
                  nota: String(r.nota || '')
                }))
                const inserted = await Promise.all(payloads.map(p => upsertWeeklyRow(p)))
                normalized = inserted.filter(Boolean).map(r => ({
                  ...r,
                  status: r.status || 'PENDIENTE',
                  assigned: normalizeAssigned(r.assigned),
                  prioridad: r.prioridad || 'MEDIA',
                  tipo: r.tipo || 'SERVICIO',
                  nota: String(r.nota || '')
                }))
              }
            }catch(_){}
          }
        }
        setRows(normalized)
      }catch(_){}
    }
    fetchRemote()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const id = setTimeout(()=>setBooting(false), 200)
    return () => clearTimeout(id)
  }, [])

  const counts = useMemo(() => {
    const c = Object.fromEntries(TECHS.map(t => [t, 0]))
    for(const r of rows){
      for(const t of TECHS){
        if(r.assigned?.[t]) c[t] += 1
      }
    }
    return c
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows
      .map((r, idx) => ({ ...r, _idx: idx }))
      .filter(r => filterPrioridad === 'ALL' || r.prioridad === filterPrioridad)
      .filter(r => filterTipo === 'ALL' || r.tipo === filterTipo)
      .filter(r => filterStatus === 'ALL' || r.status === filterStatus)
  }, [rows, filterPrioridad, filterTipo, filterStatus])

  const isTech = role === 'TECH'
  const myPendings = useMemo(() => {
    if(!tech) return []
    return rows
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.assigned?.[tech])
      .filter(r => r.status !== 'COMPLETADO')
  }, [rows, tech])

  async function saveRow(row){
    try{
      const payload = {
        id: row.id,
        numero: row.numero,
        empresa: row.empresa,
        tarea: row.tarea,
        assigned: row.assigned,
        status: row.status,
        prioridad: row.prioridad,
        tipo: row.tipo || 'SERVICIO',
        nota: String(row.nota || '')
      }
      const saved = await upsertWeeklyRow(payload)
      if(saved?.id){
        setRows(prev => prev.map(r => r.id === saved.id ? {
          ...saved,
          status: saved.status || 'PENDIENTE',
          assigned: normalizeAssigned(saved.assigned),
          prioridad: saved.prioridad || 'MEDIA',
          tipo: saved.tipo || 'SERVICIO',
          nota: String(saved.nota || '')
        } : r))
      }
    }catch(_){}
  }

  function toggle(rowIdx, tech){
    setRows(prev => {
      const target = prev[rowIdx]
      if(!target) return prev
      const next = { ...target, assigned: { ...target.assigned, [tech]: !target.assigned?.[tech] } }
      saveRow(next)
      return prev.map((r, i) => i === rowIdx ? next : r)
    })
  }

  function setStatus(rowIdx, status){
    setRows(prev => {
      const target = prev[rowIdx]
      if(!target) return prev
      const next = { ...target, status }
      saveRow(next)
      return prev.map((r, i) => i === rowIdx ? next : r)
    })
  }

  function setNota(rowIdx, nota, persist = false){
    setRows(prev => {
      const target = prev[rowIdx]
      if(!target) return prev
      const next = { ...target, nota }
      const key = target.id || rowIdx
      if(notaTimers.current[key]) clearTimeout(notaTimers.current[key])
      if(persist){
        delete notaTimers.current[key]
        saveRow(next)
      } else {
        notaTimers.current[key] = setTimeout(() => saveRow(next), 1000)
      }
      return prev.map((r, i) => i === rowIdx ? next : r)
    })
  }

  function nextNumero() {
    const numbers = rows
      .map(r => Number(String(r.numero || '').replace(/\D/g, '')))
      .filter(n => Number.isFinite(n) && n > 0)
    const next = numbers.length ? Math.max(...numbers) + 1 : rows.length + 1
    return String(next)
  }

  async function addRow(){
    if(!draft.empresa.trim() || !draft.tarea.trim()) return
    const payload = {
      numero: nextNumero(),
      empresa: draft.empresa.trim().toUpperCase(),
      tarea: draft.tarea.trim().toUpperCase(),
      assigned: Object.fromEntries(TECHS.map(t => [t, false])),
      status: 'PENDIENTE',
      prioridad: draft.prioridad || 'MEDIA',
      tipo: draft.tipo || 'SERVICIO',
      nota: ''
    }
    try{
      const saved = await upsertWeeklyRow(payload)
      if(saved){
        const normalized = {
          ...saved,
          status: saved.status || 'PENDIENTE',
          assigned: normalizeAssigned(saved.assigned),
          prioridad: saved.prioridad || 'MEDIA',
          tipo: saved.tipo || 'SERVICIO',
          nota: String(saved.nota || '')
        }
        setRows(prev => [...prev, normalized])
      }
      setDraft({ empresa:'', tarea:'', prioridad: 'MEDIA', tipo: 'SERVICIO' })
      setOpen(false)
    }catch(_){}
  }

  function removeRow(idx){
    setRows(prev => {
      const target = prev[idx]
      if(target?.id) deleteWeeklyRow(target.id).catch(() => {})
      return prev.filter((_, i) => i !== idx)
    })
  }

  function createOTFromRow(row){
    const asignados = Object.entries(row.assigned || {}).filter(([,v])=>v).map(([k])=>k)
    const payload = {
      cliente: row.empresa,
      referencia: row.tarea,
      asignados,
      responsable: '',
      fechaPlan: weekStart,
      fechaCompromiso: weekStart,
      prioridad: row.prioridad || 'MEDIA'
    }
    localStorage.setItem('prefillOT', JSON.stringify(payload))
    navigate('/ot')
  }

  function moveRow(from, to){
    if(from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return
    setRows(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  function importCSV(file){
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = Array.isArray(res.data) ? res.data : []
        const newRows = data.map((d) => {
          const assigned = Object.fromEntries(TECHS.map(t => [t, false]))
          for(const t of TECHS){
            const short = t.split(' ')[0]
            const v = String(
              d[t] ?? d[t.toLowerCase()] ?? d[short] ?? d[short.toLowerCase()] ?? ''
            ).trim().toUpperCase()
            if(['X','SI','SÍ','1','TRUE','OK','Y','YES'].includes(v)) assigned[t] = true
          }
          const numero = String(
            d['NRO'] ?? d['NRO.'] ?? d['NUMERO'] ?? d['NÚMERO'] ?? d['NUM'] ?? d['NO'] ?? d['ID'] ?? d['N'] ?? d['numero'] ?? ''
          ).trim()
          return {
            numero,
            empresa: String(d['EMPRESA'] ?? d['empresa'] ?? '').trim().toUpperCase(),
            tarea: String(d['TAREA'] ?? d['tarea'] ?? '').trim().toUpperCase(),
            assigned,
            status: 'PENDIENTE',
            prioridad: 'MEDIA',
            nota: String(d['NOTA'] ?? d['nota'] ?? d['OBS'] ?? d['OBSERVACION'] ?? d['OBSERVACIÓN'] ?? '').trim()
          }
        }).filter(r => r.empresa && r.tarea)

        if(newRows.length){
          Promise.all(newRows.map(r => upsertWeeklyRow(r))).then((saved) => {
            const normalized = saved
              .filter(Boolean)
              .map(r => ({
                ...r,
                status: r.status || 'PENDIENTE',
                assigned: normalizeAssigned(r.assigned),
                prioridad: r.prioridad || 'MEDIA',
                nota: String(r.nota || '')
              }))
            if(normalized.length) setRows(normalized)
          }).catch(() => {})
        }
      }
    })
  }

  return (
    <div className="grid">
      <div className="col-12 card">
        <div className="row">
          <div>
            <h1 className="h1">Plan Semanal</h1>
            <p className="muted" style={{margin:'8px 0 0 0'}}>
              Matriz estilo Excel (empresa + tarea + técnicos). Ideal para visibilidad rápida.
            </p>
            <p className="muted" style={{margin:'6px 0 0 0'}}>Se guarda automáticamente y se comparte en Supabase.</p>
          </div>
          <Chip tone="blue">Semana (MVP)</Chip>
        </div>

        <div className="grid" style={{marginTop:12}}>
          <div className="col-6 field">
            <label>Inicio de semana</label>
            <input className="input" type="date" value={weekStart} onChange={(e)=>setWeekStart(e.target.value)} />
          </div>
          <div className="col-6 field">
            <label>Importar CSV (encabezados: NRO, EMPRESA, TAREA, LUDWIN CABA, JESSE PORRAS, BRAYAN IBARRA, DIEGO ORTUÑO)</label>
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e)=>{ const f = e.target.files?.[0]; if(f) importCSV(f) }}
            />
          </div>
        </div>

        <div className="row" style={{marginTop:12}}>
          <button className="btn primary" onClick={()=>setOpen(true)}>
            + Nueva fila
          </button>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {TECHS.map(t => (
              <span className="chip" key={t}>
                {t}: <b style={{color:'#fff'}}>{counts[t]}</b>
              </span>
            ))}
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
            <div className="muted">Sin pendientes asignados en el plan semanal.</div>
          )}
          {myPendings.length > 0 && (
            <div className="grid">
              {myPendings.map(it => (
                <div key={`${it.numero}-${it.tarea}-${it.idx}`} className="col-12 card" style={{background:'rgba(255,255,255,0.02)'}}>
                  <div className="row" style={{alignItems:'flex-start', gap:10}}>
                    <div>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                        <Chip tone={it.status === 'EN_PROCESO' ? 'warn' : 'blue'}>
                          {it.status?.replace('_',' ') || 'PENDIENTE'}
                        </Chip>
                      </div>
                      <h3 style={{margin:'8px 0 4px 0'}}>{it.empresa}</h3>
                      <div className="muted">{it.tarea}</div>
                    </div>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button className="btn" onClick={()=>setStatus(it.idx, 'EN_PROCESO')}>En proceso</button>
                      <button className="btn primary" onClick={()=>setStatus(it.idx, 'COMPLETADO')}>Completar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

          <div className="col-12 card">
        <div className="row" style={{marginBottom:10}}>
          <h2 style={{margin:0}}>Registro</h2>
          <span className="muted">{filteredRows.length} / {rows.length} filas</span>
        </div>

        {/* Filtros */}
        <div style={{display:'flex', gap:16, flexWrap:'wrap', marginBottom:12, alignItems:'center'}}>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <span className="muted" style={{fontSize:12}}>Tipo:</span>
            {['ALL', ...TIPOS].map(t => (
              <button
                key={t}
                className={`btn${filterTipo === t ? ' primary' : ''}`}
                style={{padding:'3px 10px', fontSize:12}}
                onClick={() => setFilterTipo(t)}
              >
                {t === 'ALL' ? 'Todos' : TIPO_LABEL[t]}
              </button>
            ))}
          </div>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <span className="muted" style={{fontSize:12}}>Prioridad:</span>
            {['ALL', ...PRIORITIES].map(p => (
              <button
                key={p}
                className={`btn${filterPrioridad === p ? ' primary' : ''}`}
                style={{padding:'3px 10px', fontSize:12}}
                onClick={() => setFilterPrioridad(p)}
              >
                {p === 'ALL' ? 'Todas' : PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <span className="muted" style={{fontSize:12}}>Estado:</span>
            {[
              { value: 'ALL',        label: 'Todos'      },
              { value: 'PENDIENTE',  label: 'Pendiente'  },
              { value: 'EN_PROCESO', label: 'En proceso' },
              { value: 'COMPLETADO', label: 'Completado' },
            ].map(s => (
              <button
                key={s.value}
                className={`btn${filterStatus === s.value ? ' primary' : ''}`}
                style={{padding:'3px 10px', fontSize:12}}
                onClick={() => setFilterStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table className="desktop-only">
            <thead>
              <tr>
                <th style={{width:70}}>Nro</th>
                <th style={{width:160}}>Empresa</th>
                <th>Tarea</th>
                <th style={{width:110}}>Tipo</th>
                <th style={{width:110}}>Estado</th>
                <th style={{width:110}}>Prioridad</th>
                {TECHS.map(t => <th key={t} style={{width:110}}>{t}</th>)}
                <th style={{width:260}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {booting && (
                <>
                  {[1,2,3].map(k => (
                    <tr key={`sk-${k}`} className="skeleton-row">
                      <td colSpan={5+TECHS.length} style={{padding:0}}>
                        <div className="skeleton-line"></div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!booting && filteredRows.map((r) => {
                const idx = r._idx
                return (
                <tr
                  key={idx}
                  draggable
                  onDragStart={()=>setDragIdx(idx)}
                  onDragOver={(e)=>{e.preventDefault();}}
                  onDrop={(e)=>{e.preventDefault(); moveRow(dragIdx, idx); setDragIdx(null)}}
                  className={dragIdx === idx ? 'dragging' : ''}
                >
                  <td>{r.numero}</td>
                  <td>{r.empresa}</td>
                  <td>{r.tarea}</td>
                  <td>
                    <Chip tone={TIPO_TONE[r.tipo] ?? 'blue'}>
                      {TIPO_LABEL[r.tipo] ?? 'Servicio'}
                    </Chip>
                  </td>
                  <td>
                    <Chip tone={r.status === 'COMPLETADO' ? 'ok' : r.status === 'EN_PROCESO' ? 'warn' : 'blue'}>
                      {r.status?.replace('_',' ') || 'PENDIENTE'}
                    </Chip>
                  </td>
                  <td>
                    <Chip tone={PRIORITY_TONE[r.prioridad] ?? 'warn'}>
                      {PRIORITY_LABEL[r.prioridad] ?? 'Media'}
                    </Chip>
                  </td>
                  {TECHS.map(t => (
                    <td key={t}>
                      <input
                        type="checkbox"
                        checked={!!r.assigned?.[t]}
                        onChange={()=>toggle(idx, t)}
                      />
                    </td>
                  ))}
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <select className="input" value={r.tipo || 'SERVICIO'} onChange={(e)=>{ const next={...r,tipo:e.target.value}; saveRow(next); setRows(prev=>prev.map((x,i)=>i===idx?next:x)) }}>
                        {TIPOS.map(tp => <option key={tp} value={tp}>{TIPO_LABEL[tp]}</option>)}
                      </select>
                      <select className="input" value={r.status || 'PENDIENTE'} onChange={(e)=>setStatus(idx, e.target.value)}>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROCESO">En proceso</option>
                        <option value="COMPLETADO">Completado</option>
                      </select>
                      <button className="btn" onClick={()=>createOTFromRow(r)}>Crear OT</button>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Nota de la tarea..."
                        style={{width:'100%', minHeight:62, resize:'vertical'}}
                        value={r.nota || ''}
                        onChange={(e)=>setNota(idx, e.target.value, false)}
                        onBlur={(e)=>setNota(idx, e.target.value, true)}
                      />
                    </div>
                  </td>
                </tr>
              )})}
              {!rows.length && (
                <tr><td colSpan={6+TECHS.length} className="muted">Sin filas</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      <div className="col-12 card mobile-only">
        <h2 style={{margin:'0 0 10px 0'}}>Registro (móvil)</h2>
        {booting && (
          <div className="skeleton-line" style={{marginBottom:8}}></div>
        )}
        {!booting && filteredRows.map((r) => {
          const idx = r._idx
          return (
          <div key={`card-${idx}`} className="card" style={{marginBottom:10, background:'rgba(255,255,255,0.02)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <div>
                <div className="muted">#{r.numero} - {r.empresa}</div>
                <div style={{fontWeight:700, marginTop:4}}>{r.tarea}</div>
                <div style={{display:'flex', gap:6, marginTop:4, flexWrap:'wrap'}}>
                  <Chip tone={TIPO_TONE[r.tipo] ?? 'blue'}>{TIPO_LABEL[r.tipo] ?? 'Servicio'}</Chip>
                  <Chip tone={r.status === 'COMPLETADO' ? 'ok' : r.status === 'EN_PROCESO' ? 'warn' : 'blue'}>
                    {r.status?.replace('_',' ') || 'PENDIENTE'}
                  </Chip>
                </div>
              </div>
            </div>
            <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap'}}>
              {TECHS.map(t => (
                <label key={t} style={{display:'flex', alignItems:'center', gap:6}}>
                  <input type="checkbox" checked={!!r.assigned?.[t]} onChange={()=>toggle(idx, t)} />
                  <span style={{fontSize:12}}>{t}</span>
                </label>
              ))}
            </div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:10}}>
              <Chip tone={PRIORITY_TONE[r.prioridad] ?? 'warn'}>
                {PRIORITY_LABEL[r.prioridad] ?? 'Media'}
              </Chip>
              <select className="input" value={r.tipo || 'SERVICIO'} onChange={(e)=>{ const next={...r,tipo:e.target.value}; saveRow(next); setRows(prev=>prev.map((x,i)=>i===idx?next:x)) }}>
                {TIPOS.map(tp => <option key={tp} value={tp}>{TIPO_LABEL[tp]}</option>)}
              </select>
              <select className="input" value={r.status || 'PENDIENTE'} onChange={(e)=>setStatus(idx, e.target.value)}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADO">Completado</option>
              </select>
              <button className="btn" onClick={()=>createOTFromRow(r)}>Crear OT</button>
              <textarea
                className="input"
                rows={2}
                placeholder="Nota de la tarea..."
                style={{width:'100%', minHeight:62, resize:'vertical'}}
                value={r.nota || ''}
                onChange={(e)=>setNota(idx, e.target.value, false)}
                onBlur={(e)=>setNota(idx, e.target.value, true)}
              />
            </div>
          </div>
        )})}
        {!booting && !filteredRows.length && <div className="muted">{rows.length ? 'Sin resultados para los filtros.' : 'Sin filas'}</div>}
      </div>

      <Modal open={open} title="Nueva fila de Plan Semanal" onClose={()=>setOpen(false)}>
        <div className="grid">
          <div className="col-4 field">
            <label>Nro</label>
            <input className="input" value={nextNumero()} readOnly />
          </div>
          <div className="col-4 field">
            <label>Empresa</label>
            <input className="input" value={draft.empresa} onChange={(e)=>setDraft(d=>({...d,empresa:e.target.value}))} placeholder="Ej: EMPACAR" />
          </div>
          <div className="col-12 field">
            <label>Tarea</label>
            <input className="input" value={draft.tarea} onChange={(e)=>setDraft(d=>({...d,tarea:e.target.value}))} placeholder="Ej: CAMBIO DE POLEA" />
          </div>
          <div className="col-4 field">
            <label>Tipo</label>
            <select className="input" value={draft.tipo} onChange={(e)=>setDraft(d=>({...d,tipo:e.target.value}))}>
              {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>
          <div className="col-4 field">
            <label>Prioridad</label>
            <select className="input" value={draft.prioridad} onChange={(e)=>setDraft(d=>({...d,prioridad:e.target.value}))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={()=>setOpen(false)}>Cancelar</button>
          <button className="btn primary" onClick={addRow}>Guardar</button>
        </div>
      </Modal>
    </div>
  )
}


