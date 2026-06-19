'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, Tv, Menu, X, Film, Clapperboard, Trophy, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const mobileNav = [
  { href: '/live', label: 'TV en Vivo', icon: Tv },
  { href: '/movies', label: 'Películas', icon: Film },
  { href: '/series', label: 'Series', icon: Clapperboard },
  { href: '/sports', label: 'Deportes', icon: Trophy },
  { href: '/search', label: 'Buscar', icon: Search },
  { href: '/favorites', label: 'Favoritos', icon: Heart },
]

interface HeaderProps {
  username?: string
  avatarUrl?: string
}

export function Header({ username, avatarUrl }: HeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const initials = username?.slice(0, 2).toUpperCase() || 'TV'

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 py-3 md:pl-60">
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="md:hidden text-zinc-400 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-zinc-900 border-zinc-800 w-60 p-0">
          <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
            <Tv className="h-6 w-6 text-red-500" />
            <span className="font-bold text-white text-lg">Papayo TV</span>
          </div>
          <nav className="p-3 space-y-1">
            {mobileNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Search shortcut */}
      <Link
        href="/search"
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar contenido...</span>
      </Link>

      <div className="flex items-center gap-3 ml-auto">
        <button className="text-zinc-400 hover:text-white transition-colors relative">
          <Bell className="h-5 w-5" />
        </button>
        <Link href="/settings">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-red-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
