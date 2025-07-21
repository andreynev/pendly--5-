import type { PendlyEvent } from '../types';

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

function generateIcsContent(event: PendlyEvent): string {
    const uid = `${event.id}@pendly.app`;
    const dtstamp = toIcsUTCString(new Date());

    let dtstart: string;
    let dtend: string;
    
    const eventDate = event.displayDate ? event.displayDate : new Date(event.date);
    
    if (event.time) {
        // Event with a specific time
        const [hours, minutes] = event.time.split(':').map(Number);
        const startDateTime = new Date(eventDate);
        startDateTime.setHours(hours, minutes, 0, 0);
        
        // Assume a 1-hour duration for simplicity
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        dtstart = `DTSTART:${toIcsUTCString(startDateTime)}`;
        dtend = `DTEND:${toIcsUTCString(endDateTime)}`;
    } else {
        // All-day event
        const startDateTime = eventDate;
        const endDateTime = new Date(startDateTime);
        endDateTime.setDate(endDateTime.getDate() + 1);

        dtstart = `DTSTART;VALUE=DATE:${toIcsDateString(startDateTime)}`;
        dtend = `DTEND;VALUE=DATE:${toIcsDateString(endDateTime)}`;
    }
    
    let rruleLine = '';
    if (event.repetition !== 'none') {
        const freq = event.repetition.toUpperCase();
        rruleLine = `RRULE:FREQ=${freq}`;
    }

    const summary = event.name || 'Untitled Event';
    const description = event.notes || '';
    const location = event.location || '';
    
    // Using \r\n for line endings as per RFC 5545
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PendlyApp//Event Exporter//EN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        dtstart,
        dtend,
        `SUMMARY:${summary}`,
    ];

    if (description) {
        lines.push(`DESCRIPTION:${description}`);
    }
    if (location) {
        lines.push(`LOCATION:${location}`);
    }
    if (rruleLine) {
        lines.push(rruleLine);
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
}


export function downloadIcsFile(event: PendlyEvent) {
    const icsContent = generateIcsContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    const filename = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
