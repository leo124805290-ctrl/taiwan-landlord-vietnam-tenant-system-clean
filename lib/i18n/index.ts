'use client'

import zhTW from './zh-TW.json'
import vi from './vi.json'

export type Locale = 'zh-TW' | 'vi'

const messages: Record<Locale, Record<string, string>> = {
  'zh-TW': zhTW as Record<string, string>,
  vi: vi as Record<string, string>,
}

const STORAGE_KEY = 'app_lang'

export function getLang(): Locale {
  if (typeof window === 'undefined') return 'zh-TW'
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  return stored === 'vi' || stored === 'zh-TW' ? stored : 'zh-TW'
}

export function setLang(lang: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang)
  }
}

export function t(key: string, lang?: Locale): string {
  const l = lang ?? (typeof window === 'undefined' ? 'zh-TW' : getLang())
  return (messages[l] && messages[l][key]) || key
}
