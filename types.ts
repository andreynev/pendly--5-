
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export type Category = 'holiday' | 'meeting' | 'work' | 'travel' | 'other';
export type Repetition = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface PendlyEvent {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM"
  location?: string;
  category: Category;
  notes?: string;
  repetition: Repetition;
  displayDate?: Date; // Added for internal processing, not in DB
  source?: 'google'; // To identify synced events
  sourceEventId?: string; // To prevent duplicates
}

export type Theme = 'light' | 'dark' | 'system';
export type Screen = 'home' | 'archive' | 'settings';