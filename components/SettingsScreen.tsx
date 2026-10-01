import React, { useRef, useState } from 'react';
import type { Theme, User } from '../types';
import DeleteAccountDialog from './DeleteAccountDialog';
import { useI18n } from '../i18n/react';
import { LANGUAGES, type LangSetting, type MessageKey } from '../i18n';
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
    onDeleteAccount: () => Promise<void>;
}

const THEMES: { value: Theme; labelKey: MessageKey }[] = [
    { value: 'light', labelKey: 'settings.themeLight' },
    { value: 'dark', labelKey: 'settings.themeDark' },
    { value: 'system', labelKey: 'settings.themeSystem' },
];

const cardStyles = 'mb-6 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm ring-1 ring-slate-200/60 dark:ring-slate-700/60';
const secondaryButton = 'w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed';

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    user, theme, onThemeChange, calendarConnection, isSyncing, onConnectCalendar, onSyncNow,
    onDisconnect, onImportIcs, onExportAll, eventCount, onLogout, onDeleteAccount,
}) => {
    const { t, setting, setSetting } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onImportIcs(file);
        // Allow importing the same file again.
        e.target.value = '';
    };

    return (
        <div className="p-4 sm:p-6 text-slate-900 dark:text-slate-200">
            <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>

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
                <h3 className="font-medium text-base mb-3">{t('settings.theme')}</h3>
                <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-700" role="radiogroup" aria-label={t('settings.theme')}>
                    {THEMES.map(option => (
                        <button
                            key={option.value}
                            role="radio"
                            aria-checked={theme === option.value}
                            onClick={() => onThemeChange(option.value)}
                            className={`py-2 rounded-md text-sm font-medium transition-colors ${theme === option.value ? 'bg-white dark:bg-slate-900 text-violet-500 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-violet-500'}`}
                        >
                            {t(option.labelKey)}
                        </button>
                    ))}
                </div>

                <label htmlFor="language" className="block font-medium text-base mt-5 mb-3">{t('settings.language')}</label>
                <select
                    id="language"
                    value={setting}
                    onChange={e => setSetting(e.target.value as LangSetting)}
                    className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-base focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                    <option value="auto">{t('settings.languageAuto')}</option>
                    {LANGUAGES.map(l => <option key={l.value} value={l.value} lang={l.value}>{l.name}</option>)}
                </select>
            </div>

            <div className={cardStyles}>
                <h3 className="font-medium text-base mb-2">{t('settings.calendarTitle')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t('settings.calendarHint')}
                </p>
                {calendarConnection ? (
                    <div className="space-y-4">
                        <p className="text-sm text-green-600 dark:text-green-400">{t('settings.connected')} <span className="font-semibold break-all">{calendarConnection}</span></p>
                        <div className="flex items-center gap-2">
                            <button onClick={onSyncNow} disabled={isSyncing} className={secondaryButton}>
                                {isSyncing ? <><SyncIcon className="h-5 w-5 animate-spin" /> {t('settings.syncing')}</> : <><SyncIcon /> {t('settings.sync')}</>}
                            </button>
                            <button
                                onClick={onDisconnect}
                                disabled={isSyncing}
                                className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors disabled:opacity-50"
                                aria-label={t('settings.disconnect')}
                                title={t('settings.disconnect')}
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
                        {isSyncing ? <><SpinnerIcon /> {t('settings.connecting')}</> : <><GoogleIcon /> {t('settings.connect')}</>}
                    </button>
                )}
            </div>

            <div className={cardStyles}>
                <h3 className="font-medium text-base mb-2">{t('settings.importExport')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t('settings.importExportHint')}
                </p>
                <input ref={fileInputRef} type="file" accept=".ics,text/calendar" className="hidden" onChange={handleFileChange} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className={secondaryButton}>
                        <ImportIcon /> {t('settings.importIcs')}
                    </button>
                    <button onClick={onExportAll} disabled={eventCount === 0} className={secondaryButton}>
                        <CalendarPlusIcon /> {t('settings.export', { count: eventCount })}
                    </button>
                </div>
            </div>

            <button onClick={onLogout} className="w-full bg-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-violet-600 transition-colors text-base">
                {t('settings.logout')}
            </button>

            <div className="mt-8 flex flex-col items-center gap-3 text-sm">
                <button onClick={() => setIsDeleteOpen(true)} className="text-red-600 dark:text-red-400 hover:underline">
                    {t('settings.deleteAccount')}
                </button>
                <a href="/privacy.html" target="_blank" rel="noopener" className="text-slate-500 dark:text-slate-400 hover:underline">
                    {t('login.privacy')}
                </a>
            </div>

            <DeleteAccountDialog
                isOpen={isDeleteOpen}
                eventCount={eventCount}
                onCancel={() => setIsDeleteOpen(false)}
                onConfirm={onDeleteAccount}
            />
        </div>
    );
};

export default SettingsScreen;
