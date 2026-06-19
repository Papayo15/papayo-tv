const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function tmdbImage(path: string | null, size: 'w300' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path) return '/placeholder-poster.jpg'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export async function getTrendingMovies(page = 1) {
  const res = await fetch(`${TMDB_BASE}/trending/movie/week?page=${page}&language=es-MX`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('TMDB trending movies failed')
  return res.json()
}

export async function getTrendingSeries(page = 1) {
  const res = await fetch(`${TMDB_BASE}/trending/tv/week?page=${page}&language=es-MX`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('TMDB trending series failed')
  return res.json()
}

export async function getNowPlayingMovies(page = 1) {
  const res = await fetch(`${TMDB_BASE}/movie/now_playing?page=${page}&language=es-MX&region=MX`, {
    headers: getHeaders(),
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error('TMDB now playing failed')
  return res.json()
}

export async function getPopularMovies(page = 1) {
  const res = await fetch(`${TMDB_BASE}/movie/popular?page=${page}&language=es-MX`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('TMDB popular movies failed')
  return res.json()
}

export async function getPopularSeries(page = 1) {
  const res = await fetch(`${TMDB_BASE}/tv/popular?page=${page}&language=es-MX`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('TMDB popular series failed')
  return res.json()
}

export async function getMovieDetails(id: number) {
  const res = await fetch(
    `${TMDB_BASE}/movie/${id}?language=es-MX&append_to_response=videos,credits,similar`,
    { headers: getHeaders(), next: { revalidate: 86400 } }
  )
  if (!res.ok) throw new Error('TMDB movie details failed')
  return res.json()
}

export async function getSeriesDetails(id: number) {
  const res = await fetch(
    `${TMDB_BASE}/tv/${id}?language=es-MX&append_to_response=videos,credits,similar`,
    { headers: getHeaders(), next: { revalidate: 86400 } }
  )
  if (!res.ok) throw new Error('TMDB series details failed')
  return res.json()
}

export async function searchContent(query: string, page = 1) {
  const res = await fetch(
    `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=${page}&language=es-MX`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  )
  if (!res.ok) throw new Error('TMDB search failed')
  return res.json()
}

export async function getUpcomingMovies(page = 1) {
  const res = await fetch(`${TMDB_BASE}/movie/upcoming?page=${page}&language=es-MX&region=MX`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('TMDB upcoming movies failed')
  return res.json()
}
