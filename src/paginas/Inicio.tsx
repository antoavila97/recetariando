import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarDestacadas, obtenerEstadisticas } from '../lib/api'
import type { Estadisticas, RecetaResumen } from '../lib/tipos'
import TarjetaReceta from '../componentes/TarjetaReceta'
import Spinner from '../componentes/Spinner'

export default function Inicio() {
  const [recetas, setRecetas] = useState<RecetaResumen[]>([])
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [errores, setErrores] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargar() {
      try {
        const [destacadas, estadisticas] = await Promise.all([
          listarDestacadas(12),
          obtenerEstadisticas(),
        ])
        if (!activo) return
        setRecetas(destacadas)
        setStats(estadisticas)
      } catch (e) {
        if (!activo) return
        setErrores((prev) => [
          ...prev,
          'No se pudo cargar el catálogo. Verifica que ejecutaste supabase/schema.sql y seed_demo.sql en Supabase.',
        ])
        if (e instanceof Error) console.error(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <header className="hero">
        <div className="container">
          <h1 className="hero-titulo">🍳 RECETARIANDO</h1>
          <p className="hero-subtitulo">
            Tu catálogo interactivo de recetas: busca por texto, ingredientes y tipo de
            dieta.
          </p>
          <div className="stats">
            <div className="stat">📖 {stats?.totalRecetas ?? '…'} recetas</div>
            <div className="stat">🥕 {stats?.totalIngredientes ?? '…'} ingredientes</div>
          </div>
          <Link to="/catalogo" className="btn btn--blanco">
            Explorar catálogo →
          </Link>
        </div>
      </header>

      <main className="container">
        <section className="seccion">
          <h2 className="seccion-titulo">✨ Recetas destacadas</h2>

          {errores.length > 0 && (
            <div className="alerta">
              {errores.map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          {cargando ? (
            <Spinner />
          ) : recetas.length === 0 ? (
            <p className="vacio">
              Aún no hay recetas. Ejecuta <code>supabase/seed_demo.sql</code> en el SQL
              Editor de Supabase.
            </p>
          ) : (
            <div className="grid">
              {recetas.map((r) => (
                <TarjetaReceta key={r.id} receta={r} />
              ))}
            </div>
          )}
        </section>

        <section className="seccion seccion--info">
          <h2 className="seccion-titulo">¿Cómo funciona?</h2>
          <div className="info-columnas">
            <div className="info-item">
              <h3>🔎 Búsqueda inteligente</h3>
              <p>Busca por nombre o resumen, o filtra por ingredientes que tengas en casa.</p>
            </div>
            <div className="info-item">
              <h3>🥗 Filtros de dieta</h3>
              <p>Vegano, vegetariano, sin gluten, sin lactosa, tiempo máximo y calorías.</p>
            </div>
            <div className="info-item">
              <h3>❤ Favoritos</h3>
              <p>Crea tu cuenta y guarda las recetas que quieras preparar.</p>
            </div>
            <div className="info-item">
              <h3>📊 Nutrición</h3>
              <p>Cada receta muestra calorías, proteínas, carbohidratos, grasa y fibra.</p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}