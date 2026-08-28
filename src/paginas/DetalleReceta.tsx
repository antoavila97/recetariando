import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { agregarFavorito, esFavorito, obtenerReceta, quitarFavorito, tiempoTotal } from '../lib/api'
import type { Nutricion, RecetaDetalle } from '../lib/tipos'
import { useAuth } from '../context/AuthContext'
import Spinner from '../componentes/Spinner'

const MACROS: { clave: keyof Nutricion; etiqueta: string; maximo: number }[] = [
  { clave: 'proteinas', etiqueta: 'Proteínas', maximo: 60 },
  { clave: 'carbohidratos', etiqueta: 'Carbohidratos', maximo: 100 },
  { clave: 'grasa', etiqueta: 'Grasa', maximo: 50 },
  { clave: 'fibra', etiqueta: 'Fibra', maximo: 25 },
]

function limpiarResumen(texto: string | null): string {
  if (!texto) return ''
  return texto.replace(/<[^>]*>/g, '')
}

export default function DetalleReceta() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const [receta, setReceta] = useState<RecetaDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [favCargando, setFavCargando] = useState(false)
  const [imagenOk, setImagenOk] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const datos = await obtenerReceta(id ?? '')
        if (!activo) return
        setReceta(datos)
      } catch (e) {
        if (!activo) return
        setError('No se pudo cargar la receta.')
        if (e instanceof Error) console.error(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [id])

  useEffect(() => {
    let activo = true

    if (usuario && receta) {
      esFavorito(usuario.id, receta.id)
        .then((resultado) => {
          if (activo) setFav(resultado)
        })
        .catch(() => {})
    } else {
      setFav(false)
    }

    return () => {
      activo = false
    }
  }, [usuario, receta])

  if (cargando) {
    return (
      <main className="container">
        <Spinner />
      </main>
    )
  }

  if (error || !receta) {
    return (
      <main className="container">
        <p className="vacio">{error ?? 'Receta no encontrada.'}</p>
        <Link to="/catalogo" className="btn btn--primario">
          Volver al catálogo
        </Link>
      </main>
    )
  }

  const pasos =
    receta.instrucciones
      ?.split(/\r?\n+/)
      .map((l) => l.trim())
      .filter(Boolean) ?? []

  async function alternarFavorito() {
    if (!usuario || !receta) return
    setFavCargando(true)
    try {
      if (fav) {
        await quitarFavorito(usuario.id, receta.id)
        setFav(false)
      } else {
        await agregarFavorito(usuario.id, receta.id)
        setFav(true)
      }
    } catch (e) {
      if (e instanceof Error) console.error(e.message)
    } finally {
      setFavCargando(false)
    }
  }

  return (
    <main className="container detalle">
      <Link to="/catalogo" className="detalle-volver">
        ← Volver al catálogo
      </Link>

      <article className="detalle-hero">
        <div className="detalle-imagen">
          {receta.imagen_url && imagenOk ? (
            <img
              src={receta.imagen_url}
              alt={receta.titulo}
              onError={() => setImagenOk(false)}
            />
          ) : (
            <div className="card-imagen-fallback detalle-imagen-fallback">🍽️</div>
          )}
        </div>

        <div className="detalle-info">
          <h1 className="detalle-titulo">{receta.titulo}</h1>

          {usuario && (
            <button
              className={`btn favorito-btn ${fav ? 'favorito-btn--activo' : ''}`}
              disabled={favCargando}
              onClick={alternarFavorito}
            >
              {fav ? '❤ Guardada en favoritos' : '🤍 Guardar en favoritos'}
            </button>
          )}

          <div className="card-meta detalle-meta">
            {receta.calificacion != null && (
              <span className="rating">
                ⭐ {Number(receta.calificacion).toFixed(1)}
              </span>
            )}
            <span>⏱️ {tiempoTotal(receta)} min en total</span>
            <span>🍽️ {receta.porciones} porciones</span>
            {receta.calorias != null && (
              <span>🔥 {Math.round(receta.calorias)} kcal</span>
            )}
          </div>

          <div className="tags">
            {receta.vegano && <span className="tag tag--veg">🌱 Vegano</span>}
            {receta.vegetariano && (
              <span className="tag tag--veg">🥗 Vegetariano</span>
            )}
            {receta.sin_gluten && <span className="tag">🚫🌾 Sin gluten</span>}
            {receta.sin_lactosa && <span className="tag">🚫🥛 Sin lactosa</span>}
            {receta.saludable && <span className="tag tag--sano">💪 Saludable</span>}
            {receta.barato && <span className="tag tag--sano">💰 Barato</span>}
            {receta.muy_popular && <span className="tag">🔥 Muy popular</span>}
          </div>

          {receta.resumen && <p className="detalle-resumen">{limpiarResumen(receta.resumen)}</p>}
        </div>
      </article>

      <div className="detalle-columnas">
        <section className="panel">
          <h2 className="panel-titulo">🛒 Ingredientes</h2>
          {receta.ingredientes.length === 0 ? (
            <p className="vacio">Sin ingredientes registrados.</p>
          ) : (
            <ul className="lista-ingredientes">
              {receta.ingredientes.map((ing, i) => (
                <li key={i}>
                  <span className="ing-cantidad">
                    {[ing.cantidad, ing.unidad].filter(Boolean).join(' ')}
                  </span>
                  <span className="ing-nombre">{ing.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2 className="panel-titulo">📋 Preparación</h2>
          {pasos.length === 0 ? (
            <p className="vacio">Sin instrucciones registradas.</p>
          ) : (
            <ol className="pasos">
              {pasos.map((paso, i) => (
                <li key={i}>{paso}</li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="panel">
        <h2 className="panel-titulo">📊 Información nutricional</h2>
        {!receta.nutricion ? (
          <p className="vacio">Sin datos nutricionales.</p>
        ) : (
          <div className="nutricion">
            {receta.nutricion.calorias != null && (
              <div className="nutricion-calorias">
                <strong>{Math.round(receta.nutricion.calorias)}</strong> kcal por porción
              </div>
            )}
            {MACROS.map((m) => {
              const valor = receta.nutricion?.[m.clave]
              if (valor == null) return null
              const porcentaje = Math.min(100, (valor / m.maximo) * 100)
              return (
                <div className="nutri-fila" key={m.clave}>
                  <div className="nutri-etiqueta">
                    <span>{m.etiqueta}</span>
                    <strong>
                      {valor} g
                    </strong>
                  </div>
                  <div className="nutri-barra">
                    <div className="nutri-barra-relleno" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {receta.fuente_url && (
        <p className="detalle-fuente">
          Fuente:{' '}
          <a href={receta.fuente_url} target="_blank" rel="noreferrer">
            {receta.fuente_url}
          </a>
        </p>
      )}
    </main>
  )
}