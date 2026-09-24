import { initializeApp } from 'firebase/app';
import {
    GoogleAuthProvider,
    browserLocalPersistence,
    connectAuthEmulator,
    getAuth,
    getRedirectResult,
    onAuthStateChanged as onFirebaseAuthStateChanged,
    reauthenticateWithPopup,
    reauthenticateWithRedirect,
    setPersistence,
    signInWithCredential,
    signInWithPopup,
    signInWithRedirect,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import {
    collection,
    connectFirestoreEmulator,
    deleteDoc,
    doc,
    initializeFirestore,
    onSnapshot,
    persistentLocalCache,
    persistentMultipleTabManager,
    serverTimestamp,
    setDoc,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import type { User, PendlyEvent, EventInput, Category, Repetition } from '../types';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'uk';

// Offline cache so the PWA works without a connection and syncs later.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
});

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    // Test hook for automated tests against the emulators (stripped from production builds).
    (window as unknown as Record<string, unknown>).__pendlyEmulatorSignIn = (name: string, email: string) =>
        signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, name, email_verified: true })))
            .then(credential => credential.user.uid);
}

const eventsCollection = (userId: string) => collection(db, 'users', userId, 'events');

// Keeps only the fields we store, so stray UI fields (e.g. displayDate) never reach Firestore.
const toStoredFields = (event: EventInput) => ({
    name: event.name,
    date: event.date,
    time: event.time ?? '',
    location: event.location ?? '',
    category: event.category,
    notes: event.notes ?? '',
    repetition: event.repetition,
    source: event.source,
    sourceEventId: event.sourceEventId,
});

// --- AUTH ---

const AUTH_ERRORS: Record<string, string> = {
    'auth/network-request-failed': 'Немає з\'єднання з інтернетом.',
    'auth/unauthorized-domain': 'Цей домен не дозволено для входу. Додайте його в Firebase → Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'Вхід через Google не увімкнено в Firebase → Authentication.',
    'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше.',
};

const toUserError = (error: unknown): Error => {
    const code = error instanceof FirebaseError ? error.code : '';
    return new Error(AUTH_ERRORS[code] ?? 'Не вдалося увійти. Спробуйте ще раз.');
};

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_PENDING_KEY = 'pendly_gcal_pending';

export interface CalendarAccess {
    accessToken: string;
    email: string;
}

type CalendarAccessListener = (access: CalendarAccess) => void;
let calendarAccessListener: CalendarAccessListener | null = null;
let pendingRedirectAccess: CalendarAccess | null = null;

/** Receives calendar access granted via a redirect flow (when popups were blocked). */
export const onCalendarAccessFromRedirect = (listener: CalendarAccessListener) => {
    calendarAccessListener = listener;
    if (pendingRedirectAccess) {
        listener(pendingRedirectAccess);
        pendingRedirectAccess = null;
    }
};

// Completes a redirect sign-in (used when popups are blocked) and surfaces errors.
const redirectResult = getRedirectResult(auth)
    .then(result => {
        const wasCalendarRequest = sessionStorage.getItem(CALENDAR_PENDING_KEY) === '1';
        sessionStorage.removeItem(CALENDAR_PENDING_KEY);
        const token = result && wasCalendarRequest ? GoogleAuthProvider.credentialFromResult(result)?.accessToken : undefined;
        if (result && token) {
            const access = { accessToken: token, email: result.user.email ?? '' };
            if (calendarAccessListener) calendarAccessListener(access);
            else pendingRedirectAccess = access;
        }
    })
    .catch(error => {
        sessionStorage.removeItem(CALENDAR_PENDING_KEY);
        console.error('Redirect sign-in failed:', error);
    });

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) =>
    onFirebaseAuthStateChanged(auth, firebaseUser => {
        callback(firebaseUser
            ? { uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email }
            : null);
    });

export const signIn = async (): Promise<void> => {
    await redirectResult;
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        const code = error instanceof FirebaseError ? error.code : '';
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
            // Installed PWAs on iOS and some browsers block popups; fall back to a full-page redirect.
            await signInWithRedirect(auth, provider);
            return;
        }
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            return;
        }
        console.error('Sign-in failed:', error);
        throw toUserError(error);
    }
};

export const signOut = (): Promise<void> => firebaseSignOut(auth);

