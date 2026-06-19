export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  original_language: string
}

export interface TMDBSeries {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  original_language: string
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface VodSource {
  id: string
  tmdb_id: number
  content_type: 'movie' | 'series'
  stream_url: string
  quality?: string
  added_by: string
  created_at: string
}

export interface SportsEvent {
  id: string
  name: string
  sport: string
  league: string
  home_team?: string
  away_team?: string
  channel_url?: string
  channel_name?: string
  starts_at: string
  ends_at?: string
  poster_url?: string
  is_live: boolean
  source: 'thesportsdb' | 'manual'
}
