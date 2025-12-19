import Chip from '../components/Chip.jsx'

export default function Admin(){
  return (
    <div className="grid">
      <div className="col-12 card">
        <div className="row">
          <div>
            <h1 className="h1">Admin (Placeholder)</h1>
            <p className="muted" style={{margin:'8px 0 0 0'}}>
              Aquí irá: usuarios/roles, catálogos (servicios), clientes y configuración.
            </p>
          </div>
          <Chip tone="blue">MVP</Chip>
        </div>
      </div>

      <div className="col-12 card">
        <h2 style={{marginTop:0}}>Siguiente</h2>
        <ul className="muted" style={{lineHeight:1.7, marginTop:8}}>
          <li>Integrar Firebase Auth (Google) + roles (admin/planner/tech).</li>
          <li>CRUD de clientes y catálogo de servicios.</li>
          <li>Reglas Firestore para que tech vea solo lo suyo.</li>
        </ul>
      </div>
    </div>
  )
}
