import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import {
  PLANIFICACION_ITEMS,
  PERMISOS_ALTO_RIESGO,
  EQUIPO_EMERGENCIA,
  EPPS_ITEMS
} from '../../constants'

const G = '#22c55e'

const styles = StyleSheet.create({
  page: {
    padding: 14,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: G,
    marginBottom: 5
  },
  headerLogo: {
    width: 68,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: G,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerLogoText: { fontSize: 8, fontWeight: 'bold', color: G },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6
  },
  headerTitleText: { fontSize: 13, fontWeight: 'bold', color: G },
  headerSubtitle: { fontSize: 9, color: G, marginTop: 1 },
  headerCode: {
    width: 68,
    borderLeftWidth: 1,
    borderLeftColor: G,
    padding: 4,
    justifyContent: 'center'
  },
  headerCodeLabel: { fontSize: 6, color: '#666' },
  headerCodeValue: { fontSize: 8, fontWeight: 'bold', color: G },

  sectionTitle: {
    backgroundColor: G,
    color: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 0
  },

  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: G,
    borderTopWidth: 0
  },
  firstRow: { borderTopWidth: 1 },
  cell: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: G
  },
  cellLast: { borderRightWidth: 0 },
  cellLabel: { fontSize: 6, color: '#666', marginBottom: 1 },
  cellValue: { fontSize: 7, color: '#000' },

  checkbox: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: G,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: { backgroundColor: G },
  checkboxX: { fontSize: 5, color: '#fff', fontWeight: 'bold' },
  checkboxLabel: { fontSize: 6, flex: 1 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },

  radioGroup: { flexDirection: 'row', marginTop: 2 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 5 },
  radioLabel: { fontSize: 6, marginLeft: 2 },

  table: { borderWidth: 1, borderColor: G },
  tableHeader: { flexDirection: 'row', backgroundColor: G },
  tableHeaderCell: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#fff'
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: G,
    minHeight: 15
  },
  tableCell: {
    fontSize: 7,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: G
  },

  threeColSection: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: G,
    borderTopWidth: 1
  },
  threeColItem: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: G
  },
  threeColTitle: {
    fontSize: 6,
    fontWeight: 'bold',
    color: G,
    marginBottom: 3,
    textTransform: 'uppercase'
  },

  observacionesBox: {
    borderWidth: 1,
    borderColor: G,
    borderTopWidth: 0,
    padding: 4,
    minHeight: 24
  },

  signatureSection: {
    flexDirection: 'row',
    marginTop: 4,
    borderWidth: 1,
    borderColor: G
  },
  signatureBox: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: G,
    alignItems: 'center'
  },
  signatureBoxLast: { borderRightWidth: 0 },
  signatureImage: {
    width: 110,
    height: 42,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  signatureLabel: { fontSize: 6, color: '#666', marginTop: 2 },
  signatureName: { fontSize: 7, marginTop: 1 },

  disclaimer: {
    padding: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: G,
    borderTopWidth: 0,
    fontSize: 6,
    color: '#166534',
    textAlign: 'center'
  }
})

const Checkbox = ({ checked, label }) => (
  <View style={styles.checkboxRow}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxX}>X</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </View>
)

const RadioOptions = ({ value }) => (
  <View style={styles.radioGroup}>
    {[['si', 'Sí'], ['no', 'No'], ['noAplica', 'N/A']].map(([v, label]) => (
      <View key={v} style={styles.radioOption}>
        <View style={[styles.checkbox, value === v && styles.checkboxChecked]}>
          {value === v && <Text style={styles.checkboxX}>X</Text>}
        </View>
        <Text style={styles.radioLabel}>{label}</Text>
      </View>
    ))}
  </View>
)

