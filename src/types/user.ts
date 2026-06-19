export interface Profile {
  id: string
  username?: string
  avatar_url?: string
  is_admin: boolean
  created_at: string
}

export interface Favorite {
  id: string
  user_id: string
  content_type: 'channel' | 'movie' | 'series' | 'sports'
  content_id: string
  created_at: string
}

export interface WatchHistory {
  id: string
  user_id: string
  content_type: 'channel' | 'movie' | 'series'
  content_id: string
  watched_at: string
}
