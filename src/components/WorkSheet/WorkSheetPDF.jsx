import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import {
  PLANIFICACION_ITEMS,
  EJECUCION_ITEMS,
  PELIGROS_ITEMS,
  PERMISOS_ALTO_RIESGO,
  EQUIPO_EMERGENCIA,
  EPPS_ITEMS
} from '../../constants'

// Estilos para el PDF - REG-SIE-02
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  // Header
  header: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#22c55e',
    marginBottom: 10
  },
  headerLogo: {
    width: 80,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerLogoText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#22c55e'
  },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8
  },
  headerTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e'
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#22c55e',
    marginTop: 2
  },
  headerCode: {
    width: 80,
    borderLeftWidth: 1,
    borderLeftColor: '#22c55e',
    padding: 5,
    justifyContent: 'center'
  },
  headerCodeLabel: {
    fontSize: 7,
    color: '#666'
  },
  headerCodeValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#22c55e'
  },

  // Section title
  sectionTitle: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4
  },

  // Grid layouts
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderTopWidth: 0
  },
  firstRow: {
    borderTopWidth: 1
  },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#22c55e',
    fontSize: 8
  },
  cellLast: {
    borderRightWidth: 0
  },
  cellLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 1
  },
  cellValue: {
    fontSize: 8,
    color: '#000'
  },

  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2
  },
  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: {
    backgroundColor: '#22c55e'
  },
  checkboxX: {
    fontSize: 6,
    color: '#fff',
    fontWeight: 'bold'
  },
  checkboxLabel: {
    fontSize: 7,
    flex: 1
  },

  // Radio options (Si/No/NoAplica)
  radioGroup: {
    flexDirection: 'row',
    gap: 8
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  radioLabel: {
    fontSize: 6,
    marginLeft: 2
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: '#22c55e'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#22c55e'
  },
  tableHeaderCell: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#fff'
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#22c55e'
  },
  tableCell: {
    fontSize: 7,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#22c55e'
  },

  // Three column section
  threeColumnSection: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderTopWidth: 0
  },
  threeColumnItem: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#22c55e'
  },
  threeColumnTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 4,
    textTransform: 'uppercase'
  },

  // Signatures
  signatureSection: {
    flexDirection: 'row',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#22c55e'
  },
  signatureBox: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#22c55e',
    alignItems: 'center'
  },
  signatureBoxLast: {
    borderRightWidth: 0
  },
  signatureImage: {
    width: 120,
    height: 50,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  signatureLabel: {
    fontSize: 7,
    color: '#666',
    marginTop: 4
  },
  signatureName: {
    fontSize: 8,
    marginTop: 2
  },

  // Footer disclaimer
  disclaimer: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#22c55e',
    fontSize: 7,
    color: '#166534',
    textAlign: 'center'
  },

  // Peligros grid (checkboxes in grid)
  peligrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    borderWidth: 1,
    borderColor: '#22c55e',
    borderTopWidth: 0
  },
  peligrosItem: {
    width: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: 4
  },

  // Observaciones
  observacionesBox: {
    borderWidth: 1,
    borderColor: '#22c55e',
    borderTopWidth: 0,
    padding: 6,
    minHeight: 40
  },
  observacionesText: {
    fontSize: 8,
    color: '#333'
  }
})

// Helper: Render checkbox
const Checkbox = ({ checked, label }) => (
  <View style={styles.checkboxRow}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxX}>X</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </View>
)

// Helper: Render radio options
const RadioOptions = ({ value }) => (
  <View style={styles.radioGroup}>
    <View style={styles.radioOption}>
      <View style={[styles.checkbox, value === 'si' && styles.checkboxChecked]}>
        {value === 'si' && <Text style={styles.checkboxX}>X</Text>}
      </View>
      <Text style={styles.radioLabel}>Sí</Text>
    </View>
    <View style={styles.radioOption}>
      <View style={[styles.checkbox, value === 'no' && styles.checkboxChecked]}>
        {value === 'no' && <Text style={styles.checkboxX}>X</Text>}
      </View>
      <Text style={styles.radioLabel}>No</Text>
    </View>
    <View style={styles.radioOption}>
      <View style={[styles.checkbox, value === 'noAplica' && styles.checkboxChecked]}>
        {value === 'noAplica' && <Text style={styles.checkboxX}>X</Text>}
      </View>
      <Text style={styles.radioLabel}>N/A</Text>
    </View>
  </View>
)

