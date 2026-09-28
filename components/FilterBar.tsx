import React, { useEffect, useRef, useState } from 'react';
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

const roundButton = 'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-violet-500 transition-colors';

const FilterBar: React.FC<FilterBarProps> = ({ search, onSearchChange, category, onCategoryChange }) => {
    // Search stays collapsed to an icon until needed, so the list stays the focus.
    const [isSearchOpen, setIsSearchOpen] = useState(search !== '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchOpen) inputRef.current?.focus();
    }, [isSearchOpen]);

    const closeSearch = () => {
        onSearchChange('');
        setIsSearchOpen(false);
    };

    return (
        <div className="px-3 sm:px-5 pt-4 pb-1 flex items-center gap-2">
            {isSearchOpen ? (
                <div className="relative flex-grow min-w-0">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="search"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') closeSearch(); }}
                        placeholder="Пошук подій"
                        aria-label="Пошук подій"
                        className="w-full h-9 pl-9 pr-3 rounded-full bg-slate-100 dark:bg-slate-700/60 text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
                    />
                </div>
            ) : (
                <div
                    className="flex-grow min-w-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_85%,transparent)] pr-6"
                    role="group"
                    aria-label="Фільтр за категорією"
                >
                    <button className={chip(category === 'all')} aria-pressed={category === 'all'} onClick={() => onCategoryChange('all')}>Усі</button>
                    {CATEGORIES.map(c => (
                        <button key={c.value} className={chip(category === c.value)} aria-pressed={category === c.value} onClick={() => onCategoryChange(c.value)}>
                            {c.label}
                        </button>
                    ))}
                </div>
            )}
            {isSearchOpen ? (
                <button onClick={closeSearch} className={roundButton} aria-label="Закрити пошук" title="Закрити пошук">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            ) : (
                <button onClick={() => setIsSearchOpen(true)} className={roundButton} aria-label="Пошук подій" title="Пошук">
                    <SearchIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default FilterBar;
