/**
 * RECETARIANDO — Importador de recetas desde Spoonacular a Supabase.
 *
 * Equivalente a scripts/importar_spoonacular.php del documento original,
 * pero en Node + Supabase.
 *
 * USO:
 *   1. Copia .env.example a .env y llena:
 *        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SPOONACULAR_API_KEY
 *   2. Ejecuta:  npm run importar
 *
 * OPCIONES (variables de entorno, opcionales):
 *   OFFSET  = desde que posicion empieza (default 0)
 *   NUMERO  = cuantas recetas traer por lote (default 20)
 *
 * Plan gratuito de Spoonacular: 150 peticiones/dia.
 * Con NUMERO=70 se consumen ~70 peticiones. Usa OFFSET para escalonar dias.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SPOONACULAR_API_KEY,
} = process.env

const OFFSET = Number(process.env.OFFSET ?? 0)
const NUMBER = Number(process.env.NUMERO ?? 20)

// =====================================================
// Validacion inicial
// =====================================================
function errorFatal(mensaje: string): never {
  console.error(`❌ ${mensaje}`)
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  errorFatal('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el archivo .env')
}

if (!SPOONACULAR_API_KEY || SPOONACULAR_API_KEY.length < 10) {
  errorFatal(
    'Configura tu SPOONACULAR_API_KEY en el archivo .env (consiguela en https://spoonacular.com/food-api)'
  )
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const BASE_URL = 'https://api.spoonacular.com'

interface ResultadoSpoonacular {
  results?: unknown[]
  totalResults?: number
  status?: string
  message?: string
}

interface DetalleReceta {
  id: number
  title?: string
  image?: string | null
  summary?: string | null
  instructions?: string | null
  analyzedInstructions?: { steps?: { number?: number; step?: string }[] }[]
  readyInMinutes?: number
  servings?: number
  spoonacularScore?: number
  vegan?: boolean
  vegetarian?: boolean
  glutenFree?: boolean
  dairyFree?: boolean
  veryHealthy?: boolean
  cheap?: boolean
  veryPopular?: boolean
  sourceUrl?: string | null
  extendedIngredients?: {
    id?: number | null
    name?: string
    amount?: number
    unit?: string | null
    image?: string | null
    measures?: {
      metric?: { amount?: number; unitShort?: string | null }
    }
  }[]
  nutrition?: {
    nutrients?: { name?: string; amount?: number }[]
  }
}

// =====================================================
// Auxiliares
// =====================================================
async function spoonacularGet(
  endpoint: string,
  params: Record<string, string | number | boolean>
): Promise<ResultadoSpoonacular | null> {
  const url = new URL(BASE_URL + endpoint)
  url.searchParams.set('apiKey', SPOONACULAR_API_KEY!)
  Object.entries(params).forEach(([clave, valor]) =>
    url.searchParams.set(clave, String(valor))
  )

  try {
    const respuesta = await fetch(url.toString())
    const datos = (await respuesta.json()) as ResultadoSpoonacular
    if (datos?.status === 'failure') {
      console.warn(`⚠️ Error API: ${datos.message ?? 'desconocido'}`)
      return null
    }
    return datos
  } catch (e) {
    console.warn(`⚠️ No se pudo contactar Spoonacular: ${e}`)
    return null
  }
}

function limpiar(texto: string | null | undefined): string | null {
  if (!texto) return null
  return texto
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&uuml;/g, 'ü')
    .trim()
}

function primerLetraMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// =====================================================
// Importacion por receta
// =====================================================
async function importarReceta(detalle: DetalleReceta): Promise<boolean> {
  const titulo = limpiar(detalle.title)
  if (!titulo) return false

  const pasosInstruccion: string[] = []
  if (Array.isArray(detalle.analyzedInstructions)) {
    for (const seccion of detalle.analyzedInstructions) {
      for (const paso of seccion.steps ?? []) {
        const texto = limpiar(paso.step)
        if (texto) pasosInstruccion.push(`${paso.number ?? ''}. ${texto}`)
      }
    }
  }
  const instrucciones =
    pasosInstruccion.length > 0
      ? pasosInstruccion.join('\n')
      : limpiar(detalle.instructions)

  const calificacion =
    typeof detalle.spoonacularScore === 'number'
      ? Math.round((detalle.spoonacularScore / 20) * 100) / 100
      : null

  const { error: errReceta } = await supabase
    .from('recetas')
    .upsert(
      {
        spoonacular_id: detalle.id,
        titulo,
        imagen_url: detalle.image ?? null,
        resumen: limpiar(detalle.summary),
        instrucciones,
        tiempo_preparacion: detalle.readyInMinutes ?? null,
        tiempo_coccion: null,
        porciones: detalle.servings ?? 1,
        calificacion,
        vegano: Boolean(detalle.vegan),
        vegetariano: Boolean(detalle.vegetarian),
        sin_gluten: Boolean(detalle.glutenFree),
        sin_lactosa: Boolean(detalle.dairyFree),
        saludable: Boolean(detalle.veryHealthy),
        barato: Boolean(detalle.cheap),
        muy_popular: Boolean(detalle.veryPopular),
        fuente_url: detalle.sourceUrl ?? null,
      },
      { onConflict: 'spoonacular_id' }
    )

  if (errReceta) {
    console.warn(`  ⚠️ No se pudo guardar la receta "${titulo}": ${errReceta.message}`)
    return false
  }

  const { data: filaReceta } = await supabase
    .from('recetas')
    .select('id')
    .eq('spoonacular_id', detalle.id)
    .single()

  if (!filaReceta) return false
  const recetaId = filaReceta.id as number

  // Limpiar ingredientes previos y volver a insertar
  await supabase.from('receta_ingredientes').delete().eq('receta_id', recetaId)

  for (const ingApi of detalle.extendedIngredients ?? []) {
    const nombre = ingApi.name ? primerLetraMayuscula(ingApi.name.trim().toLowerCase()) : null
    if (!nombre) continue

    await supabase.from('ingredientes').upsert(
      {
        spoonacular_id: ingApi.id ?? null,
        nombre,
        imagen_url: ingApi.image
          ? `https://img.spoonacular.com/ingredients_100x100/${ingApi.image}`
          : null,
      },
      { onConflict: 'nombre' }
    )

    const { data: filaIng } = await supabase
      .from('ingredientes')
      .select('id')
      .eq('nombre', nombre)
      .single()

    if (!filaIng) continue

    const cantidad =
      ingApi.measures?.metric?.amount ?? ingApi.amount ?? null
    const unidad =
      ingApi.measures?.metric?.unitShort ?? ingApi.unit ?? null

    await supabase.from('receta_ingredientes').upsert(
      {
        receta_id: recetaId,
        ingrediente_id: filaIng.id as number,
        cantidad: cantidad != null ? String(cantidad) : null,
        unidad: unidad ? String(unidad) : null,
      },
      { onConflict: 'receta_id,ingrediente_id' }
    )
  }

  // Nutricion
  const nutrientes = detalle.nutrition?.nutrients ?? []
  const obtenerNutriente = (nombre: string): number | null => {
    const nutriente = nutrientes.find(
      (n) => n.name?.toLowerCase() === nombre.toLowerCase()
    )
    return typeof nutriente?.amount === 'number' ? nutriente.amount : null
  }

  await supabase.from('nutricion').upsert(
    {
      receta_id: recetaId,
      calorias: obtenerNutriente('Calories'),
      proteinas: obtenerNutriente('Protein'),
      carbohidratos: obtenerNutriente('Carbohydrates'),
      grasa: obtenerNutriente('Fat'),
      fibra: obtenerNutriente('Fiber'),
    },
    { onConflict: 'receta_id' }
  )

  return true
}

// =====================================================
// Proceso principal
// =====================================================
async function main() {
  console.log('🔍 Buscando recetas en Spoonacular…')

  const resultado = await spoonacularGet('/recipes/complexSearch', {
    number: NUMBER,
    offset: OFFSET,
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    instructionsRequired: 'true',
    fillIngredients: 'true',
  })

  const resultados = (resultado?.results ?? []) as DetalleReceta[]

  if (!resultado || resultados.length === 0) {
    console.error(
      '❌ No se obtuvieron recetas. Verifica tu API Key, el limite diario (150/dia) o los filtros.'
    )
    process.exit(1)
  }

  console.log(
    `✅ Se encontraron ${resultado.totalResults ?? resultados.length} recetas disponibles.`
  )
  console.log(`📥 Procesando ${resultados.length} recetas…`)

  let insertadas = 0

  for (let idx = 0; idx < resultados.length; idx++) {
    const recetaApi = resultados[idx]
    const numero = idx + 1
    const tituloCorto = (recetaApi.title ?? '?').slice(0, 50)
    console.log(`[${numero}] Procesando: ${tituloCorto}…`)

    let detalle: DetalleReceta | null = recetaApi

    if (
      !Array.isArray(recetaApi.analyzedInstructions) ||
      recetaApi.analyzedInstructions.length === 0
    ) {
      const info = await spoonacularGet(
        `/recipes/${recetaApi.id}/information`,
        { includeNutrition: 'true' }
      )
      if (!info) continue
      detalle = info as unknown as DetalleReceta
    }

    if (!detalle) continue

    if (await importarReceta(detalle)) insertadas++
  }

  const { count: totalIngredientes } = await supabase
    .from('ingredientes')
    .select('*', { count: 'exact', head: true })
  const { count: totalRecetas } = await supabase
    .from('recetas')
    .select('*', { count: 'exact', head: true })

  console.log('\n✅ ¡Importación completada!')
  console.log(`   🍽️ Recetas procesadas: ${insertadas}`)
  console.log(`   🥕 Ingredientes en BD: ${totalIngredientes ?? 0}`)
  console.log(`   🍽️ Total de recetas en el sistema: ${totalRecetas ?? 0}`)
}

main().catch((e) => {
  console.error('❌ Error inesperado:', e)
  process.exit(1)
})