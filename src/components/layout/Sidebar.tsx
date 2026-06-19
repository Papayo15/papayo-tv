'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Tv,
  Film,
  Clapperboard,
  Trophy,
  Search,
  Heart,
  Settings,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/live', label: 'TV en Vivo', icon: Tv },
  { href: '/movies', label: 'Películas', icon: Film },
  { href: '/series', label: 'Series', icon: Clapperboard },
  { href: '/sports', label: 'Deportes', icon: Trophy },
  { href: '/search', label: 'Buscar', icon: Search },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
        <Tv className="h-6 w-6 text-red-500 shrink-0" />
        <span className="font-bold text-white text-lg leading-tight">Papayo TV</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-red-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs text-zinc-600 uppercase tracking-wider font-semibold">Admin</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Panel Admin
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configuración
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
