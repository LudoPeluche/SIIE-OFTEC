import Chip from '../Chip.jsx'
import {
    STATUS,
    TONE_BY_STATUS,
    LABEL_BY_STATUS,
    PRIORITY_TONE,
    PRIORITY_LABEL
} from '../../constants'

function parseDate(value) {
    if (!value) return null
    const [y, m, d] = String(value).split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
}

function getTimingStatus(it) {
    if (it.estado === 'CLOSED' || it.estado === 'CANCELED') return 'CERRADA'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const d = parseDate(it.fechaFin || it.fechaInicio)
    if (!d) return 'SIN_FECHA'
    if (d < today) return 'VENCIDA'
    if (d.getTime() === today.getTime()) return 'HOY'
    if (d <= nextWeek) return 'ESTA_SEMANA'
    return 'PROXIMA'
}

const TIMING_ROW_BG = {
    VENCIDA:     'rgba(239,68,68,0.06)',
    HOY:         'rgba(16,185,129,0.06)',
    ESTA_SEMANA: 'rgba(59,130,246,0.04)',
    SIN_FECHA:   'transparent',
    PROXIMA:     'transparent',
    CERRADA:     'transparent'
}
const TIMING_DATE_COLOR = {
    VENCIDA:     '#ef4444',
    HOY:         '#10b981',
    ESTA_SEMANA: '#3b82f6',
    SIN_FECHA:   '#cbd5e1',
    PROXIMA:     '#cbd5e1',
    CERRADA:     '#64748b'
}

export default function WorkOrderTable({
    items,
    isAdmin,
    isPlanner,
    isTech,
    booting,
    openDetail,
    openAssign,
    setStatus,
    openCloseModal,
    openRework,
    remove
}) {

    function handleStatusChange(item, newStatus) {
        setStatus(item.id, newStatus)
    }

    return (
        <>
            <div className="table-wrap desktop-only">
                <table>
                    <thead>
                        <tr>
                            <th className="col-id" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>ID</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Cliente</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Contacto en planta</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Fecha inicio</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Fecha fin</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Entrega informe</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Responsable</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Acompañantes</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Prioridad</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Estado</th>
                            <th style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.3px' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {booting && (
                            <>
                                <tr><td colSpan={11} className="skeleton-line"></td></tr>
                                <tr><td colSpan={11} className="skeleton-line"></td></tr>
                                <tr><td colSpan={11} className="skeleton-line"></td></tr>
                            </>
                        )}
                        {!booting && items.map(it => {
                            const timing = getTimingStatus(it)
                            return (
                            <tr key={it.id} style={{ background: TIMING_ROW_BG[timing] }}>
                                <td className="col-id">
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{it.code || it.id}</span>
                                </td>
                                <td style={{ fontWeight: 600, fontSize: 13 }}>{it.cliente}</td>
                                <td style={{ color: '#94a3b8', fontSize: 13 }}>{it.pdv || '-'}</td>
                                <td style={{ fontSize: 13, color: '#cbd5e1' }}>{it.fechaInicio}</td>
                                <td style={{ fontSize: 13, color: TIMING_DATE_COLOR[timing], fontWeight: timing === 'VENCIDA' || timing === 'HOY' ? 700 : 400 }}>{it.fechaFin || '-'}</td>
                                <td style={{ fontSize: 13, color: '#cbd5e1' }}>{it.fechaInforme || '-'}</td>
                                <td style={{ fontWeight: 600, fontSize: 13, color: '#e6edf7' }}>{it.responsable || '-'}</td>
                                <td>
                                    {it.asignados?.length ? (
                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#7dd3fc' }}>
                                            {it.asignados.length} técnico{it.asignados.length > 1 ? 's' : ''}
                                        </span>
                                    ) : <span className="muted" style={{ fontSize: 12 }}>-</span>}
                                </td>
                                <td>
                                    <span style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: it.prioridad === 'ALTA' ? '#fca5a5' : it.prioridad === 'MEDIA' ? '#fbbf24' : '#94a3b8'
                                    }}>
                                        {PRIORITY_LABEL[it.prioridad] ?? 'Media'}
                                    </span>
                                </td>
                                <td><Chip tone={TONE_BY_STATUS[it.estado] ?? 'blue'}>{LABEL_BY_STATUS[it.estado] ?? it.estado}</Chip></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                                        <button
                                            className="btn"
                                            style={{
                                                fontSize: 13,
                                                padding: '8px 12px',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap'
                                            }}
                                            onClick={() => openDetail(it)}
                                        >
                                            Ver
                                        </button>
                                        {(isTech || isAdmin) && it.estado !== 'CLOSED' && (
                                            <button
                                                className="btn primary"
                                                style={{
                                                    fontSize: 13,
                                                    padding: '8px 12px',
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onClick={() => openCloseModal(it)}
                                            >
                                                Completar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {!items.length && !booting && (
                            <tr><td colSpan={11} className="muted">Sin OTs</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mobile-only">
                {booting && <div className="skeleton-line" style={{ marginTop: 8 }}></div>}
                {!booting && items.map(it => (
                    <div key={`card-${it.id || it.code}`} className="card" style={{ marginBottom: 10, background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div>
                                <div className="muted">{it.code || it.id} · {it.cliente}</div>
                                <div style={{ fontWeight: 700, marginTop: 4 }}>{it.referencia}</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                    <Chip tone={PRIORITY_TONE[it.prioridad] ?? 'blue'}>{PRIORITY_LABEL[it.prioridad] ?? 'Media'}</Chip>
                                    <Chip tone={TONE_BY_STATUS[it.estado] ?? 'blue'}>{LABEL_BY_STATUS[it.estado] ?? it.estado}</Chip>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <button className="btn" onClick={() => openDetail(it)}>Ver</button>
                                {!isTech && <button className="btn" onClick={() => openAssign(it)}>Asignar</button>}
                            </div>
                        </div>
                        <div className="muted" style={{ marginTop: 6 }}>Fin: {it.fechaFin || '-'}</div>
                        <div className="muted" style={{ marginTop: 2 }}>Entrega informe: {it.fechaInforme || '-'}</div>
                        <div style={{ marginTop: 6 }}>
                            Acompañantes:
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                {it.asignados?.length ? it.asignados.map(a => <span key={a} className="chip">{a}</span>) : <span className="muted">Sin asignar</span>}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            <button className="btn" disabled={it.estado === 'CLOSED' && !isAdmin} onClick={() => setStatus(it.id, 'IN_PROGRESS')}>En proceso</button>
                            <button className="btn primary" disabled={it.estado === 'CLOSED' && !isAdmin} onClick={() => openCloseModal(it)}>Completar</button>
                            {(isAdmin || isPlanner) && it.estado === 'CLOSED' && (
                                <button className="btn" onClick={() => openRework(it)}>Re-trabajo</button>
                            )}
                            {!isTech && <button className="btn danger" onClick={() => remove(it.id)}>Borrar</button>}
                        </div>
                    </div>
                ))}
                {!booting && !items.length && <div className="muted">No hay coincidencias con los filtros.</div>}
            </div>
        </>
    )
}
