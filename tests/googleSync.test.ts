import { describe, expect, it } from 'vitest';
import { getRepetitionFromRRule, htmlToText, transformGoogleEvent } from '../services/calendarApi';
import { planGoogleSync } from '../utils/googleSync';
import type { PendlyEvent } from '../types';

describe('transformGoogleEvent', () => {
    it('keeps all-day dates as-is (no UTC shift)', () => {
        expect(transformGoogleEvent({ id: 'a', summary: 'Відпустка', start: { date: '2026-10-05' } })).toMatchObject({
            name: 'Відпустка', date: '2026-10-05', time: '', repetition: 'none', source: 'google', sourceEventId: 'a',
        });
    });

    it('converts timed events to local date and time', () => {
        const e = transformGoogleEvent({ id: 'b', summary: 'Зустріч', start: { dateTime: '2026-10-05T23:30:00Z' } })!;
        const local = new Date('2026-10-05T23:30:00Z');
        expect(e.time).toBe(`${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`);
        expect(e.date).toBe(`${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`);
    });

    it('skips cancelled events, modified instances, daily series and non-default types', () => {
        expect(transformGoogleEvent({ id: 'c', status: 'cancelled', start: { date: '2026-10-05' } })).toBeNull();
        expect(transformGoogleEvent({ id: 'd', recurringEventId: 'x', start: { date: '2026-10-05' } })).toBeNull();
        expect(transformGoogleEvent({ id: 'e', start: { date: '2026-10-05' }, recurrence: ['RRULE:FREQ=DAILY'] })).toBeNull();
        expect(transformGoogleEvent({ id: 'f', start: { date: '2026-10-05' }, eventType: 'outOfOffice' })).toBeNull();
    });

    it('marks birthdays as holidays and strips HTML from descriptions', () => {
        const e = transformGoogleEvent({
            id: 'g', summary: 'ДН Олі', eventType: 'birthday', start: { date: '2026-03-01' },
            recurrence: ['RRULE:FREQ=YEARLY'], description: 'Купити <b>торт</b><br>і квіти &amp; листівку',
        })!;
        expect(e).toMatchObject({ category: 'holiday', repetition: 'yearly', notes: 'Купити торт\nі квіти & листівку' });
    });
});

describe('getRepetitionFromRRule', () => {
    it.each([
        [undefined, 'none'], [['RRULE:FREQ=WEEKLY;BYDAY=MO'], 'weekly'], [['EXDATE:20260101', 'RRULE:FREQ=MONTHLY'], 'monthly'],
        [['RRULE:FREQ=YEARLY'], 'yearly'], [['RRULE:FREQ=DAILY'], null],
    ])('%j → %s', (rule, expected) => {
        expect(getRepetitionFromRRule(rule as string[] | undefined)).toBe(expected);
    });
});

describe('htmlToText', () => {
    it('handles plain text unchanged', () => {
        expect(htmlToText('Просто текст')).toBe('Просто текст');
    });
});

describe('planGoogleSync', () => {
    const existing: PendlyEvent[] = [
        { id: '1', name: 'Стара назва', date: '2026-10-01', category: 'travel', repetition: 'none', source: 'google', sourceEventId: 'g1' },
        { id: '2', name: 'Без змін', date: '2026-10-02', time: '', location: '', notes: '', category: 'other', repetition: 'none', source: 'google', sourceEventId: 'g2' },
        { id: '3', name: 'Власна', date: '2026-10-03', category: 'work', repetition: 'none' },
    ];
    const g = (id: string, name: string, date: string) => ({
        name, date, time: '', location: '', notes: '', category: 'other' as const, repetition: 'none' as const, source: 'google' as const, sourceEventId: id,
    });

    it('adds new events, updates changed ones keeping the user category, ignores unchanged', () => {
        const plan = planGoogleSync(existing, [g('g1', 'Нова назва', '2026-10-01'), g('g2', 'Без змін', '2026-10-02'), g('g3', 'Нова подія', '2026-11-01'), g('g3', 'Дубль', '2026-11-01')]);
        expect(plan.toAdd.map(e => e.sourceEventId)).toEqual(['g3']);
        expect(plan.toUpdate).toHaveLength(1);
        expect(plan.toUpdate[0]).toMatchObject({ id: '1', data: { name: 'Нова назва', category: 'travel' } });
    });
});
