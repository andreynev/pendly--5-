
import ICAL from 'ical.js';
import type { PendlyEvent, Repetition } from '../types';

type PartialEvent = Omit<PendlyEvent, 'id' | 'displayDate'>;

/**
 * Parses a string containing iCalendar data and extracts events.
 * @param icsContent The string content of the .ics file.
 * @returns An array of event objects compatible with the application.
 */
export const parseIcsFile = (icsContent: string): PartialEvent[] => {
    try {
        const jcalData = ICAL.parse(icsContent);
        const vcalendar = new ICAL.Component(jcalData);
        const vevents = vcalendar.getAllSubcomponents('vevent');
        const importedEvents: PartialEvent[] = [];

        for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);

            const startDate = event.startDate.toJSDate();
            
            const year = startDate.getFullYear();
            const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
            const day = startDate.getDate().toString().padStart(2, '0');
            const date = `${year}-${month}-${day}`;
            
            let time = '';
            // An event is not "all-day" if the type is DATETIME
            if (!event.startDate.isDate) {
                 const hours = startDate.getHours().toString().padStart(2, '0');
                 const minutes = startDate.getMinutes().toString().padStart(2, '0');
                 time = `${hours}:${minutes}`;
            }

            let repetition: Repetition = 'none';
            if (event.isRecurring()) {
                const rrule = event.iterator().rule.toString();
                if (rrule.includes('FREQ=YEARLY')) {
                    repetition = 'yearly';
                } else if (rrule.includes('FREQ=MONTHLY')) {
                    repetition = 'monthly';
                } else if (rrule.includes('FREQ=WEEKLY')) {
                    repetition = 'weekly';
                }
            }
            
            const newEvent: PartialEvent = {
                name: event.summary || 'Без назви',
                date: date,
                time: time,
                location: event.location || '',
                category: 'other', // Default category for imported events
                notes: event.description || '',
                repetition: repetition,
            };
            
            importedEvents.push(newEvent);
        }
        
        return importedEvents;

    } catch (error) {
        console.error('Failed to parse ICS file:', error);
        throw new Error('Недійсний формат файлу .ics.');
    }
};
