import { Link } from 'react-router-dom'
import type { RecetaResumen } from '../lib/tipos'
import { tiempoTotal } from '../lib/api'

export default function TarjetaReceta({ receta }: { receta: RecetaResumen }) {
  return (
    <Link to={`/receta/${receta.id}`} className="card">
      <div className="card-imagen">
        {receta.imagen_url ? (
          <img src={receta.imagen_url} alt={receta.titulo} loading="lazy" />
        ) : (
          <div className="card-imagen-fallback">🍽️</div>
        )}
        {receta.calorias != null && (
          <span className="card-calorias">{Math.round(receta.calorias)} kcal</span>
        )}
      </div>
      <div className="card-cuerpo">
        <h3 className="card-titulo">{receta.titulo}</h3>
        <div className="card-meta">
          {receta.calificacion != null && (
            <span className="rating">⭐ {Number(receta.calificacion).toFixed(1)}</span>
          )}
          <span>⏱️ {tiempoTotal(receta)} min</span>
          {receta.porciones != null && <span>🍽️ {receta.porciones}</span>}
        </div>
        <div className="tags">
          {receta.vegano && <span className="tag tag--veg">🌱 Vegano</span>}
          {receta.vegetariano && <span className="tag tag--veg">🥗 Vegetariano</span>}
          {receta.sin_gluten && <span className="tag">🚫🌾 Sin gluten</span>}
          {receta.sin_lactosa && <span className="tag">🚫🥛 Sin lactosa</span>}
        </div>
      </div>
    </Link>
  )
}