/**
 * Asks the signed-in user for read-only access to their Google Calendar and
 * returns a short-lived (~1 hour) OAuth access token. Must be called from a
 * user gesture (click), because it may open a popup.
 * Resolves to null when the page is redirecting instead (popup blocked).
 */
export const requestCalendarAccess = async (): Promise<CalendarAccess | null> => {
    const user = auth.currentUser;
    if (!user) throw new Error('Спочатку увійдіть в обліковий запис.');
    const provider = new GoogleAuthProvider();
    provider.addScope(CALENDAR_SCOPE);
    provider.setCustomParameters({ login_hint: user.email ?? '' });
    try {
        const result = await reauthenticateWithPopup(user, provider);
        const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
        if (!token) throw new Error('Google не надав доступ до календаря.');
        return { accessToken: token, email: result.user.email ?? '' };
    } catch (error) {
        const code = error instanceof FirebaseError ? error.code : '';
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
            sessionStorage.setItem(CALENDAR_PENDING_KEY, '1');
            await reauthenticateWithRedirect(user, provider);
            return null;
        }
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
            throw new Error('Підключення скасовано.');
        }
        if (code === 'auth/user-mismatch') {
            throw new Error('Оберіть той самий Google-акаунт, яким ви увійшли в Pendly.');
        }
        if (error instanceof FirebaseError) throw toUserError(error);
        throw error;
    }
};

// --- DATABASE (users/{uid}/events/{eventId}) ---

export const onEventsSnapshot = (
    userId: string,
    callback: (events: PendlyEvent[]) => void,
    onError?: (error: Error) => void,
): (() => void) =>
    onSnapshot(
        eventsCollection(userId),
        snapshot => {
            callback(snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: String(data.name ?? ''),
                    date: String(data.date ?? ''),
                    time: data.time || undefined,
                    location: data.location || undefined,
                    category: (data.category ?? 'other') as Category,
                    notes: data.notes || undefined,
                    repetition: (data.repetition ?? 'none') as Repetition,
                    source: data.source,
                    sourceEventId: data.sourceEventId,
                };
            }).filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e.date)));
        },
        error => {
            console.error('Events listener failed:', error);
            onError?.(new Error('Не вдалося завантажити події.'));
        },
    );

// Writes are not awaited to the server: with the offline cache they resolve
// once the server confirms, which never happens while offline. The local
// snapshot updates immediately either way.
const fireAndLog = (promise: Promise<unknown>) => {
    promise.catch(error => console.error('Firestore write failed:', error));
};

export const addEvent = async (userId: string, eventData: EventInput): Promise<void> => {
    const ref = doc(eventsCollection(userId));
    fireAndLog(setDoc(ref, { ...toStoredFields(eventData), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
};

export const addEvents = async (userId: string, eventsData: EventInput[]): Promise<void> => {
    // Firestore batches are limited to 500 writes.
    for (let i = 0; i < eventsData.length; i += 450) {
        const batch = writeBatch(db);
        for (const eventData of eventsData.slice(i, i + 450)) {
            batch.set(doc(eventsCollection(userId)), { ...toStoredFields(eventData), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        fireAndLog(batch.commit());
    }
};

export const updateEvent = async (userId: string, eventId: string, eventData: EventInput): Promise<void> => {
    fireAndLog(updateDoc(doc(eventsCollection(userId), eventId), { ...toStoredFields(eventData), updatedAt: serverTimestamp() }));
};

export const updateEvents = async (userId: string, updates: { id: string; data: EventInput }[]): Promise<void> => {
    for (let i = 0; i < updates.length; i += 450) {
        const batch = writeBatch(db);
        for (const { id, data } of updates.slice(i, i + 450)) {
            batch.update(doc(eventsCollection(userId), id), { ...toStoredFields(data), updatedAt: serverTimestamp() });
        }
        fireAndLog(batch.commit());
    }
};

export const deleteEvent = async (userId: string, eventId: string): Promise<void> => {
    fireAndLog(deleteDoc(doc(eventsCollection(userId), eventId)));
};

/** Re-inserts a previously deleted event with the same id (used by "undo"). */
export const restoreEvent = async (userId: string, event: PendlyEvent): Promise<void> => {
    fireAndLog(setDoc(doc(eventsCollection(userId), event.id), { ...toStoredFields(event), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
};
