import { Route, Routes } from 'react-router-dom'
import Navbar from './componentes/Navbar'
import RequiereAuth from './componentes/RequiereAuth'
import Inicio from './paginas/Inicio'
import Catalogo from './paginas/Catalogo'
import DetalleReceta from './paginas/DetalleReceta'
import Favoritos from './paginas/Favoritos'
import Acceso from './paginas/Acceso'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          🍳 <strong>RECETARIANDO</strong> — Catálogo y buscador de recetas
        </p>
        <p className="footer-creditos">
          Recetas proporcionadas por{' '}
          <a href="https://spoonacular.com/food-api" target="_blank" rel="noreferrer">
            Spoonacular API
          </a>{' '}
          · Desarrollado con React + Supabase
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/receta/:id" element={<DetalleReceta />} />
        <Route
          path="/favoritos"
          element={
            <RequiereAuth>
              <Favoritos />
            </RequiereAuth>
          }
        />
        <Route path="/acceso" element={<Acceso />} />
        <Route path="*" element={<Catalogo />} />
      </Routes>
      <Footer />
    </>
  )
}