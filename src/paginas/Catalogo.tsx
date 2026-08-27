import { useEffect, useRef, useState } from 'react'
import { buscarRecetas, listarIngredientes } from '../lib/api'
import { FILTROS_VACIOS, type Filtros, type IngredienteResumen, type RecetaResumen } from '../lib/tipos'
import TarjetaReceta from '../componentes/TarjetaReceta'
import Spinner from '../componentes/Spinner'

const POR_PAGINA = 20

export default function Catalogo() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(FILTROS_VACIOS)
  const [ingredienteTexto, setIngredienteTexto] = useState('')
  const [sugerencias, setSugerencias] = useState<IngredienteResumen[]>([])
  const [recetas, setRecetas] = useState<RecetaResumen[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cambiarFiltro(clave: keyof Filtros, valor: unknown) {
    setFiltros((prev) => ({ ...prev, [clave]: valor }))
  }

  function buscar() {
    setFiltrosAplicados(filtros)
    setPagina(1)
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS)
    setFiltrosAplicados(FILTROS_VACIOS)
    setIngredienteTexto('')
    setSugerencias([])
    setPagina(1)
  }

  function agregarIngrediente(nombre: string) {
    if (!nombre.trim()) return
    const nombreLimpio = nombre.trim().toLowerCase()
    if (filtros.ingredientes.includes(nombreLimpio)) {
      setIngredienteTexto('')
      setSugerencias([])
      return
    }
    const nuevos = [...filtros.ingredientes, nombreLimpio]
    setFiltros((prev) => ({ ...prev, ingredientes: nuevos }))
    setIngredienteTexto('')
    setSugerencias([])
  }

  function quitarIngrediente(nombre: string) {
    setFiltros((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((i) => i !== nombre),
    }))
  }

  useEffect(() => {
    if (temporizador.current) clearTimeout(temporizador.current)

    if (ingredienteTexto.trim().length < 2) {
      setSugerencias([])
      return
    }

    temporizador.current = setTimeout(async () => {
      try {
        setSugerencias(await listarIngredientes(ingredienteTexto.trim()))
      } catch (e) {
        setSugerencias([])
      }
    }, 300)

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [ingredienteTexto])

  useEffect(() => {
    let activo = true

    async function cargar() {
      setCargando(true)
      setError(null)
      try {
        const resultado = await buscarRecetas(filtrosAplicados, pagina, POR_PAGINA)
        if (!activo) return
        setRecetas(resultado.recetas)
        setTotal(resultado.total)
      } catch (e) {
        if (!activo) return
        setError(
          'Ocurrió un error al buscar. Verifica la conexión a Supabase y que ejecutaste schema.sql.'
        )
        if (e instanceof Error) console.error(e.message)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => {
      activo = false
    }
  }, [filtrosAplicados, pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const hayFiltros = filtrosAplicados !== FILTROS_VACIOS

  return (
    <main className="container">
      <h1 className="pagina-titulo">🔎 Catálogo y buscador</h1>

      <div className="filtros-panel">
        <div className="filtros-busqueda">
          <input
            type="search"
            className="campo campo--grande"
            placeholder="Buscar receta (ej. pollo, paella, lentejas…)"
            value={filtros.q}
            onChange={(e) => cambiarFiltro('q', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') buscar()
            }}
          />
          <button className="btn btn--primario" onClick={buscar}>
            Buscar
          </button>
        </div>

        <div className="filtros-ingredientes">
          <div className="autocompletar">
            <input
              type="text"
              className="campo"
              placeholder="Agregar ingrediente (debe contener todos)…"
              value={ingredienteTexto}
              onChange={(e) => setIngredienteTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') agregarIngrediente(ingredienteTexto)
              }}
            />
            {sugerencias.length > 0 && (
              <ul className="autocompletar-lista">
                {sugerencias.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => agregarIngrediente(s.nombre)}>
                      {s.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {filtros.ingredientes.length > 0 && (
            <div className="chips">
              {filtros.ingredientes.map((ing) => (
                <span key={ing} className="chip">
                  {ing}
                  <button type="button" onClick={() => quitarIngrediente(ing)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="filtros-checks">
          <label className="check">
            <input
              type="checkbox"
              checked={filtros.vegano}
              onChange={(e) => cambiarFiltro('vegano', e.target.checked)}
            />
            🌱 Vegano
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={filtros.vegetariano}
              onChange={(e) => cambiarFiltro('vegetariano', e.target.checked)}
            />
            🥗 Vegetariano
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={filtros.sin_gluten}
              onChange={(e) => cambiarFiltro('sin_gluten', e.target.checked)}
            />
            🚫🌾 Sin gluten
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={filtros.sin_lactosa}
              onChange={(e) => cambiarFiltro('sin_lactosa', e.target.checked)}
            />
            🚫🥛 Sin lactosa
          </label>
          <div className="filtros-numero">
            <label className="check">
              A lo más
              <input
                type="number"
                min="1"
                className="campo campo--numero"
                placeholder="min"
                value={filtros.tiempo_max}
                onChange={(e) => cambiarFiltro('tiempo_max', e.target.value)}
              />{' '}
              min de tiempo
            </label>
          </div>
          <div className="filtros-numero">
            <label className="check">
              A lo más
              <input
                type="number"
                min="1"
                className="campo campo--numero"
                placeholder="kcal"
                value={filtros.calorias_max}
                onChange={(e) => cambiarFiltro('calorias_max', e.target.value)}
              />{' '}
              kcal
            </label>
          </div>
          <button className="btn btn--secundario" onClick={limpiar}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {filtrosAplicados !== FILTROS_VACIOS && !cargando && (
        <p className="resultados-info">
          {total} receta{total === 1 ? '' : 's'} encontrada
          {total === 1 ? '' : 's'}
          {hayFiltros && filtrosAplicados.q ? ` para “${filtrosAplicados.q}”` : ''}
        </p>
      )}

      {error && <div className="alerta">{error}</div>}

      {cargando ? (
        <Spinner />
      ) : recetas.length === 0 ? (
        <p className="vacio">No se encontraron recetas con esos filtros.</p>
      ) : (
        <>
          <div className="grid">
            {recetas.map((r) => (
              <TarjetaReceta key={r.id} receta={r} />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion">
              <button
                className="btn btn--secundario"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                ‹ Anterior
              </button>
              <span className="paginacion-info">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                className="btn btn--secundario"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente ›
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}