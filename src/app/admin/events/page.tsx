'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface EventChannel { id: string; name: string; url: string; logo: string; sort_order: number }
interface FeaturedEvent {
  id: string; name: string; slug: string; description: string; banner_url: string
  color: string; is_active: boolean; starts_at: string; ends_at: string
  event_channels: EventChannel[]
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<FeaturedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', banner_url: '', color: '#dc2626', starts_at: '', ends_at: '' })
  const [newChannel, setNewChannel] = useState<Record<string, { name: string; url: string; logo: string }>>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const res = await fetch('/api/admin/events')
    const data = await res.json()
    setEvents(data || [])
    setLoading(false)
  }

  function slugify(text: string) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function createEvent() {
    setSaving(true)
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setMsg('✅ Evento creado')
      setCreating(false)
      setForm({ name: '', slug: '', description: '', banner_url: '', color: '#dc2626', starts_at: '', ends_at: '' })
      await loadEvents()
    } else setMsg('❌ Error al crear')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function toggleEvent(id: string, current: boolean) {
    await fetch(`/api/admin/events/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !current }) })
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e))
  }

  async function deleteEvent(id: string) {
    if (!confirm('¿Eliminar este evento y todos sus canales?')) return
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  async function addChannel(eventId: string) {
    const ch = newChannel[eventId]
    if (!ch?.name || !ch?.url) return
    setSaving(true)
    const res = await fetch(`/api/admin/events/${eventId}/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ch),
    })
    if (res.ok) {
      setNewChannel(prev => ({ ...prev, [eventId]: { name: '', url: '', logo: '' } }))
      await loadEvents()
    }
    setSaving(false)
  }

  async function removeChannel(eventId: string, channelId: string) {
    await fetch(`/api/admin/events/${eventId}/channels/${channelId}`, { method: 'DELETE' })
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, event_channels: e.event_channels.filter(c => c.id !== channelId) }
      : e
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white font-bold text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Eventos Especiales
        </h1>
        <Button onClick={() => setCreating(v => !v)} className="bg-red-600 hover:bg-red-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {msg && <div className="rounded-lg px-4 py-3 text-sm bg-zinc-800 text-zinc-300">{msg}</div>}

      {/* Create form */}
      {creating && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Crear evento</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs">Nombre *</label>
              <Input
                placeholder="Mundial 2026"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs">Slug (URL) *</label>
              <Input
                placeholder="mundial-2026"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white font-mono text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 text-xs">Descripción</label>
              <Input
                placeholder="Todos los partidos del Mundial en un solo lugar"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-zinc-400 text-xs">URL del banner (imagen)</label>
              <Input
                placeholder="https://..."
                value={form.banner_url}
                onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs">Fecha inicio</label>
              <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 text-xs">Fecha fin</label>
              <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1 flex items-end gap-3">
              <div className="flex-1">
                <label className="text-zinc-400 text-xs">Color del evento</label>
                <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="bg-zinc-800 border-zinc-700 h-10 cursor-pointer" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={createEvent} disabled={!form.name || !form.slug || saving} className="bg-red-600 hover:bg-red-700 text-white">
              Crear evento
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)} className="text-zinc-400">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading ? (
        <p className="text-zinc-500">Cargando...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No hay eventos aún — crea el primero</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Event header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ background: event.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{event.name}</p>
                  <p className="text-zinc-500 text-xs">{event.event_channels?.length || 0} canales · /events/{event.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/events/${event.slug}`} target="_blank">
                    <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-zinc-300">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => toggleEvent(event.id, event.is_active)}
                    className={event.is_active ? 'text-green-400' : 'text-zinc-600'}>
                    {event.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteEvent(event.id)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === event.id ? null : event.id)} className="text-zinc-400">
                    {expanded === event.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Expanded: channels */}
              {expanded === event.id && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  {/* Existing channels */}
                  {(event.event_channels || []).map(ch => (
                    <div key={ch.id} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{ch.name}</p>
                        <p className="text-zinc-500 text-xs truncate font-mono">{ch.url.slice(0, 60)}...</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeChannel(event.id, ch.id)} className="text-zinc-600 hover:text-red-400 shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Add channel */}
                  <div className="border border-dashed border-zinc-700 rounded-lg p-3 space-y-2">
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Agregar canal</p>
                    <Input
                      placeholder="Nombre (ej: ESPN en Español)"
                      value={newChannel[event.id]?.name || ''}
                      onChange={e => setNewChannel(p => ({ ...p, [event.id]: { ...p[event.id], name: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    />
                    <Input
                      placeholder="URL del stream (.m3u8 o .mp4)"
                      value={newChannel[event.id]?.url || ''}
                      onChange={e => setNewChannel(p => ({ ...p, [event.id]: { ...p[event.id], url: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm font-mono"
                    />
                    <Input
                      placeholder="URL del logo (opcional)"
                      value={newChannel[event.id]?.logo || ''}
                      onChange={e => setNewChannel(p => ({ ...p, [event.id]: { ...p[event.id], logo: e.target.value } }))}
                      className="bg-zinc-800 border-zinc-700 text-white text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => addChannel(event.id)}
                      disabled={!newChannel[event.id]?.name || !newChannel[event.id]?.url || saving}
                      className="bg-red-600 hover:bg-red-700 text-white gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar canal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
