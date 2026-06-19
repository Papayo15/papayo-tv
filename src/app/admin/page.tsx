import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Tv, Film, Users, Trophy, RefreshCw } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalChannels },
    { count: activeChannels },
    { count: vodCount },
    { count: userCount },
    { count: sportsCount },
  ] = await Promise.all([
    supabase.from('channels').select('*', { count: 'exact', head: true }),
    supabase.from('channels').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vod_sources').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('sports_events').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Canales totales', value: totalChannels || 0, sub: `${activeChannels || 0} activos`, icon: Tv, href: '/admin/channels', color: 'text-blue-400' },
    { label: 'Fuentes VOD', value: vodCount || 0, sub: 'Películas y series con stream', icon: Film, href: '/admin/vod', color: 'text-yellow-400' },
    { label: 'Eventos deportivos', value: sportsCount || 0, sub: 'Auto-actualizados cada 30min', icon: Trophy, href: '/admin/channels', color: 'text-green-400' },
    { label: 'Usuarios', value: userCount || 0, sub: 'Registrados', icon: Users, href: '/admin/users', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-white font-bold text-xl flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-red-500" />
        Panel de Administración
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, href, color }) => (
          <Link
            key={href + label}
            href={href}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
          >
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-white font-bold text-2xl">{value}</p>
            <p className="text-zinc-300 text-sm font-medium">{label}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-semibold mb-3">Acciones rápidas</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/admin/channels"
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
          >
            <RefreshCw className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-white font-medium text-sm">Sincronizar Canales</p>
              <p className="text-zinc-500 text-xs">Actualizar lista M3U desde iptv-org</p>
            </div>
          </Link>
          <Link
            href="/admin/vod"
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
          >
            <Film className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-white font-medium text-sm">Agregar Video VOD</p>
              <p className="text-zinc-500 text-xs">Asociar URL de stream a película/serie</p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
          >
            <Users className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-white font-medium text-sm">Gestionar Usuarios</p>
              <p className="text-zinc-500 text-xs">Ver y promover administradores</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400 space-y-2">
        <p className="text-zinc-300 font-medium">Sincronización automática</p>
        <ul className="space-y-1 text-xs">
          <li>🔄 <strong className="text-white">Canales IPTV</strong> — se sincronizan 1x al día a las 4am UTC</li>
          <li>⚽ <strong className="text-white">Eventos deportivos</strong> — se sincronizan cada 30 minutos</li>
          <li>🗑️ <strong className="text-white">Limpieza</strong> — eventos deportivos pasados se eliminan automáticamente</li>
          <li>🎬 <strong className="text-white">Películas/Series</strong> — TMDB se actualiza en tiempo real (cache de 1-24h)</li>
        </ul>
      </div>
    </div>
  )
}
