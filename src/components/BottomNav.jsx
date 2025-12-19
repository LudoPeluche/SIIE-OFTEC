import { NavLink } from 'react-router-dom'

function Item({ to, icon, label }){
  return (
    <NavLink
      to={to}
      className={({isActive}) => "navitem" + (isActive ? " active" : "")}
      end={to === '/'}
    >
      <div className="navicon">{icon}</div>
      <div>{label}</div>
    </NavLink>
  )
}

export default function BottomNav(){
  return (
    <div className="bottomnav">
      <div className="bottomnav-inner">
        <Item to="/" icon="📊" label="KPIs" />
        <Item to="/plan-semanal" icon="📅" label="Plan" />
        <Item to="/ot" icon="🛠️" label="OT" />
        <Item to="/horas-extra" icon="⏱️" label="Extras" />
        <Item to="/admin" icon="⚙️" label="Admin" />
      </div>
    </div>
  )
}
