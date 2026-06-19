export interface Channel {
  id: string
  name: string
  url: string
  logo?: string
  country: string
  category: string
  language?: string
  is_active: boolean
  last_synced_at?: string
}

export type ChannelStatus = 'unknown' | 'online' | 'offline' | 'cors-blocked' | 'error'

export interface ChannelWithStatus extends Channel {
  status: ChannelStatus
}

export const CHANNEL_CATEGORIES = [
  'sports',
  'news',
  'movies',
  'kids',
  'entertainment',
  'music',
  'documentary',
  'other',
] as const

export type ChannelCategory = (typeof CHANNEL_CATEGORIES)[number]

export const COUNTRIES = [
  { code: 'mx', name: 'México', flag: '🇲🇽' },
  { code: 'es', name: 'España', flag: '🇪🇸' },
  { code: 'us', name: 'EE.UU.', flag: '🇺🇸' },
  { code: 'ar', name: 'Argentina', flag: '🇦🇷' },
  { code: 'co', name: 'Colombia', flag: '🇨🇴' },
  { code: 'br', name: 'Brasil', flag: '🇧🇷' },
  { code: 'cl', name: 'Chile', flag: '🇨🇱' },
] as const
