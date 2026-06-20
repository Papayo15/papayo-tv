'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tv, RefreshCw, Search, Eye, EyeOff, Trash2, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

export default function AdminChannelsPage() {
  const supabase = createClient()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingEpg, setSyncingEpg] = useState(false)
  const [search, setSearch] = useState('')
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    loadChannels()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadChannels() {
    setLoading(true)
    const { data } = await supabase.from('channels').select('*').order('name').limit(500)
    setChannels(data || [])
    setLoading(false)
  }

  async function triggerSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      setSyncResult('⏳ Sincronizando todos los países (puede tardar 2-3 min)...')
      const res = await fetch('/api/sync-all', { method: 'POST' })
      const data = await res.json()
      setSyncResult(`✅ Listo — ${data.channels || 0} canales de ${35}+ países`)
      await loadChannels()
    } catch (err) {
      setSyncResult(`❌ Error: ${String(err)}`)
    } finally {
      setSyncing(false)
    }
  }

  async function triggerEpgSync() {
    setSyncingEpg(true)
    setSyncResult('⏳ Sincronizando guía de programación (EPG)...')
    try {
      const res = await fetch('/api/sync-epg', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data.inserted ? `✅ EPG sincronizado — ${data.inserted} programas` : `⚠️ ${data.message || 'Sin datos'}`)
    } catch (err) {
      setSyncResult(`❌ Error EPG: ${String(err)}`)
    } finally {
      setSyncingEpg(false)
    }
  }

  async function toggleChannel(id: string, current: boolean) {
    await supabase.from('channels').update({ is_active: !current }).eq('id', id)
    setChannels(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function deleteChannel(id: string) {
    if (!confirm('¿Eliminar este canal?')) return
    await supabase.from('channels').delete().eq('id', id)
    setChannels(prev => prev.filter(c => c.id !== id))
  }

  const filtered = channels.filter(c =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Tv className="h-5 w-5 text-blue-400" />
          Canales IPTV ({channels.length})
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={triggerSync}
            disabled={syncing || syncingEpg}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar canales'}
          </Button>
          <Button
            onClick={triggerEpgSync}
            disabled={syncing || syncingEpg}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
          >
            <CalendarDays className={`h-4 w-4 ${syncingEpg ? 'animate-spin' : ''}`} />
            {syncingEpg ? 'Cargando...' : 'Sync EPG'}
          </Button>
        </div>
      </div>

      {syncResult && (
        <div className={`rounded-lg px-4 py-3 text-sm ${syncResult.startsWith('✅') ? 'bg-green-950/40 text-green-400' : 'bg-red-950/40 text-red-400'}`}>
          {syncResult}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar canal..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(channel => (
            <div key={channel.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="w-8 h-8 relative shrink-0">
                {channel.logo ? (
                  <Image src={channel.logo} alt={channel.name} fill className="object-contain" sizes="32px" />
                ) : (
                  <Tv className="h-5 w-5 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 px-1 py-0">
                    {channel.country.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500 px-1 py-0">
                    {channel.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleChannel(channel.id, channel.is_active)}
                  className={channel.is_active ? 'text-green-400 hover:text-green-300' : 'text-zinc-600 hover:text-zinc-400'}
                >
                  {channel.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteChannel(channel.id)}
                  className="text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
