'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tv, RefreshCw, Search, Eye, EyeOff, Trash2, CalendarDays,
  Rss, CheckCircle2, XCircle, Clock, Plus, Globe,
} from 'lucide-react'
import Image from 'next/image'
import type { Channel } from '@/types/channel'

const SERVICE_COLOR: Record<string, string> = {
  pluto: 'bg-yellow-500/20 text-yellow-400 border-yellow-700/50',
  samsung: 'bg-blue-500/20 text-blue-400 border-blue-700/50',
  plex: 'bg-orange-500/20 text-orange-400 border-orange-700/50',
  'iptv-org': 'bg-green-500/20 text-green-400 border-green-700/50',
  custom: 'bg-purple-500/20 text-purple-400 border-purple-700/50',
}

interface PlaylistSource {
  id: string
  name: string
  url: string
  country: string
  service: string
  is_active: boolean
  last_synced_at: string | null
  channel_count: number
}

export default function AdminChannelsPage() {
  const supabase = createClient()
  const [channels, setChannels] = useState<Channel[]>([])
  const [sources, setSources] = useState<PlaylistSource[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingPlaylists, setSyncingPlaylists] = useState(false)
  const [syncingEpg, setSyncingEpg] = useState(false)
  const [search, setSearch] = useState('')
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [tab, setTab] = useState<'channels' | 'sources'>('channels')
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [addingSource, setAddingSource] = useState(false)

  useEffect(() => {
    loadChannels()
    loadSources()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadChannels() {
    setLoading(true)
    const [{ count }, { data }] = await Promise.all([
      supabase.from('channels').select('*', { count: 'exact', head: true }),
      supabase.from('channels').select('*').order('name').limit(500),
    ])
    setTotalCount(count || 0)
    setChannels(data || [])
    setLoading(false)
  }

  async function loadSources() {
    const res = await fetch('/api/playlist-sources')
    const data = await res.json()
    setSources(Array.isArray(data) ? data : [])
  }

  async function triggerSync() {
    const COUNTRIES = [
      'mx','ar','co','cl','br','pe','ve','ec',
      'es','pt','gb','it','fr','de','nl','be',
      'us','ca','au','int',
      'do','cr','uy','bo','gt','pa','hn','sv','pr',
      'at','se','no','dk','tr',
    ]
    setSyncing(true)
    setSyncResult(null)
    let total = 0
    for (let i = 0; i < COUNTRIES.length; i++) {
      const country = COUNTRIES[i]
      setSyncResult(`⏳ [${i + 1}/${COUNTRIES.length}] ${country.toUpperCase()} — ${total} canales hasta ahora`)
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country }),
        })
        const data = await res.json()
        if (data.error || data.dbError) {
          setSyncResult(`⚠️ ${country.toUpperCase()}: ${data.error || data.dbError}`)
          await new Promise(r => setTimeout(r, 2000))
        }
        total += data.inserted || 0
      } catch (e) {
        setSyncResult(`❌ ${country.toUpperCase()}: ${String(e)}`)
        await new Promise(r => setTimeout(r, 1500))
      }
    }
    setSyncResult(`✅ Países listos (${total}). Sincronizando Pluto TV, Samsung, Plex...`)
    const pr = await fetch('/api/sync-playlists', { method: 'POST' }).then(r => r.json()).catch(() => ({}))
    total += pr.total_channels || 0
    setSyncResult(`✅ Playlists: +${pr.total_channels || 0} canales. Sincronizando deportes...`)
    const sr = await fetch('/api/sync-sports', { method: 'POST' }).then(r => r.json()).catch(() => ({}))
    total += sr.inserted || 0
    setSyncResult(`✅ Deportes: +${sr.inserted || 0}. Recategorizando...`)
    await fetch('/api/recategorize', { method: 'POST' }).catch(() => null)
    setSyncResult(`✅ Detectando eventos deportivos...`)
    await fetch('/api/sync-events', { method: 'POST' }).catch(() => null)
    setSyncResult(`✅ ¡Sincronización completa! ${total} canales totales`)
    setSyncing(false)
    await Promise.all([loadChannels(), loadSources()])
  }

  async function triggerPlaylistSync() {
    setSyncingPlaylists(true)
    setSyncResult('⏳ Sincronizando Pluto TV, Samsung TV Plus, Plex y fuentes personalizadas...')
    try {
      const res = await fetch('/api/sync-playlists', { method: 'POST' })
      const data = await res.json()
      setSyncResult(`✅ Playlists: ${data.total_channels || 0} canales de ${data.synced || 0} fuentes${data.errors?.length ? ` (${data.errors.length} errores)` : ''}`)
    } catch (err) {
      setSyncResult(`❌ Error: ${String(err)}`)
    } finally {
      setSyncingPlaylists(false)
      await Promise.all([loadChannels(), loadSources()])
    }
  }

  async function triggerEpgSync() {
    setSyncingEpg(true)
    setSyncResult('⏳ Sincronizando guía EPG...')
    try {
      const res = await fetch('/api/sync-epg', { method: 'POST' })
      const data = await res.json()
      setSyncResult(data.inserted ? `✅ EPG: ${data.inserted} programas` : `⚠️ ${data.message || 'Sin datos'}`)
    } catch (err) {
      setSyncResult(`❌ Error EPG: ${String(err)}`)
    } finally {
      setSyncingEpg(false)
    }
  }

  async function toggleSource(id: string, current: boolean) {
    await fetch('/api/playlist-sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setSources(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  async function deleteSource(id: string) {
    if (!confirm('¿Eliminar esta fuente?')) return
    await fetch('/api/playlist-sources', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSources(prev => prev.filter(s => s.id !== id))
  }

  async function addSource() {
    if (!newUrl.trim()) return
    setAddingSource(true)
    const res = await fetch('/api/playlist-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() || newUrl.trim(), url: newUrl.trim() }),
    })
    if (res.ok) {
      setNewUrl('')
      setNewName('')
      await loadSources()
    }
    setAddingSource(false)
  }

  async function toggleChannel(id: string, current: boolean) {
    await supabase.from('channels').update({ is_active: !current }).eq('id', id)
    setChannels(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function deleteChannel(id: string) {
    if (!confirm('¿Eliminar este canal?')) return
    await supabase.from('channels').delete().eq('id', id)
    setChannels(prev => prev.filter(c => c.id !== id))
    setTotalCount(t => t - 1)
  }

  const filtered = channels.filter(c =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  const activeSourceCount = sources.filter(s => s.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Tv className="h-5 w-5 text-blue-400" />
          Canales IPTV
          <span className="text-zinc-500 text-sm font-normal ml-1">({totalCount.toLocaleString()} total)</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={triggerPlaylistSync}
            disabled={syncing || syncingPlaylists || syncingEpg}
            variant="outline"
            className="border-yellow-700/50 text-yellow-400 hover:bg-yellow-950/30 gap-2"
          >
            <Rss className={`h-4 w-4 ${syncingPlaylists ? 'animate-spin' : ''}`} />
            {syncingPlaylists ? 'Sync...' : `Playlists (${activeSourceCount})`}
          </Button>
          <Button
            onClick={triggerSync}
            disabled={syncing || syncingPlaylists || syncingEpg}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sync completo'}
          </Button>
          <Button
            onClick={triggerEpgSync}
            disabled={syncing || syncingPlaylists || syncingEpg}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
          >
            <CalendarDays className={`h-4 w-4 ${syncingEpg ? 'animate-spin' : ''}`} />
            {syncingEpg ? 'EPG...' : 'Sync EPG'}
          </Button>
        </div>
      </div>

      {/* Status */}
      {syncResult && (
        <div className={`rounded-lg px-4 py-3 text-sm font-mono ${
          syncResult.startsWith('✅') ? 'bg-green-950/40 text-green-400 border border-green-900/50'
          : syncResult.startsWith('❌') ? 'bg-red-950/40 text-red-400 border border-red-900/50'
          : 'bg-blue-950/40 text-blue-400 border border-blue-900/50'
        }`}>
          {syncResult}
        </div>
      )}

      {/* Cron schedule info */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <p className="text-zinc-400 text-xs font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />CRON DIARIO AUTOMÁTICO (UTC)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
          {[
            { time: '04:00', label: 'Países (35)', color: 'text-blue-400' },
            { time: '04:30', label: `Playlists (${activeSourceCount})`, color: 'text-yellow-400' },
            { time: '05:00', label: 'Deportes API', color: 'text-orange-400' },
            { time: '05:30', label: 'Recategorizar', color: 'text-green-400' },
            { time: '06:00', label: 'Eventos', color: 'text-purple-400' },
          ].map(c => (
            <div key={c.time} className="bg-zinc-800 rounded-lg p-2 text-center">
              <p className={`font-bold ${c.color}`}>{c.time}</p>
              <p className="text-zinc-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(['channels', 'sources'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'channels' ? `Canales (${filtered.length} / ${totalCount})` : `Fuentes M3U (${sources.length})`}
          </button>
        ))}
      </div>

      {/* ── Channels tab ── */}
      {tab === 'channels' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar en los primeros 500 canales..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-white"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(channel => (
                <div key={channel.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 relative shrink-0 flex items-center justify-center">
                    {channel.logo ? (
                      <Image src={channel.logo} alt={channel.name} fill className="object-contain" sizes="32px" />
                    ) : (
                      <Tv className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{channel.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                      size="sm" variant="ghost"
                      onClick={() => toggleChannel(channel.id, channel.is_active)}
                      className={channel.is_active ? 'text-green-400 hover:text-green-300' : 'text-zinc-600 hover:text-zinc-400'}
                    >
                      {channel.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm" variant="ghost"
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
        </>
      )}

      {/* ── Sources tab ── */}
      {tab === 'sources' && (
        <div className="space-y-4">
          {/* Add new source */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <p className="text-white text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-400" />
              Agregar fuente M3U personalizada
            </p>
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Nombre (opcional)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white w-44"
              />
              <Input
                placeholder="https://... (URL de lista M3U)"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white flex-1 min-w-64"
              />
              <Button
                onClick={addSource}
                disabled={addingSource || !newUrl.trim()}
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                {addingSource ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Agregar'}
              </Button>
            </div>
            <p className="text-zinc-600 text-xs">Las fuentes agregadas se sincronizan automáticamente en el cron diario</p>
          </div>

          {/* Sources list grouped by service */}
          {(['pluto', 'samsung', 'plex', 'custom'] as const).map(service => {
            const group = sources.filter(s => s.service === service)
            if (!group.length) return null
            const labels: Record<string, string> = {
              pluto: '📺 Pluto TV', samsung: '📱 Samsung TV Plus',
              plex: '🎬 Plex TV', custom: '🔧 Fuentes personalizadas',
            }
            return (
              <div key={service}>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{labels[service]}</p>
                <div className="space-y-1.5">
                  {group.map(source => (
                    <div
                      key={source.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                        source.is_active ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-60'
                      }`}
                    >
                      <Globe className="h-4 w-4 text-zinc-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium">{source.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SERVICE_COLOR[source.service] || SERVICE_COLOR.custom}`}>
                            {source.service}
                          </span>
                          <span className="text-zinc-600 text-[10px]">{source.country.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          {source.last_synced_at ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="text-zinc-500 text-[10px]">
                                Último sync: {new Date(source.last_synced_at).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {source.channel_count > 0 && (
                                <span className="text-green-500 text-[10px] font-medium">{source.channel_count} canales</span>
                              )}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 text-zinc-600 shrink-0" />
                              <span className="text-zinc-600 text-[10px]">Sin sincronizar</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => toggleSource(source.id, source.is_active)}
                          className={source.is_active ? 'text-green-400 hover:text-green-300' : 'text-zinc-600 hover:text-zinc-400'}
                        >
                          {source.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => deleteSource(source.id)}
                          className="text-zinc-600 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
