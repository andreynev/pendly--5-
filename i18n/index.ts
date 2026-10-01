import { MESSAGES, type MessageKey, type PluralForms } from './messages';

export type Lang = 'uk' | 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it' | 'pl';
export type LangSetting = Lang | 'auto';

export const LANGUAGES: { value: Lang; name: string; locale: string }[] = [
    { value: 'uk', name: 'Українська', locale: 'uk-UA' },
    { value: 'en', name: 'English', locale: 'en-US' },
    { value: 'es', name: 'Español', locale: 'es-ES' },
    { value: 'pt', name: 'Português', locale: 'pt-BR' },
    { value: 'de', name: 'Deutsch', locale: 'de-DE' },
    { value: 'fr', name: 'Français', locale: 'fr-FR' },
    { value: 'it', name: 'Italiano', locale: 'it-IT' },
    { value: 'pl', name: 'Polski', locale: 'pl-PL' },
];

const STORAGE_KEY = 'language';
const FALLBACK: Lang = 'en';

const isLang = (value: unknown): value is Lang => LANGUAGES.some(l => l.value === value);

/** Picks the first supported language from the device settings. */
export const detectLanguage = (): Lang => {
    const preferred = typeof navigator !== 'undefined'
        ? (navigator.languages?.length ? navigator.languages : [navigator.language])
        : [];
    for (const tag of preferred) {
        const base = tag?.toLowerCase().split('-')[0];
        // Russian-speaking devices in Ukraine get Ukrainian rather than English.
        if (base === 'ru' || base === 'be') return 'uk';
        if (isLang(base)) return base;
    }
    return FALLBACK;
};

export const readLanguageSetting = (): LangSetting => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return isLang(stored) ? stored : 'auto';
    } catch {
        return 'auto';
    }
};

export const saveLanguageSetting = (setting: LangSetting) => {
    try {
        if (setting === 'auto') localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, setting);
    } catch {
        // Storage unavailable: the choice applies for this session only.
    }
};

export const resolveLanguage = (setting: LangSetting): Lang => (setting === 'auto' ? detectLanguage() : setting);

// The active language is module state so non-React code (services, error
// messages) translates the same way as components.
let currentLang: Lang = resolveLanguage(readLanguageSetting());

export const getLanguage = (): Lang => currentLang;
export const getLocale = (lang: Lang = currentLang): string => LANGUAGES.find(l => l.value === lang)!.locale;

export const setLanguage = (lang: Lang) => {
    currentLang = lang;
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.title = translate(lang, 'app.title');
    }
};

type Params = Record<string, string | number>;

const interpolate = (text: string, params?: Params): string =>
    params ? text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match)) : text;

const pluralRules = new Map<string, Intl.PluralRules>();
const pluralCategory = (lang: Lang, count: number): Intl.LDMLPluralRule => {
    const locale = getLocale(lang);
    let rules = pluralRules.get(locale);
    if (!rules) {
        rules = new Intl.PluralRules(locale);
        pluralRules.set(locale, rules);
    }
    return rules.select(count);
};

const pickPlural = (forms: PluralForms, category: Intl.LDMLPluralRule): string =>
    forms[category] ?? forms.other;

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
    const message = MESSAGES[lang][key] ?? MESSAGES[FALLBACK][key];
    if (typeof message === 'string') return interpolate(message, params);
    const count = Number(params?.count ?? 0);
    return interpolate(pickPlural(message, pluralCategory(lang, count)), params);
}

/** Translates a key in the active language. Plural messages use params.count. */
export const t = (key: MessageKey, params?: Params): string => translate(currentLang, key, params);

export type { MessageKey };
