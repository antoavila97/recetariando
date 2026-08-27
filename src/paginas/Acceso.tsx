import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Acceso() {
  const { iniciarSesion, registrar } = useAuth()
  const navigate = useNavigate()

  const [modo, setModo] = useState<'acceso' | 'registro'>('acceso')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setEnviando(true)

    try {
      if (modo === 'registro') {
        const resultado = await registrar(email, password, nombre)
        if (resultado.error) {
          setError(resultado.error)
        } else if (resultado.confirmarCorreo) {
          setAviso(
            'Registro exitoso. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'
          )
        } else {
          navigate('/favoritos')
        }
      } else {
        const resultado = await iniciarSesion(email, password)
        if (resultado.error) {
          setError(resultado.error)
        } else {
          navigate('/favoritos')
        }
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="container">
      <div className="login-panel">
        <h1 className="pagina-titulo">
          {modo === 'acceso' ? '🔐 Iniciar sesión' : '📝 Crear cuenta'}
        </h1>

        <div className="login-tabs">
          <button
            className={`login-tab ${modo === 'acceso' ? 'login-tab--activo' : ''}`}
            onClick={() => {
              setModo('acceso')
              setError(null)
              setAviso(null)
            }}
          >
            Ingresar
          </button>
          <button
            className={`login-tab ${modo === 'registro' ? 'login-tab--activo' : ''}`}
            onClick={() => {
              setModo('registro')
              setError(null)
              setAviso(null)
            }}
          >
            Registrarme
          </button>
        </div>

        {error && <div className="alerta">{error}</div>}
        {aviso && <div className="aviso">{aviso}</div>}

        <form className="login-form" onSubmit={enviar}>
          {modo === 'registro' && (
            <label className="campo-etiqueta">
              Nombre
              <input
                type="text"
                className="campo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>
          )}

          <label className="campo-etiqueta">
            Correo electrónico
            <input
              type="email"
              className="campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="campo-etiqueta">
            Contraseña
            <input
              type="password"
              className="campo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          <button className="btn btn--primario" disabled={enviando}>
            {enviando
              ? 'Procesando…'
              : modo === 'acceso'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="login-aviso-legal">
          {modo === 'acceso' ? (
            <>
              ¿No tienes cuenta?{' '}
              <button
                className="enlace"
                onClick={() => {
                  setModo('registro')
                  setError(null)
                  setAviso(null)
                }}
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                className="enlace"
                onClick={() => {
                  setModo('acceso')
                  setError(null)
                  setAviso(null)
                }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>

        <p className="login-aviso-legal">
          <Link to="/catalogo" className="enlace">
            ← Seguir explorando sin cuenta
          </Link>
        </p>
      </div>
    </main>
  )
}