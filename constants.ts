import type { Category, Repetition } from './types';
import type { MessageKey } from './i18n';

export const CATEGORIES: { value: Category; labelKey: MessageKey; color: string }[] = [
  { value: 'holiday', labelKey: 'category.holiday', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  { value: 'meeting', labelKey: 'category.meeting', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'work', labelKey: 'category.work', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  { value: 'travel', labelKey: 'category.travel', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  { value: 'other', labelKey: 'category.other', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
];

export const REPETITIONS: { value: Repetition; labelKey: MessageKey }[] = [
  { value: 'none', labelKey: 'repeat.none' },
  { value: 'weekly', labelKey: 'repeat.weekly' },
  { value: 'monthly', labelKey: 'repeat.monthly' },
  { value: 'yearly', labelKey: 'repeat.yearly' },
];
