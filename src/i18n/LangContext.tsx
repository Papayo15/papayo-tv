'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Lang, type Translations, LOCALE_MAP, LANGUAGES, getTranslations } from './translations'

type LangCtx = { lang: Lang; t: Translations; setLang: (l: Lang) => void; languages: typeof LANGUAGES }
const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ defaultLang, children }: { defaultLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang)

  useEffect(() => {
    // On mount, try to refine from browser navigator (more precise than server header)
    const saved = localStorage.getItem('papayos-lang') as Lang | null
    if (saved && LANGUAGES[saved]) {
      setLangState(saved)
      return
    }
    const nav = navigator.language?.toLowerCase()
    const detected = LOCALE_MAP[nav] || LOCALE_MAP[nav?.split('-')[0]] || defaultLang
    setLangState(detected)
  }, [defaultLang])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('papayos-lang', l)
  }

  return (
    <Ctx.Provider value={{ lang, t: getTranslations(lang), setLang, languages: LANGUAGES }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLang() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
