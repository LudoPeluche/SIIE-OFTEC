// Status Definitions
export const STATUS = ['OPEN', 'IN_PROGRESS', 'REWORK', 'CLOSED', 'CANCELED']

export const TONE_BY_STATUS = {
    OPEN: 'warn',
    IN_PROGRESS: 'warn',
    REWORK: 'warn',
    CLOSED: 'ok',
    CANCELED: 'bad'
}

export const LABEL_BY_STATUS = {
    OPEN: 'Abierta',
    IN_PROGRESS: 'En proceso',
    REWORK: 'Re-trabajo',
    CLOSED: 'Cerrada',
    CANCELED: 'Cancelada'
}

// Priority Definitions
export const PRIORITIES = ['ALTA', 'MEDIA', 'BAJA']

export const PRIORITY_TONE = {
    ALTA: 'bad',
    MEDIA: 'warn',
    BAJA: 'blue'
}

export const PRIORITY_LABEL = {
    ALTA: 'Alta',
    MEDIA: 'Media',
    BAJA: 'Baja'
}

// Service Options
export const SERVICE_OPTIONS = [
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
    'INSPECCION VISUAL',
    'OTRO'
]

// Clients List
export const CLIENTS = [
    'ACERICO', 'ALBINA GROUP', 'AREQUIPA', 'BIODIESEL', 'CADMA', 'CBN', 'CHURATA', 'CONFIFETROL', 'COPELME',
    'ELECTRICIDAD BALCAZAR', 'ELECTROSERVICE', 'EMBOL', 'EMPACAR', 'ENDE TRANSMISION', 'EPSA', 'FABOCE',
    'FRIGOR', 'GERONA', 'GEUMEC', 'GLADYMAR', 'GRUPO VENADO', 'GUABIRA', 'HOSPITAL MESSUTI', 'IMPASTAS',
    'INOLSA', 'INSERCOM', 'IPDN', 'ITACAMBA', 'ITALSA', 'JACIF', 'KUPPEL', 'LA SUPREMA', 'LAND SILVER',
    'LEVCORP', 'LURI', 'MARRIOT', 'NUTRIOIL', 'PABLO GARNICA', 'PIL', 'POPLAR', 'READYMIX', 'RODASUR',
    'MINERA SAN CRISTOBAL', 'SCANBIOTEK', 'SCHWARTZ VRENA', 'SIEMENS', 'SINOPEC', 'TECNOPOR', 'TENSOLINE', 'TEXPRO'
]

// Staff
export const PEOPLE = [
    'LUDWIN CABA',
    'DIEGO ORTUÑO',
    'BRAYAN IBARRA',
    'JESSE PORRAS'
]

