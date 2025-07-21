
import type { Category, Repetition } from './types';

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'holiday', label: 'Свято', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  { value: 'meeting', label: 'Зустріч', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
  { value: 'work', label: 'Робота', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
  { value: 'travel', label: 'Подорож', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
  { value: 'other', label: 'Інше', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
];

export const REPETITIONS: { value: Repetition; label: string }[] = [
  { value: 'none', label: 'Не повторювати' },
  { value: 'weekly', label: 'Щотижня' },
  { value: 'monthly', label: 'Щомісяця' },
  { value: 'yearly', label: 'Щороку' },
];
