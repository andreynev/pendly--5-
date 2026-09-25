import ICAL from 'ical.js';
import type { PendlyEvent, Repetition } from '../types';
import { toLocalDateString } from './dateUtils';

export type ImportedEvent = Omit<PendlyEvent, 'id' | 'displayDate'>;

const repetitionFromTypes = (types: Record<string, boolean>): Repetition => {
    if (types.YEARLY) return 'yearly';
    if (types.MONTHLY) return 'monthly';
    if (types.WEEKLY) return 'weekly';
    return 'none';
};

/**
 * Parses a string containing iCalendar data and extracts events.
 * @param icsContent The string content of the .ics file.
 * @returns An array of event objects compatible with the application.
 */
export const parseIcsFile = (icsContent: string): ImportedEvent[] => {
    let vevents: ICAL.Component[];
    try {
        const vcalendar = new ICAL.Component(ICAL.parse(icsContent));
        vevents = vcalendar.getAllSubcomponents('vevent');
    } catch (error) {
        console.error('Failed to parse ICS file:', error);
        throw new Error('Недійсний формат файлу .ics.');
    }

    const importedEvents: ImportedEvent[] = [];

    for (const vevent of vevents) {
        // Skip overridden instances of recurring events (RECURRENCE-ID) to avoid duplicates.
        if (vevent.hasProperty('recurrence-id')) continue;

        const event = new ICAL.Event(vevent);
        if (!event.startDate) continue;

        const startDate = event.startDate.toJSDate();
        let time = '';
        if (!event.startDate.isDate) {
            const hours = startDate.getHours().toString().padStart(2, '0');
            const minutes = startDate.getMinutes().toString().padStart(2, '0');
            time = `${hours}:${minutes}`;
        }

        importedEvents.push({
            name: event.summary || 'Без назви',
            date: toLocalDateString(startDate),
            time,
            location: event.location || '',
            category: 'other',
            notes: event.description || '',
            repetition: event.isRecurring() ? repetitionFromTypes(event.getRecurrenceTypes()) : 'none',
            sourceEventId: event.uid ? `ics:${event.uid}` : undefined,
        });
    }

    return importedEvents;
};
