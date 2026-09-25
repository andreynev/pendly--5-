import React, { useRef } from 'react';
import type { Theme, User } from '../types';
import { GoogleIcon, SpinnerIcon, SyncIcon, DisconnectIcon, ImportIcon, CalendarPlusIcon } from './Icons';

interface SettingsScreenProps {
    user: User;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    calendarConnection: string | null;
    isSyncing: boolean;
    onConnectCalendar: () => void;
    onSyncNow: () => void;
    onDisconnect: () => void;
    onImportIcs: (file: File) => void;
    onExportAll: () => void;
    eventCount: number;
    onLogout: () => void;
}

const THEMES: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Світла' },
    { value: 'dark', label: 'Темна' },
    { value: 'system', label: 'Системна' },
];

const cardStyles = 'mb-6 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-700/60';
const secondaryButton = 'w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed';

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    user, theme, onThemeChange, calendarConnection, isSyncing, onConnectCalendar, onSyncNow,
    onDisconnect, onImportIcs, onExportAll, eventCount, onLogout,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onImportIcs(file);
        // Allow importing the same file again.
        e.target.value = '';
    };

    return (
        <div className="p-4 sm:p-6 text-slate-900 dark:text-slate-200">
            <h2 className="text-2xl font-bold mb-6">Налаштування</h2>

            <div className={`${cardStyles} flex items-center gap-4`}>
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-violet-500 text-white flex items-center justify-center text-xl font-bold" aria-hidden="true">
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-lg truncate">{user.displayName}</p>
                    <p className="text-base text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
            </div>

            <div className={cardStyles}>
                <h3 className="font-medium text-base mb-3">Тема</h3>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-700" role="radiogroup" aria-label="Тема">
                    {THEMES.map(t => (
                        <button
                            key={t.value}
                            role="radio"
                            aria-checked={theme === t.value}
                            onClick={() => onThemeChange(t.value)}
                            className={`py-2 rounded-md text-sm font-medium transition-colors ${theme === t.value ? 'bg-white dark:bg-slate-900 text-violet-500 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-violet-500'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={cardStyles}>
                <h3 className="font-medium text-base mb-2">Синхронізація з Google Calendar</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Події з основного календаря (від місяця тому до року вперед) додаються в Pendly, а змінені — оновлюються.
                    Доступ лише для читання: Pendly нічого не змінює у вашому календарі.
                </p>
                {calendarConnection ? (
                    <div className="space-y-4">
                        <p className="text-sm text-green-600 dark:text-green-400">Підключено: <span className="font-semibold break-all">{calendarConnection}</span></p>
                        <div className="flex items-center gap-2">
                            <button onClick={onSyncNow} disabled={isSyncing} className={secondaryButton}>
                                {isSyncing ? <><SyncIcon className="h-5 w-5 animate-spin" /> Синхронізація…</> : <><SyncIcon /> Синхронізувати</>}
                            </button>
                            <button
                                onClick={onDisconnect}
                                disabled={isSyncing}
                                className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors disabled:opacity-50"
                                aria-label="Відключити Google Calendar"
                                title="Відключити Google Calendar"
                            >
                                <DisconnectIcon />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onConnectCalendar}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600"
                    >
                        {isSyncing ? <><SpinnerIcon /> Підключення...</> : <><GoogleIcon /> Підключити Google Calendar</>}
                    </button>
                )}
            </div>

            <div className={cardStyles}>
                <h3 className="font-medium text-base mb-2">Імпорт та експорт</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Імпортуйте події з файлу .ics (Apple, Outlook, Google) або збережіть усі свої події в один файл.
                </p>
                <input ref={fileInputRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={handleFileChange} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className={secondaryButton}>
                        <ImportIcon /> Імпорт .ics
                    </button>
                    <button onClick={onExportAll} disabled={eventCount === 0} className={secondaryButton}>
                        <CalendarPlusIcon /> Експорт ({eventCount})
                    </button>
                </div>
            </div>

            <button onClick={onLogout} className="w-full bg-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-600 transition-colors text-base">
                Вийти
            </button>
        </div>
    );
};

export default SettingsScreen;
