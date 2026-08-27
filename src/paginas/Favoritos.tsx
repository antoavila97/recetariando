import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarFavoritos, quitarFavorito } from '../lib/api'
import type { Favorito } from '../lib/tipos'
import { useAuth } from '../context/AuthContext'
import TarjetaReceta from '../componentes/TarjetaReceta'
import Spinner from '../componentes/Spinner'

export default function Favoritos() {
  const { usuario } = useAuth()
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true

    async function cargar() {
      if (!usuario) return
      setCargando(true)
      setError(null)
      try {
        const datos = await listarFavoritos(usuario.id)
        if (!activo) return
        setFavoritos(datos)
      } catch (e) {
        if (!activo) return
        setError('No se pudieron cargar tus favoritos.')
        if (e instanceof Error) console.error(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [usuario])

  async function eliminar(idFavorito: number) {
    if (!usuario) return
    try {
      await quitarFavorito(usuario.id, idFavorito)
      setFavoritos((prev) => prev.filter((f) => f.recetas?.id !== idFavorito))
    } catch (e) {
      setFavoriteError(e)
    }
  }

  function setFavoriteError(e: unknown) {
    setError('No se pudo quitar la receta de favoritos.')
    if (e instanceof Error) console.error(e.message)
  }

  if (cargando) {
    return (
      <main className="container">
        <Spinner />
      </main>
    )
  }

  const hayRecetas = favoritos.some((f) => f.recetas)

  return (
    <main className="container">
      <h1 className="pagina-titulo">❤ Mis recetas favoritas</h1>

      {error && <div className="alerta">{error}</div>}

      {favoritos.length === 0 || !hayRecetas ? (
        <div className="vacio">
          <p>Aún no tienes recetas favoritas.</p>
          <Link to="/catalogo" className="btn btn--primario">
            Explorar el catálogo
          </Link>
        </div>
      ) : (
        <div className="grid">
          {favoritos.map((f) =>
            f.recetas ? (
              <div className="tarjeta-favorita" key={f.recetas.id}>
                <TarjetaReceta receta={f.recetas} />
                <button
                  className="btn btn--secundario tarjeta-favorita-boton"
                  onClick={() => eliminar(f.recetas!.id)}
                >
                  Quitar de favoritos
                </button>
              </div>
            ) : null
          )}
        </div>
      )}
    </main>
  )
}