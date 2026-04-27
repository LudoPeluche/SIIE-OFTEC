import { useEffect, useMemo, useState } from 'react'
import { nowISODate } from '../lib/utils.js'
import Chip from '../components/Chip.jsx'
import Modal from '../components/Modal.jsx'
import { listExtraHours, createExtraHourRequest, updateExtraHourStatus } from '../lib/extraHoursService.js'
import { listWorkOrders } from '../lib/woService.js'
import { PEOPLE } from '../constants.js'

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

export default function HorasExtra({ role = 'TECH', tech = '' }) {
  const [requests, setRequests] = useState([])
  const [ots, setOts] = useState([])
  const [fecha, setFecha] = useState(nowISODate())
  const [horas, setHoras] = useState('8')
  const [motivo, setMotivo] = useState('')
  // Notas individuales por solicitud (mapa: id -> nota)
  const [notasJefe, setNotasJefe] = useState({})
  const [selectedTech, setSelectedTech] = useState(role === 'ADMIN' ? 'ALL' : (tech || PEOPLE[0]))
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [message, setMessage] = useState(null)
  const [toastTimer, setToastTimer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showTechSummary, setShowTechSummary] = useState(false)
  const [techFocus, setTechFocus] = useState('')
  const [confirmReject, setConfirmReject] = useState(null) // { id, tech }

  const isTech = role === 'TECH'
  const isJefe = role === 'ADMIN'
  const activeTech = isTech ? tech : selectedTech

  const stats = useMemo(() => {
    const closed = ots.filter(it => ['CLOSED', 'REWORK'].includes(it.estado))
    const participated = closed.filter(it => {
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      if (participants.includes(activeTech)) return true
      const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      return hpt.some(h => h.tech === activeTech)
    })
    const earned = participated.reduce((sum, it) => {
      const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      if (hpt.length > 0) {
        const entry = hpt.find(h => h.tech === activeTech)
        return sum + (entry ? Number(entry.horasExtra || 0) : 0)
      }
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      const extra = Number(it.horas_extra || it.horasExtraReales || 0)
      return sum + (isNaN(extra) ? 0 : extra / Math.max(1, participants.length))
    }, 0)
    let approved = 0
    let pending = 0
    requests.forEach(r => {
      if (r.tech !== activeTech) return
      if (r.estado === 'APROBADA') approved += Number(r.horas || 0)
      if (r.estado === 'PENDIENTE') pending += Number(r.horas || 0)
    })
    const available = Math.max(0, earned - approved - pending)
    return { earned, approved, pending, available }
  }, [requests, activeTech, ots])

  const myRequests = useMemo(() => {
    return requests.filter(r => r.tech === activeTech)
  }, [requests, activeTech])

  const techSummaries = useMemo(() => {
    const techSet = new Set(PEOPLE)
    requests.forEach(r => {
      if (r.tech) techSet.add(r.tech)
    })
    const earnedMap = new Map()
    const approvedMap = new Map()
    const pendingMap = new Map()
    const requestedMap = new Map()
    const closed = ots.filter(it => ['CLOSED', 'REWORK'].includes(it.estado))
    closed.forEach(it => {
      const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const hasDesglose = hpt.length > 0
      const participants = Array.from(new Set([
        it.responsable,
        ...(it.asignados || []),
        ...(hpt.map(h => h.tech))
      ].filter(Boolean)))
      const extra = Number(it.horas_extra || it.horasExtraReales || 0)
      participants.forEach(p => {
        let share
        if (hasDesglose) {
          const entry = hpt.find(h => h.tech === p)
          share = entry ? Number(entry.horasExtra || 0) : 0
        } else {
          share = isNaN(extra) ? 0 : extra / Math.max(1, participants.length)
        }
        earnedMap.set(p, (earnedMap.get(p) || 0) + share)
      })
    })
    requests.forEach(r => {
      const hours = Number(r.horas || 0)
      requestedMap.set(r.tech, (requestedMap.get(r.tech) || 0) + (isNaN(hours) ? 0 : hours))
      if (r.estado === 'APROBADA') {
        approvedMap.set(r.tech, (approvedMap.get(r.tech) || 0) + (isNaN(hours) ? 0 : hours))
      }
      if (r.estado === 'PENDIENTE') {
        pendingMap.set(r.tech, (pendingMap.get(r.tech) || 0) + (isNaN(hours) ? 0 : hours))
      }
    })
    const summary = Array.from(techSet).map(t => {
      const earned = earnedMap.get(t) || 0
      const approved = approvedMap.get(t) || 0
      const pending = pendingMap.get(t) || 0
      const requested = requestedMap.get(t) || 0
      const available = Math.max(0, earned - approved - pending)
      return { tech: t, earned, approved, pending, requested, available }
    }).sort((a, b) => b.requested - a.requested)
    return summary
  }, [requests, ots])

  const maxRequested = useMemo(() => {
    return Math.max(...techSummaries.map(t => t.requested), 1)
  }, [techSummaries])

  const techFocusSummary = useMemo(() => {
    if (!techFocus) return null
    return techSummaries.find(t => t.tech === techFocus) || null
  }, [techSummaries, techFocus])

  const techFocusRequests = useMemo(() => {
    if (!techFocus) return []
    return requests
      .filter(r => r.tech === techFocus)
      .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
  }, [requests, techFocus])

  const techFocusOTs = useMemo(() => {
    if (!techFocus) return []
    return ots
      .filter(it => ['CLOSED', 'REWORK'].includes(it.estado))
      .filter(it => {
        const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
        const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
        return participants.includes(techFocus) || hpt.some(h => h.tech === techFocus)
      })
      .map(it => {
        const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
        const hasDesglose = hpt.length > 0
        const participants = Array.from(new Set([
          it.responsable,
          ...(it.asignados || []),
          ...(hpt.map(h => h.tech))
        ].filter(Boolean)))
        const totalExtra = Number(it.horas_extra || it.horasExtraReales || 0)
        const totalRegular = Number(it.horasReales || 0)
        const numP = Math.max(1, participants.length)
        let share, regularHours
        if (hasDesglose) {
          const entry = hpt.find(h => h.tech === techFocus)
          share = entry ? Number(entry.horasExtra || 0) : 0
          regularHours = entry ? Number(entry.horas || 0) : 0
        } else {
          share = isNaN(totalExtra) ? 0 : totalExtra / numP
          regularHours = isNaN(totalRegular) ? 0 : totalRegular / numP
        }
        const date = it.realFechaFin || it.fechaFin || it.realFechaInicio || it.fechaInicio || ''
        const hasFallback = !hasDesglose
        return { ...it, share, regularHours, participants, date, hasFallback }
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [ots, techFocus])

  // Filtrar solicitudes para la tabla
  const filteredRequests = useMemo(() => {
    let list = isTech ? myRequests : requests.filter(r => selectedTech === 'ALL' || r.tech === selectedTech)
    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.estado === statusFilter)
    }
    return list
  }, [isTech, myRequests, requests, selectedTech, statusFilter])

  function resetForm() {
    setFecha(nowISODate())
    setHoras('8')
    setMotivo('')
  }

  useEffect(() => {
    async function fetchRemote() {
      try {
        setLoading(true)
        const [reqs, workOrders] = await Promise.all([
          listExtraHours(),
          listWorkOrders()
        ])
        if (Array.isArray(reqs)) setRequests(reqs)
        if (Array.isArray(workOrders)) setOts(workOrders)
      } catch (_err) {
        setMessage({ tone: 'bad', text: 'No se pudo sincronizar horas extra' })
        if (toastTimer) clearTimeout(toastTimer)
        setToastTimer(setTimeout(() => setMessage(null), 2400))
      } finally {
        setLoading(false)
      }
    }
    fetchRemote()
  }, [])

  function handleSubmit() {
    const hoursNum = Number(horas || 0)
    const motivoClean = motivo.trim()
    if (!fecha) {
      setMessage({ tone: 'bad', text: 'Elige una fecha' })
      return
    }
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 8) {
      setMessage({ tone: 'bad', text: 'Horas entre 1 y 8' })
      return
    }
    if (hoursNum > stats.available) {
      setMessage({ tone: 'bad', text: 'No tienes horas suficientes' })
      return
    }
    if (!motivoClean) {
      setMessage({ tone: 'bad', text: 'Ingresa el motivo' })
      return
    }
    createExtraHourRequest({ tech: activeTech, fecha, horas: hoursNum, motivo: motivoClean })
      .then(newReq => {
        if (newReq) setRequests(prev => [newReq, ...prev])
        setMessage({ tone: 'ok', text: 'Solicitud enviada al jefe' })
        if (toastTimer) clearTimeout(toastTimer)
        setToastTimer(setTimeout(() => setMessage(null), 2400))
        resetForm()
      })
      .catch(() => {
        setMessage({ tone: 'bad', text: 'No se pudo guardar en Supabase' })
        if (toastTimer) clearTimeout(toastTimer)
        setToastTimer(setTimeout(() => setMessage(null), 2400))
      })
  }

  function updateStatus(id, estado) {
    if (!isJefe) {
      setMessage({ tone: 'bad', text: 'Solo el jefe puede aprobar o rechazar' })
      if (toastTimer) clearTimeout(toastTimer)
      setToastTimer(setTimeout(() => setMessage(null), 2400))
      return
    }
    const nota = notasJefe[id] || ''
    updateExtraHourStatus(id, estado, nota.trim())
      .then(updated => {
        if (updated) setRequests(prev => prev.map(r => r.id === id ? updated : r))
        // Limpiar la nota de esta solicitud
        setNotasJefe(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setMessage({ tone: estado === 'APROBADA' ? 'ok' : 'warn', text: `Solicitud ${estado.toLowerCase()}` })
        if (toastTimer) clearTimeout(toastTimer)
        setToastTimer(setTimeout(() => setMessage(null), 2400))
      })
      .catch(() => {
        setMessage({ tone: 'bad', text: 'No se pudo actualizar en Supabase' })
        if (toastTimer) clearTimeout(toastTimer)
        setToastTimer(setTimeout(() => setMessage(null), 2400))
      })
  }

  function handleReject(id, techName) {
    setConfirmReject({ id, tech: techName })
  }

  function confirmRejectAction() {
    if (!confirmReject) return
    updateStatus(confirmReject.id, 'RECHAZADA')
    setConfirmReject(null)
  }

  function updateNota(id, value) {
    setNotasJefe(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="grid">
      {message && (
        <div className={`toast ${message.tone || 'blue'}`}>
          {message.text}
        </div>
      )}

      <div className="col-12 card card-hero">
        <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="h1">Horas Extra</h1>
            <p className="muted" style={{ margin: '8px 0 0 0', fontSize: 13 }}>Solicita o aprueba uso de horas extra.</p>
          </div>
          {!isTech && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Técnico</label>
                <select className="input" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {PEOPLE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ minWidth: 140 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Estado</label>
                <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="APROBADA">Aprobada</option>
                  <option value="RECHAZADA">Rechazada</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-12 card">
        <div className="row" style={{ alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Saldo de {activeTech}</h3>
          <Chip tone="ok" style={{ fontSize: 13, fontWeight: 700 }}>Acumuladas: {stats.earned.toFixed(1)}h</Chip>
          <Chip tone="warn" style={{ fontSize: 13, fontWeight: 700 }}>Pendientes: {stats.pending.toFixed(1)}h</Chip>
          <Chip tone="bad" style={{ fontSize: 13, fontWeight: 700 }}>Gastadas: {stats.approved.toFixed(1)}h</Chip>
          <Chip tone="blue" style={{ fontSize: 13, fontWeight: 700 }}>Disponible: {stats.available.toFixed(1)}h</Chip>
        </div>
      </div>

      {!isTech && (
        <div className="col-12 card">
          <div className="row" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Resumen por técnico</h3>
          </div>
          {loading ? (
            <div className="skeleton-line" style={{ height: 100 }}></div>
          ) : techSummaries.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>Sin solicitudes registradas.</div>
          ) : (
            <div className="mini-chart">
              {techSummaries.map(t => (
                <div
                  key={t.tech}
                  className="mini-chart-row"
                  onClick={() => {
                    setTechFocus(t.tech)
                    setShowTechSummary(true)
                  }}
                  style={{ cursor: 'pointer', transition: 'transform 0.15s ease', padding: '4px 0' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div className="mini-chart-label" style={{ fontWeight: 700, fontSize: 12 }}>{t.tech}</div>
                  <div className="mini-chart-bar">
                    <div className="mini-bar bar-primary" style={{ width: Math.max(4, Math.round((t.requested / maxRequested) * 100)) + '%' }} title={`${t.requested.toFixed(1)}h`} />
                  </div>
                  <div className="mini-chart-value" style={{ fontSize: 13, fontWeight: 700 }}>
                    <span style={{ color: '#10b981' }}>{t.requested.toFixed(1)}h</span> solicitadas · <span style={{ color: '#0ea5e9' }}>{t.available.toFixed(1)}h</span> disponibles
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(isTech || (selectedTech !== 'ALL')) && (
        <div className="col-12 card">
          <h3 style={{ margin: '0 0 14px 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Solicitar horas extra para {activeTech}</h3>
          <div className="grid">
            <div className="col-4 field">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Fecha a tomar</label>
              <input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="col-4 field">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Horas a usar (1-8)</label>
              <input className="input" type="number" min="1" max="8" step="1" value={horas} onChange={(e) => setHoras(e.target.value)} />
            </div>
            <div className="col-12 field">
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Motivo</label>
              <textarea className="input" rows="3" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="¿Por qué tomas tus horas extra?" />
            </div>
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={handleSubmit} style={{ fontWeight: 700, fontSize: 14 }}>Enviar solicitud</button>
          </div>
        </div>
      )}

      <div className="col-12 card">
        <div className="row" style={{ marginBottom: 12, alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{isTech ? 'Mis solicitudes' : 'Solicitudes del equipo'}</h3>
          {isTech && (
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
              <option value="ALL">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          )}
          <span className="chip" style={{ fontSize: 12 }}>{filteredRequests.length} solicitudes</span>
        </div>

        {/* Vista Desktop */}
        <div className="table-wrap">
          <table className="desktop-only">
            <thead>
              <tr>
                <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>ID</th>
                {!isTech && <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Técnico</th>}
                <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Fecha</th>
                <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Horas</th>
                <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Motivo</th>
                <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Estado</th>
                {isJefe && <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={isTech ? 5 : isJefe ? 7 : 6}>
                    <div className="skeleton-line"></div>
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.map(r => (
                <tr key={r.id}>
                  <td><span style={{ fontWeight: 700, color: '#10b981' }}>#{r.id}</span></td>
                  {!isTech && <td style={{ fontWeight: 600 }}>{r.tech}</td>}
                  <td style={{ fontWeight: 600 }}>{r.fecha}</td>
                  <td><span style={{ fontWeight: 700, color: '#0ea5e9' }}>{r.horas}h</span></td>
                  <td style={{ fontSize: 13 }}>
                    {r.motivo}
                    {r.nota && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Nota: {r.nota}</div>}
                  </td>
                  <td><Chip tone={STATUS_TONE[r.estado] || 'blue'}>{STATUS_LABEL[r.estado] || r.estado}</Chip></td>
                  {isJefe && (
                    <td>
                      {r.estado === 'PENDIENTE' ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <input
                            className="input"
                            placeholder="Nota (opcional)"
                            value={notasJefe[r.id] || ''}
                            onChange={(e) => updateNota(r.id, e.target.value)}
                            style={{ minWidth: 100, fontSize: 12, padding: '6px 8px' }}
                          />
                          <button className="btn primary" onClick={() => updateStatus(r.id, 'APROBADA')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px' }}>Aprobar</button>
                          <button className="btn danger" onClick={() => handleReject(r.id, r.tech)} style={{ fontSize: 12, fontWeight: 700, padding: '6px 10px' }}>Rechazar</button>
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Procesada</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!loading && filteredRequests.length === 0 && (
                <tr><td colSpan={isTech ? 5 : isJefe ? 7 : 6} className="muted" style={{ fontSize: 13 }}>Sin solicitudes</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile */}
        <div className="mobile-only">
          {loading && <div className="skeleton-line" style={{ marginTop: 8 }}></div>}
          {!loading && filteredRequests.map(r => (
            <div key={`card-${r.id}`} className="card" style={{ marginBottom: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>#{r.id} · {r.fecha}</div>
                  {!isTech && <div style={{ fontWeight: 700, marginTop: 4 }}>{r.tech}</div>}
                  <div style={{ fontSize: 13, marginTop: 4 }}>{r.motivo}</div>
                  {r.nota && <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Nota: {r.nota}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#0ea5e9', fontSize: 16 }}>{r.horas}h</div>
                  <Chip tone={STATUS_TONE[r.estado] || 'blue'} style={{ marginTop: 4 }}>{STATUS_LABEL[r.estado] || r.estado}</Chip>
                </div>
              </div>
              {isJefe && r.estado === 'PENDIENTE' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    className="input"
                    placeholder="Nota (opcional)"
                    value={notasJefe[r.id] || ''}
                    onChange={(e) => updateNota(r.id, e.target.value)}
                    style={{ flex: 1, minWidth: 100, fontSize: 12 }}
                  />
                  <button className="btn primary" onClick={() => updateStatus(r.id, 'APROBADA')} style={{ fontSize: 12, fontWeight: 700 }}>Aprobar</button>
                  <button className="btn danger" onClick={() => handleReject(r.id, r.tech)} style={{ fontSize: 12, fontWeight: 700 }}>Rechazar</button>
                </div>
              )}
            </div>
          ))}
          {!loading && filteredRequests.length === 0 && (
            <div className="muted" style={{ padding: 20, textAlign: 'center' }}>Sin solicitudes</div>
          )}
        </div>
      </div>

      {/* Modal de detalle por técnico */}
      <Modal
        open={showTechSummary}
        title={
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px'
          }}>
            Detalle de horas extra: {techFocus || 'N/D'}
          </span>
        }
        onClose={() => setShowTechSummary(false)}
      >
        {!techFocusSummary ? (
          <div className="muted" style={{ fontSize: 13 }}>Sin datos para este técnico.</div>
        ) : (
          <>
            {/* Reconciliación */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Reconciliación de saldo</div>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Horas acumuladas (OTs cerradas)</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>+{techFocusSummary.earned.toFixed(2)}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Horas gastadas (aprobadas)</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>−{techFocusSummary.approved.toFixed(2)}h</span>
                </div>
                {techFocusSummary.pending > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Solicitudes pendientes</span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>−{techFocusSummary.pending.toFixed(2)}h</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                  <span>Saldo disponible</span>
                  <span style={{ color: '#0ea5e9' }}>{techFocusSummary.available.toFixed(2)}h</span>
                </div>
              </div>
            </div>

            {/* OTs donde ganó horas */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
                Origen — OTs cerradas ({techFocusOTs.length})
              </span>
              <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>ordenadas por fecha desc</span>
            </div>
            {!techFocusOTs.length ? (
              <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Sin OTs cerradas registradas.</div>
            ) : (
              <div style={{ display: 'grid', gap: 6, marginBottom: 4 }}>
                {techFocusOTs.map(ot => {
                  const alertaAlto     = ot.share >= 8
                  const alertaSinReg   = ot.share > 0 && ot.regularHours === 0
                  const alertaFallback = ot.hasFallback
                  const tieneAlerta    = alertaAlto || alertaSinReg || alertaFallback
                  return (
                    <div key={ot.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                      padding: '8px 12px', borderRadius: 8,
                      background: tieneAlerta ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.07)',
                      border: `1px solid ${tieneAlerta ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.12)'}`
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: tieneAlerta ? '#f59e0b' : '#10b981' }}>{ot.code || ot.id}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{ot.date || 'sin fecha'}</span>
                          {ot.cliente && <span className="muted" style={{ fontSize: 12 }}>{ot.cliente}</span>}
                          {alertaAlto     && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 4, padding: '1px 5px' }}>ALTO</span>}
                          {alertaSinReg   && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 4, padding: '1px 5px' }}>0 REGULARES</span>}
                          {alertaFallback && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(100,116,139,0.2)', color: '#94a3b8', borderRadius: 4, padding: '1px 5px' }}>SIN DESGLOSE</span>}
                        </div>
                        {ot.participants.length > 1 && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                            Con: {ot.participants.filter(p => p !== techFocus).join(', ')}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: tieneAlerta ? '#f59e0b' : '#10b981', fontSize: 14 }}>+{ot.share.toFixed(2)}h extra</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{ot.regularHours.toFixed(2)}h regulares</div>
                      </div>
                    </div>
                  )
                })}
                {/* Total verificable */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.15)', fontWeight: 700, fontSize: 13 }}>
                  <span>Total acumulado ({techFocusOTs.length} OTs)</span>
                  <span style={{ color: '#10b981' }}>+{techFocusOTs.reduce((s, o) => s + o.share, 0).toFixed(2)}h</span>
                </div>

                {/* Entradas que revisar */}
                {(() => {
                  const sospechosas = techFocusOTs.filter(ot => ot.share >= 8 || (ot.share > 0 && ot.regularHours === 0) || ot.hasFallback)
                  if (!sospechosas.length) return null
                  return (
                    <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        ⚠ {sospechosas.length} entrada{sospechosas.length > 1 ? 's' : ''} que revisar
                      </div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        {sospechosas.map(ot => {
                          const motivos = []
                          if (ot.share >= 8) motivos.push(`${ot.share.toFixed(1)}h extra es muy alto`)
                          if (ot.share > 0 && ot.regularHours === 0) motivos.push('horas extra > 0 con 0 regulares')
                          if (ot.hasFallback) motivos.push('sin desglose por técnico')
                          return (
                            <div key={ot.id} style={{ fontSize: 12, color: '#cbd5e1' }}>
                              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{ot.code}</span>
                              <span className="muted" style={{ marginLeft: 6 }}>({ot.date})</span>
                              <span style={{ marginLeft: 6 }}>— {motivos.join(' · ')}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Días en que cobró horas extras */}
            <div style={{ marginBottom: 8, marginTop: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
                Días cobrados — solicitudes de uso ({techFocusRequests.length})
              </span>
            </div>
            {!techFocusRequests.length ? (
              <div className="muted" style={{ fontSize: 13 }}>Sin solicitudes registradas.</div>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {techFocusRequests.map(r => (
                  <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{r.fecha || 'N/D'}</div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.motivo || 'Sin motivo'}</div>
                      {r.nota && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>Nota: {r.nota}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: r.estado === 'APROBADA' ? '#ef4444' : r.estado === 'PENDIENTE' ? '#f59e0b' : '#64748b', fontSize: 14 }}>
                        {r.estado === 'APROBADA' ? '−' : ''}{r.horas || 0}h
                      </div>
                      <Chip tone={STATUS_TONE[r.estado] || 'blue'} style={{ fontSize: 11, marginTop: 4 }}>{STATUS_LABEL[r.estado] || r.estado}</Chip>
                    </div>
                  </div>
                ))}
                {/* Total gastado */}
                {techFocusRequests.filter(r => r.estado === 'APROBADA').length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', fontWeight: 700, fontSize: 13 }}>
                    <span>Total gastado (aprobadas)</span>
                    <span style={{ color: '#ef4444' }}>
                      −{techFocusRequests.filter(r => r.estado === 'APROBADA').reduce((s, r) => s + Number(r.horas || 0), 0).toFixed(2)}h
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowTechSummary(false)}>Cerrar</button>
        </div>
      </Modal>

      {/* Modal de confirmación para rechazar */}
      <Modal
        open={!!confirmReject}
        title="Confirmar rechazo"
        onClose={() => setConfirmReject(null)}
      >
        <p style={{ margin: '0 0 16px 0' }}>
          ¿Estás seguro de rechazar la solicitud de <strong>{confirmReject?.tech}</strong>?
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={() => setConfirmReject(null)}>Cancelar</button>
          <button className="btn danger" onClick={confirmRejectAction}>Sí, rechazar</button>
        </div>
      </Modal>
    </div>
  )
}
