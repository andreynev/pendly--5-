
import React from 'react';
import { CalendarIcon } from './Icons';

interface EmptyStateProps {
    isArchive: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isArchive }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center h-full p-8 mt-10">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                 <CalendarIcon className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {isArchive ? 'Архів порожній' : 'Подій ще немає'}
            </h3>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {isArchive ? 'Тут будуть з\'являтися минулі події.' : 'Додайте свою першу подію, щоб почати відлік!'}
            </p>
        </div>
    );
};

export default EmptyState;