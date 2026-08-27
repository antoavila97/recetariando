import { supabase } from './supabase'
import type {
  Estadisticas,
  Favorito,
  Filtros,
  IngredienteConCantidad,
  IngredienteResumen,
  Nutricion,
  RecetaDetalle,
  RecetaResumen,
  ResultadoBusqueda,
} from './tipos'

interface FilaIngrediente {
  cantidad: string | null
  unidad: string | null
  ingredientes:
    | { nombre: string | null; imagen_url: string | null }
    | { nombre: string | null; imagen_url: string | null }[]
    | null
}

function tiempoTotal(r: RecetaResumen): number {
  return (r.tiempo_preparacion ?? 0) + (r.tiempo_coccion ?? 0)
}

export { tiempoTotal }

export async function listarDestacadas(limite = 12): Promise<RecetaResumen[]> {
  const { data, error } = await supabase
    .from('recetas')
    .select(
      'id, titulo, imagen_url, tiempo_preparacion, tiempo_coccion, porciones, calificacion, vegano, vegetariano, sin_gluten, sin_lactosa'
    )
    .order('calificacion', { ascending: false, nullsFirst: false })
    .limit(limite)

  if (error) throw error
  return (data ?? []) as RecetaResumen[]
}

export async function obtenerEstadisticas(): Promise<Estadisticas> {
  const { count: totalRecetas } = await supabase
    .from('recetas')
    .select('*', { count: 'exact', head: true })
  const { count: totalIngredientes } = await supabase
    .from('ingredientes')
    .select('*', { count: 'exact', head: true })

  return {
    totalRecetas: totalRecetas ?? 0,
    totalIngredientes: totalIngredientes ?? 0,
  }
}

export async function buscarRecetas(
  filtros: Filtros,
  pagina = 1,
  limite = 20
): Promise<ResultadoBusqueda> {
  const ingredientes = filtros.ingredientes.length > 0 ? filtros.ingredientes : null

  const { data, error } = await supabase.rpc('buscar_recetas', {
    p_q: filtros.q || '',
    p_ingredientes: ingredientes,
    p_vegano: filtros.vegano ? true : null,
    p_vegetariano: filtros.vegetariano ? true : null,
    p_sin_gluten: filtros.sin_gluten ? true : null,
    p_sin_lactosa: filtros.sin_lactosa ? true : null,
    p_tiempo_max: filtros.tiempo_max ? Number(filtros.tiempo_max) : null,
    p_calorias_max: filtros.calorias_max ? Number(filtros.calorias_max) : null,
    p_pagina: pagina,
    p_limite: limite,
  })

  if (error) throw error

  return {
    total: (data as ResultadoBusqueda).total ?? 0,
    pagina: (data as ResultadoBusqueda).pagina ?? pagina,
    limite: (data as ResultadoBusqueda).limite ?? limite,
    recetas: (data as ResultadoBusqueda).recetas ?? [],
  }
}

export async function obtenerReceta(id: number | string): Promise<RecetaDetalle | null> {
  const { data: receta, error } = await supabase
    .from('recetas')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!receta) return null

  const { data } = await supabase
    .from('receta_ingredientes')
    .select('cantidad, unidad, ingredientes(nombre, imagen_url)')
    .eq('receta_id', id)

  const { data: nutricion } = await supabase
    .from('nutricion')
    .select('calorias, proteinas, carbohidratos, grasa, fibra')
    .eq('receta_id', id)
    .maybeSingle()

  const filas = (data as unknown as FilaIngrediente[]) ?? []
  const ingredientes: IngredienteConCantidad[] = filas.map((f) => {
    const ing = Array.isArray(f.ingredientes) ? f.ingredientes[0] : f.ingredientes
    return {
      cantidad: f.cantidad,
      unidad: f.unidad,
      nombre: ing?.nombre ?? null,
      imagen_url: ing?.imagen_url ?? null,
    }
  })

  return {
    ...(receta as RecetaDetalle),
    ingredientes,
    nutricion: (nutricion as Nutricion | null) ?? null,
  }
}

export async function listarIngredientes(q: string): Promise<IngredienteResumen[]> {
  const { data, error } = await supabase
    .from('ingredientes')
    .select('id, nombre, imagen_url')
    .ilike('nombre', `%${q}%`)
    .order('nombre', { ascending: true })
    .limit(30)

  if (error) throw error
  return (data ?? []) as IngredienteResumen[]
}

export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  const { data, error } = await supabase
    .from('favoritos')
    .select('id, guardado_en, recetas(*)')
    .eq('usuario_id', usuarioId)
    .order('guardado_en', { ascending: false })

  if (error) throw error
  return (data as unknown as Favorito[]) ?? []
}

export async function esFavorito(usuarioId: string, recetaId: number): Promise<boolean> {
  const { count } = await supabase
    .from('favoritos')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('receta_id', recetaId)

  return (count ?? 0) > 0
}

export async function agregarFavorito(usuarioId: string, recetaId: number): Promise<void> {
  const { error } = await supabase
    .from('favoritos')
    .insert({ usuario_id: usuarioId, receta_id: recetaId })
  if (error) throw error
}

export async function quitarFavorito(usuarioId: string, recetaId: number): Promise<void> {
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('usuario_id', usuarioId)
    .eq('receta_id', recetaId)
  if (error) throw error
}