export default function WorkSheetPDF({ data, workOrderCode }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>SIENERGIA</Text>
          </View>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>REGISTRO</Text>
            <Text style={styles.headerSubtitle}>HOJA DE TRABAJO</Text>
          </View>
          <View style={styles.headerCode}>
            <Text style={styles.headerCodeLabel}>Código:</Text>
            <Text style={styles.headerCodeValue}>REG-SIE-02</Text>
            <Text style={styles.headerCodeLabel}>Revisión:</Text>
            <Text style={styles.headerCodeValue}>03</Text>
            <Text style={styles.headerCodeLabel}>N°:</Text>
            <Text style={styles.headerCodeValue}>{workOrderCode || '-'}</Text>
          </View>
        </View>

        {/* SECCIÓN A - INICIO DE SERVICIO */}
        <Text style={styles.sectionTitle}>SECCIÓN A - Inicio de servicio</Text>

        {/* Fila 1: Cliente, Referencia */}
        <View style={[styles.row, styles.firstRow]}>
          <View style={[styles.cell, { flex: 2 }]}>
            <Text style={styles.cellLabel}>Cliente:</Text>
            <Text style={styles.cellValue}>{data.cliente || ''}</Text>
          </View>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Referencia:</Text>
            <Text style={styles.cellValue}>{data.referencia || workOrderCode || ''}</Text>
          </View>
        </View>

        {/* Fila 2: Responsable, Destino, Permiso viaje */}
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Responsable del servicio:</Text>
            <Text style={styles.cellValue}>{data.responsable || ''}</Text>
          </View>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Destino:</Text>
            <Text style={styles.cellValue}>{data.destino || ''}</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { width: 120 }]}>
            <Text style={styles.cellLabel}>¿Corresponde permiso de viaje?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
              <View style={styles.radioOption}>
                <View style={[styles.checkbox, data.permiso_viaje === true && styles.checkboxChecked]}>
                  {data.permiso_viaje === true && <Text style={styles.checkboxX}>X</Text>}
                </View>
                <Text style={styles.radioLabel}>Sí</Text>
              </View>
              <View style={styles.radioOption}>
                <View style={[styles.checkbox, data.permiso_viaje === false && styles.checkboxChecked]}>
                  {data.permiso_viaje === false && <Text style={styles.checkboxX}>X</Text>}
                </View>
                <Text style={styles.radioLabel}>No</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fila 3: Acompañantes */}
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Acompañante 1:</Text>
            <Text style={styles.cellValue}>{data.acompanante_1 || ''}</Text>
          </View>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Acompañante 2:</Text>
            <Text style={styles.cellValue}>{data.acompanante_2 || ''}</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Fecha:</Text>
            <Text style={styles.cellValue}>{formatDate(data.fecha_servicio)}</Text>
          </View>
        </View>

        {/* Fila 4: Área y descripción */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Área de ejecución del Servicio / Descripción del servicio y equipos intervenidos:</Text>
            <Text style={styles.cellValue}>{data.descripcion_servicio || ''}</Text>
          </View>
        </View>

        {/* CHECK LIST - PLANIFICACIÓN DEL SERVICIO */}
        <Text style={styles.sectionTitle}>CHECK LIST - PLANIFICACIÓN DEL SERVICIO</Text>
        <View style={[styles.row, styles.firstRow]}>
          {PLANIFICACION_ITEMS.map((item, idx) => (
            <View key={item.key} style={[styles.cell, idx === PLANIFICACION_ITEMS.length - 1 && styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{item.label}</Text>
              <RadioOptions value={data.planificacion?.[item.key]} />
            </View>
          ))}
        </View>

        {/* EJECUCIÓN DEL SERVICIO */}
        <Text style={styles.sectionTitle}>EJECUCIÓN DEL SERVICIO</Text>
        <View style={[styles.row, styles.firstRow]}>
          {EJECUCION_ITEMS.map((item, idx) => (
            <View key={item.key} style={[styles.cell, idx === EJECUCION_ITEMS.length - 1 && styles.cellLast, { flex: 1 }]}>
              <Text style={styles.cellLabel}>{item.label}</Text>
              <RadioOptions value={data.ejecucion?.[item.key]} />
            </View>
          ))}
        </View>
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>¿Cuántas personas están en riesgo de sufrir un accidente por sus actividades?</Text>
            <Text style={styles.cellValue}>{data.personas_riesgo || '0'} personas | R= {data.riesgo_rating || '0'}</Text>
          </View>
        </View>

        {/* TAREAS REALIZADAS */}
        <Text style={styles.sectionTitle}>TAREAS REALIZADAS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>N°</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>DETALLE DE TAREAS/ACTIVIDADES</Text>
            <Text style={[styles.tableHeaderCell, { width: 100, borderRightWidth: 0 }]}>RESPONSABLE</Text>
          </View>
          {data.tareas_realizadas && data.tareas_realizadas.length > 0 ? (
            data.tareas_realizadas.map((task, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 30, textAlign: 'center' }]}>{task.numero}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{task.detalle || ''}</Text>
                <Text style={[styles.tableCell, { width: 100, borderRightWidth: 0 }]}>{task.responsable || ''}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', borderRightWidth: 0 }]}>Sin tareas registradas</Text>
            </View>
          )}
        </View>

        {/* PELIGROS */}
        <Text style={styles.sectionTitle}>PELIGROS</Text>
        <View style={styles.peligrosGrid}>
          {PELIGROS_ITEMS.map((item) => (
            <View key={item.key} style={styles.peligrosItem}>
              <View style={[styles.checkbox, data.peligros?.[item.key] && styles.checkboxChecked]}>
                {data.peligros?.[item.key] && <Text style={styles.checkboxX}>X</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { fontSize: 6 }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* PERMISOS, EQUIPO DE EMERGENCIA, EPPs */}
        <View style={styles.threeColumnSection}>
          {/* Permisos Alto Riesgo */}
          <View style={styles.threeColumnItem}>
            <Text style={styles.threeColumnTitle}>Permisos para Actividades de Alto Riesgo</Text>
            {PERMISOS_ALTO_RIESGO.map((item) => (
              <Checkbox key={item.key} checked={data.permisos_alto_riesgo?.[item.key]} label={item.label} />
            ))}
          </View>

          {/* Equipo de Emergencia */}
          <View style={styles.threeColumnItem}>
            <Text style={styles.threeColumnTitle}>Equipo de Emergencia</Text>
            {EQUIPO_EMERGENCIA.map((item) => (
              <Checkbox key={item.key} checked={data.equipo_emergencia?.[item.key]} label={item.label} />
            ))}
          </View>

          {/* EPPs */}
          <View style={[styles.threeColumnItem, { borderRightWidth: 0 }]}>
            <Text style={styles.threeColumnTitle}>EPPs</Text>
            {EPPS_ITEMS.map((item) => (
              <Checkbox key={item.key} checked={data.epps?.[item.key]} label={item.label} />
            ))}
          </View>
        </View>

        {/* OBSERVACIONES */}
        <View style={styles.observacionesBox}>
          <Text style={styles.cellLabel}>Observaciones:</Text>
          <Text style={styles.observacionesText}>{data.observaciones || 'Sin observaciones'}</Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Text style={styles.cellLabel}>Ficha de trabajo: </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.radioOption}>
                <View style={[styles.checkbox, data.ficha_trabajo_ok === true && styles.checkboxChecked]}>
                  {data.ficha_trabajo_ok === true && <Text style={styles.checkboxX}>X</Text>}
                </View>
                <Text style={styles.radioLabel}>Sí</Text>
              </View>
              <View style={styles.radioOption}>
                <View style={[styles.checkbox, data.ficha_trabajo_ok === false && styles.checkboxChecked]}>
                  {data.ficha_trabajo_ok === false && <Text style={styles.checkboxX}>X</Text>}
                </View>
                <Text style={styles.radioLabel}>No</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD */}
        <Text style={styles.sectionTitle}>2. RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD</Text>

        <View style={styles.disclaimer}>
          <Text>Dejamos constancia de nuestra aceptación del servicio ofrecido ejecutado sin que exista reclamo presente ni futuro al respecto.</Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureSection}>
          {/* Firma Técnico */}
          <View style={styles.signatureBox}>
            {data.firma_tecnico ? (
              <Image src={data.firma_tecnico} style={styles.signatureImage} />
            ) : (
              <View style={[styles.signatureImage, { backgroundColor: '#f9fafb' }]} />
            )}
            <Text style={styles.signatureLabel}>Firma</Text>
            <Text style={styles.signatureName}>{data.nombre_tecnico || ''}</Text>
            <Text style={styles.signatureLabel}>Nombre y Fecha</Text>
          </View>

          {/* Firma Cliente */}
          <View style={[styles.signatureBox, styles.signatureBoxLast]}>
            {data.firma_cliente ? (
              <Image src={data.firma_cliente} style={styles.signatureImage} />
            ) : (
              <View style={[styles.signatureImage, { backgroundColor: '#f9fafb' }]} />
            )}
            <Text style={styles.signatureLabel}>Firma</Text>
            <Text style={styles.signatureName}>{data.nombre_cliente || ''}</Text>
            <Text style={styles.signatureLabel}>Nombre y Fecha</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
