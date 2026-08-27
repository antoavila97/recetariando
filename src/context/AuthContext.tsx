import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface ResultadoAuth {
  error: string | null
  confirmarCorreo?: boolean
}

interface AuthContextType {
  usuario: User | null
  sesion: Session | null
  cargando: boolean
  iniciarSesion: (email: string, password: string) => Promise<ResultadoAuth>
  registrar: (email: string, password: string, nombre: string) => Promise<ResultadoAuth>
  cerrarSesion: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [sesion, setSesion] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      setUsuario(data.session?.user ?? null)
      setCargando(false)
    })

    const { data: suscripcion } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        setSesion(nuevaSesion)
        setUsuario(nuevaSesion?.user ?? null)
      }
    )

    return () => suscripcion.subscription.unsubscribe()
  }, [])

  async function iniciarSesion(email: string, password: string): Promise<ResultadoAuth> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function registrar(
    email: string,
    password: string,
    nombre: string
  ): Promise<ResultadoAuth> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    const requiereConfirmacion = !data.session && !error
    return { error: error?.message ?? null, confirmarCorreo: requiereConfirmacion }
  }

  async function cerrarSesion(): Promise<void> {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ usuario, sesion, cargando, iniciarSesion, registrar, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return contexto
}