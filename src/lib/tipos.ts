export interface RecetaResumen {
  id: number
  spoonacular_id?: number | null
  titulo: string
  imagen_url: string | null
  resumen?: string | null
  tiempo_preparacion: number | null
  tiempo_coccion: number | null
  porciones: number | null
  calificacion: number | null
  vegano?: boolean
  vegetariano?: boolean
  sin_gluten?: boolean
  sin_lactosa?: boolean
  calorias?: number | null
  [clave: string]: unknown
}

export interface IngredienteConCantidad {
  cantidad: string | null
  unidad: string | null
  nombre: string | null
  imagen_url: string | null
}

export interface Nutricion {
  calorias: number | null
  proteinas: number | null
  carbohidratos: number | null
  grasa: number | null
  fibra: number | null
}

export interface RecetaDetalle extends RecetaResumen {
  resumen: string | null
  instrucciones: string | null
  fuente_url: string | null
  saludable: boolean
  barato: boolean
  muy_popular: boolean
  ingredientes: IngredienteConCantidad[]
  nutricion: Nutricion | null
}

export interface IngredienteResumen {
  id: number
  nombre: string
  imagen_url: string | null
}

export interface Filtros {
  q: string
  ingredientes: string[]
  vegano: boolean
  vegetariano: boolean
  sin_gluten: boolean
  sin_lactosa: boolean
  tiempo_max: string
  calorias_max: string
}

export interface ResultadoBusqueda {
  total: number
  pagina: number
  limite: number
  recetas: RecetaResumen[]
}

export interface Favorito {
  id: number
  guardado_en: string
  recetas: RecetaResumen | null
}

export interface Estadisticas {
  totalRecetas: number
  totalIngredientes: number
}

export const FILTROS_VACIOS: Filtros = {
  q: '',
  ingredientes: [],
  vegano: false,
  vegetariano: false,
  sin_gluten: false,
  sin_lactosa: false,
  tiempo_max: '',
  calorias_max: '',
}