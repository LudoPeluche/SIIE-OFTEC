import {
    STATUS,
    LABEL_BY_STATUS,
    PRIORITIES,
    PRIORITY_LABEL,
    LABEL_BY_STATUS as STATUS_LABELS,
    PLANIFICACION_ITEMS
} from '../../constants'

export default function WorkOrderDetails({
    viewing,
    detailDraft,
    setDetailDraft,
    isAdmin,
    canCorrect,
    onCorrect,
    onClose,
    onSave,
    onOpenWorkSheet,
    hasWorkSheet
}) {
    if (!viewing) return null
    const toolReady = viewing.checklist?.toolReady ?? viewing.toolReady
    const toolsComplete = viewing.checklist?.toolsComplete ?? viewing.toolsComplete
    const toolNote = viewing.checklist?.toolNote ?? viewing.toolNote
    const hasChecklist = typeof toolReady === 'boolean' || typeof toolsComplete === 'boolean' || (toolNote || '').trim()

    return (
        <>
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
                    <label>PDV</label>
                    <div className="badge" style={{ color: viewing.pdv ? '#fbbf24' : undefined }}>{viewing.pdv || <span style={{ opacity: 0.4 }}>No especificado</span>}</div>
                </div>
                <div className="col-6 field">
                    <label>Estado</label>
                    <select className="input" value={detailDraft.estado} onChange={(e) => setDetailDraft(d => ({ ...d, estado: e.target.value }))} disabled={!isAdmin}>
                        {STATUS.map(s => <option key={s} value={s}>{LABEL_BY_STATUS[s]}</option>)}
                    </select>
                </div>
                <div className="col-6 field">
                    <label>Prioridad</label>
                    <select className="input" value={detailDraft.prioridad} onChange={(e) => setDetailDraft(d => ({ ...d, prioridad: e.target.value }))}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                    </select>
                </div>
                <div className="col-6 field">
                    <label>Fecha inicio</label>
                    <input className="input" type="date" value={detailDraft.fechaInicio} onChange={(e) => setDetailDraft(d => ({ ...d, fechaInicio: e.target.value }))} />
                </div>
                <div className="col-6 field">
                    <label>Fecha fin</label>
                    <input className="input" type="date" value={detailDraft.fechaFin} onChange={(e) => setDetailDraft(d => ({ ...d, fechaFin: e.target.value }))} />
                </div>
                <div className="col-6 field">
                    <label>Fecha entrega de informe</label>
                    <input className="input" type="date" value={detailDraft.fechaInforme} onChange={(e) => setDetailDraft(d => ({ ...d, fechaInforme: e.target.value }))} />
                </div>
                <div className="col-6 field">
                    <label>Responsable</label>
                    <div className="badge">{viewing.responsable || 'N/D'}</div>
                </div>
                <div className="col-6 field">
                    <label>Acompañantes</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {viewing.asignados?.length ? viewing.asignados.map(a => <span key={a} className="chip">{a}</span>) : <span className="muted">Sin asignar</span>}
                    </div>
                </div>
                <div className="col-12 field">
                    <label>Tipo de servicio</label>
                    {viewing.tipoServicios?.length ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {viewing.tipoServicios.map(s => <span key={s} className="chip">{s}</span>)}
                        </div>
                    ) : (
                        <div className="muted">Sin capturar</div>
                    )}
                    {viewing.tipoServicioOtro && <div className="muted" style={{ marginTop: 4 }}>Otro: {viewing.tipoServicioOtro}</div>}
                </div>
                <div className="col-12 field">
                    <label>Alcance</label>
                    <div className="badge" style={{ whiteSpace: 'pre-wrap' }}>{viewing.alcance || 'Sin notas'}</div>
                </div>
                <div className="col-12 field">
                    <label>Checklist de herramientas (cierre)</label>
                    {!hasChecklist ? (
                        <div className="muted">Sin checklist capturado.</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className={`chip ${toolReady ? 'ok' : 'bad'}`}>{toolReady ? 'Herramienta OK' : 'Herramienta en mal estado'}</span>
                                <span className={`chip ${toolsComplete ? 'ok' : 'warn'}`}>{toolsComplete ? 'Completo' : 'Faltó herramienta'}</span>
                            </div>
                            <div className="muted" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>
                                {toolNote || 'Sin nota'}
                            </div>
                        </>
                    )}
                </div>
                {isAdmin && (
                    <div className="col-12 field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={!!detailDraft.esDeuda}
                                onChange={(e) => setDetailDraft(d => ({ ...d, esDeuda: e.target.checked }))}
                            />
                            <span>Marcar como deuda/legado</span>
                            <span className="muted" style={{ fontSize: 11 }}>(no cuenta en KPIs del Dashboard)</span>
                        </label>
                    </div>
                )}
                {(() => {
                    const planData = viewing.work_sheet_data?.planificacion || null
                    if (!planData) return (
                        <div className="col-12 field">
                            <label>Planificación del servicio</label>
                            <div className="muted">Sin hoja de trabajo registrada.</div>
                        </div>
                    )
                    const done = PLANIFICACION_ITEMS.filter(p => planData[p.key] === 'SI').length
                    return (
                        <div className="col-12 field">
                            <label>Planificación del servicio — {done}/{PLANIFICACION_ITEMS.length}</label>
                            <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                                {PLANIFICACION_ITEMS.map(p => {
                                    const val = planData[p.key]
                                    const color = val === 'SI' ? '#10b981' : val === 'NO' ? '#ef4444' : '#64748b'
                                    const icon = val === 'SI' ? '✓' : val === 'NO' ? '✗' : '—'
                                    return (
                                        <div key={p.key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 10px', borderRadius: 6, background: `${color}10`, border: `1px solid ${color}25` }}>
                                            <span style={{ fontWeight: 800, color, fontSize: 14, width: 16, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                                            <span style={{ fontSize: 13, color: val ? '#e2e8f0' : '#64748b' }}>{p.label}</span>
                                            {val && val !== 'NA' && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color }}>{val}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })()}
                <div className="col-12 field">
                    <label>Historial de re-trabajo</label>
                    {viewing.reworkHistory?.length ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                            {viewing.reworkHistory.map((h, idx) => (
                                <div key={idx} className="card" style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span className="badge">{h.date || '-'}</span>
                                        <span className="chip">{h.by || 'N/D'}</span>
                                        <span className="muted" style={{ fontSize: 12 }}>desde {STATUS_LABELS[h.from] || h.from || 'N/D'}</span>
                                    </div>
                                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{h.reason || 'Sin motivo'}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="muted">Sin re-trabajos registrados.</div>
                    )}
                </div>
            </div>
            <div className="modal-actions">
                <button className="btn" onClick={onClose}>Cerrar</button>
                {canCorrect && onCorrect && (
                    <button
                        className="btn"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}
                        onClick={() => onCorrect(viewing)}
                    >
                        Corregir datos
                    </button>
                )}
                {onOpenWorkSheet && (
                    <button
                        className="btn"
                        style={{
                            background: hasWorkSheet ? 'rgba(16,185,129,0.15)' : 'transparent',
                            color: hasWorkSheet ? 'var(--ok)' : undefined,
                            border: hasWorkSheet ? '1px solid var(--ok)' : undefined
                        }}
                        onClick={() => onOpenWorkSheet(viewing)}
                    >
                        {hasWorkSheet ? 'Ver Hoja de Trabajo' : 'Crear Hoja de Trabajo'}
                    </button>
                )}
                <button className="btn primary" onClick={onSave}>Guardar</button>
            </div>
        </>
    )
}
