import type { PendlyEvent } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Formats a Date as a local "YYYY-MM-DD" string (no UTC shift). */
export const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/** Parses a "YYYY-MM-DD" string as a local date at midnight. */
export const parseLocalDate = (value: string): Date => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const startOfToday = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

export const daysUntil = (date: Date, today: Date = startOfToday()): number => {
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    // Math.round absorbs the ±1h difference on daylight-saving transitions.
    return Math.round((eventDate.getTime() - today.getTime()) / MS_PER_DAY);
};

/** Builds a date, clamping the day to the month's length (e.g. Jan 31 + 1 month -> Feb 28/29). */
const clampedDate = (year: number, month: number, day: number): Date => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
};

export const calculateNextOccurrence = (event: Pick<PendlyEvent, 'date' | 'repetition'>, today: Date): Date => {
    const startDate = parseLocalDate(event.date);

    if (event.repetition === 'none' || startDate >= today) {
        return startDate;
    }

    const day = startDate.getDate();

    switch (event.repetition) {
        case 'weekly': {
            const weeks = Math.ceil(daysUntil(today, startDate) / 7);
            const next = new Date(startDate);
            next.setDate(next.getDate() + weeks * 7);
            return next;
        }
        case 'monthly': {
            let months = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
            let next = clampedDate(startDate.getFullYear(), startDate.getMonth() + months, day);
            if (next < today) {
                months += 1;
                next = clampedDate(startDate.getFullYear(), startDate.getMonth() + months, day);
            }
            return next;
        }
        case 'yearly': {
            let year = today.getFullYear();
            let next = clampedDate(year, startDate.getMonth(), day);
            if (next < today) {
                year += 1;
                next = clampedDate(year, startDate.getMonth(), day);
            }
            return next;
        }
    }

    return startDate;
};

/** Picks the correct Ukrainian plural form: 1 день, 2 дні, 5 днів, 21 день. */
export const pluralizeUk = (count: number, one: string, few: string, many: string): string => {
    const n = Math.abs(count) % 100;
    const n10 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n10 === 1) return one;
    if (n10 >= 2 && n10 <= 4) return few;
    return many;
};

export const pluralizeDays = (count: number): string => pluralizeUk(count, 'день', 'дні', 'днів');

export const formatDate = (date: Date, includeTime: string | undefined): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    let dateString = date.toLocaleDateString('uk-UA', options);
    if (includeTime) {
        dateString += `, ${includeTime}`;
    }
    return dateString;
};
