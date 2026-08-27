# 🍳 RECETARIANDO — Catálogo y buscador de recetas

Versión web moderna del proyecto "Sistema RECETARIANDO" (originalmente PHP + MySQL),
ahora construido con **React + Vite + TypeScript**, base de datos en **Supabase (PostgreSQL)**
y desplegado en **Netlify**.

## ✨ Funcionalidades

- Catálogo de recetas con tarjetas (imagen, calificación, tiempo, porciones).
- Buscador con filtros avanzados: texto, ingredientes (debe contener TODOS), dietas
  (vegano, vegetariano, sin gluten, sin lactosa), tiempo máximo y calorías máximas.
- Detalle de receta: ingredientes con cantidad, preparación paso a paso y tablas de nutrición.
- Registro / inicio de sesión con **Supabase Auth** (correo y contraseña).
- Favoritos por usuario (protegidos por Row Level Security).
- Script de importación desde **Spoonacular API** (equivalente al `.php` original).

## 📁 Estructura

```
├── supabase/
│   ├── schema.sql          → tablas, RLS y función buscar_recetas (pégalo en SQL Editor)
│   └── seed_demo.sql       → 18 recetas de ejemplo (pégalo después de schema.sql)
├── scripts/
│   └── importar_spoonacular.ts → importador desde Spoonacular a Supabase
├── src/
│   ├── lib/                → cliente Supabase, tipos y llamadas a la API
│   ├── context/            → AuthContext (sesión de usuario)
│   ├── componentes/        → Navbar, TarjetaReceta, Spinner, RequiereAuth
│   ├── paginas/            → Inicio, Catalogo, DetalleReceta, Favoritos, Acceso
│   └── estilos/            → global.css
├── netlify.toml            → configuración de despliegue
└── .env.example            → variables de entorno necesarias
```

## 🚀 Puesta en marcha

### 1. Crear la base de datos en Supabase

1. Entra a [Supabase](https://supabase.com) → crea (o usa) un proyecto.
2. Ve a **SQL Editor → New query**.
3. Pega el contenido de `supabase/schema.sql` y ejecuta.
4. Pega el contenido de `supabase/seed_demo.sql` y ejecuta (inserta las recetas demo).

### 2. Configurar la autenticación

1. En Supabase → **Authentication → Providers**: deja activo **Email**.
2. En **Authentication → URL Configuration** agrega:
   - Site URL: tu URL de Netlify (ej. `https://miproyecto.netlify.app`)
   - Redirect URLs: `https://miproyecto.netlify.app/**`

### 3. Variables de entorno

Copia `.env.example` a `.env` y llena:

| Variable | Dónde conseguirla |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (solo para el importador) |
| `SPOONACULAR_API_KEY` | [spoonacular.com/food-api](https://spoonacular.com/food-api) → Dashboard |

> ⚠️ El archivo `.env` NO se sube a git. Solo `VITE_*` llega al navegador; las llaves
> secretas (`SUPABASE_SERVICE_ROLE_KEY`, `SPOONACULAR_API_KEY`) se quedan en tu máquina.

### 4. Desarrollo local

```bash
npm install
npm run dev       # abre http://localhost:5173
```

### 5. Importar recetas reales de Spoonacular

```bash
npm run importar          # primer lote (recetas 0-19)
npm run importar          # antes, cambia OFFSET en .env para el siguiente lote
```

El plan gratuito permite **150 peticiones al día**. Con `NUMERO=20` consumes ~20.
Para días siguientes sube `OFFSET` en 20 (20, 40, 60…).

## ☁️ Despliegue en Netlify

1. Sube este proyecto a un repositorio en GitHub (es el que ya tienes enlazado con Supabase).
2. En [Netlify](https://app.netlify.com) → **Add new site → Import an existing project** → tu repo.
3. Build command: `npm run build` · Publish directory: `dist`
   (ya viene preconfigurado en `netlify.toml`).
4. En **Site settings → Environment variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Luego añade la URL de Netlify en Supabase (paso 2).

## 🛢️ La búsqueda (función `buscar_recetas`)

Reemplaza a `api/buscar.php` del diseño original. Es una función SQL en Supabase que hace
búsqueda por texto con ILIKE, filtra dietas, tiempo, calorías e ingredientes, y devuelve
paginado `{ total, pagina, limite, recetas }`. El frontend la llama con
`supabase.rpc('buscar_recetas', {...})`.

## 📜 Créditos

- Recetas: [Spoonacular API](https://spoonacular.com/food-api)
- Base de datos y autenticación: [Supabase](https://supabase.com)
- Despliegue: [Netlify](https://www.netlify.com)