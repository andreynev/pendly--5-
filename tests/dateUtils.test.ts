import { describe, expect, it } from 'vitest';
import { calculateNextOccurrence, daysUntil, pluralizeDays, toLocalDateString } from '../utils/dateUtils';

const d = (s: string) => {
    const [y, m, day] = s.split('-').map(Number);
    return new Date(y, m - 1, day);
};
const next = (date: string, repetition: 'none' | 'weekly' | 'monthly' | 'yearly', today: string) =>
    toLocalDateString(calculateNextOccurrence({ date, repetition }, d(today)));

describe('calculateNextOccurrence', () => {
    it('returns the start date for one-off and future events', () => {
        expect(next('2026-01-01', 'none', '2026-09-24')).toBe('2026-01-01');
        expect(next('2026-12-01', 'weekly', '2026-09-24')).toBe('2026-12-01');
    });

    it('advances weekly events keeping the weekday', () => {
        expect(next('2026-09-03', 'weekly', '2026-09-24')).toBe('2026-09-24');
        expect(next('2026-09-04', 'weekly', '2026-09-24')).toBe('2026-09-25');
    });

    it('clamps monthly events to the end of shorter months', () => {
        expect(next('2026-01-31', 'monthly', '2026-02-10')).toBe('2026-02-28');
        // After a short month it goes back to the 31st, not drifting to the 28th.
        expect(next('2026-01-31', 'monthly', '2026-03-01')).toBe('2026-03-31');
        expect(next('2026-01-15', 'monthly', '2026-09-24')).toBe('2026-10-15');
    });

    it('handles yearly events including 29 February', () => {
        expect(next('1990-05-10', 'yearly', '2026-09-24')).toBe('2027-05-10');
        expect(next('1990-12-10', 'yearly', '2026-09-24')).toBe('2026-12-10');
        expect(next('2024-02-29', 'yearly', '2026-01-01')).toBe('2026-02-28');
        expect(next('2024-02-29', 'yearly', '2027-03-01')).toBe('2028-02-29');
    });
});

describe('daysUntil', () => {
    it('counts whole days across DST changes', () => {
        expect(daysUntil(d('2026-03-30'), d('2026-03-28'))).toBe(2);
        expect(daysUntil(d('2026-10-26'), d('2026-10-24'))).toBe(2);
        expect(daysUntil(d('2026-09-20'), d('2026-09-24'))).toBe(-4);
    });
});

describe('pluralizeDays', () => {
    it.each([
        [0, 'днів'], [1, 'день'], [2, 'дні'], [4, 'дні'], [5, 'днів'], [11, 'днів'],
        [14, 'днів'], [21, 'день'], [22, 'дні'], [25, 'днів'], [101, 'день'], [111, 'днів'],
    ])('%i → %s', (n, word) => {
        expect(pluralizeDays(n)).toBe(word);
    });
});
