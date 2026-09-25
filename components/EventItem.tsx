import React from 'react';
import type { PendlyEvent } from '../types';
import { CATEGORIES, REPETITIONS } from '../constants';
import { daysUntil, formatDate, parseLocalDate, pluralizeDays } from '../utils/dateUtils';
import { downloadIcsFile } from '../utils/calendarUtils';
import { TrashIcon, CalendarPlusIcon, GoogleCalendarIcon, RepeatIcon } from './Icons';

interface EventItemProps {
    event: PendlyEvent;
    isArchive: boolean;
    onDelete: (event: PendlyEvent) => void;
    onEdit: (event: PendlyEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, isArchive, onDelete, onEdit }) => {
    const categoryInfo = CATEGORIES.find(c => c.value === event.category);
    const repetitionLabel = REPETITIONS.find(r => r.value === event.repetition)?.label;

    const displayDate = event.displayDate || parseLocalDate(event.date);
    const days = daysUntil(displayDate);
    const isPast = isArchive || days < 0;
    const isToday = !isPast && days === 0;
    const countdownValue = Math.abs(days);

    const countdownLabel = isToday
        ? 'сьогодні'
        : isPast
            ? `${pluralizeDays(countdownValue)} тому`
            : pluralizeDays(countdownValue);

    const stop = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onEdit(event)}
            onKeyDown={e => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onEdit(event);
                }
            }}
            aria-label={`${event.name}: редагувати`}
            className="animate-fade-in relative flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm transition-shadow hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
            <div className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex flex-col items-center justify-center text-center transition-colors
                ${isPast
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    : isToday
                        ? 'bg-violet-500 text-white'
                        : 'bg-violet-100 dark:bg-violet-900/50 text-violet-900 dark:text-violet-300'}`}>
                {isToday ? (
                    <span className="text-lg font-bold uppercase">Сьогодні</span>
                ) : (
                    <>
                        <span className="text-3xl sm:text-4xl font-bold leading-none">{countdownValue}</span>
                        <span className="text-xs font-medium uppercase tracking-wider mt-1">{countdownLabel}</span>
                    </>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <h3 className={`pr-[4.5rem] text-lg sm:text-xl font-bold truncate ${isArchive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{event.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    {categoryInfo && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryInfo.color}`}>{categoryInfo.label}</span>}
                    {event.repetition !== 'none' && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400" title={repetitionLabel}>
                            <RepeatIcon className="w-3.5 h-3.5" /> {repetitionLabel}
                        </span>
                    )}
                    {event.source === 'google' && (
                        <span title="Імпортовано з Google Calendar">
                            <GoogleCalendarIcon className="w-4 h-4" />
                        </span>
                    )}
                </div>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate mt-1">
                    {formatDate(displayDate, event.time)}
                    {event.location && ` · ${event.location}`}
                </p>
                {event.notes && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 italic truncate">{event.notes}</p>}
            </div>
            <div className="absolute top-3 right-3 flex items-center gap-1">
                {!isArchive && (
                    <button
                        onClick={e => { stop(e); downloadIcsFile(event); }}
                        className="p-2 rounded-full text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        aria-label="Додати в календар"
                        title="Додати в календар"
                    >
                        <CalendarPlusIcon />
                    </button>
                )}
                <button
                    onClick={e => { stop(e); onDelete(event); }}
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
