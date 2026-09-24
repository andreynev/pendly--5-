import React from 'react';
import type { Category } from '../types';
import { CATEGORIES } from '../constants';
import { SearchIcon } from './Icons';

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    category: Category | 'all';
    onCategoryChange: (value: Category | 'all') => void;
}

const chip = (active: boolean) =>
    `flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active
        ? 'bg-violet-500 text-white'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`;

const FilterBar: React.FC<FilterBarProps> = ({ search, onSearchChange, category, onCategoryChange }) => (
    <div className="px-2 sm:px-4 pt-4 space-y-3">
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
                type="search"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Пошук подій"
                aria-label="Пошук подій"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Фільтр за категорією">
            <button className={chip(category === 'all')} aria-pressed={category === 'all'} onClick={() => onCategoryChange('all')}>Усі</button>
            {CATEGORIES.map(c => (
                <button key={c.value} className={chip(category === c.value)} aria-pressed={category === c.value} onClick={() => onCategoryChange(c.value)}>
                    {c.label}
                </button>
            ))}
        </div>
    </div>
);

export default FilterBar;
