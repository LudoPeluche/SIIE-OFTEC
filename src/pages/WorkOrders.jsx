import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import Chip from '../components/Chip.jsx'
import WorkOrderDetails from '../components/WorkOrder/WorkOrderDetails.jsx'
import WorkOrderForm from '../components/WorkOrder/WorkOrderForm.jsx'
import WorkOrderTable from '../components/WorkOrder/WorkOrderTable.jsx'
import { nowISODate } from '../lib/utils.js'
import { listWorkOrders, upsertWorkOrder, updateWorkOrder, deleteWorkOrder } from '../lib/woService.js'
import { listExtraHours } from '../lib/extraHoursService.js'
// Los datos de la hoja de trabajo se guardan directamente en work_orders.work_sheet_data
import WorkSheetModal from '../components/WorkSheet/WorkSheetModal.jsx'
import BulkUploadModal from '../components/WorkOrder/BulkUploadModal.jsx'
import {
  STATUS,
  TONE_BY_STATUS,
  LABEL_BY_STATUS,
  PRIORITIES,
  PRIORITY_TONE,
  PRIORITY_LABEL,
  SERVICE_OPTIONS,
  CLIENTS,
  PEOPLE,
  TOOL_OPTIONS,
  PLANIFICACION_ITEMS,
  RIESGOS_ITEMS
} from '../constants.js'

// Aliases for compatibility if needed, or update usage below
const toneByStatus = TONE_BY_STATUS
const labelByStatus = LABEL_BY_STATUS
const priorityTone = PRIORITY_TONE
const priorityLabel = PRIORITY_LABEL

const seed = [
  {
    code: 'OT-001',
    cliente: 'EMPACAR',
    referencia: 'MONTAR 2DO REDUCTOR',
    fechaPlan: nowISODate(),
    responsable: 'JESSE PORRAS',
    asignados: ['JESSE PORRAS'],
    prioridad: 'ALTA',
    fechaCompromiso: nowISODate(),
    estado: 'OPEN',
    pdv: '',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa: 'PLANIFICACION',
    presupuesto: '',
    fechaInforme: nowISODate(),
    tipoServicios: ['MONITOREO DE VIBRACIONES'],
    tipoServicioOtro: '',
    herramientas: '',
    horasPlanta: '4',
    horasGabinete: '2',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales: '0',
    horasExtraReales: '0',
    gastos: '0',
    observacionesCierre: '',
    alcance: '',
    observaciones: '',
    reworkHistory: [],
    toolReady: false,
    toolsComplete: false,
    toolNote: ''
  },
  {
    code: 'OT-002',
    cliente: 'SOFIA',
    referencia: 'CAMBIO DE CILINDRO',
    fechaPlan: nowISODate(),
    responsable: 'BRAYAN IBARRA',
    asignados: ['BRAYAN IBARRA'],
    prioridad: 'MEDIA',
    fechaCompromiso: nowISODate(),
    estado: 'IN_PROGRESS',
    pdv: '',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa: 'EJECUCION',
    presupuesto: '',
    fechaInforme: nowISODate(),
    tipoServicios: ['ALINEACION LASER DE EJES'],
    tipoServicioOtro: '',
    herramientas: '',
    horasPlanta: '6',
    horasGabinete: '1',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales: '0',
    horasExtraReales: '0',
    gastos: '0',
    observacionesCierre: '',
    alcance: '',
    observaciones: '',
    reworkHistory: [],
    toolReady: false,
    toolsComplete: false,
    toolNote: ''
  },
  {
    code: 'OT-003',
    cliente: 'TECNOPOR',
    referencia: 'PLAN DE MANTENIMIENTO',
    fechaPlan: nowISODate(),
    responsable: 'DIEGO ORTUÑO',
    asignados: ['DIEGO ORTUÑO'],
    prioridad: 'MEDIA',
    fechaCompromiso: nowISODate(),
    estado: 'OPEN',
    pdv: '',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa: 'PLANIFICACION',
    presupuesto: '',
    fechaInforme: nowISODate(),
    tipoServicios: ['ANALISIS DE ACEITE'],
    tipoServicioOtro: '',
    herramientas: '',
    horasPlanta: '3',
    horasGabinete: '2',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales: '0',
    horasExtraReales: '0',
    gastos: '0',
    observacionesCierre: '',
    alcance: '',
    observaciones: '',
    reworkHistory: [],
    toolReady: false,
    toolsComplete: false,
    toolNote: ''
  },
]

const STORAGE_KEY = 'otData'


