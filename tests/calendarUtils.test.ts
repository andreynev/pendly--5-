import { describe, expect, it } from 'vitest';
import { escapeIcsText, generateIcsContent, toSafeFileName } from '../utils/calendarUtils';
import { parseIcsFile } from '../utils/icsParser';
import type { PendlyEvent } from '../types';

const event: PendlyEvent = {
    id: 'abc',
    name: 'Зустріч, важлива; дуже',
    date: '2026-10-05',
    location: 'Київ, вул. Хрещатик',
    notes: 'Рядок 1\nРядок 2',
    category: 'meeting',
    repetition: 'yearly',
};

describe('ICS export', () => {
    it('escapes special characters', () => {
        expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\;c\\\\d\\ne');
    });

    it('keeps Cyrillic in file names', () => {
        expect(toSafeFileName('День народження / мама')).toBe('День_народження_мама');
        expect(toSafeFileName('???')).toBe('event');
    });

    it('round-trips through the ICS parser', () => {
        const ics = generateIcsContent([event, { ...event, id: 'def', name: 'Друга', time: '09:30', repetition: 'none' }]);
        const parsed = parseIcsFile(ics);
        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toMatchObject({
            name: event.name,
            date: '2026-10-05',
            time: '',
            location: event.location,
            notes: event.notes,
            repetition: 'yearly',
        });
        expect(parsed[1]).toMatchObject({ name: 'Друга', date: '2026-10-05', time: '09:30', repetition: 'none' });
    });

    it('rejects invalid files', () => {
        expect(() => parseIcsFile('not a calendar')).toThrow();
    });
});
