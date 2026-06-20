'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Tv, Film, Clapperboard, Trophy, Star, Search,
  Heart, Settings, LayoutDashboard, LogOut, RefreshCw, Globe, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLang } from '@/i18n/LangContext'
import { type Lang } from '@/i18n/translations'

interface SidebarProps { isAdmin?: boolean }

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [showLangs, setShowLangs] = useState(false)
  const { t, lang, setLang, languages } = useLang()

  const navItems = [
    { href: '/live',    label: t.live,    icon: Tv },
    { href: '/movies',  label: t.movies,  icon: Film },
    { href: '/series',  label: t.series,  icon: Clapperboard },
    { href: '/sports',  label: t.sports,  icon: Trophy },
    { href: '/docs',    label: t.documentary, icon: BookOpen },
    { href: '/events',  label: t.events,  icon: Star },
    { href: '/search',  label: t.search,  icon: Search },
    { href: '/favorites', label: 'Favoritos', icon: Heart },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleQuickSync() {
    setSyncing(true)
    setSyncMsg(t.syncing)
    try {
      const res = await fetch('/api/sync-all', { method: 'POST' })
      const data = await res.json()
      setSyncMsg(`✅ ${data.channels || 0} ${t.channels}`)
      setTimeout(() => setSyncMsg(''), 4000)
    } catch {
      setSyncMsg('❌ Error')
      setTimeout(() => setSyncMsg(''), 3000)
    } finally {
      setSyncing(false)
    }
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
              {t.adminPanel}
            </Link>
            <button
              onClick={handleQuickSync}
              disabled={syncing}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4 shrink-0', syncing && 'animate-spin')} />
              {syncMsg || t.updateAll}
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800 space-y-1">
        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangs(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Globe className="h-4 w-4 shrink-0" />
            {languages[lang]}
          </button>
          {showLangs && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
              {(Object.entries(languages) as [Lang, string][]).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setShowLangs(false) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    lang === code ? 'text-red-400 bg-zinc-700' : 'text-zinc-300 hover:bg-zinc-700'
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {t.country}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {lang === 'es' ? 'Cerrar sesión' : lang === 'en' ? 'Sign out' : lang === 'pt' ? 'Sair' : lang === 'de' ? 'Abmelden' : lang === 'fr' ? 'Déconnexion' : lang === 'it' ? 'Esci' : lang === 'zh' ? '退出' : lang === 'ja' ? 'ログアウト' : lang === 'ko' ? '로그아웃' : 'تسجيل خروج'}
        </button>
      </div>
    </aside>
  )
}
