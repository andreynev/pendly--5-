import type { PendlyEvent } from '../types';
import { parseLocalDate } from './dateUtils';

// Helper to format a date object into an iCalendar-compatible UTC string (YYYYMMDDTHHMMSSZ)
function toIcsUTCString(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Helper to format a date object into an iCalendar-compatible date-only string (YYYYMMDD)
function toIcsDateString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

// Escapes TEXT values per RFC 5545 §3.3.11.
export function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function veventLines(event: PendlyEvent, dtstamp: string): string[] {
    const uid = `${event.id}@pendly.app`;

    let dtstart: string;
    let dtend: string;

    const eventDate = event.displayDate ? event.displayDate : parseLocalDate(event.date);

    if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(hours, minutes, 0, 0);

        // Assume a 1-hour duration for simplicity
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        dtstart = `DTSTART:${toIcsUTCString(startDateTime)}`;
        dtend = `DTEND:${toIcsUTCString(endDateTime)}`;
    } else {
        const endDateTime = new Date(eventDate);
        endDateTime.setDate(endDateTime.getDate() + 1);

        dtstart = `DTSTART;VALUE=DATE:${toIcsDateString(eventDate)}`;
        dtend = `DTEND;VALUE=DATE:${toIcsDateString(endDateTime)}`;
    }

    const lines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        dtstart,
        dtend,
        `SUMMARY:${escapeIcsText(event.name || 'Untitled Event')}`,
    ];

    if (event.notes) {
        lines.push(`DESCRIPTION:${escapeIcsText(event.notes)}`);
    }
    if (event.location) {
        lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.repetition !== 'none') {
        lines.push(`RRULE:FREQ=${event.repetition.toUpperCase()}`);
    }

    lines.push('END:VEVENT');
    return lines;
}

/** Builds an iCalendar document containing one or more events. */
export function generateIcsContent(events: PendlyEvent | PendlyEvent[]): string {
    const list = Array.isArray(events) ? events : [events];
    const dtstamp = toIcsUTCString(new Date());
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PendlyApp//Event Exporter//EN',
        ...list.flatMap(event => veventLines(event, dtstamp)),
        'END:VCALENDAR',
    ];
    // Using \r\n for line endings as per RFC 5545
    return lines.join('\r\n');
}

/** Makes a safe file name while keeping Cyrillic and other letters. */
export function toSafeFileName(name: string): string {
    const cleaned = name
        .trim()
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '')
        .replace(/\s+/g, '_');
    return cleaned || 'event';
}

function downloadText(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadIcsFile(event: PendlyEvent) {
    downloadText(generateIcsContent(event), `${toSafeFileName(event.name)}.ics`, 'text/calendar;charset=utf-8');
}

export function downloadAllEventsIcs(events: PendlyEvent[]) {
    // Export the stored start dates, not the computed next occurrence.
    const stored = events.map(({ displayDate: _displayDate, ...rest }) => rest);
    downloadText(generateIcsContent(stored), 'pendly-events.ics', 'text/calendar;charset=utf-8');
}
