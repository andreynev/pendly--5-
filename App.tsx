import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    onAuthStateChanged, signIn, signOut, onEventsSnapshot,
    addEvent as addEventToDb, addEvents as addEventsToDb, updateEvent as updateEventInDb,
    deleteEvent as deleteEventFromDb, restoreEvent as restoreEventInDb,
} from './services/firebase';
import { connectCalendar, disconnectCalendar, fetchCalendarEvents, transformGoogleEvent, getCalendarConnectionStatus } from './services/calendarApi';
import type { PendlyEvent, User, Theme, Screen, Category, EventInput } from './types';
import { calculateNextOccurrence, daysUntil, parseLocalDate, pluralizeDays, pluralizeUk, startOfToday } from './utils/dateUtils';
import { downloadAllEventsIcs } from './utils/calendarUtils';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import EventList from './components/EventList';
import BottomNav from './components/BottomNav';
import EventModal from './components/EventModal';
import SettingsScreen from './components/SettingsScreen';
import FilterBar from './components/FilterBar';
import { ToastProvider, useToast } from './components/Toast';
import { AddIcon } from './components/Icons';
import LoadingSpinner from './components/LoadingSpinner';

const readStoredTheme = (): Theme => {
    try {
        const stored = localStorage.getItem('theme');
        return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    } catch {
        return 'system';
    }
};

