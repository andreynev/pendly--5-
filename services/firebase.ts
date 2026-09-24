import type { User, PendlyEvent, EventInput } from '../types';
import { toLocalDateString } from '../utils/dateUtils';

// Mock auth + database backed by localStorage, so events survive page reloads.
// The exported API mirrors what a real Firebase implementation would provide.

const USER_KEY = 'pendly_user';
const eventsKey = (userId: string) => `pendly_events_${userId}`;

let currentUser: User | null = null;
const authListeners = new Set<(user: User | null) => void>();
const eventListeners = new Map<string, Set<(events: PendlyEvent[]) => void>>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);

const daysFromToday = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toLocalDateString(date);
};

const createSampleEvents = (): PendlyEvent[] => [
    { id: generateId(), name: 'День народження', date: daysFromToday(45), time: '18:00', location: 'Вдома', category: 'holiday', repetition: 'yearly' },
    { id: generateId(), name: 'Щотижнева зустріч', date: daysFromToday(-3), category: 'work', repetition: 'weekly' },
    { id: generateId(), name: 'Подорож в гори', date: daysFromToday(21), notes: 'Взяти намет', category: 'travel', repetition: 'none' },
    { id: generateId(), name: 'Зустріч з дизайнером', date: daysFromToday(-10), category: 'meeting', repetition: 'none' },
];

const readEvents = (userId: string): PendlyEvent[] => {
    const raw = localStorage.getItem(eventsKey(userId));
    if (raw === null) {
        const sample = createSampleEvents();
        writeEvents(userId, sample);
        return sample;
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeEvents = (userId: string, events: PendlyEvent[]) => {
    localStorage.setItem(eventsKey(userId), JSON.stringify(events));
};

const notifyEvents = (userId: string) => {
    const listeners = eventListeners.get(userId);
    if (!listeners) return;
    const events = readEvents(userId);
    listeners.forEach(listener => listener([...events]));
};

const notifyAuth = () => {
    authListeners.forEach(listener => listener(currentUser));
};

// Keep multiple open tabs in sync.
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === USER_KEY) {
            currentUser = e.newValue ? JSON.parse(e.newValue) : null;
            notifyAuth();
        } else if (e.key?.startsWith('pendly_events_')) {
            notifyEvents(e.key.slice('pendly_events_'.length));
        }
    });
}

// --- AUTH ---

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    authListeners.add(callback);
    setTimeout(() => {
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
            } catch {
                localStorage.removeItem(USER_KEY);
            }
        }
        if (authListeners.has(callback)) callback(currentUser);
    }, 300);
    return () => { authListeners.delete(callback); };
};

export const signIn = async (): Promise<void> => {
    await delay(600);
    currentUser = {
        uid: 'mock-user-123',
        displayName: 'Тестовий Користувач',
        email: 'test.user@example.com',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    notifyAuth();
};

export const signOut = async (): Promise<void> => {
    await delay(200);
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    notifyAuth();
};

// --- DATABASE ---

export const onEventsSnapshot = (userId: string, callback: (events: PendlyEvent[]) => void): (() => void) => {
    let listeners = eventListeners.get(userId);
    if (!listeners) {
        listeners = new Set();
        eventListeners.set(userId, listeners);
    }
    listeners.add(callback);
    setTimeout(() => {
        if (eventListeners.get(userId)?.has(callback)) callback(readEvents(userId));
    }, 300);
    return () => { eventListeners.get(userId)?.delete(callback); };
};

export const addEvent = async (userId: string, eventData: EventInput): Promise<PendlyEvent> => {
    const newEvent: PendlyEvent = { ...eventData, id: generateId() };
    writeEvents(userId, [...readEvents(userId), newEvent]);
    notifyEvents(userId);
    return newEvent;
};

export const addEvents = async (userId: string, eventsData: EventInput[]): Promise<void> => {
    if (eventsData.length === 0) return;
    const newEvents = eventsData.map(data => ({ ...data, id: generateId() }));
    writeEvents(userId, [...readEvents(userId), ...newEvents]);
    notifyEvents(userId);
};

export const updateEvent = async (userId: string, eventId: string, eventData: EventInput): Promise<void> => {
    writeEvents(userId, readEvents(userId).map(e => (e.id === eventId ? { ...e, ...eventData, id: eventId } : e)));
    notifyEvents(userId);
};

export const deleteEvent = async (userId: string, eventId: string): Promise<void> => {
    writeEvents(userId, readEvents(userId).filter(e => e.id !== eventId));
    notifyEvents(userId);
};

/** Re-inserts a previously deleted event (used by "undo"). */
export const restoreEvent = async (userId: string, event: PendlyEvent): Promise<void> => {
    const { displayDate: _displayDate, ...stored } = event;
    writeEvents(userId, [...readEvents(userId).filter(e => e.id !== event.id), stored]);
    notifyEvents(userId);
};
