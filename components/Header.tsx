import React from 'react';
import type { PendlyEvent } from '../types';
import { daysUntil, pluralizeDays } from '../utils/dateUtils';

interface HeaderProps {
    userName: string;
    nextEvent?: PendlyEvent;
    today: Date;
}

const BokehCircle: React.FC<{ className: string; animationDelay: string }> = ({ className, animationDelay }) => (
    <div
        className={`absolute rounded-full bg-white/10 filter blur-2xl animate-pulse ${className}`}
        style={{ animationDelay }}
    ></div>
);

const Header: React.FC<HeaderProps> = ({ userName, nextEvent, today }) => {
    const todayLabel = today.toLocaleDateString('uk-UA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let nextLabel: string | null = null;
    if (nextEvent?.displayDate) {
        const days = daysUntil(nextEvent.displayDate, today);
        nextLabel = days === 0
            ? `Сьогодні: ${nextEvent.name}`
            : days === 1
                ? `Завтра: ${nextEvent.name}`
                : `Найближча: ${nextEvent.name} — через ${days} ${pluralizeDays(days)}`;
    }

    return (
        <header className="relative h-56 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-300 rounded-b-3xl overflow-hidden p-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white shadow-lg">
            <div className="absolute inset-0" aria-hidden="true">
                <BokehCircle className="w-48 h-48 -top-10 -left-10" animationDelay="0s" />
                <BokehCircle className="w-32 h-32 -bottom-10 right-20" animationDelay="1s" />
                <BokehCircle className="w-40 h-40 top-10 -right-16" animationDelay="2s" />
            </div>
            <div className="relative z-10 mx-auto max-w-2xl">
                <h1 className="text-3xl sm:text-4xl font-bold drop-shadow-sm">Привіт, {userName.split(' ')[0]}!</h1>
                <p className="text-base opacity-90 mt-1 drop-shadow-sm first-letter:uppercase">{todayLabel}</p>
                {nextLabel && <p className="text-sm font-medium mt-2 drop-shadow-sm truncate">{nextLabel}</p>}
            </div>
        </header>
    );
};

export default Header;
