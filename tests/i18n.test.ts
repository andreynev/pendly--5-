import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../i18n/messages';
import { LANGUAGES, translate, detectLanguage } from '../i18n';

const placeholders = (message: unknown): string[] => {
    const texts = typeof message === 'string' ? [message] : Object.values(message as Record<string, string>);
    return [...new Set(texts.flatMap(text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1])))].sort();
};

describe('translations', () => {
    const keys = Object.keys(MESSAGES.uk);

    it.each(LANGUAGES.map(l => l.value))('%s has every key with the same placeholders', (lang) => {
        const messages = MESSAGES[lang] as Record<string, unknown>;
        expect(Object.keys(messages).sort()).toEqual([...keys].sort());
        for (const key of keys) {
            const message = messages[key];
            expect(message, `${lang}:${key}`).toBeTruthy();
            if (typeof message !== 'string') expect((message as Record<string, string>).other, `${lang}:${key} needs "other"`).toBeTruthy();
            const expected = placeholders((MESSAGES.uk as Record<string, unknown>)[key]).filter(p => p !== 'count');
            const actual = placeholders(message).filter(p => p !== 'count');
            expect(actual, `${lang}:${key}`).toEqual(expected);
        }
    });

    it('uses the right plural forms', () => {
        const days = (lang: 'uk' | 'en' | 'pl' | 'de', count: number) => translate(lang, 'unit.days', { count });
        expect([1, 2, 5, 11, 21, 22, 25].map(n => days('uk', n))).toEqual(['день', 'дні', 'днів', 'днів', 'день', 'дні', 'днів']);
        expect([1, 2, 5, 22].map(n => days('pl', n))).toEqual(['dzień', 'dni', 'dni', 'dni']);
        expect([1, 2].map(n => days('en', n))).toEqual(['day', 'days']);
        expect(days('de', 1)).toBe('Tag');
        expect(translate('uk', 'toast.imported', { source: 'a.ics', count: 3 })).toBe('a.ics: імпортовано 3 події');
        expect(translate('en', 'toast.imported', { source: 'a.ics', count: 1 })).toBe('a.ics: imported 1 event');
    });

    it('fills placeholders', () => {
        expect(translate('fr', 'header.greeting', { name: 'Anna' })).toBe('Bonjour, Anna !');
        expect(translate('es', 'event.edit', { name: 'Cena' })).toBe('Cena: editar');
    });
});

describe('detectLanguage', () => {
    const withLanguages = (languages: string[], fn: () => void) => {
        const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', { value: { languages, language: languages[0] }, configurable: true });
        try { fn(); } finally {
            if (original) Object.defineProperty(globalThis, 'navigator', original);
        }
    };

    it('picks the first supported device language', () => {
        withLanguages(['de-AT', 'en-US'], () => expect(detectLanguage()).toBe('de'));
        withLanguages(['ja-JP', 'pt-BR'], () => expect(detectLanguage()).toBe('pt'));
        withLanguages(['ru-UA'], () => expect(detectLanguage()).toBe('uk'));
        withLanguages(['ja-JP'], () => expect(detectLanguage()).toBe('en'));
    });
});
