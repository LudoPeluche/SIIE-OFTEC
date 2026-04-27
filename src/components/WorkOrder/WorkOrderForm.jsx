import { useState } from 'react'
import {
    STATUS,
    LABEL_BY_STATUS,
    PRIORITIES,
    PRIORITY_LABEL,
    SERVICE_OPTIONS,
    PEOPLE,
    TOOL_OPTIONS
} from '../../constants'

export default function WorkOrderForm({ draft, setDraft, onCancel, onSave, clientSuggestions, clientInput }) {

    function toggleService(key) {
        setDraft(prev => {
            const exists = prev.tipoServicios.includes(key)
            const next = exists ? prev.tipoServicios.filter(k => k !== key) : [...prev.tipoServicios, key]
            return { ...prev, tipoServicios: next }
        })
    }

    function toggleTool(key) {
        setDraft(prev => {
            const exists = prev.herramientas.includes(key)
            const next = exists ? prev.herramientas.filter(k => k !== key) : [...prev.herramientas, key]
            return { ...prev, herramientas: next }
        })
    }

    function toggleAssignedDraft(person) {
        setDraft(prev => {
            const exists = prev.asignados.includes(person)
            const next = exists ? prev.asignados.filter(p => p !== person) : [...prev.asignados, person]
            return { ...prev, asignados: next }
        })
    }

    // Helper to calculate totals for display
    const horasTotales = (data) => {
        const base = Number(data.horasPlanta || 0) + Number(data.horasGabinete || 0)
        return Math.max(0, base)
    }

    return (
        <div className="grid">
            <div className="col-6 field">
                <label>Responsable del servicio</label>
                <select className="input" value={draft.responsable} onChange={(e) => setDraft(d => ({ ...d, responsable: e.target.value }))}>
                    <option value="">Selecciona...</option>
                    {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div className="col-6 field">
                <label>Acompañantes (1 a 3)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                                onClick={() => toggleAssignedDraft(p)}
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
                    onChange={(e) => setDraft(d => ({ ...d, cliente: '', clienteOtro: e.target.value }))}
                    placeholder="Buscar o escribir cliente"
                />
                <div style={{ maxHeight: 140, overflowY: 'auto', marginTop: 6, border: '1px solid var(--line)', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                    {clientSuggestions.map(c => (
                        <div
                            key={c}
                            style={{ padding: '8px 10px', cursor: 'pointer' }}
                            onMouseDown={() => setDraft(d => ({ ...d, cliente: c, clienteOtro: '' }))}
                        >
                            {c}
                        </div>
                    ))}
                    {!clientSuggestions.length && (
                        <div style={{ padding: '8px 10px' }}>
                            <div className="muted">No hay coincidencias</div>
                            <div
                                className="badge"
                                style={{ cursor: 'pointer', display: 'inline-block', marginTop: 6 }}
                                onMouseDown={() => setDraft(d => ({ ...d, cliente: clientInput.toUpperCase(), clienteOtro: '' }))}
                            >
                                Usar "{clientInput || 'nuevo cliente'}"
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="col-6 field">
                <label>PDV</label>
                <input className="input" value={draft.pdv} onChange={(e) => setDraft(d => ({ ...d, pdv: e.target.value }))} placeholder="Ej: SANTA CRUZ" />
            </div>
            <div className="col-6 field">
                <label>Fecha inicio</label>
                <input className="input" type="date" value={draft.fechaInicio} onChange={(e) => setDraft(d => ({ ...d, fechaInicio: e.target.value }))} />
            </div>
            <div className="col-6 field">
                <label>Fecha fin</label>
                <input className="input" type="date" value={draft.fechaFin} onChange={(e) => setDraft(d => ({ ...d, fechaFin: e.target.value }))} />
            </div>
            <div className="col-6 field">
                <label>Prioridad</label>
                <select className="input" value={draft.prioridad} onChange={(e) => setDraft(d => ({ ...d, prioridad: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                </select>
            </div>
            <div className="col-6 field">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <label style={{ margin: 0 }}>Fecha entrega de informe</label>
                    <button
                        type="button"
                        className="btn"
                        style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            fontWeight: 700,
                            background: draft.fechaInforme ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: draft.fechaInforme ? '#10b981' : '#ef4444',
                            border: `1px solid ${draft.fechaInforme ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                        }}
                        onClick={() => setDraft(d => ({ ...d, fechaInforme: d.fechaInforme ? '' : new Date().toISOString().split('T')[0] }))}
                    >
                        {draft.fechaInforme ? 'Aplica' : 'No aplica'}
                    </button>
                </div>
                {draft.fechaInforme ? (
                    <input className="input" type="date" value={draft.fechaInforme} onChange={(e) => setDraft(d => ({ ...d, fechaInforme: e.target.value }))} />
                ) : (
                    <div className="input" style={{ color: 'var(--muted)', cursor: 'default' }}>No aplica</div>
                )}
            </div>
            <div className="col-12 field">
                <label>Contacto en planta (referencia)</label>
                <input className="input" value={draft.referencia} onChange={(e) => setDraft(d => ({ ...d, referencia: e.target.value }))} placeholder="Nombre de la persona de contacto" />
            </div>
            <div className="col-6 field">
                <label>Estado</label>
                <select className="input" value={draft.estado} onChange={(e) => setDraft(d => ({ ...d, estado: e.target.value }))}>
                    {STATUS.map(s => <option key={s} value={s}>{LABEL_BY_STATUS[s]}</option>)}
                </select>
            </div>
            <div className="col-6 field">
                <label>Presupuesto planificado</label>
                <input className="input" type="number" value={draft.presupuesto} onChange={(e) => setDraft(d => ({ ...d, presupuesto: e.target.value }))} placeholder="Ej: 1200" />
            </div>
            <div className="col-6 field">
                <label>Tipo de servicio</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '6px 10px' }}>
                    {SERVICE_OPTIONS.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={draft.tipoServicios.includes(opt)}
                                onChange={() => toggleService(opt)}
                            />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
                {draft.tipoServicios.includes('OTRO') && (
                    <input
                        className="input"
                        style={{ marginTop: 8 }}
                        value={draft.tipoServicioOtro}
                        onChange={(e) => setDraft(d => ({ ...d, tipoServicioOtro: e.target.value }))}
                        placeholder="Describe el servicio"
                    />
                )}
            </div>
            <div className="col-6 field">
                <label>Herramientas</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '6px 10px' }}>
                    {TOOL_OPTIONS.map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <input
                                type="checkbox"
                                checked={draft.herramientas.includes(opt)}
                                onChange={() => toggleTool(opt)}
                            />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="col-4 field">
                <label>Horas de trabajo en planta</label>
                <input className="input" type="number" step="0.25" value={draft.horasPlanta} onChange={(e) => setDraft(d => ({ ...d, horasPlanta: e.target.value }))} />
            </div>
            <div className="col-4 field">
                <label>Horas de trabajo en gabinete</label>
                <input className="input" type="number" step="0.25" value={draft.horasGabinete} onChange={(e) => setDraft(d => ({ ...d, horasGabinete: e.target.value }))} />
            </div>
            <div className="col-4 field">
                <label>Horas totales</label>
                <input className="input" value={horasTotales(draft).toFixed(2)} readOnly />
            </div>
            <div className="col-12 field">
                <label>Alcance técnico</label>
                <textarea className="input" rows="5" value={draft.alcance} onChange={(e) => setDraft(d => ({ ...d, alcance: e.target.value }))} placeholder="Detalle técnico y consideraciones" />
            </div>

            <div className="col-12 modal-actions">
                <button className="btn" onClick={onCancel}>Cancelar</button>
                <button className="btn primary" onClick={onSave}>Guardar</button>
            </div>
        </div>
    )
}