export default function WorkSheetPDF({ data, workOrderCode }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
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

        {/* SECCIÓN A */}
        <Text style={styles.sectionTitle}>SECCIÓN A - Inicio de servicio</Text>

        {/* Fila 1: Cliente | Referencia | Fecha */}
        <View style={[styles.row, styles.firstRow]}>
          <View style={[styles.cell, { flex: 2 }]}>
            <Text style={styles.cellLabel}>Cliente:</Text>
            <Text style={styles.cellValue}>{data.cliente || ''}</Text>
          </View>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Referencia:</Text>
            <Text style={styles.cellValue}>{data.referencia || workOrderCode || ''}</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Fecha:</Text>
            <Text style={styles.cellValue}>{formatDate(data.fecha_servicio)}</Text>
          </View>
        </View>

        {/* Fila 2: Responsable | Destino */}
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Responsable del servicio:</Text>
            <Text style={styles.cellValue}>{data.responsable || ''}</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Destino:</Text>
            <Text style={styles.cellValue}>{data.destino || ''}</Text>
          </View>
        </View>

        {/* Fila 3: Acompañantes */}
        <View style={styles.row}>
          <View style={[styles.cell, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Acompañante 1:</Text>
            <Text style={styles.cellValue}>{data.acompanante_1 || ''}</Text>
          </View>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Acompañante 2:</Text>
            <Text style={styles.cellValue}>{data.acompanante_2 || ''}</Text>
          </View>
        </View>

        {/* Fila 4: Área de ejecución */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLast, { flex: 1 }]}>
            <Text style={styles.cellLabel}>Área de ejecución del Servicio:</Text>
            <Text style={styles.cellValue}>{data.area_ejecucion || ''}</Text>
          </View>
        </View>

        {/* Fila 5: Equipos intervenidos (altura variable) */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLast, { flex: 1, minHeight: 26 }]}>
            <Text style={styles.cellLabel}>Equipos intervenidos:</Text>
            <Text style={styles.cellValue}>{data.equipos_intervenidos || data.descripcion_servicio || ''}</Text>
          </View>
        </View>

        {/* CHECK LIST - PLANIFICACIÓN */}
        <Text style={styles.sectionTitle}>CHECK LIST - PLANIFICACIÓN DEL SERVICIO</Text>
        <View style={[styles.row, styles.firstRow]}>
          {PLANIFICACION_ITEMS.map((item, idx) => (
            <View
              key={item.key}
              style={[styles.cell, idx === PLANIFICACION_ITEMS.length - 1 && styles.cellLast, { flex: 1 }]}
            >
              <Text style={styles.cellLabel}>{item.label}</Text>
              <RadioOptions value={data.planificacion?.[item.key]} />
            </View>
          ))}
        </View>

        {/* TAREAS REALIZADAS */}
        <Text style={styles.sectionTitle}>TAREAS REALIZADAS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 20 }]}>N°</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>DETALLE DE TAREAS/ACTIVIDADES</Text>
            <Text style={[styles.tableHeaderCell, { width: 75, borderRightWidth: 0 }]}>RESPONSABLE</Text>
          </View>
          {data.tareas_realizadas && data.tareas_realizadas.length > 0 ? (
            data.tareas_realizadas.map((task, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 20, textAlign: 'center' }]}>{task.numero}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{task.detalle || ''}</Text>
                <Text style={[styles.tableCell, { width: 75, borderRightWidth: 0 }]}>{task.responsable || ''}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', borderRightWidth: 0 }]}>
                Sin tareas registradas
              </Text>
            </View>
          )}
        </View>

        {/* PERMISOS / EQUIPO DE EMERGENCIA / EPPs */}
        <Text style={styles.sectionTitle}>PERMISOS / EQUIPO DE EMERGENCIA / EPPs</Text>
        <View style={styles.threeColSection}>
          <View style={styles.threeColItem}>
            <Text style={styles.threeColTitle}>Permisos para Actividades de Alto Riesgo</Text>
            {PERMISOS_ALTO_RIESGO.map((item) => (
              <Checkbox key={item.key} checked={data.permisos_alto_riesgo?.[item.key]} label={item.label} />
            ))}
          </View>
          <View style={styles.threeColItem}>
            <Text style={styles.threeColTitle}>Equipo de Emergencia</Text>
            {EQUIPO_EMERGENCIA.map((item) => (
              <Checkbox key={item.key} checked={data.equipo_emergencia?.[item.key]} label={item.label} />
            ))}
          </View>
          <View style={[styles.threeColItem, { borderRightWidth: 0 }]}>
            <Text style={styles.threeColTitle}>EPPs</Text>
            {EPPS_ITEMS.map((item) => (
              <Checkbox key={item.key} checked={data.epps?.[item.key]} label={item.label} />
            ))}
          </View>
        </View>

        {/* OBSERVACIONES */}
        <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
        <View style={styles.observacionesBox}>
          <Text style={{ fontSize: 7, color: '#333' }}>{data.observaciones || ''}</Text>
        </View>

        {/* RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD */}
        <Text style={styles.sectionTitle}>RECEPCIÓN Y EVALUACIÓN DE CONFORMIDAD</Text>
        <View style={styles.disclaimer}>
          <Text>
            Dejamos constancia de nuestra aceptación del servicio ofrecido ejecutado sin que exista reclamo presente ni futuro al respecto.
          </Text>
        </View>

        {/* FIRMAS */}
        <View style={styles.signatureSection}>
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
