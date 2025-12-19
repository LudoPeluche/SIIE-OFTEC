import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'
import Modal from '../components/Modal.jsx'
import Chip from '../components/Chip.jsx'
import { nowISODate } from '../lib/utils.js'

const TECHS = ['LUDWIN CABA', 'JESSE PORRAS', 'BRAYAN IBARRA', 'DIEGO ORTUÑO']

const LEGACY_TECH_MAP = {
  LUDWIN:'LUDWIN CABA',
  JESSE:'JESSE PORRAS',
  BRAYAN:'BRAYAN IBARRA',
  DIEGO:'DIEGO ORTUÑO'
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

const seedRows = [
  { numero:'1', empresa:'TECNOPOR', tarea:'PLAN DE MANTENIMIENTO', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':false,'BRAYAN IBARRA':false,'DIEGO ORTUÑO':true}, status:'PENDIENTE' },
  { numero:'2', empresa:'EMPACAR', tarea:'MONTAR 2DO REDUCTOR', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':true,'BRAYAN IBARRA':true,'DIEGO ORTUÑO':false}, status:'EN_PROCESO' },
  { numero:'2', empresa:'EMPACAR', tarea:'INFORME DEL MONTAJE', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':true,'BRAYAN IBARRA':true,'DIEGO ORTUÑO':false}, status:'PENDIENTE' },
  { numero:'2', empresa:'EMPACAR', tarea:'SEGUIMIENTO AL CAMBIO DE RODAMIENTO EXTRACTOR MAC', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':false,'BRAYAN IBARRA':false,'DIEGO ORTUÑO':true}, status:'PENDIENTE' },
  { numero:'3', empresa:'SOFIA', tarea:'CAMBIO DE POLEA', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':false,'BRAYAN IBARRA':false,'DIEGO ORTUÑO':false}, status:'PENDIENTE' },
  { numero:'3', empresa:'SOFIA', tarea:'CAMBIO DE CILINDRO', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':true,'BRAYAN IBARRA':true,'DIEGO ORTUÑO':false}, status:'PENDIENTE' },
  { numero:'4', empresa:'G77', tarea:'TRASLADO', assigned:{'LUDWIN CABA':false,'JESSE PORRAS':true,'BRAYAN IBARRA':true,'DIEGO ORTUÑO':true}, status:'PENDIENTE' },
]

export default function PlanSemanal({ role = 'ADMIN', tech = '' }){
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(nowISODate())
  const [rows, setRows] = useState(seedRows)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ numero:'', empresa:'', tarea:'' })
  const storageKey = 'planSemanalRows'
  const [booting, setBooting] = useState(true)
  const [dragIdx, setDragIdx] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if(saved){
      try{
        const parsed = JSON.parse(saved)
        if(Array.isArray(parsed)) {
          // migrar rows antiguos sin status/done
          const migrated = parsed.map(r => ({
            ...r,
            status: r.status || (r.done ? 'COMPLETADO' : 'PENDIENTE'),
            assigned: normalizeAssigned(r.assigned),
            done: undefined
          }))
          setRows(migrated)
        }
      }catch(_){}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(rows))
  }, [rows])

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

  const isTech = role === 'TECH'
  const myPendings = useMemo(() => {
    if(!tech) return []
    return rows
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.assigned?.[tech])
      .filter(r => r.status !== 'COMPLETADO')
  }, [rows, tech])

  function toggle(rowIdx, tech){
    setRows(prev => prev.map((r, i) => {
      if(i !== rowIdx) return r
      return { ...r, assigned: { ...r.assigned, [tech]: !r.assigned?.[tech] } }
    }))
  }

  function setStatus(rowIdx, status){
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, status } : r))
  }

  function addRow(){
    if(!draft.empresa.trim() || !draft.tarea.trim()) return
    setRows(prev => [
      ...prev,
      { numero: draft.numero.trim(), empresa: draft.empresa.trim().toUpperCase(), tarea: draft.tarea.trim().toUpperCase(),
        assigned: Object.fromEntries(TECHS.map(t => [t, false])),
        status: 'PENDIENTE'
      }
    ])
    setDraft({ numero:'', empresa:'', tarea:'' })
    setOpen(false)
  }

  function removeRow(idx){
    setRows(prev => prev.filter((_, i) => i !== idx))
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
      prioridad: 'MEDIA'
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
            status: 'PENDIENTE'
          }
        }).filter(r => r.empresa && r.tarea)

        if(newRows.length) setRows(newRows)
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
            <p className="muted" style={{margin:'6px 0 0 0'}}>Se guarda automáticamente en este navegador (localStorage).</p>
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
          <button className="btn primary" onClick={()=>setOpen(true)}>+ Nueva fila</button>
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
          <span className="muted">{rows.length} filas</span>
        </div>

        <div className="table-wrap">
          <table className="desktop-only">
            <thead>
              <tr>
                <th style={{width:70}}>Nro</th>
                <th style={{width:160}}>Empresa</th>
                <th>Tarea</th>
                <th style={{width:110}}>Estado</th>
                {TECHS.map(t => <th key={t} style={{width:110}}>{t}</th>)}
                <th style={{width:260}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {booting && (
                <>
                  {[1,2,3].map(k => (
                    <tr key={`sk-${k}`} className="skeleton-row">
                      <td colSpan={4+TECHS.length} style={{padding:0}}>
                        <div className="skeleton-line"></div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!booting && rows.map((r, idx) => (
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
                    <Chip tone={r.status === 'COMPLETADO' ? 'ok' : r.status === 'EN_PROCESO' ? 'warn' : 'blue'}>
                      {r.status?.replace('_',' ') || 'PENDIENTE'}
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
                      <button className="btn" onClick={()=>moveRow(idx, Math.max(0, idx-1))}>↑</button>
                      <button className="btn" onClick={()=>moveRow(idx, Math.min(rows.length-1, idx+1))}>↓</button>
                      <select className="input" value={r.status || 'PENDIENTE'} onChange={(e)=>setStatus(idx, e.target.value)}>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROCESO">En proceso</option>
                        <option value="COMPLETADO">Completado</option>
                      </select>
                      <button className="btn" onClick={()=>createOTFromRow(r)}>Crear OT</button>
                      <button className="btn danger" onClick={()=>removeRow(idx)}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={4+TECHS.length} className="muted">Sin filas</td></tr>
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
        {!booting && rows.map((r, idx) => (
          <div key={`card-${idx}`} className="card" style={{marginBottom:10, background:'rgba(255,255,255,0.02)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <div>
                <div className="muted">#{r.numero} · {r.empresa}</div>
                <div style={{fontWeight:700, marginTop:4}}>{r.tarea}</div>
                <Chip tone={r.status === 'COMPLETADO' ? 'ok' : r.status === 'EN_PROCESO' ? 'warn' : 'blue'}>
                  {r.status?.replace('_',' ') || 'PENDIENTE'}
                </Chip>
              </div>
              <div style={{display:'flex', gap:6}}>
                <button className="btn" onClick={()=>moveRow(idx, Math.max(0, idx-1))}>↑</button>
                <button className="btn" onClick={()=>moveRow(idx, Math.min(rows.length-1, idx+1))}>↓</button>
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
              <select className="input" value={r.status || 'PENDIENTE'} onChange={(e)=>setStatus(idx, e.target.value)}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADO">Completado</option>
              </select>
              <button className="btn" onClick={()=>createOTFromRow(r)}>Crear OT</button>
              <button className="btn danger" onClick={()=>removeRow(idx)}>Borrar</button>
            </div>
          </div>
        ))}
        {!booting && !rows.length && <div className="muted">Sin filas</div>}
      </div>

      <Modal open={open} title="Nueva fila de Plan Semanal" onClose={()=>setOpen(false)}>
        <div className="grid">
          <div className="col-4 field">
            <label>Nro</label>
            <input className="input" value={draft.numero} onChange={(e)=>setDraft(d=>({...d,numero:e.target.value}))} placeholder="Ej: 2" />
          </div>
          <div className="col-4 field">
            <label>Empresa</label>
            <input className="input" value={draft.empresa} onChange={(e)=>setDraft(d=>({...d,empresa:e.target.value}))} placeholder="Ej: EMPACAR" />
          </div>
          <div className="col-12 field">
            <label>Tarea</label>
            <input className="input" value={draft.tarea} onChange={(e)=>setDraft(d=>({...d,tarea:e.target.value}))} placeholder="Ej: CAMBIO DE POLEA" />
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