// Tools
export const TOOL_OPTIONS = [
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

// ===========================================
// HOJA DE TRABAJO (REG-SIE-02) - CONSTANTES
// ===========================================

// CHECK LIST - Planificación del Servicio
export const PLANIFICACION_ITEMS = [
    { key: 'fichaTrabajo', label: '1. Ficha de trabajo' },
    { key: 'permisoViaje', label: '2. Permiso de viaje' },
    { key: 'registroFondos', label: '3. Registro de fondos a rendir' },
    { key: 'herrCompletas', label: '4. Herr. a usar completas y en óptimas condiciones' },
    { key: 'procedimientos', label: '5. Procedimientos Técnicos' },
    { key: 'permisoEspecial', label: '6. Permiso de trabajo especial' }
]

// Ejecución del Servicio
export const EJECUCION_ITEMS = [
    { key: 'clienteSGS', label: '1. El cliente cuenta con SGS' },
    { key: 'acreditadoArea', label: '2. ¿A acreditado el area?' },
    { key: 'fichaTrabajo', label: '3. ¿Colgo la ficha de trabajo seguro?' },
    { key: 'cuentaEPP', label: '4. ¿Cuenta con el EPP ud. Y su equipo?' }
]

// PELIGROS - Lista completa según formulario
export const PELIGROS_ITEMS = [
    { key: 'caidaPersonas', label: 'Caída de personas a distinto nivel' },
    { key: 'caidaMismoNivel', label: 'Caída de personas al mismo nivel' },
    { key: 'caidaObjetos', label: 'Caída de objetos' },
    { key: 'pisadasObjetos', label: 'Pisadas sobre objetos' },
    { key: 'choquesObjetos', label: 'Choques contra objetos inmóviles' },
    { key: 'golpesObjetos', label: 'Golpes por objetos o herramientas' },
    { key: 'proyeccionFragmentos', label: 'Proyección de fragmentos o partículas' },
    { key: 'atrapamiento', label: 'Atrapamiento' },
    { key: 'sobreesfuerzos', label: 'Sobreesfuerzos' },
    { key: 'exposicionTemperaturas', label: 'Exposición a temperaturas' },
    { key: 'contactosTermicos', label: 'Contactos térmicos' },
    { key: 'contactosElectricos', label: 'Contactos eléctricos' },
    { key: 'inhalacionSustancias', label: 'Inhalación de sustancias' },
    { key: 'contactoSustancias', label: 'Contacto con sustancias' },
    { key: 'exposicionRadiaciones', label: 'Exposición a radiaciones' },
    { key: 'incendiosExplosiones', label: 'Incendios/Explosiones' },
    { key: 'atropellosVehiculos', label: 'Atropellos o golpes con vehículos' },
    { key: 'exposicionRuido', label: 'Exposición a ruido' },
    { key: 'exposicionVibraciones', label: 'Exposición a vibraciones' },
    { key: 'iluminacion', label: 'Iluminación' },
    { key: 'estres', label: 'Estrés' },
    { key: 'fatiga', label: 'Fatiga' }
]

// PERMISOS PARA ACTIVIDADES DE ALTO RIESGO
export const PERMISOS_ALTO_RIESGO = [
    { key: 'trabajosCaliente', label: 'Trabajos en caliente' },
    { key: 'espaciosConfinados', label: 'Espacios confinados' },
    { key: 'trabajosAltura', label: 'Trabajos en altura' },
    { key: 'trabajosElectricos', label: 'Trabajos eléctricos' },
    { key: 'izajeCargas', label: 'Izaje de cargas' },
    { key: 'excavaciones', label: 'Excavaciones' },
    { key: 'trabajoEquiposIzaje', label: 'Trabajo con equipos de Izaje o Grúas' }
]

// EQUIPO DE EMERGENCIA
export const EQUIPO_EMERGENCIA = [
    { key: 'extintor', label: 'Extintor' },
    { key: 'botiquin', label: 'Botiquín' },
    { key: 'cascoEspecial', label: 'Casco especial' },
    { key: 'lentesSeguridad', label: 'Lentes de seguridad' },
    { key: 'zapatosPuntaAcero', label: 'Zapatos con punta de Acero' },
    { key: 'overolManga', label: 'Overol de manga' }
]

// EPPs (Equipos de Protección Personal)
export const EPPS_ITEMS = [
    { key: 'guantes', label: 'Guantes' },
    { key: 'protectorAuditivo', label: 'Protector auditivo' },
    { key: 'arnesSeguridad', label: 'Arnés de seguridad' },
    { key: 'chalecosReflectivos', label: 'Chalecos reflectivos' },
    { key: 'respirador', label: 'Respirador' },
    { key: 'lentes', label: 'Lentes' },
    { key: 'mameluco', label: 'Mameluco' },
    { key: 'casco', label: 'Casco' },
    { key: 'botasSeguridad', label: 'Botas de seguridad' }
]

// RIESGOS - Mantener compatibilidad (alias)
export const RIESGOS_ITEMS = PELIGROS_ITEMS

// ===========================================
// SISTEMA DE VERIFICACIÓN DE SEGURIDAD (SVS)
// ===========================================

// Permisos CRÍTICOS - Bloquean guardado si marcados "No" sin aprobación supervisor
export const CRITICAL_PERMITS = [
    'trabajosCaliente',
    'trabajosAltura',
    'trabajosElectricos',
    'espaciosConfinados'
]

// Estados de confirmación de seguridad
export const SAFETY_STATUS = {
    PENDIENTE: 'pendiente',      // No confirmado aún
    SI: 'si',                    // Confirmado positivamente
    NO: 'no',                    // Confirmado negativamente (requiere justificación)
    NO_APLICA: 'noAplica'        // No aplica (requiere justificación)
}

// Estados globales de verificación de seguridad
export const SAFETY_VERIFICATION_STATUS = {
    NOT_CONFIGURED: 'not_configured',  // Planificador no ha configurado
    PENDING: 'pending',                 // Configurado, técnico no ha confirmado
    IN_PROGRESS: 'in_progress',         // Técnico confirmando
    BLOCKED: 'blocked',                 // Bloqueado por permiso crítico
    COMPLETED: 'completed'              // Todo verificado
}

// Mapeo de tipo de servicio → requisitos de seguridad sugeridos
export const SERVICE_SAFETY_MAPPING = {
    'MONITOREO DE VIBRACIONES': {
        riesgos: ['exposicionVibraciones', 'exposicionRuido', 'atrapamiento'],
        permisos: [],
        epps: ['protectorAuditivo', 'guantes', 'lentes', 'casco'],
        equipos: ['botiquin']
    },
    'TERMOGRAFIA': {
        riesgos: ['contactosElectricos', 'exposicionTemperaturas', 'exposicionRadiaciones'],
        permisos: ['trabajosElectricos'],
        epps: ['guantes', 'lentes', 'casco'],
        equipos: ['extintor', 'botiquin']
    },
    'ALINEACION LASER DE EJES': {
        riesgos: ['atrapamiento', 'golpesObjetos', 'sobreesfuerzos'],
        permisos: [],
        epps: ['guantes', 'lentes', 'casco', 'botasSeguridad'],
        equipos: ['botiquin']
    },
    'ALINEACION LASER DE POLEAS Y TENSADO DE CORREAS': {
        riesgos: ['atrapamiento', 'golpesObjetos', 'sobreesfuerzos'],
        permisos: [],
        epps: ['guantes', 'lentes', 'casco', 'botasSeguridad'],
        equipos: ['botiquin']
    },
    'ALINEACION CON RELOJ COMPARADOR': {
        riesgos: ['atrapamiento', 'golpesObjetos'],
        permisos: [],
        epps: ['guantes', 'lentes', 'casco'],
        equipos: ['botiquin']
    },
    'BALANCEO DINAMICO': {
        riesgos: ['atrapamiento', 'exposicionVibraciones', 'exposicionRuido', 'proyeccionFragmentos'],
        permisos: [],
        epps: ['protectorAuditivo', 'guantes', 'lentes', 'casco'],
        equipos: ['botiquin']
    },
    'MONTAJE DE RODAMIENTOS': {
        riesgos: ['contactosTermicos', 'golpesObjetos', 'sobreesfuerzos', 'atrapamiento'],
        permisos: [],
        epps: ['guantes', 'lentes', 'casco', 'botasSeguridad'],
        equipos: ['botiquin', 'extintor']
    },
    'ANALISIS DE ACEITE': {
        riesgos: ['contactoSustancias', 'inhalacionSustancias'],
        permisos: [],
        epps: ['guantes', 'lentes', 'respirador'],
        equipos: ['botiquin']
    },
    'ULTRASONIDO': {
        riesgos: ['contactosElectricos', 'exposicionRuido'],
        permisos: [],
        epps: ['protectorAuditivo', 'guantes', 'lentes'],
        equipos: ['botiquin']
    },
    'FLUSHING DE ACEITE': {
        riesgos: ['contactoSustancias', 'inhalacionSustancias', 'incendiosExplosiones'],
        permisos: ['trabajosCaliente'],
        epps: ['guantes', 'lentes', 'respirador', 'mameluco'],
        equipos: ['extintor', 'botiquin']
    }
}
