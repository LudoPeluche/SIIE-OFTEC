import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { PLANIFICACION_ITEMS, EPPS_ITEMS } from '../../constants'

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

  radioBox: {
    width: 7,
    height: 7,
    borderWidth: 1,
    borderColor: G,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioBoxChecked: { backgroundColor: G },
  radioX: { fontSize: 5, color: '#fff', fontWeight: 'bold' },

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

const RadioOptions = ({ value }) => (
  <View style={styles.radioGroup}>
    {[['si', 'Sí'], ['no', 'No'], ['noAplica', 'N/A']].map(([v, label]) => (
      <View key={v} style={styles.radioOption}>
        <View style={[styles.radioBox, value === v && styles.radioBoxChecked]}>
          {value === v && <Text style={styles.radioX}>X</Text>}
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

        {/* EPPs — antes de tareas */}
        <Text style={styles.sectionTitle}>EPPs</Text>
        <View style={{ borderWidth: 1, borderColor: G, padding: 6, flexDirection: 'row', flexWrap: 'wrap' }}>
          {EPPS_ITEMS.map((item) => (
            <View key={item.key} style={{ width: '33%', flexDirection: 'row', alignItems: 'center', paddingVertical: 2, paddingRight: 6 }}>
              <View style={[styles.radioBox, data.epps?.[item.key] && styles.radioBoxChecked]}>
                {data.epps?.[item.key] && <Text style={styles.radioX}>X</Text>}
              </View>
              <Text style={{ fontSize: 6, marginLeft: 3 }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* TAREAS y OBSERVACIONES comparten el espacio restante en mitades iguales */}
        <View style={{ flex: 1, flexDirection: 'column' }}>

          {/* TAREAS REALIZADAS */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <Text style={styles.sectionTitle}>TAREAS REALIZADAS</Text>
            <View style={[styles.table, { flex: 1 }]}>
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
              {/* Filler — casillas en blanco para igualar altura con Observaciones */}
              <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: G, flexDirection: 'row' }}>
                <View style={{ width: 20, borderRightWidth: 1, borderRightColor: G }} />
                <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: G }} />
                <View style={{ width: 75 }} />
              </View>
            </View>
          </View>

          {/* OBSERVACIONES */}
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
            <View style={{ flex: 1, borderWidth: 1, borderColor: G, padding: 6 }}>
              <Text style={{ fontSize: 7, color: (data.observaciones || '').trim() ? '#333' : '#999' }}>
                {(data.observaciones || '').trim() || 'No existe ninguna observación.'}
              </Text>
            </View>
          </View>

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
