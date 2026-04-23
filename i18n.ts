import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import mk from './locales/mk.json'
import en from './locales/en.json'
import de from './locales/de.json'
import fr from './locales/fr.json'
import it from './locales/it.json'
import es from './locales/es.json'
import ru from './locales/ru.json'
import sq from './locales/sq.json'
import sr from './locales/sr.json'
import bg from './locales/bg.json'
import el from './locales/el.json'
import tr from './locales/tr.json'
import ro from './locales/ro.json'
import hr from './locales/hr.json'
import sl from './locales/sl.json'
import bs from './locales/bs.json'
import nl from './locales/nl.json'
import pt from './locales/pt.json'
import pl from './locales/pl.json'
import cs from './locales/cs.json'
import sk from './locales/sk.json'
import hu from './locales/hu.json'
import uk from './locales/uk.json'
import ar from './locales/ar.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import hi from './locales/hi.json'
import th from './locales/th.json'
import vi from './locales/vi.json'
import he from './locales/he.json'
import sv from './locales/sv.json'
import no from './locales/no.json'
import da from './locales/da.json'
import fi from './locales/fi.json'
import et from './locales/et.json'
import lv from './locales/lv.json'
import lt from './locales/lt.json'
import ka from './locales/ka.json'
import hy from './locales/hy.json'
import az from './locales/az.json'
import fa from './locales/fa.json'
import ur from './locales/ur.json'
import sw from './locales/sw.json'
import id from './locales/id.json'
import ms from './locales/ms.json'
import tl from './locales/tl.json'

export const resources = {
  mk: { translation: mk },
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  es: { translation: es },
  ru: { translation: ru },
  sq: { translation: sq },
  sr: { translation: sr },
  bg: { translation: bg },
  el: { translation: el },
  tr: { translation: tr },
  ro: { translation: ro },
  hr: { translation: hr },
  sl: { translation: sl },
  bs: { translation: bs },
  nl: { translation: nl },
  pt: { translation: pt },
  pl: { translation: pl },
  cs: { translation: cs },
  sk: { translation: sk },
  hu: { translation: hu },
  uk: { translation: uk },
  ar: { translation: ar },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  hi: { translation: hi },
  th: { translation: th },
  vi: { translation: vi },
  he: { translation: he },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  et: { translation: et },
  lv: { translation: lv },
  lt: { translation: lt },
  ka: { translation: ka },
  hy: { translation: hy },
  az: { translation: az },
  fa: { translation: fa },
  ur: { translation: ur },
  sw: { translation: sw },
  id: { translation: id },
  ms: { translation: ms },
  tl: { translation: tl },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'mk',
    lng: 'mk',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n

export const languages = [
  { code: 'mk', name: 'Македонски', flag: '🇲🇰', dir: 'ltr' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱', dir: 'ltr' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸', dir: 'ltr' },
  { code: 'bg', name: 'Български', flag: '🇧🇬', dir: 'ltr' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', dir: 'ltr' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', dir: 'ltr' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', dir: 'ltr' },
  { code: 'bs', name: 'Bosanski', flag: '🇧🇦', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿', dir: 'ltr' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰', dir: 'ltr' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺', dir: 'ltr' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', dir: 'ltr' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', dir: 'ltr' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', dir: 'ltr' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', dir: 'ltr' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪', dir: 'ltr' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻', dir: 'ltr' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', dir: 'ltr' },
  { code: 'ka', name: 'ქართული', flag: '🇬🇪', dir: 'ltr' },
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲', dir: 'ltr' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿', dir: 'ltr' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭', dir: 'ltr' },
] as const

export type LanguageCode = keyof typeof resources
