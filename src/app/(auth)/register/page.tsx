'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tv } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <Card className="bg-zinc-900 border-zinc-800 w-full max-w-sm text-center p-6">
          <Tv className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-white text-xl font-semibold mb-2">¡Cuenta creada!</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Revisa tu correo y confirma tu cuenta para continuar.
          </p>
          <Button onClick={() => router.push('/login')} className="bg-red-600 hover:bg-red-700 w-full">
            Ir al inicio de sesión
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Tv className="h-8 w-8 text-red-500" />
            <span className="text-2xl font-bold text-white">Papayo TV</span>
          </div>
          <p className="text-sm text-zinc-400">Tu plataforma de entretenimiento</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Crear cuenta</CardTitle>
            <CardDescription className="text-zinc-400">
              Regístrate gratis para acceder a todo el contenido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-300">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tuusuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-950/40 rounded px-3 py-2">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <p className="text-center text-sm text-zinc-500 mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-red-400 hover:text-red-300">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