/** Returns today's date at midnight and refreshes it when the day changes. */
const useToday = (): Date => {
    const [today, setToday] = useState(startOfToday);
    useEffect(() => {
        const refresh = () => {
            const next = startOfToday();
            setToday(prev => (prev.getTime() === next.getTime() ? prev : next));
        };
        const interval = setInterval(refresh, 60 * 1000);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, []);
    return today;
};

const PendlyApp: React.FC = () => {
    const toast = useToast();
    const today = useToday();
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [theme, setTheme] = useState<Theme>(readStoredTheme);
    const [activeScreen, setActiveScreen] = useState<Screen>('home');
    const [events, setEvents] = useState<PendlyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<PendlyEvent | null>(null);
    const [calendarConnection, setCalendarConnection] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

    useEffect(() => {
        return onAuthStateChanged((authUser) => {
            setUser(authUser ? { uid: authUser.uid, displayName: authUser.displayName, email: authUser.email } : null);
        });
    }, []);

    useEffect(() => {
        if (user === undefined) return;
        if (user === null) {
            setEvents([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        return onEventsSnapshot(user.uid, (snapshot) => {
            setEvents(snapshot);
            setLoading(false);
        });
    }, [user]);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const isDark = theme === 'dark' || (theme === 'system' && media.matches);
            document.documentElement.classList.toggle('dark', isDark);
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0f172a' : '#8b5cf6');
        };
        apply();
        try {
            localStorage.setItem('theme', theme);
        } catch {
            // Storage may be unavailable (private mode); the theme still applies for this session.
        }
        // Follow OS theme changes while "system" is selected.
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);

    useEffect(() => {
        getCalendarConnectionStatus().then(setCalendarConnection);
    }, []);

    const handleLogout = async () => {
        await signOut();
        setActiveScreen('home');
        setSearch('');
        setCategoryFilter('all');
    };

    const openCreateModal = () => {
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const openEditModal = useCallback((event: PendlyEvent) => {
        setEditingEvent(event);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingEvent(null);
    }, []);

    const handleSaveEvent = async (eventData: EventInput) => {
        if (!user) return;
        if (editingEvent) {
            await updateEventInDb(user.uid, editingEvent.id, eventData);
            toast('Подію оновлено', { kind: 'success' });
        } else {
            await addEventToDb(user.uid, eventData);
            const days = daysUntil(calculateNextOccurrence(eventData, today), today);
            toast(days > 0 ? `Подію додано — залишилось ${days} ${pluralizeDays(days)}` : 'Подію додано', { kind: 'success' });
        }
        closeModal();
    };

    const handleDeleteEvent = useCallback(async (event: PendlyEvent) => {
        if (!user) return;
        await deleteEventFromDb(user.uid, event.id);
        toast(`«${event.name}» видалено`, {
            action: { label: 'Повернути', onClick: () => { restoreEventInDb(user.uid, event); } },
        });
    }, [user, toast]);

    const importEvents = useCallback(async (incoming: EventInput[], sourceLabel: string) => {
        if (!user) return;
        const existingSourceIds = new Set(events.map(e => e.sourceEventId).filter(Boolean));
        const fresh = incoming.filter(e => !e.sourceEventId || !existingSourceIds.has(e.sourceEventId));
        if (fresh.length === 0) {
            toast(`${sourceLabel}: нових подій не знайдено.`);
            return;
        }
        await addEventsToDb(user.uid, fresh);
        toast(`${sourceLabel}: імпортовано ${fresh.length} ${pluralizeUk(fresh.length, 'подію', 'події', 'подій')}`, { kind: 'success' });
    }, [user, events, toast]);

    const handleSyncNow = useCallback(async () => {
        if (!user) return;
        setIsSyncing(true);
        try {
            const googleEvents = await fetchCalendarEvents();
            await importEvents(googleEvents.map(transformGoogleEvent), 'Google Calendar');
        } catch (error) {
            console.error("Error syncing calendar:", error);
            toast(`Не вдалося синхронізувати з календарем. ${error instanceof Error ? error.message : ''}`, { kind: 'error' });
        } finally {
            setIsSyncing(false);
        }
    }, [user, importEvents, toast]);

    const handleConnectCalendar = async () => {
        setIsSyncing(true);
        try {
            const email = await connectCalendar();
            setCalendarConnection(email);
        } catch (error) {
            console.error("Error connecting calendar:", error);
            toast(`Не вдалося підключити календар. ${error instanceof Error ? error.message : ''}`, { kind: 'error' });
            setIsSyncing(false);
            return;
        }
        // Initial sync after connecting; it manages isSyncing itself.
        await handleSyncNow();
    };

    const handleDisconnect = async () => {
        setIsSyncing(true);
        try {
            await disconnectCalendar();
            setCalendarConnection(null);
            toast('Синхронізацію з календарем відключено.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportIcs = async (file: File) => {
        try {
            const [text, { parseIcsFile }] = await Promise.all([file.text(), import('./utils/icsParser')]);
            const parsed = parseIcsFile(text).map(e => ({ ...e, source: 'ics' as const }));
            await importEvents(parsed, file.name);
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Не вдалося імпортувати файл.', { kind: 'error' });
        }
    };

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const processed = events.map(event => ({ ...event, displayDate: calculateNextOccurrence(event, today) }));

        const upcoming = processed
            .filter(e => e.displayDate >= today)
            .sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime() || (a.time || '').localeCompare(b.time || ''));
        const past = processed
            .filter(e => e.displayDate < today)
            .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events, today]);

    const applyFilters = useCallback((list: PendlyEvent[]) => {
        const query = search.trim().toLocaleLowerCase('uk-UA');
        return list.filter(e =>
            (categoryFilter === 'all' || e.category === categoryFilter) &&
            (!query || [e.name, e.location, e.notes].some(v => v?.toLocaleLowerCase('uk-UA').includes(query)))
        );
    }, [search, categoryFilter]);

    if (user === undefined) {
        return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-900"><LoadingSpinner /></div>;
    }

    if (!user) {
        return <LoginScreen onLogin={signIn} />;
    }

    const isFiltered = search.trim() !== '' || categoryFilter !== 'all';

    const renderContent = () => {
        switch (activeScreen) {
            case 'home':
            case 'archive': {
                const isArchive = activeScreen === 'archive';
                const source = isArchive ? pastEvents : upcomingEvents;
                return (
                    <>
                        {source.length > 0 && (
                            <FilterBar
                                search={search}
                                onSearchChange={setSearch}
                                category={categoryFilter}
                                onCategoryChange={setCategoryFilter}
                            />
                        )}
                        <EventList
                            events={applyFilters(source)}
                            isArchive={isArchive}
                            onDelete={handleDeleteEvent}
                            onEdit={openEditModal}
                            loading={!isArchive && loading && events.length === 0}
                            isFiltered={isFiltered && source.length > 0}
                        />
                    </>
                );
            }
            case 'settings':
                return (
                    <SettingsScreen
                        user={user}
                        theme={theme}
                        onThemeChange={setTheme}
                        calendarConnection={calendarConnection}
                        isSyncing={isSyncing}
                        onConnectCalendar={handleConnectCalendar}
                        onSyncNow={handleSyncNow}
                        onDisconnect={handleDisconnect}
                        onImportIcs={handleImportIcs}
                        onExportAll={() => downloadAllEventsIcs(events)}
                        eventCount={events.length}
                        onLogout={handleLogout}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300">
            <Header userName={user.displayName || 'User'} nextEvent={upcomingEvents[0]} today={today} />

            <main className="relative z-10 mx-auto max-w-2xl px-4 -mt-20">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg min-h-[calc(100vh-220px)] pb-28">
                  {renderContent()}
              </div>
            </main>

            {activeScreen !== 'settings' && (
              <button
                  onClick={openCreateModal}
                  className="fixed z-20 bottom-24 right-6 bg-violet-500 hover:bg-violet-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
                  aria-label="Додати подію"
                  title="Додати подію"
              >
                  <AddIcon />
              </button>
            )}

            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

            <EventModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSaveEvent}
                event={editingEvent}
            />
        </div>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <PendlyApp />
    </ToastProvider>
);

export default App;
