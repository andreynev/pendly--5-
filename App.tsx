
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signIn, signOut, onEventsSnapshot, addEvent as addEventToDb, deleteEvent as deleteEventFromDb } from './services/firebase';
import { connectCalendar, disconnectCalendar, fetchCalendarEvents, transformGoogleEvent, getCalendarConnectionStatus } from './services/calendarApi';
import type { PendlyEvent, User, Theme, Screen } from './types';
import { calculateNextOccurrence } from './utils/dateUtils';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import EventList from './components/EventList';
import BottomNav from './components/BottomNav';
import EventModal from './components/EventModal';
import { AddIcon, GoogleIcon, SpinnerIcon, SyncIcon, DisconnectIcon } from './components/Icons';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null | undefined>(undefined);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [activeScreen, setActiveScreen] = useState<Screen>('home');
    const [events, setEvents] = useState<PendlyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [calendarConnection, setCalendarConnection] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                });
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user === undefined) return;
        if (user === null) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onEventsSnapshot(user.uid, (snapshot) => {
            setEvents(snapshot);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        getCalendarConnectionStatus().then(status => {
            if (status) {
                setCalendarConnection(status);
            }
        });
    }, []);
    
    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    const handleLogin = async () => {
        await signIn();
    };

    const handleLogout = async () => {
        await signOut();
        setUser(null);
        setActiveScreen('home');
    };

    const handleAddEvent = async (event: Omit<PendlyEvent, 'id' | 'userId'>) => {
        if (!user) return;
        await addEventToDb(user.uid, event);
        setIsModalOpen(false);
    };
    
    const handleDeleteEvent = useCallback(async (eventId: string) => {
        if (!user) return;
        await deleteEventFromDb(user.uid, eventId);
    }, [user]);
    
    const handleSyncNow = useCallback(async () => {
        if (!user) return;
        setIsSyncing(true);
        try {
            const googleEvents = await fetchCalendarEvents();
            const existingSourceIds = new Set(events.map(e => e.sourceEventId).filter(Boolean));
            
            const newEvents = googleEvents.filter(ge => !existingSourceIds.has(ge.id));

            if (newEvents.length === 0) {
                alert('Ваш календар вже синхронізовано. Нових подій не знайдено.');
                setIsSyncing(false);
                return;
            }

            const eventsToAdd = newEvents.map(transformGoogleEvent);

            for (const eventData of eventsToAdd) {
                await addEventToDb(user.uid, eventData);
            }
            alert(`${eventsToAdd.length} нових подій було успішно імпортовано з Google Calendar!`);

        } catch (error) {
            console.error("Error syncing calendar:", error);
            alert(`Не вдалося синхронізувати з календарем. ${error instanceof Error ? error.message : ''}`);
        } finally {
            setIsSyncing(false);
        }
    }, [user, events]);

    const handleConnectCalendar = async () => {
        setIsSyncing(true); // Use isSyncing to show loading on connect button
        try {
            const email = await connectCalendar();
            setCalendarConnection(email);
            // Trigger initial sync after connecting
            await handleSyncNow();
        } catch (error) {
            console.error("Error connecting calendar:", error);
            alert(`Не вдалося підключити календар. ${error instanceof Error ? error.message : ''}`);
             setIsSyncing(false);
        }
        // finally is handled in handleSyncNow
    };
    
    const handleDisconnect = async () => {
        await disconnectCalendar();
        setCalendarConnection(null);
        alert('Ви відключили синхронізацію з календарем.');
    };

    const { upcomingEvents, pastEvents } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const processedEvents = events.map(event => {
            const nextOccurrence = calculateNextOccurrence(event, now);
            return { ...event, displayDate: nextOccurrence };
        }).sort((a,b) => a.displayDate.getTime() - b.displayDate.getTime());

        const upcoming = processedEvents.filter(e => e.displayDate >= now);
        const past = events
            .filter(e => {
                const nextOccurrence = calculateNextOccurrence(e, now);
                return nextOccurrence < now;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { upcomingEvents: upcoming, pastEvents: past };
    }, [events]);

    if (user === undefined) {
        return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-900"><LoadingSpinner /></div>;
    }

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const renderContent = () => {
        switch (activeScreen) {
            case 'home':
                return <EventList events={upcomingEvents} isArchive={false} onDelete={handleDeleteEvent} loading={loading && events.length === 0} />;
            case 'archive':
                return <EventList events={pastEvents} isArchive={true} onDelete={handleDeleteEvent} loading={false} />;
            case 'settings':
                return (
                    <div className="p-6 text-slate-900 dark:text-slate-200">
                        <h2 className="text-2xl font-bold mb-6">Налаштування</h2>
                        <div className="mb-8 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm">
                            <p className="font-semibold text-lg">{user.displayName}</p>
                            <p className="text-base text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                        <div className="mb-6 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm">
                            <label htmlFor="theme-select" className="block font-medium mb-2 text-base">Тема</label>
                            <select id="theme-select" value={theme} onChange={(e) => handleThemeChange(e.target.value as Theme)} className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:ring-2 focus:ring-violet-500 focus:outline-none text-base">
                                <option value="light">Світла</option>
                                <option value="dark">Темна</option>
                                <option value="system">Системна</option>
                            </select>
                        </div>
                        
                        <div className="mb-6 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm">
                           <h3 className="font-medium text-base mb-2">Синхронізація з календарем</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                               Автоматично додавайте події з вашого Google Calendar.
                           </p>
                           {calendarConnection ? (
                               <div className="space-y-4">
                                   <p className="text-sm text-green-600 dark:text-green-400">Підключено як: <span className="font-semibold">{calendarConnection}</span></p>
                                   <div className="flex items-center gap-2">
                                       <button 
                                           onClick={handleSyncNow}
                                           disabled={isSyncing}
                                           className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                           {isSyncing ? <><SpinnerIcon /> Синхронізація...</> : <><SyncIcon /> Синхронізувати</>}
                                       </button>
                                       <button
                                           onClick={handleDisconnect}
                                           className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors"
                                           aria-label="Відключити"
                                           title="Відключити"
                                       >
                                           <DisconnectIcon />
                                       </button>
                                   </div>
                               </div>
                           ) : (
                               <button 
                                   onClick={handleConnectCalendar}
                                   disabled={isSyncing}
                                   className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600"
                               >
                                   {isSyncing ? <><SpinnerIcon /> Підключення...</> : <><GoogleIcon /> Підключити Google Calendar</>}
                               </button>
                           )}
                        </div>

                        <button onClick={handleLogout} className="w-full bg-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-600 transition-colors text-base">
                            Вийти
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300">
            <Header userName={user.displayName || 'User'} />
            
            <main className="relative z-10 mx-auto max-w-2xl px-4 -mt-20">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg min-h-[calc(100vh-220px)] pb-24">
                  {renderContent()}
              </div>
            </main>
            
            {activeScreen !== 'settings' && (
              <button
                  onClick={() => setIsModalOpen(true)}
                  className="fixed z-20 bottom-24 right-6 bg-violet-500 hover:bg-violet-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
                  aria-label="Add Event"
              >
                  <AddIcon />
              </button>
            )}

            <BottomNav activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
            
            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddEvent}
            />
        </div>
    );
};

export default App;