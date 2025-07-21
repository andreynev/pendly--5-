import React from 'react';
import type { PendlyEvent } from '../types';
import { CATEGORIES } from '../constants';
import { daysUntil, formatDate } from '../utils/dateUtils';
import { downloadIcsFile } from '../utils/calendarUtils';
import { TrashIcon, CalendarPlusIcon, GoogleCalendarIcon } from './Icons';

interface EventItemProps {
    event: PendlyEvent;
    isArchive: boolean;
    onDelete: (id: string) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, isArchive, onDelete }) => {
    const categoryInfo = CATEGORIES.find(c => c.value === event.category);

    const days = event.displayDate ? daysUntil(event.displayDate) : 0;
    const isPast = days < 0;

    const countdownText = () => {
        if (isArchive || isPast) return 'минуло';
        if (days === 0) return 'сьогодні';
        if (days === 1) return 'день';
        return 'днів';
    };

    const countdownValue = isArchive || isPast ? Math.abs(days) : days;
    
    return (
        <div 
            className="relative flex items-center gap-4 p-5 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        >
            <div className={`flex-shrink-0 w-24 h-24 rounded-xl flex flex-col items-center justify-center text-center transition-colors
                ${isArchive || isPast ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-violet-100 dark:bg-violet-900/50 text-violet-900 dark:text-violet-300'}`}>
                <span className="text-4xl font-bold">{countdownValue}</span>
                <span className="text-sm font-medium uppercase tracking-wider">{countdownText()}</span>
            </div>
            <div className="flex-grow overflow-hidden">
                <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-bold truncate ${isArchive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{event.name}</h3>
                    {categoryInfo && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryInfo.color}`}>{categoryInfo.label}</span>}
                    {event.source === 'google' && (
                        <div title="Імпортовано з Google Calendar">
                            <GoogleCalendarIcon className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                </div>
                <p className="text-base text-slate-500 dark:text-slate-400 truncate mt-1">
                    {formatDate(event.displayDate || new Date(event.date), event.time)}
                    {event.location && ` · ${event.location}`}
                </p>
                {event.notes && <p className="text-base text-slate-400 dark:text-slate-500 mt-1 italic truncate">{event.notes}</p>}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1">
                {!isArchive && (
                    <button
                        onClick={() => downloadIcsFile(event)}
                        className="p-2 rounded-full text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        aria-label="Додати в календар"
                        title="Додати в календар"
                    >
                        <CalendarPlusIcon />
                    </button>
                )}
                <button
                    onClick={() => onDelete(event.id)}
                    className="p-2 rounded-full text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Видалити подію"
                    title="Видалити подію"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};

export default EventItem;