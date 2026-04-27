import { PEOPLE } from '../../constants'

export default function TaskTable({ tasks = [], onChange }) {
  const safeTasks = Array.isArray(tasks) ? tasks : []

  const handleAddTask = () => {
    const newTask = {
      numero: safeTasks.length + 1,
      detalle: '',
      responsable: ''
    }
    onChange([...safeTasks, newTask])
  }

  const handleRemoveTask = (index) => {
    const updated = safeTasks.filter((_, i) => i !== index)
    // Renumerar tareas
    const renumbered = updated.map((task, i) => ({ ...task, numero: i + 1 }))
    onChange(renumbered)
  }

  const handleTaskChange = (index, field, value) => {
    const updated = [...safeTasks]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ margin: 0 }}>
          Tareas Realizadas
          <span style={{ color: 'var(--bad)', marginLeft: 4 }}>*</span>
        </label>
        <button
          type="button"
          className="btn primary"
          onClick={handleAddTask}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          + Agregar Tarea
        </button>
      </div>

      {safeTasks.length === 0 && (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '1px dashed var(--line)',
            color: 'var(--muted)'
          }}
        >
          No hay tareas registradas. Haz clic en "Agregar Tarea" para comenzar.
        </div>
      )}

      {safeTasks.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>N°</th>
                <th>Detalle de Tareas/Actividades</th>
                <th style={{ width: 180 }}>Responsable</th>
                <th style={{ width: 80 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {safeTasks.map((task, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{task.numero}</td>
                  <td>
                    <textarea
                      className="input"
                      rows="2"
                      value={task.detalle}
                      onChange={(e) => handleTaskChange(index, 'detalle', e.target.value)}
                      placeholder="Describe la tarea realizada..."
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </td>
                  <td>
                    <select
                      className="input"
                      value={task.responsable}
                      onChange={(e) => handleTaskChange(index, 'responsable', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {PEOPLE.map((person) => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => handleRemoveTask(index)}
                      style={{ fontSize: 12, padding: '6px 10px' }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
