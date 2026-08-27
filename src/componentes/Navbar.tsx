import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth()

  return (
    <nav className="nav">
      <div className="nav-contenido container">
        <NavLink to="/" className="nav-logo" end>
          <span>🍳</span> RECETARIANDO
        </NavLink>

        <div className="nav-enlaces">
          <NavLink to="/" className="nav-enlace" end>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className="nav-enlace">
            Catálogo
          </NavLink>
          {usuario && (
            <NavLink to="/favoritos" className="nav-enlace">
              ❤ Favoritos
            </NavLink>
          )}
        </div>

        <div className="nav-sesion">
          {usuario ? (
            <>
              <span className="nav-usuario">
                {String(usuario.user_metadata?.nombre ?? usuario.email)} ·{' '}
                {usuario.email}
              </span>
              <button className="btn btn--pequeno" onClick={() => cerrarSesion()}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/acceso" className="btn btn--primario btn--pequeno">
              Ingresar
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}