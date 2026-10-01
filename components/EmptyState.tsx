import React from 'react';
import { CalendarIcon } from './Icons';
import { useI18n } from '../i18n/react';

interface EmptyStateProps {
    isFiltered?: boolean;
    /** There are past events, just nothing upcoming. */
    hasPast?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isFiltered = false, hasPast = false }) => {
    const { t } = useI18n();
    const title = t(isFiltered ? 'empty.noResults' : hasPast ? 'empty.noUpcoming' : 'empty.events');
    const subtitle = t(isFiltered ? 'empty.noResultsHint' : 'empty.eventsHint');

    return (
        <div className="flex flex-col items-center justify-center text-center h-full p-8 mt-10">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                 <CalendarIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{subtitle}</p>
        </div>
    );
};

export default EmptyState;
