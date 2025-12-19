export default function Modal({ open, title, children, onClose }){
  if(!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e)=>e.stopPropagation()}>
        <div className="row" style={{marginBottom:10}}>
          <h3>{title}</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
