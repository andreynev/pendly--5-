
import type { User, PendlyEvent } from '../types';

// --- MOCK DATA ---
let MOCK_USER: User | null = null;
const MOCK_EVENTS: PendlyEvent[] = [
    { id: '1', name: 'День народження', date: '2024-12-25', time: '18:00', location: 'Вдома', category: 'holiday', repetition: 'yearly' },
    { id: '2', name: 'Щотижнева зустріч', date: '2024-07-20', category: 'work', repetition: 'weekly' },
    { id: '3', name: 'Подорож в гори', date: '2024-08-15', notes: 'Взяти намет', category: 'travel', repetition: 'none' },
    { id: '4', name: 'Зустріч з дизайнером', date: '2024-06-10', category: 'meeting', repetition: 'none' }, // past event
];

let authStateListener: ((user: User | null) => void) | null = null;
let eventSnapshotListeners: { [userId: string]: (events: PendlyEvent[]) => void } = {};

// --- MOCK AUTH ---

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
    authStateListener = callback;
    // Simulate initial state check
    setTimeout(() => {
        const storedUser = localStorage.getItem('pendly_user');
        if (storedUser) {
            MOCK_USER = JSON.parse(storedUser);
        }
        callback(MOCK_USER);
    }, 500);
    return () => { authStateListener = null; };
};

export const signIn = (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            MOCK_USER = {
                uid: 'mock-user-123',
                displayName: 'Тестовий Користувач',
                email: 'test.user@example.com',
            };
            localStorage.setItem('pendly_user', JSON.stringify(MOCK_USER));
            if (authStateListener) {
                authStateListener(MOCK_USER);
            }
            resolve();
        }, 1000);
    });
};

export const signOut = (): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            MOCK_USER = null;
            localStorage.removeItem('pendly_user');
            if (authStateListener) {
                authStateListener(null);
            }
            resolve();
        }, 500);
    });
};

// --- MOCK FIRESTORE ---

const triggerEventUpdate = (userId: string) => {
    if (eventSnapshotListeners[userId]) {
        eventSnapshotListeners[userId]([...MOCK_EVENTS]);
    }
};

export const onEventsSnapshot = (userId: string, callback: (events: PendlyEvent[]) => void): (() => void) => {
    eventSnapshotListeners[userId] = callback;
    // Simulate initial data fetch
    setTimeout(() => {
        triggerEventUpdate(userId);
    }, 1000);
    return () => { delete eventSnapshotListeners[userId]; };
};

export const addEvent = (userId: string, eventData: Omit<PendlyEvent, 'id'>): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const newEvent: PendlyEvent = {
                ...eventData,
                id: Math.random().toString(36).substr(2, 9),
            };
            MOCK_EVENTS.push(newEvent);
            triggerEventUpdate(userId);
            resolve();
        }, 500);
    });
};

export const deleteEvent = (userId: string, eventId: string): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const index = MOCK_EVENTS.findIndex(e => e.id === eventId);
            if (index > -1) {
                MOCK_EVENTS.splice(index, 1);
            }
            triggerEventUpdate(userId);
            resolve();
        }, 500);
    });
};
