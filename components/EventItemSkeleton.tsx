
import React from 'react';

const EventItemSkeleton: React.FC = () => {
    return (
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/50 rounded-2xl shadow-sm">
            <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            <div className="flex-grow space-y-4 w-full">
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
        </div>
    );
};

export default EventItemSkeleton;
