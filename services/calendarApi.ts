import type { Repetition, Category, EventInput } from '../types';
import { toLocalDateString } from '../utils/dateUtils';

// Simulate the structure of a Google Calendar API event resource
interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime?: string; // ISO 8601 string if time is specified
        date?: string;     // YYYY-MM-DD string if all-day event
    };
    recurrence?: string[]; // e.g., ["RRULE:FREQ=WEEKLY"]
}

const MOCK_CALENDAR_EMAIL = 'test.user@example.com';
const CALENDAR_CONNECTION_KEY = 'pendly_calendar_connected';

// --- MOCK API ---

const MOCK_CALENDAR_EVENTS: GoogleCalendarEvent[] = [
    {
        id: 'gcal_event_1',
        summary: 'Квартальний звіт',
        description: 'Підготувати презентацію для зустрічі.',
        location: 'Офіс, кімната 301',
        start: { dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() } // 10 days from now
    },
    {
        id: 'gcal_event_2',
        summary: 'Відпустка',
        start: { date: toLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) }, // 30 days from now
    },
    {
        id: 'gcal_event_3',
        summary: 'День Народження Анни',
        start: { date: '2024-11-22' },
        recurrence: ['RRULE:FREQ=YEARLY']
    },
    {
        id: 'gcal_event_4',
        summary: 'Щотижневий командний синк',
        start: { dateTime: new Date(new Date().setDate(new Date().getDate() + (5 - new Date().getDay() + 7) % 7)).toISOString() }, // Next Friday
        recurrence: ['RRULE:FREQ=WEEKLY']
    }
];

// --- MOCK SERVICE FUNCTIONS ---

export const getCalendarConnectionStatus = (): Promise<string | null> => {
    return Promise.resolve(localStorage.getItem(CALENDAR_CONNECTION_KEY));
};

export const connectCalendar = (): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem(CALENDAR_CONNECTION_KEY, MOCK_CALENDAR_EMAIL);
            resolve(MOCK_CALENDAR_EMAIL);
        }, 1500); // Simulate OAuth popup and user approval
    });
};

export const disconnectCalendar = (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            localStorage.removeItem(CALENDAR_CONNECTION_KEY);
            resolve();
        }, 500);
    });
};


export const fetchCalendarEvents = (): Promise<GoogleCalendarEvent[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            // In a real app, this would be an API call to Google Calendar
            resolve(MOCK_CALENDAR_EVENTS);
        }, 2000);
    });
};


// --- TRANSFORMATION LOGIC ---

const getRepetitionFromRRule = (rrule?: string[]): Repetition => {
    if (!rrule || rrule.length === 0) return 'none';
    const rule = rrule[0];
    if (rule.includes('FREQ=YEARLY')) return 'yearly';
    if (rule.includes('FREQ=MONTHLY')) return 'monthly';
    if (rule.includes('FREQ=WEEKLY')) return 'weekly';
    return 'none';
};

export const transformGoogleEvent = (gEvent: GoogleCalendarEvent): EventInput => {
    // All-day events carry a plain "YYYY-MM-DD" date; parsing it with new Date() would shift it to UTC.
    let date: string;
    let time = '';
    if (gEvent.start.date) {
        date = gEvent.start.date;
    } else {
        const startDate = new Date(gEvent.start.dateTime!);
        date = toLocalDateString(startDate);
        time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    }

    return {
        name: gEvent.summary,
        date,
        time,
        location: gEvent.location || '',
        // A real app might try to infer this, but 'other' is a safe default
        category: 'other' as Category,
        notes: gEvent.description || '',
        repetition: getRepetitionFromRRule(gEvent.recurrence),
        source: 'google',
        sourceEventId: gEvent.id
    };
};