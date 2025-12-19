export default function TopBar({ title, role, roles = [], onRoleChange, tech, techs = [], onTechChange }){
  return (
    <div className="topbar-inner">
      <div className="brand">
        <span style={{fontSize:18}}>SIIE-OFTEC</span>
        <span>{title}</span>
        <span className="badge">MVP Frontend</span>
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <div className="badge">Android-first PWA</div>
        {roles.length > 0 && onRoleChange && (
          <select
            className="input"
            value={role}
            onChange={(e)=>onRoleChange(e.target.value)}
            style={{minWidth:150}}
          >
            {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        )}
        {role === 'TECH' && onTechChange && (
          <select
            className="input"
            value={tech}
            onChange={(e)=>onTechChange(e.target.value)}
            style={{minWidth:180}}
          >
            {techs.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>
    </div>
  )
}
