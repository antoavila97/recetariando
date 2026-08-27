import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function RequiereAuth({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()

  if (cargando) return <Spinner />
  if (!usuario) return <Navigate to="/acceso" replace />

  return <>{children}</>
}