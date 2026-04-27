import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import '../styles.css'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">SIIE-OFTEC</h1>
        <p className="login-subtitle">Sistema de Mantenimiento</p>

        <form onSubmit={handleSubmit} className="login-step">
          <p className="login-prompt">Iniciar Sesión</p>

          <input
            type="email"
            className="input login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />

          <input
            type="password"
            className="input login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            style={{ marginTop: '1rem' }}
          />

          {error && <p className="login-error" style={{ marginTop: '1rem' }}>{error}</p>}

          <button
            type="submit"
            className="login-btn login-btn--accent"
            style={{ marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
