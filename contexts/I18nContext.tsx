'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getLang, setLang as persistLang, t as tStatic, type Locale } from '@/lib/i18n'

type I18nContextType = {
  lang: Locale
  setLang: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>('zh-TW')

  useEffect(() => {
    setLangState(getLang())
  }, [])

  const setLang = (locale: Locale) => {
    setLangState(locale)
    persistLang(locale)
  }

  const t = (key: string) => tStatic(key, lang)

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      lang: 'zh-TW',
      setLang: () => {},
      t: (key: string) => key,
    }
  }
  return ctx
}
