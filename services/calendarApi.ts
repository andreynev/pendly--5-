import type { Repetition, EventInput } from '../types';
import { toLocalDateString } from '../utils/dateUtils';

// Subset of the Google Calendar API v3 event resource that we use.
export interface GoogleCalendarEvent {
    id: string;
    status?: 'confirmed' | 'tentative' | 'cancelled';
    summary?: string;
    description?: string;
    location?: string;
    start?: {
        dateTime?: string; // RFC 3339 timestamp for timed events
        date?: string;     // YYYY-MM-DD for all-day events
    };
    recurrence?: string[]; // e.g. ["RRULE:FREQ=WEEKLY"]
    recurringEventId?: string; // set on modified instances of a recurring series
    eventType?: string;
}

const API_BASE = 'https://www.googleapis.com/calendar/v3';
const MAX_PAGES = 10;

// Per-user connection info (the email of the connected calendar).
const connectionKey = (uid: string) => `pendly_gcal_${uid}`;
// Short-lived OAuth token, kept only for this browser session.
const tokenKey = (uid: string) => `pendly_gcal_token_${uid}`;

export class CalendarAuthError extends Error {}

export const getCalendarConnection = (uid: string): string | null => {
    try {
        return localStorage.getItem(connectionKey(uid));
    } catch {
        return null;
    }
};

export const saveCalendarConnection = (uid: string, email: string, accessToken: string) => {
    try {
        localStorage.setItem(connectionKey(uid), email);
        // Google access tokens live ~1 hour; refresh a bit earlier.
        sessionStorage.setItem(tokenKey(uid), JSON.stringify({ accessToken, expiresAt: Date.now() + 55 * 60 * 1000 }));
    } catch {
        // Storage unavailable: the token still works for this call.
    }
};

export const getCachedAccessToken = (uid: string): string | null => {
    try {
        const raw = sessionStorage.getItem(tokenKey(uid));
        if (!raw) return null;
        const { accessToken, expiresAt } = JSON.parse(raw);
        return typeof accessToken === 'string' && Date.now() < expiresAt ? accessToken : null;
    } catch {
        return null;
    }
};

export const clearCalendarConnection = (uid: string, { keepConnection = false } = {}) => {
    try {
        sessionStorage.removeItem(tokenKey(uid));
        if (!keepConnection) localStorage.removeItem(connectionKey(uid));
    } catch {
        // ignore
    }
};

/** Revokes the OAuth token at Google so the app no longer has calendar access. */
export const revokeAccessToken = async (accessToken: string): Promise<void> => {
    try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: 'POST' });
    } catch {
        // Best effort: the token expires within an hour anyway.
    }
};

/**
 * Fetches events from the user's primary calendar: everything from 30 days ago
 * to one year ahead, with recurring series returned once (not expanded).
 */
export const fetchCalendarEvents = async (accessToken: string): Promise<GoogleCalendarEvent[]> => {
    const now = Date.now();
    const params = new URLSearchParams({
        singleEvents: 'false',
        showDeleted: 'false',
        maxResults: '250',
        timeMin: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const items: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
        if (pageToken) params.set('pageToken', pageToken);
        const response = await fetch(`${API_BASE}/calendars/primary/events?${params}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 401) {
            throw new CalendarAuthError('Доступ до календаря завершився. Підключіть календар ще раз.');
        }
        if (response.status === 403) {
            const body = await response.json().catch(() => null);
            const reason: string = body?.error?.errors?.[0]?.reason ?? body?.error?.status ?? '';
            if (/insufficient|PERMISSION_DENIED/i.test(reason)) {
                throw new CalendarAuthError('Під час підключення не було надано доступ до календаря. Підключіть ще раз і поставте позначку біля Google Calendar.');
            }
            if (/accessNotConfigured|SERVICE_DISABLED/i.test(reason) || /has not been used|is disabled/i.test(body?.error?.message ?? '')) {
                throw new Error('Google Calendar API не увімкнено в проєкті Google Cloud.');
            }
            throw new Error('Google відхилив запит до календаря.');
        }
        if (!response.ok) {
            throw new Error(`Помилка Google Calendar (${response.status}).`);
        }
        const data = await response.json();
        items.push(...(data.items ?? []));
        pageToken = data.nextPageToken;
        if (!pageToken) break;
    }
    return items;
};

// --- TRANSFORMATION LOGIC ---

/** Google event descriptions may contain HTML; keep plain text only. */
export const htmlToText = (html: string): string =>
    html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li)>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

/** Maps an RRULE to Pendly's repetition, or null for rules Pendly can't represent (e.g. daily). */
export const getRepetitionFromRRule = (recurrence?: string[]): Repetition | null => {
    const rule = recurrence?.find(r => r.startsWith('RRULE:'));
    if (!rule) return 'none';
    const freq = /FREQ=([A-Z]+)/.exec(rule)?.[1];
    switch (freq) {
        case 'YEARLY': return 'yearly';
        case 'MONTHLY': return 'monthly';
        case 'WEEKLY': return 'weekly';
        default: return null;
    }
};

/** Converts a Google event to a Pendly event, or returns null if it should be skipped. */
export const transformGoogleEvent = (gEvent: GoogleCalendarEvent): EventInput | null => {
    if (gEvent.status === 'cancelled' || gEvent.recurringEventId || !gEvent.start) return null;
    if (gEvent.eventType && !['default', 'fromGmail', 'birthday'].includes(gEvent.eventType)) return null;

    const repetition = getRepetitionFromRRule(gEvent.recurrence);
    if (repetition === null) return null;

    // All-day events carry a plain "YYYY-MM-DD" date; parsing it with new Date() would shift it to UTC.
    let date: string;
    let time = '';
    if (gEvent.start.date) {
        date = gEvent.start.date;
    } else if (gEvent.start.dateTime) {
        const startDate = new Date(gEvent.start.dateTime);
        if (Number.isNaN(startDate.getTime())) return null;
        date = toLocalDateString(startDate);
        time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    } else {
        return null;
    }

    return {
        name: (gEvent.summary || 'Без назви').slice(0, 200),
        date,
        time,
        location: (gEvent.location || '').slice(0, 500),
        category: gEvent.eventType === 'birthday' ? 'holiday' : 'other',
        notes: htmlToText(gEvent.description || '').slice(0, 5000),
        repetition,
        source: 'google',
        sourceEventId: gEvent.id,
    };
};