export default function WorkOrders({ role = 'ADMIN', tech = '' }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [assigning, setAssigning] = useState(null)
  const [assignDraft, setAssignDraft] = useState({ asignados: [], prioridad: 'MEDIA', fechaFin: nowISODate(), notify: true })
  const [viewing, setViewing] = useState(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [techDashTech, setTechDashTech] = useState(tech || '')
  const [detailDraft, setDetailDraft] = useState({
    estado: '',
    prioridad: 'MEDIA',
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
    horasReales: '0',
    horasExtraReales: '0',
    horasPorTecnico: [], // [{tech, horas, horasExtra}]
    gastos: '0',
    observacionesCierre: '',
    toolReady: false,
    toolsComplete: false,
    toolNote: ''
  })
  const [correcting, setCorrecting] = useState(null)
  const [correctionDraft, setCorrectionDraft] = useState({
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasPorTecnico: [],
    gastos: '0',
    observacionesCierre: ''
  })
  const [draft, setDraft] = useState({
    cliente: '',
    clienteOtro: '',
    referencia: '',
    fechaPlan: nowISODate(),
    responsable: '',
    asignados: [],
    prioridad: 'MEDIA',
    fechaCompromiso: nowISODate(),
    estado: 'OPEN',
    pdv: '',
    fechaInicio: nowISODate(),
    fechaFin: nowISODate(),
    etapa: 'PLANIFICACION',
    presupuesto: '',
    fechaInforme: nowISODate(),
    tipoServicios: [],
    tipoServicioOtro: '',
    herramientas: [],
    horasPlanta: '0',
    horasGabinete: '0',
    realFechaInicio: nowISODate(),
    realFechaFin: nowISODate(),
    horasReales: '0',
    horasExtraReales: '0',
    gastos: '0',
    observacionesCierre: '',
    alcance: '',
    observaciones: '',
    reworkHistory: []
  })
  const [techFilters, setTechFilters] = useState({ cliente: 'ALL', servicio: 'ALL' })
  const [reworkTarget, setReworkTarget] = useState(null)
  const [reworkReason, setReworkReason] = useState('')
  const [reworkAssignados, setReworkAssignados] = useState([])
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [extraRequests, setExtraRequests] = useState([])
  const [workSheetOpen, setWorkSheetOpen] = useState(false)
  const [workSheetOrder, setWorkSheetOrder] = useState(null)
  const [workSheetLoading, setWorkSheetLoading] = useState(false)
  const [workSheetsMap, setWorkSheetsMap] = useState({}) // { workOrderId: true/false }
  const displayId = (item) => item?.code || item?.id

  const clientInput = draft.cliente || draft.clienteOtro
  const clientSuggestions = CLIENTS.filter(c => clientInput ? c.toLowerCase().includes(clientInput.toLowerCase()) : true).slice(0, 8)

  const isTech = role === 'TECH'
  const isAdmin = role === 'ADMIN'
  const isPlanner = role === 'PLANNER'
  const isOperator = isTech || isPlanner
  const isMine = (item) => (item?.asignados || []).includes(tech)
  const parseDate = (value) => {
    if (!value) return null
    const [y, m, d] = String(value).split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }
  const getTimingStatus = (it) => {
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
  const baseItems = useMemo(() => {
    if (isTech && tech) {
      return items.filter(it => (it.asignados || []).includes(tech))
    }
    return items
  }, [items, isTech, tech])

  const counts = useMemo(() => {
    const statuses = isTech ? ['OPEN', 'IN_PROGRESS', 'REWORK'] : STATUS
    const c = Object.fromEntries(statuses.map(s => [s, 0]))
    for (const it of baseItems) c[it.estado] = (c[it.estado] ?? 0) + 1
    return c
  }, [baseItems, isTech])

  const myPendings = useMemo(() => {
    if (!tech || !(isOperator || isAdmin)) return []
    return items.filter(it => {
      if (it.estado === 'CLOSED' || it.estado === 'CANCELED') return false
      const assigned = (it.asignados || []).includes(tech)
      const responsible = it.responsable === tech
      return assigned || responsible
    })
  }, [items, tech, isOperator, isAdmin])
  const techDashboard = useMemo(() => {
    const activeTech = isTech ? tech : techDashTech
    if (!activeTech) return { totalHours: 0, totalExtra: 0, topClients: [], topServices: [], serviceStats: [], availableExtra: 0 }
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const soon = new Date(todayNoTime)
    soon.setDate(soon.getDate() + 3)
    const filterByCliente = techFilters.cliente !== 'ALL'
    const filterByServicio = techFilters.servicio !== 'ALL'
    const monthKey = (dateStr) => {
      const base = dateStr || ''
      const [y, m] = base.split('-')
      return y && m ? `${y}-${m}` : 'N/D'
    }
    const labelMonth = (key) => {
      if (!key || key === 'N/D') return 'N/D'
      const [y, m] = key.split('-')
      const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      const idx = Number(m) - 1
      const monthName = names[idx] || m
      return `${monthName} ${y}`
    }
    const sourceItems = isTech ? baseItems : items
    const techItems = sourceItems.filter(it => {
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      if (participants.includes(activeTech)) return true
      const hpt = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      return hpt.some(h => h.tech === activeTech)
    })
    const filtered = techItems.filter(it => {
      if (filterByCliente && it.cliente !== techFilters.cliente) return false
      if (filterByServicio && !(it.tipoServicios || []).includes(techFilters.servicio)) return false
      return true
    })
    const countsMap = new Map()
    const hoursMap = new Map()
    const clientAgg = new Map()
    const serviceAgg = new Map()
    let totalHours = 0
    let totalExtra = 0
    for (const it of filtered) {
      const key = monthKey(it.fechaFin || it.fechaInicio || nowISODate())
      const prevCounts = countsMap.get(key) || { OPEN: 0, IN_PROGRESS: 0, REWORK: 0, CLOSED: 0, CANCELED: 0 }
      prevCounts[it.estado] = (prevCounts[it.estado] ?? 0) + 1
      countsMap.set(key, prevCounts)
      // Usar horas individuales del técnico, no el total del equipo
      const perTechArr = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const techEntry = perTechArr.find(h => h.tech === activeTech)
      let techHrs, techExtra
      if (techEntry) {
        techHrs = isNaN(Number(techEntry.horas)) ? 0 : Number(techEntry.horas)
        techExtra = isNaN(Number(techEntry.horasExtra)) ? 0 : Number(techEntry.horasExtra)
      } else {
        const numP = Math.max(1, Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean))).length)
        techHrs = (isNaN(Number(it.horasReales)) ? 0 : Number(it.horasReales)) / numP
        techExtra = (isNaN(Number(it.horasExtraReales)) ? 0 : Number(it.horasExtraReales)) / numP
      }
      const hrsValid = techHrs + techExtra
      totalHours += hrsValid
      totalExtra += techExtra
      const prevHrs = hoursMap.get(key) || 0
      hoursMap.set(key, prevHrs + hrsValid)
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
      // Buscar horas extra del técnico específico en el desglose por técnico
      const perTech = Array.isArray(it.horasPorTecnico) ? it.horasPorTecnico : []
      const techEntry = perTech.find(h => h.tech === activeTech)
      if (techEntry) {
        const extra = Number(techEntry.horasExtra || 0)
        return sum + (isNaN(extra) ? 0 : extra)
      }
      // Fallback para registros antiguos sin desglose: dividir entre participantes
      const participants = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
      if (!participants.includes(activeTech)) return sum
      const totalExtra = Number(it.horasExtraReales || 0)
      if (isNaN(totalExtra)) return sum
      return sum + (participants.length > 1 ? totalExtra / participants.length : totalExtra)
    }, 0)
    const myReqs = extraRequests.filter(r => r.tech === activeTech)
    const approved = myReqs.filter(r => r.estado === 'APROBADA').reduce((s, r) => s + Number(r.horas || 0), 0)
    const pending = myReqs.filter(r => r.estado === 'PENDIENTE').reduce((s, r) => s + Number(r.horas || 0), 0)
    const availableExtra = Math.max(0, earnedExtra - approved - pending)
    return {
      totalHours,
      totalExtra,
      topClients,
      topServices,
      serviceStats,
      availableExtra
    }
  }, [baseItems, isTech, techFilters, tech, techDashTech, items, extraRequests])
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('ALL')
  const [prioridadFilter, setPrioridadFilter] = useState('ALL')
  const [asignadoFilter, setAsignadoFilter] = useState('ALL')
  const [responsableFilter, setResponsableFilter] = useState('ALL')

  const filteredItems = useMemo(() => {
    return baseItems.filter(it => {
      if (estadoFilter !== 'ALL' && it.estado !== estadoFilter) return false
      if (prioridadFilter !== 'ALL' && (it.prioridad || 'MEDIA') !== prioridadFilter) return false
      if (asignadoFilter !== 'ALL' && !(it.asignados || []).includes(asignadoFilter)) return false
      if (responsableFilter !== 'ALL' && it.responsable !== responsableFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const target = `${it.cliente} ${it.referencia}`.toLowerCase()
        if (!target.includes(q)) return false
      }
      return true
    })
  }, [baseItems, estadoFilter, prioridadFilter, asignadoFilter, responsableFilter, search])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    async function fetchRemote() {
      try {
        setLoadingRemote(true)
        const data = await listWorkOrders()
        if (Array.isArray(data)) setItems(data)
      } catch (_err) {
        setToast({ tone: 'bad', msg: 'No se pudo sincronizar OTs' })
      } finally {
        setLoadingRemote(false)
      }
    }
    fetchRemote()
  }, [])

  useEffect(() => {
    async function fetchExtra() {
      try {
        const reqs = await listExtraHours()
        if (Array.isArray(reqs)) setExtraRequests(reqs)
      } catch (_) { }
    }
    fetchExtra()
  }, [])

  // Actualizar mapa de hojas de trabajo cuando cambian los items
  // Solo marca como completada si work_sheet_completed es explícitamente true
  useEffect(() => {
    const map = {}
    items.forEach(it => {
      if (it.work_sheet_completed === true) {
        map[it.id] = true
      }
    })
    setWorkSheetsMap(map)
  }, [items])

  useEffect(() => {
    const saved = localStorage.getItem('prefillOT')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setDraft(prev => ({
          ...prev,
          cliente: (data.cliente || '').toUpperCase(),
          clienteOtro: '',
          referencia: (data.referencia || '').toUpperCase(),
          asignados: data.asignados || [],
          responsable: data.responsable || '',
          fechaPlan: data.fechaPlan || nowISODate(),
          fechaCompromiso: data.fechaCompromiso || data.fechaPlan || nowISODate(),
          prioridad: data.prioridad || 'MEDIA',
          estado: 'OPEN'
        }))
        setOpen(true)
        setToast({ tone: 'ok', msg: 'OT precargada desde Plan Semanal' })
      } catch (_) { }
      localStorage.removeItem('prefillOT')
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setBooting(false), 200)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (isTech) setTechDashTech(tech || '')
  }, [isTech, tech])

  const horasTotales = (data) => {
    const base = Number(data.horasPlanta || 0) + Number(data.horasGabinete || 0)
    return Math.max(0, base)
  }

  const normalizeAsignados = (asignados, responsable) => {
    const list = Array.isArray(asignados) ? asignados : []
    const owner = (responsable || '').trim()
    return Array.from(new Set(owner ? [...list, owner] : list))
  }

  const nextOtCode = () => {
    const numbers = items
      .map(it => String(it.code || it.id || ''))
      .map(str => str.startsWith('OT-') ? Number(str.slice(3)) : null)
      .filter(n => Number.isFinite(n))
    const maxFromCodes = numbers.length ? Math.max(...numbers) : 0
    const fallback = items.length + 1
    const next = Math.max(maxFromCodes + 1, fallback)
    return `OT-${String(next).padStart(3, '0')}`
  }

  function add() {
    if (!clientInput.trim()) {
      setToast({ tone: 'bad', msg: 'Ingresa un cliente' })
      return
    }
    if (!draft.referencia.trim()) {
      setToast({ tone: 'bad', msg: 'Ingresa el contacto en planta' })
      return
    }
    const nextCode = nextOtCode()
    const clienteFinal = draft.cliente || draft.clienteOtro || ''
    const clean = {
      ...draft,
      code: nextCode,
      cliente: clienteFinal.trim().toUpperCase(),
      referencia: draft.referencia.trim().toUpperCase(),
      responsable: draft.responsable.trim(),
      estado: draft.estado || 'OPEN',
      asignados: normalizeAsignados(draft.asignados, draft.responsable),
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
      tipoServicioOtro: draft.tipoServicioOtro.trim().toUpperCase(),
      reworkHistory: [],
      toolReady: false,
      toolsComplete: false,
      toolNote: ''
    }
    const payloadDb = { ...clean } // Let DB handle 'code' and 'id'
    upsertWorkOrder(payloadDb)
      .then(dbItem => {
        setItems(prev => [dbItem, ...prev])
        setToast({ tone: 'ok', msg: `OT creada: ${dbItem.code}` })
      })
      .catch((err) => {
        console.error(err)
        setToast({ tone: 'bad', msg: `Error: ${err.message}` })
      })
    setDraft({
      cliente: '',
      clienteOtro: '',
      referencia: '',
      fechaPlan: nowISODate(),
      responsable: '',
      asignados: [],
      prioridad: 'MEDIA',
      fechaCompromiso: nowISODate(),
      estado: 'OPEN',
      pdv: '',
      fechaInicio: nowISODate(),
      fechaFin: nowISODate(),
      realFechaInicio: nowISODate(),
      realFechaFin: nowISODate(),
      horasReales: '0',
      horasExtraReales: '0',
      gastos: '0',
      observacionesCierre: '',
      etapa: 'PLANIFICACION',
      presupuesto: '',
      fechaInforme: nowISODate(),
      tipoServicios: [],
      tipoServicioOtro: '',
      herramientas: [],
      horasPlanta: '0',
      horasGabinete: '0',
      alcance: '',
      observaciones: '',
      reworkHistory: []
    })
    setOpen(false)
  }

  function setStatus(id, estado, opts = {}) {
    let blocked = false
    let reason = opts.reason || ''
    const patch = opts.patch || null
    setItems(prev => {
      const target = prev.find(it => it.id === id)
      if (!target) return prev

      if (!isAdmin) {
        const allowedSelfAdvance = isOperator && isMine(target) && estado === 'IN_PROGRESS'
        const allowedPlannerRework = isPlanner && estado === 'REWORK'
        if (!(allowedSelfAdvance || allowedPlannerRework)) {
          blocked = true
          return prev
        }
      }

      const isRework = estado === 'REWORK'
      const alreadyClosed = target.estado === 'CLOSED'
      const canReopen = isAdmin
      const canMarkRework = (isAdmin || isPlanner) && alreadyClosed

      if (alreadyClosed && !canReopen && !isRework) {
        blocked = true
        return prev
      }
      if (isRework && !canMarkRework) {
        blocked = true
        return prev
      }
      if (isRework && !reason.trim()) {
        blocked = true
        setReworkTarget(target)
        return prev
      }

      const nextList = prev.map(it => {
        if (it.id !== id) return it
        const next = { ...it, estado, ...(patch || {}) }
        if (isRework) {
          const history = Array.isArray(it.reworkHistory) ? it.reworkHistory : []
          next.reworkHistory = [
            {
              date: nowISODate(),
              by: role,
              from: it.estado,
              reason: reason.trim()
            },
            ...history
          ]
        }
        return next
      })
      const updated = nextList.find(it => it.id === id)
      if (updated && !blocked) {
        updateWorkOrder(id, updated).catch(() => setToast({ tone: 'bad', msg: 'No se pudo actualizar en Supabase' }))
      }
      return nextList
    })
    if (blocked) {
      if (!isAdmin) {
        setToast({ tone: 'bad', msg: estado === 'REWORK' ? 'No puedes marcar re-trabajo' : 'Solo el jefe puede cambiar estados' })
      } else {
        setToast({ tone: 'bad', msg: estado === 'REWORK' ? 'No puedes marcar re-trabajo' : 'OT cerrada, solo el jefe puede reabrir' })
      }
    }
  }

  function remove(id) {
    const it = items.find(x => x.id === id)
    const confirmMsg = it ? `¿Borrar la OT ${displayId(it)} (${it.referencia})?` : '¿Borrar OT?'
    if (typeof window !== 'undefined') {
      const ok = window.confirm(confirmMsg)
      if (!ok) return
    }
    if (!id) {
      setItems(prev => prev.filter(it => it.id !== id))
      return
    }
    deleteWorkOrder(id)
      .then(() => setItems(prev => prev.filter(it => it.id !== id)))
      .catch(() => setToast({ tone: 'bad', msg: 'No se pudo borrar en Supabase' }))
  }

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

  function toggleAssignedModal(person) {
    setAssignDraft(prev => {
      const exists = prev.asignados.includes(person)
      const next = exists ? prev.asignados.filter(p => p !== person) : [...prev.asignados, person]
      return { ...prev, asignados: next }
    })
  }

  function openAssign(item) {
    setAssigning(item)
    setAssignDraft({
      asignados: item.asignados || [],
      prioridad: item.prioridad || 'MEDIA',
      fechaFin: item.fechaFin || item.fechaInicio || nowISODate(),
      notify: true
    })
  }

  function openDetail(item) {
    setViewing(item)
    setDetailDraft({
      estado: item.estado,
      prioridad: item.prioridad || 'MEDIA',
      fechaInicio: item.fechaInicio || nowISODate(),
      fechaFin: item.fechaFin || nowISODate(),
      fechaInforme: item.fechaInforme || nowISODate(),
      esDeuda: !!item.esDeuda
    })
  }

  function saveDetail() {
    if (!viewing) return
    if (!isAdmin) {
      setToast({ tone: 'bad', msg: 'Solo el jefe puede editar esta OT' })
      return
    }
    if (viewing.estado === 'CLOSED' && detailDraft.estado !== 'CLOSED' && !isAdmin) {
      setToast({ tone: 'bad', msg: 'OT cerrada, no se puede reabrir' })
      return
    }
    const updated = {
      ...viewing,
      estado: detailDraft.estado || viewing.estado,
      prioridad: detailDraft.prioridad || viewing.prioridad || 'MEDIA',
      fechaInicio: detailDraft.fechaInicio || viewing.fechaInicio,
      fechaFin: detailDraft.fechaFin || viewing.fechaFin,
      fechaInforme: detailDraft.fechaInforme || viewing.fechaInforme,
      esDeuda: !!detailDraft.esDeuda
    }
    if (!viewing.id) {
      setItems(prev => prev.map(it => it.code === updated.code ? updated : it))
      setToast({ tone: 'warn', msg: 'OT sin ID remoto, sincroniza de nuevo' })
      setViewing(null)
      return
    }
    updateWorkOrder(viewing.id, updated)
      .then(dbItem => {
        setItems(prev => prev.map(it => it.id === dbItem.id ? dbItem : it))
        setToast({ tone: 'ok', msg: 'Cambios guardados' })
      })
      .catch(() => setToast({ tone: 'bad', msg: 'No se pudo guardar en Supabase' }))
      .finally(() => setViewing(null))
  }

  function openCloseModal(item) {
    if (!(isAdmin || (isOperator && isMine(item)))) {
      setToast({ tone: 'bad', msg: 'No tienes permisos para cerrar esta OT' })
      return
    }
    if (item?.estado === 'CLOSED') {
      setToast({ tone: 'warn', msg: 'Esta OT ya fue cerrada' })
      return
    }
    setClosing(item)
    const baseHrs = Number(item.horasReales || 0)
    const extraHrs = Number(item.horasExtraReales || 0)
    // Inicializar horas por técnico con los asignados de la OT
    const participants = Array.from(new Set([item.responsable, ...(item.asignados || [])].filter(Boolean)))
    const existingHoras = Array.isArray(item.horasPorTecnico) ? item.horasPorTecnico : []
    const horasPorTecnico = participants.map(tech => {
      const existing = existingHoras.find(h => h.tech === tech)
      return existing || { tech, horas: '0', horasExtra: '0' }
    })
    setCloseDraft({
      realFechaInicio: item.realFechaInicio || item.fechaInicio || nowISODate(),
      realFechaFin: item.realFechaFin || item.fechaFin || nowISODate(),
      horasReales: String(baseHrs),
      horasExtraReales: String(extraHrs),
      horasPorTecnico,
      gastos: item.gastos || '0',
      observacionesCierre: item.observacionesCierre || '',
      toolReady: !!item.toolReady,
      toolsComplete: !!item.toolsComplete,
      toolNote: item.toolNote || ''
    })
  }

  function openWorkSheet(item) {
    if (!item) return
    setWorkSheetOrder(item)
    setWorkSheetOpen(true)
  }

  function closeWorkSheet() {
    setWorkSheetOpen(false)
    setWorkSheetOrder(null)
  }

  async function saveWorkSheet(payload) {
    if (!workSheetOrder) return null
    if (workSheetLoading) return null
    setWorkSheetLoading(true)
    try {
      // Guardar los datos de la hoja de trabajo directamente en la OT
      const workSheetData = {
        ...payload,
        saved_at: new Date().toISOString()
      }

      await updateWorkOrder(workSheetOrder.id, {
        work_sheet_completed: true,
        work_sheet_data: workSheetData
      })

      // Actualizar estado local
      setItems(prev => prev.map(it => (
        it.id === workSheetOrder.id
          ? { ...it, work_sheet_completed: true, work_sheet_data: workSheetData }
          : it
      )))

      // Actualizar el mapa de hojas de trabajo
      setWorkSheetsMap(prev => ({ ...prev, [workSheetOrder.id]: true }))

      setToast({ tone: 'ok', msg: 'Hoja de trabajo guardada' })
      return true
    } catch (error) {
      console.error(error)
      setToast({ tone: 'bad', msg: 'No se pudo guardar la hoja de trabajo' })
      throw error
    } finally {
      setWorkSheetLoading(false)
    }
  }

  function saveClose() {
    if (!closing) return
    if (!(isAdmin || (isOperator && isMine(closing)))) {
      setToast({ tone: 'bad', msg: 'No puedes cerrar esta OT' })
      return
    }
    if (!closeDraft.realFechaInicio || !closeDraft.realFechaFin) {
      setToast({ tone: 'bad', msg: 'Completa fechas reales' })
      return
    }
    // Calcular totales desde el desglose por técnico
    const horasPorTecnico = (closeDraft.horasPorTecnico || []).map(h => ({
      tech: h.tech,
      horas: String(Number(h.horas) || 0),
      horasExtra: String(Number(h.horasExtra) || 0)
    }))
    const totalHrs = horasPorTecnico.reduce((sum, h) => sum + Number(h.horas || 0), 0)
    const extraHrs = horasPorTecnico.reduce((sum, h) => sum + Number(h.horasExtra || 0), 0)
    const updated = {
      ...closing,
      estado: 'CLOSED',
      realFechaInicio: closeDraft.realFechaInicio,
      realFechaFin: closeDraft.realFechaFin,
      horasReales: String(totalHrs),
      horasExtraReales: String(extraHrs),
      horasPorTecnico,
      gastos: closeDraft.gastos || '0',
      observacionesCierre: closeDraft.observacionesCierre || '',
      toolReady: !!closeDraft.toolReady,
      toolsComplete: !!closeDraft.toolsComplete,
      toolNote: closeDraft.toolNote || ''
    }
    if (!closing.id) {
      setToast({ tone: 'warn', msg: 'OT sin ID remoto, sincroniza de nuevo' })
      setClosing(null)
      return
    }
    updateWorkOrder(closing.id, updated)
      .then(dbItem => {
        setItems(prev => prev.map(it => it.id === dbItem.id ? dbItem : it))
        setToast({ tone: 'ok', msg: 'OT cerrada con datos reales' })
        openWorkSheet(dbItem)
      })
      .catch(() => setToast({ tone: 'bad', msg: 'No se pudo cerrar en Supabase' }))
      .finally(() => setClosing(null))
  }

  function openCorrection(item) {
    if (!(isAdmin || isPlanner)) {
      setToast({ tone: 'bad', msg: 'Solo jefe o planner pueden corregir datos' })
      return
    }
    const participants = Array.from(new Set([item.responsable, ...(item.asignados || [])].filter(Boolean)))
    const existingHoras = Array.isArray(item.horasPorTecnico) ? item.horasPorTecnico : []
    const horasPorTecnico = participants.map(t => {
      const ex = existingHoras.find(h => h.tech === t)
      return ex || { tech: t, horas: '0', horasExtra: '0' }
    })
    // Incluir técnicos del desglose que ya no están en participants (por si cambiaron)
    existingHoras.forEach(h => {
      if (!horasPorTecnico.find(x => x.tech === h.tech)) {
        horasPorTecnico.push(h)
      }
    })
    setCorrecting(item)
    setCorrectionDraft({
      realFechaInicio: item.realFechaInicio || item.fechaInicio || nowISODate(),
      realFechaFin: item.realFechaFin || item.fechaFin || nowISODate(),
      horasPorTecnico,
      gastos: item.gastos || '0',
      observacionesCierre: item.observacionesCierre || ''
    })
    setViewing(null)
  }

  function saveCorrection() {
    if (!correcting) return
    if (!(isAdmin || isPlanner)) {
      setToast({ tone: 'bad', msg: 'Solo jefe o planner pueden corregir datos' })
      return
    }
    const horasPorTecnico = correctionDraft.horasPorTecnico.map(h => ({
      tech: h.tech,
      horas: String(Number(h.horas) || 0),
      horasExtra: String(Number(h.horasExtra) || 0)
    }))
    const totalHrs = horasPorTecnico.reduce((sum, h) => sum + Number(h.horas || 0), 0)
    const extraHrs = horasPorTecnico.reduce((sum, h) => sum + Number(h.horasExtra || 0), 0)
    const updated = {
      ...correcting,
      realFechaInicio: correctionDraft.realFechaInicio,
      realFechaFin: correctionDraft.realFechaFin,
      horasReales: String(totalHrs),
      horasExtraReales: String(extraHrs),
      horasPorTecnico,
      gastos: correctionDraft.gastos || '0',
      observacionesCierre: correctionDraft.observacionesCierre || ''
    }
    updateWorkOrder(correcting.id, updated)
      .then(dbItem => {
        setItems(prev => prev.map(it => it.id === dbItem.id ? dbItem : it))
        setToast({ tone: 'ok', msg: 'Datos corregidos correctamente' })
      })
      .catch(() => setToast({ tone: 'bad', msg: 'No se pudo guardar en Supabase' }))
      .finally(() => setCorrecting(null))
  }

  function openRework(item) {
    if (item.estado !== 'CLOSED') {
      setToast({ tone: 'bad', msg: 'Re-trabajo solo aplica a OTs cerradas' })
      return
    }
    if (!(isAdmin || isPlanner)) {
      setToast({ tone: 'bad', msg: 'Solo jefe o planner pueden marcar re-trabajo' })
      return
    }
    setReworkTarget(item)
    setReworkReason('')
    setReworkAssignados([])
  }

  function saveRework() {
    if (!reworkTarget) return
    const clean = reworkReason.trim()
    if (!clean) {
      setToast({ tone: 'bad', msg: 'Captura la razón del re-trabajo' })
      return
    }
    if (!reworkAssignados.length) {
      setToast({ tone: 'bad', msg: 'Selecciona al menos un técnico para el re-trabajo' })
      return
    }
    setStatus(reworkTarget.id, 'REWORK', {
      reason: clean,
      patch: {
        asignados: normalizeAsignados(reworkAssignados, reworkTarget?.responsable)
      }
    })
    setReworkTarget(null)
    setReworkReason('')
    setReworkAssignados([])
    setToast({ tone: 'ok', msg: 'OT marcada como re-trabajo' })
  }

  function handleStatusChange(item, nextStatus) {
    if (!isAdmin) {
      setToast({ tone: 'bad', msg: 'Solo el jefe puede cambiar estados' })
      return
    }
    if (nextStatus === 'REWORK') {
      openRework(item)
      return
    }
    setStatus(item.id, nextStatus)
  }

  function saveAssign() {
    if (!assigning) return
    if (!assignDraft.asignados.length) {
      setToast({ tone: 'bad', msg: 'Selecciona al menos un acompañante' })
      return
    }
    const updated = {
      ...assigning,
      asignados: normalizeAsignados(assignDraft.asignados, assigning?.responsable),
      prioridad: assignDraft.prioridad || 'MEDIA',
      fechaFin: assignDraft.fechaFin || assigning.fechaFin,
      estado: assigning.estado || 'OPEN'
    }
    if (!assigning.id) {
      setToast({ tone: 'warn', msg: 'OT sin ID remoto, sincroniza de nuevo' })
      setAssigning(null)
      return
    }
    updateWorkOrder(assigning.id, updated)
      .then(dbItem => {
        setItems(prev => prev.map(it => it.id === dbItem.id ? dbItem : it))
        setToast({ tone: 'ok', msg: 'Asignación guardada' })
      })
      .catch(() => setToast({ tone: 'bad', msg: 'No se pudo guardar en Supabase' }))
      .finally(() => setAssigning(null))
  }

  return (
    <div className="grid">
      {toast && (
        <div className={`toast ${toast.tone || 'blue'}`}>
          {toast.msg}
        </div>
      )}
      <div className="col-12 card card-hero">
        <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 className="h1">🛠️ Órdenes de Trabajo (OT)</h1>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Flujo formal: planificar → asignar → ejecutar → cerrar.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {(isOperator || isAdmin) && (
                <span className="chip ok" style={{
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '10px 18px',
                  letterSpacing: '-0.2px'
                }}>
                  ✅ Abiertas: {baseItems.filter(i => i.estado !== 'CLOSED' && i.estado !== 'CANCELED').length}
                </span>
              )}
              {(isOperator || isAdmin) && (
                <span className="chip warn" style={{
                  fontSize: 16,
                  fontWeight: 800,
                  padding: '10px 18px',
                  letterSpacing: '-0.2px'
                }}>
                  ⚠️ Mis pendientes: {myPendings.length}
                </span>
              )}
              {!isTech && STATUS.map(s => (
                <span className="chip" key={s} style={{ fontSize: 13, fontWeight: 600 }}>
                  {labelByStatus[s]}: {counts[s] ?? 0}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            {(isTech || isAdmin || isPlanner) && (
              <button
                className="btn"
                style={{ fontWeight: 700 }}
                onClick={() => {
                  if (isTech) {
                    setTechDashTech(tech || '')
                  } else if (!techDashTech) {
                    setTechDashTech(PEOPLE[0] || '')
                  }
                  setShowDashboard(true)
                }}
              >
                📊 Ver dashboard
              </button>
            )}
            {!isTech && <button className="btn" onClick={() => setShowBulkUpload(true)}>Carga masiva</button>}
            {!isTech && <button className="btn primary" onClick={() => { console.log('Click en Nueva OT, open:', open); setOpen(true); }}>+ Nueva OT</button>}
          </div>
        </div>
      </div>

      {(isOperator || isAdmin) && (
        <div className="col-12 card">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>📋 Mis pendientes</h2>
            <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>{tech || 'Usuario'}</span>
          </div>
          {!myPendings.length && (
            <div className="muted" style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>Sin pendientes asignados.</div>
          )}
          {myPendings.length > 0 && (() => {
            const TIMING_ORDER = ['VENCIDA', 'HOY', 'ESTA_SEMANA', 'SIN_FECHA', 'PROXIMA']
            const TIMING_CONFIG = {
              VENCIDA:     { label: 'Vencidas',    icon: '🔴', color: '#ef4444', borderColor: '#ef4444', badgeBg: 'rgba(239,68,68,0.15)',    badgeText: 'VENCIDA'    },
              HOY:         { label: 'Hoy',          icon: '🟢', color: '#10b981', borderColor: '#10b981', badgeBg: 'rgba(16,185,129,0.15)',   badgeText: 'HOY'        },
              ESTA_SEMANA: { label: 'Esta semana',  icon: '📅', color: '#3b82f6', borderColor: '#3b82f6', badgeBg: 'rgba(59,130,246,0.15)',   badgeText: 'ESTA SEM'   },
              SIN_FECHA:   { label: 'Sin fecha',    icon: '⚪', color: '#64748b', borderColor: '#64748b', badgeBg: 'rgba(100,116,139,0.15)',  badgeText: 'SIN FECHA'  },
              PROXIMA:     { label: 'Próximas',     icon: '🔮', color: '#7c3aed', borderColor: '#7c3aed', badgeBg: 'rgba(124,58,237,0.15)',   badgeText: 'PRÓXIMA'    },
            }
            const withTiming = myPendings
              .map(it => ({ ...it, _timing: getTimingStatus(it) }))
              .sort((a, b) => TIMING_ORDER.indexOf(a._timing) - TIMING_ORDER.indexOf(b._timing))
            const groups = {}
            for (const it of withTiming) {
              if (!groups[it._timing]) groups[it._timing] = []
              groups[it._timing].push(it)
            }
            return (
              <>
                {TIMING_ORDER.filter(k => groups[k]?.length).map(timingKey => {
                  const cfg = TIMING_CONFIG[timingKey]
                  return (
                    <div key={timingKey} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${cfg.borderColor}40` }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: 1 }}>{cfg.icon} {cfg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: cfg.badgeBg, color: cfg.color }}>{groups[timingKey].length}</span>
                      </div>
                      <div className="grid">
                        {groups[timingKey].map(it => {
                          const team = Array.from(new Set([it.responsable, ...(it.asignados || [])].filter(Boolean)))
                          const servicios = Array.isArray(it.tipoServicios) && it.tipoServicios.length > 0 ? it.tipoServicios : null
                          const planData = it.work_sheet_data?.planificacion || null
                          const planDone = planData ? PLANIFICACION_ITEMS.filter(p => planData[p.key] === 'SI').length : 0
                          const planTotal = PLANIFICACION_ITEMS.length
                          return (
                            <div key={it.id || it.code} className="col-12 card" style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                              border: `1px solid ${cfg.borderColor}30`,
                              borderLeft: `4px solid ${cfg.borderColor}`,
                              transition: 'all 0.2s ease',
                              cursor: 'pointer'
                            }} onClick={() => openDetail(it)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                                    <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>{priorityLabel[it.prioridad] ?? 'Media'}</Chip>
                                    <Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip>
                                    {it.code && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>{it.code}</span>}
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: cfg.badgeBg, color: cfg.color, border: `1px solid ${cfg.borderColor}50` }}>{cfg.badgeText}</span>
                                  </div>
                                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{it.referencia}</h3>
                                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>🏢 {it.cliente}</span>
                                    {it.pdv && <span style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}>📍 PDV: {it.pdv}</span>}
                                  </div>
                                  {servicios && (
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                      {servicios.map(s => <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'rgba(0,200,200,0.12)', color: '#67e8f9', fontWeight: 600, border: '1px solid rgba(0,200,200,0.2)', textTransform: 'uppercase' }}>{s}</span>)}
                                      {it.tipoServicioOtro && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, background: 'rgba(0,200,200,0.12)', color: '#67e8f9', fontWeight: 600, border: '1px solid rgba(0,200,200,0.2)' }}>{it.tipoServicioOtro}</span>}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>EQUIPO:</span>
                                    {team.map(p => (
                                      <span key={p} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 5, background: p === it.responsable ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: p === it.responsable ? '#10b981' : '#cbd5e1', fontWeight: p === it.responsable ? 700 : 500, border: p === it.responsable ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                                        {p === it.responsable ? '★ ' : ''}{p}
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: it.alcance ? 8 : 0 }}>
                                    <span>📅 Inicio: <b style={{ color: '#cbd5e1' }}>{it.fechaInicio || '-'}</b></span>
                                    <span>📅 Fin: <b style={{ color: cfg.color }}>{it.fechaFin || '-'}</b></span>
                                    {(it.horasPlanta || it.horasGabinete) && <span>⏱ Planeado: <b style={{ color: '#cbd5e1' }}>{(Number(it.horasPlanta || 0) + Number(it.horasGabinete || 0)).toFixed(1)}h</b></span>}
                                    {it.fechaInforme && <span>📄 Informe: <b style={{ color: '#cbd5e1' }}>{it.fechaInforme}</b></span>}
                                  </div>
                                  {it.alcance && (
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 10px', borderLeft: '2px solid rgba(0,200,200,0.3)' }}>
                                      <span style={{ fontWeight: 700, color: '#67e8f9', marginRight: 6 }}>ALCANCE:</span>{it.alcance}
                                    </div>
                                  )}
                                  {planData ? (
                                    <div style={{ marginTop: 8 }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: planDone === planTotal ? '#10b981' : 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Planificación: {planDone}/{planTotal}</div>
                                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {PLANIFICACION_ITEMS.map(p => {
                                          const val = planData[p.key]
                                          const color = val === 'SI' ? '#10b981' : val === 'NO' ? '#ef4444' : '#64748b'
                                          return <span key={p.key} title={p.label} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${color}20`, color, fontWeight: 600, border: `1px solid ${color}40` }}>{val === 'SI' ? '✓' : val === 'NO' ? '✗' : '·'} {p.label.replace(/^\d+\.\s*/, '')}</span>
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Sin hoja de trabajo / checklist de planificación</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                                  <button className="btn" style={{ fontWeight: 700 }} disabled={it.estado === 'CLOSED' && !isAdmin} onClick={(e) => { e.stopPropagation(); setStatus(it.id, 'IN_PROGRESS') }}>▶️ En proceso</button>
                                  <button className="btn primary" disabled={it.estado === 'CLOSED' && !isAdmin} onClick={(e) => { e.stopPropagation(); openCloseModal(it) }}>✅ Completar</button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </>
            )
          })()}
        </div>
      )}

      <div className="col-12 card">
        <div className="row" style={{ marginBottom: 12, alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>📝 Listado</h2>
          <span className="chip blue" style={{ fontSize: 13, fontWeight: 700 }}>{filteredItems.length} / {items.length} OTs</span>
        </div>

        <div className="grid" style={{ marginBottom: 12 }}>
          <div className="col-3 field">
            <label>Buscar (cliente o contacto)</label>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej: EMPACAR, NOMBRE DE CONTACTO..." />
          </div>
          <div className="col-3 field">
            <label>Estado</label>
            {isTech ? (
              <select className="input" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                <option value="ALL">Todos</option>
                <option value="OPEN">Abierta</option>
                <option value="IN_PROGRESS">En proceso</option>
                <option value="REWORK">Re-trabajo</option>
                <option value="CLOSED">Cerrada</option>
              </select>
            ) : (
              <select className="input" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                <option value="ALL">Todos</option>
                {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
              </select>
            )}
          </div>
          {!isTech && (
            <>
              <div className="col-3 field">
                <label>Responsable</label>
                <select className="input" value={responsableFilter} onChange={(e) => setResponsableFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-3 field">
                <label>Asignado</label>
                <select className="input" value={asignadoFilter} onChange={(e) => setAsignadoFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="table-wrap table-wrap--narrow">
          <table className="desktop-only">
            <thead>
              <tr>
                <th className="col-id" style={{ width: 100 }}>ID</th>
                <th style={{ width: 120 }}>Cliente</th>
                <th style={{ minWidth: 180 }}>Contacto en planta</th>
                <th style={{ width: 100 }}>Fecha inicio</th>
                <th style={{ width: 100 }}>Fecha fin</th>
                <th style={{ width: 110 }}>Entrega informe</th>
                <th style={{ width: 130 }}>Responsable</th>
                <th style={{ width: 150 }}>Acompañantes</th>
                <th style={{ width: 90, textAlign: 'center' }}>Prioridad</th>
                <th style={{ width: 100, textAlign: 'center' }}>Estado</th>
                <th style={{ width: 180 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {booting && (
                <>
                  {[1, 2, 3].map(k => (
                    <tr key={`sk-wo-${k}`} className="skeleton-row">
                      <td colSpan={11} style={{ padding: 0 }}>
                        <div className="skeleton-line"></div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!booting && filteredItems.map(it => (
                <tr key={it.id || it.code}>
                  <td className="col-id" style={{ fontWeight: 600 }}>
                    {it.code || it.id}
                    {it.esDeuda && <span className="chip warn" style={{ fontSize: 9, padding: '1px 5px', marginLeft: 4 }}>DEUDA</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{it.cliente}</td>
                  <td style={{ fontWeight: 500 }}>{it.referencia}</td>
                  <td>{it.fechaInicio}</td>
                  <td>{it.fechaFin || '-'}</td>
                  <td>{it.fechaInforme || '-'}</td>
                  <td>{it.responsable || '-'}</td>
                  <td>
                    {it.asignados?.length ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {it.asignados.map(p => (
                          <span key={p} className="chip" style={{ padding: '4px 8px', fontSize: 11 }}>{p}</span>
                        ))}
                      </div>
                    ) : <span className="muted">-</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>
                      {priorityLabel[it.prioridad] ?? 'Media'}
                    </Chip>
                  </td>
                  <td style={{ textAlign: 'center' }}><Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => openDetail(it)}>Ver</button>
                      <button
                        className="btn"
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          background: workSheetsMap[it.id] ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: workSheetsMap[it.id] ? 'var(--ok)' : undefined,
                          border: workSheetsMap[it.id] ? '1px solid var(--ok)' : undefined
                        }}
                        onClick={() => openWorkSheet(it)}
                        title={workSheetsMap[it.id] ? 'Ver Hoja de Trabajo guardada' : 'Crear Hoja de Trabajo'}
                      >
                        {workSheetsMap[it.id] ? 'HT ✓' : 'HT'}
                      </button>
                      {!isTech && <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => openAssign(it)}>Asignar</button>}
                      <details className="action-menu">
                        <summary className="btn" style={{ padding: '6px 10px', fontSize: 12 }}>⋯</summary>
                        <div className="action-menu-list">
                          {(isOperator || isAdmin) && (
                            <>
                              <button className="btn" disabled={it.estado === 'CLOSED' && !isAdmin} onClick={() => setStatus(it.id, 'IN_PROGRESS')}>En proceso</button>
                              <button className="btn primary" disabled={it.estado === 'CLOSED' && !isAdmin} onClick={() => openCloseModal(it)}>Completar</button>
                            </>
                          )}
                          {(isAdmin || isPlanner) && it.estado === 'CLOSED' && (
                            <button className="btn" onClick={() => openRework(it)}>Re-trabajo</button>
                          )}
                          {isAdmin && (
                            <select className="input action-select" value={it.estado} onChange={(e) => handleStatusChange(it, e.target.value)} disabled={it.estado === 'CLOSED' && !isAdmin}>
                              {STATUS.map(s => <option key={s} value={s}>{labelByStatus[s]}</option>)}
                            </select>
                          )}
                          {!isTech && <button className="btn danger" onClick={() => remove(it.id)}>Borrar</button>}
                        </div>
                      </details>
                    </div>
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
          {booting && <div className="skeleton-line" style={{ marginTop: 8 }}></div>}
          {!booting && filteredItems.map(it => (
            <div key={`card-${it.id || it.code}`} className="card" style={{ marginBottom: 10, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div className="muted">{it.code || it.id} · {it.cliente}</div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>{it.referencia}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <Chip tone={priorityTone[it.prioridad] ?? 'blue'}>{priorityLabel[it.prioridad] ?? 'Media'}</Chip>
                    <Chip tone={toneByStatus[it.estado] ?? 'blue'}>{labelByStatus[it.estado] ?? it.estado}</Chip>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={() => openDetail(it)}>Ver</button>
                  <button
                    className="btn"
                    style={{
                      background: workSheetsMap[it.id] ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: workSheetsMap[it.id] ? 'var(--ok)' : undefined,
                      border: workSheetsMap[it.id] ? '1px solid var(--ok)' : undefined
                    }}
                    onClick={() => openWorkSheet(it)}
                  >
                    {workSheetsMap[it.id] ? 'HT ✓' : 'HT'}
                  </button>
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
          {!booting && !filteredItems.length && <div className="muted">No hay coincidencias con los filtros.</div>}
        </div>

        <p className="muted" style={{ marginTop: 10 }}>
          Próximo: detalle OT + cierre con horas/gastos/fotos + bitácora.
        </p>
      </div>

      <Modal open={!!assigning} title={`Asignar OT ${assigning?.id || ''}`} onClose={() => setAssigning(null)}>
        <div className="grid">
          <div className="col-12 field">
            <label>Acompañantes</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                    onClick={() => toggleAssignedModal(p)}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="col-6 field">
            <label>Prioridad</label>
            <select className="input" value={assignDraft.prioridad} onChange={(e) => setAssignDraft(d => ({ ...d, prioridad: e.target.value }))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
            </select>
          </div>
          <div className="col-6 field">
            <label>Fecha fin</label>
            <input className="input" type="date" value={assignDraft.fechaFin} onChange={(e) => setAssignDraft(d => ({ ...d, fechaFin: e.target.value }))} />
          </div>
          <div className="col-12 field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={assignDraft.notify} onChange={(e) => setAssignDraft(d => ({ ...d, notify: e.target.checked }))} />
            <label style={{ margin: 0 }}>Enviar notificación (mock)</label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setAssigning(null)}>Cancelar</button>
          <button className="btn primary" onClick={saveAssign}>Guardar asignación</button>
        </div>
      </Modal>

      <Modal
        open={showDashboard && (isTech || isAdmin || isPlanner)}
        title={
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.3px'
          }}>
            👤 Dashboard técnico{techDashTech ? `: ${techDashTech}` : ''}
          </span>
        }
        onClose={() => setShowDashboard(false)}
      >
        <div className="grid" style={{ gap: 10 }}>
          <div className="col-12" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isTech && (
              <div className="field" style={{ minWidth: 180 }}>
                <label>Técnico</label>
                <select className="input" value={techDashTech} onChange={(e) => setTechDashTech(e.target.value)}>
                  {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
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
            <div className="card card-hero" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>⏱️ Horas Trabajadas</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashboard.totalHours.toFixed(1)}h</div>
            </div>
            <div className="card card-hero" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>⚡ Horas Extras</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashboard.totalExtra.toFixed(1)}h</div>
            </div>
            <div className="card card-hero" style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>✅ Disponibles</div>
              <div className="stat-number-large" style={{ fontSize: 36 }}>{techDashboard.availableExtra.toFixed(1)}h</div>
            </div>
          </div>

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
                {techDashboard.topClients.length === 0 && <div className="muted">Sin datos</div>}
                {techDashboard.topClients.map((c, idx) => (
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
                {techDashboard.topServices.length === 0 && <div className="muted">Sin datos</div>}
                {techDashboard.topServices.map((s, idx) => (
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
            {techDashboard.serviceStats.length === 0 && <div className="muted">Sin datos</div>}
            {techDashboard.serviceStats.map((s, idx) => {
              const max = Math.max(...techDashboard.serviceStats.map(x => x.count), 1)
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
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setShowDashboard(false)}>Cerrar</button>
        </div>
      </Modal>

      <Modal open={!!viewing} title={`Detalle OT ${viewing?.id || ''}`} onClose={() => setViewing(null)}>
        <WorkOrderDetails
          viewing={viewing}
          detailDraft={detailDraft}
          setDetailDraft={setDetailDraft}
          isAdmin={isAdmin}
          canCorrect={isAdmin || isPlanner}
          onCorrect={openCorrection}
          onClose={() => setViewing(null)}
          onSave={saveDetail}
          onOpenWorkSheet={(item) => {
            setViewing(null)
            openWorkSheet(item)
          }}
          hasWorkSheet={viewing ? workSheetsMap[viewing.id] : false}
        />
      </Modal>

      <Modal open={!!closing} title={`Cerrar OT ${closing?.code || closing?.id || ''}`} onClose={() => setClosing(null)}>
        <div className="grid">
          <div className="col-6 field">
            <label>Fecha inicio real</label>
            <input className="input" type="date" value={closeDraft.realFechaInicio} onChange={(e) => setCloseDraft(d => ({ ...d, realFechaInicio: e.target.value }))} />
          </div>
          <div className="col-6 field">
            <label>Fecha fin real</label>
            <input className="input" type="date" value={closeDraft.realFechaFin} onChange={(e) => setCloseDraft(d => ({ ...d, realFechaFin: e.target.value }))} />
          </div>

          {/* Desglose de horas por técnico */}
          <div className="col-12 field">
            <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Horas por técnico</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {(closeDraft.horasPorTecnico || []).map((h, idx) => (
                <div key={h.tech} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.tech}</div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 10, color: 'var(--muted)' }}>Regulares</label>
                    <input
                      className="input"
                      type="number"
                      step="0.25"
                      min="0"
                      value={h.horas}
                      onChange={(e) => {
                        const val = e.target.value
                        setCloseDraft(d => ({
                          ...d,
                          horasPorTecnico: d.horasPorTecnico.map((item, i) =>
                            i === idx ? { ...item, horas: val } : item
                          )
                        }))
                      }}
                      style={{ padding: '6px 8px', fontSize: 13 }}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 10, color: 'var(--muted)' }}>Extras</label>
                    <input
                      className="input"
                      type="number"
                      step="0.25"
                      min="0"
                      value={h.horasExtra}
                      onChange={(e) => {
                        const val = e.target.value
                        setCloseDraft(d => ({
                          ...d,
                          horasPorTecnico: d.horasPorTecnico.map((item, i) =>
                            i === idx ? { ...item, horasExtra: val } : item
                          )
                        }))
                      }}
                      style={{ padding: '6px 8px', fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
              {/* Totales calculados */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontWeight: 700 }}>
                <div>TOTAL</div>
                <div style={{ textAlign: 'center' }}>
                  {(closeDraft.horasPorTecnico || []).reduce((sum, h) => sum + Number(h.horas || 0), 0).toFixed(2)}h
                </div>
                <div style={{ textAlign: 'center' }}>
                  {(closeDraft.horasPorTecnico || []).reduce((sum, h) => sum + Number(h.horasExtra || 0), 0).toFixed(2)}h
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 field">
            <label>Gastos del servicio</label>
            <input className="input" type="number" step="0.01" value={closeDraft.gastos} onChange={(e) => setCloseDraft(d => ({ ...d, gastos: e.target.value }))} />
          </div>
          <div className="col-12 field">
            <label>Observaciones / Comentarios</label>
            <textarea className="input" rows="3" value={closeDraft.observacionesCierre} onChange={(e) => setCloseDraft(d => ({ ...d, observacionesCierre: e.target.value }))} placeholder="Notas relevantes del cierre" />
          </div>
          <div className="col-12 field">
            <label>Checklist de herramientas</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={!!closeDraft.toolReady} onChange={(e) => setCloseDraft(d => ({ ...d, toolReady: e.target.checked }))} />
                <span>Herramienta en buen estado</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={!!closeDraft.toolsComplete} onChange={(e) => setCloseDraft(d => ({ ...d, toolsComplete: e.target.checked }))} />
                <span>Todas las herramientas necesarias disponibles</span>
              </label>
            </div>
            <textarea className="input" rows="2" value={closeDraft.toolNote} onChange={(e) => setCloseDraft(d => ({ ...d, toolNote: e.target.value }))} placeholder="Nota breve (opcional)" style={{ marginTop: 8 }} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setClosing(null)}>Cancelar</button>
          <button
            className="btn"
            onClick={() => {
              if (!closing) return
              openWorkSheet(closing)
              setClosing(null)
            }}
          >
            Hoja de trabajo
          </button>
          <button className="btn primary" onClick={saveClose}>Guardar y cerrar</button>
        </div>
      </Modal>

      <Modal open={!!correcting} title={`Corregir datos — ${correcting?.code || correcting?.id || ''}`} onClose={() => setCorrecting(null)}>
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', fontSize: 13, color: '#fbbf24' }}>
          Solo admin y planner pueden corregir estos datos. Los cambios sobrescriben los valores de cierre.
        </div>
        <div className="grid">
          <div className="col-6 field">
            <label>Fecha inicio real</label>
            <input className="input" type="date" value={correctionDraft.realFechaInicio} onChange={(e) => setCorrectionDraft(d => ({ ...d, realFechaInicio: e.target.value }))} />
          </div>
          <div className="col-6 field">
            <label>Fecha fin real</label>
            <input className="input" type="date" value={correctionDraft.realFechaFin} onChange={(e) => setCorrectionDraft(d => ({ ...d, realFechaFin: e.target.value }))} />
          </div>

          <div className="col-12 field">
            <label style={{ fontWeight: 700, marginBottom: 8, display: 'block' }}>Horas por técnico</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {(correctionDraft.horasPorTecnico || []).map((h, idx) => (
                <div key={h.tech} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.tech}</div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 10, color: 'var(--muted)' }}>Regulares</label>
                    <input
                      className="input"
                      type="number"
                      step="0.25"
                      min="0"
                      value={h.horas}
                      onChange={(e) => {
                        const val = e.target.value
                        setCorrectionDraft(d => ({
                          ...d,
                          horasPorTecnico: d.horasPorTecnico.map((item, i) =>
                            i === idx ? { ...item, horas: val } : item
                          )
                        }))
                      }}
                      style={{ padding: '6px 8px', fontSize: 13 }}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label style={{ fontSize: 10, color: 'var(--muted)' }}>Extras</label>
                    <input
                      className="input"
                      type="number"
                      step="0.25"
                      min="0"
                      value={h.horasExtra}
                      onChange={(e) => {
                        const val = e.target.value
                        setCorrectionDraft(d => ({
                          ...d,
                          horasPorTecnico: d.horasPorTecnico.map((item, i) =>
                            i === idx ? { ...item, horasExtra: val } : item
                          )
                        }))
                      }}
                      style={{ padding: '6px 8px', fontSize: 13 }}
                    />
                  </div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, fontWeight: 700 }}>
                <div>TOTAL</div>
                <div style={{ textAlign: 'center' }}>
                  {(correctionDraft.horasPorTecnico || []).reduce((sum, h) => sum + Number(h.horas || 0), 0).toFixed(2)}h
                </div>
                <div style={{ textAlign: 'center' }}>
                  {(correctionDraft.horasPorTecnico || []).reduce((sum, h) => sum + Number(h.horasExtra || 0), 0).toFixed(2)}h
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 field">
            <label>Gastos del servicio</label>
            <input className="input" type="number" step="0.01" min="0" value={correctionDraft.gastos} onChange={(e) => setCorrectionDraft(d => ({ ...d, gastos: e.target.value }))} />
          </div>
          <div className="col-12 field">
            <label>Observaciones / Comentarios de cierre</label>
            <textarea className="input" rows="3" value={correctionDraft.observacionesCierre} onChange={(e) => setCorrectionDraft(d => ({ ...d, observacionesCierre: e.target.value }))} placeholder="Notas relevantes del cierre" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => setCorrecting(null)}>Cancelar</button>
          <button className="btn primary" onClick={saveCorrection}>Guardar corrección</button>
        </div>
      </Modal>

      <Modal open={!!reworkTarget} title={`Marcar re-trabajo ${reworkTarget?.id || ''}`} onClose={() => { setReworkTarget(null); setReworkReason(''); setReworkAssignados([]) }}>
        <div className="grid">
          <div className="col-12 field">
            <label>Razón del re-trabajo</label>
            <textarea className="input" rows="3" value={reworkReason} onChange={(e) => setReworkReason(e.target.value)} placeholder="Describe por qué se reabre la OT" />
          </div>
          <div className="col-12 field">
            <label>Técnicos para re-trabajo</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PEOPLE.map(p => {
                const active = reworkAssignados.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    className="btn"
                    style={{
                      borderColor: active ? 'rgba(110,231,183,.5)' : undefined,
                      background: active ? 'rgba(110,231,183,.12)' : undefined
                    }}
                    onClick={() => setReworkAssignados(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              Selecciona el equipo que atenderá el re-trabajo. Puede ser distinto al servicio original.
            </div>
          </div>
          <div className="col-12 field">
            <label>Estado actual</label>
            <div className="badge">{labelByStatus[reworkTarget?.estado] || reworkTarget?.estado}</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={() => { setReworkTarget(null); setReworkReason(''); setReworkAssignados([]) }}>Cancelar</button>
          <button className="btn primary" onClick={saveRework}>Guardar re-trabajo</button>
        </div>
      </Modal>

      <BulkUploadModal
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        existingItems={items}
        onSuccess={(created) => {
          setItems(prev => [...created, ...prev])
          setToast({ tone: 'ok', msg: `${created.length} OTs creadas` })
        }}
      />

      <Modal open={open} title="Nueva OT (MVP)" onClose={() => setOpen(false)}>
        <WorkOrderForm
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setOpen(false)}
          onSave={add}
          clientSuggestions={clientSuggestions}
          clientInput={clientInput}
        />
      </Modal>

      <WorkSheetModal
        open={workSheetOpen}
        workOrder={workSheetOrder}
        onClose={closeWorkSheet}
        onSave={saveWorkSheet}
      />
    </div>
  )
}

