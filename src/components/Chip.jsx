export default function Chip({ tone='blue', children }){
  return <span className={'chip ' + tone}>{children}</span>
}
