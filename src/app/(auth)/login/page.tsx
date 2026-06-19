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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/live')
    router.refresh()
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
            <CardTitle className="text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-zinc-400">
              Ingresa tus datos para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
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
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="text-center text-sm text-zinc-500 mt-4">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-red-400 hover:text-red-300">
                Regístrate
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
