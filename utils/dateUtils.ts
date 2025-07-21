
import type { PendlyEvent } from '../types';

export const daysUntil = (date: Date): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const calculateNextOccurrence = (event: PendlyEvent, today: Date): Date => {
    const [year, month, day] = event.date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0,0,0,0);

    if (event.repetition === 'none') {
        return startDate;
    }

    let nextDate = new Date(startDate.getTime());

    if (nextDate >= today) {
        return nextDate;
    }
    
    switch (event.repetition) {
        case 'weekly':
            while (nextDate < today) {
                nextDate.setDate(nextDate.getDate() + 7);
            }
            break;
        case 'monthly':
            while (nextDate < today) {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
            break;
        case 'yearly':
            while (nextDate < today) {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            break;
    }

    return nextDate;
};

export const formatDate = (date: Date, includeTime: string | undefined): string => {
  const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
  };
  let dateString = date.toLocaleDateString('uk-UA', options);
  if(includeTime) {
      dateString += `, ${includeTime}`;
  }
  return dateString;
};
