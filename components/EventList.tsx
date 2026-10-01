import React, { useState } from 'react';
import type { PendlyEvent } from '../types';
import EventItem from './EventItem';
import EmptyState from './EmptyState';
import EventItemSkeleton from './EventItemSkeleton';
import { useI18n } from '../i18n/react';

interface EventListProps {
    upcoming: PendlyEvent[];
    past: PendlyEvent[];
    onDelete: (event: PendlyEvent) => void;
    onEdit: (event: PendlyEvent) => void;
    loading: boolean;
    isFiltered?: boolean;
}

const EventList: React.FC<EventListProps> = ({ upcoming, past, onDelete, onEdit, loading, isFiltered = false }) => {
    const { t } = useI18n();
    const [showPast, setShowPast] = useState(false);
    // While searching, past matches are shown right away so they aren't hidden behind the toggle.
    const isPastOpen = showPast || (isFiltered && past.length > 0);

    if (loading) {
        return (
            <div className="p-2 sm:p-4 space-y-3">
                {[...Array(3)].map((_, i) => <EventItemSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-4">
            {upcoming.length > 0 ? (
                <div className="space-y-3">
                    {upcoming.map(event => (
                        <EventItem key={event.id} event={event} isArchive={false} onDelete={onDelete} onEdit={onEdit} />
                    ))}
                </div>
            ) : (
                (!isFiltered || past.length === 0) && (
                    <EmptyState isFiltered={isFiltered} hasPast={past.length > 0} />
                )
            )}

            {past.length > 0 && (
                <div className="mt-6">
                    <button
                        onClick={() => setShowPast(open => !open)}
                        aria-expanded={isPastOpen}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <span>{t('past.toggle', { count: past.length })}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${isPastOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isPastOpen && (
                        <div className="mt-3 space-y-3">
                            {past.map(event => (
                                <EventItem key={event.id} event={event} isArchive onDelete={onDelete} onEdit={onEdit} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventList;
