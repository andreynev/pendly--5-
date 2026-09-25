import React, { useState, useEffect, useRef } from 'react';
import type { PendlyEvent, Category, Repetition, EventInput } from '../types';
import { CATEGORIES, REPETITIONS } from '../constants';
import { toLocalDateString } from '../utils/dateUtils';
import { downloadIcsFile } from '../utils/calendarUtils';
import { CalendarPlusIcon } from './Icons';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: EventInput) => Promise<void> | void;
    event?: PendlyEvent | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState<Category>('other');
    const [notes, setNotes] = useState('');
    const [repetition, setRepetition] = useState<Repetition>('none');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setName(event?.name ?? '');
        setDate(event?.date ?? toLocalDateString(new Date()));
        setTime(event?.time ?? '');
        setLocation(event?.location ?? '');
        setCategory(event?.category ?? 'other');
        setNotes(event?.notes ?? '');
        setRepetition(event?.repetition ?? 'none');
        setError('');
        setIsSaving(false);
        // Focus after the modal has rendered.
        setTimeout(() => nameInputRef.current?.focus(), 0);
    }, [event, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName || !date) {
            setError('Назва та дата є обов\'язковими.');
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                // Preserve import metadata when editing a synced event.
                ...(event?.source ? { source: event.source } : {}),
                ...(event?.sourceEventId ? { sourceEventId: event.sourceEventId } : {}),
                name: trimmedName,
                date,
                time,
                location: location.trim(),
                category,
                notes: notes.trim(),
                repetition,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не вдалося зберегти подію.');
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const inputStyles = "mt-1 block w-full p-3 rounded-md border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition";
    const labelStyles = "block text-base font-medium text-slate-700 dark:text-slate-300";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-modal-title"
                className="animate-fade-in bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md sm:m-4 p-6 max-h-[92vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="event-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {event ? 'Редагувати подію' : 'Нова подія'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label htmlFor="name" className={labelStyles}>Назва події</label>
                        <input ref={nameInputRef} type="text" id="name" value={name} onChange={e => setName(e.target.value)} required maxLength={120} className={inputStyles} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="date" className={labelStyles}>Дата</label>
                             <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="time" className={labelStyles}>Час</label>
                            <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className={inputStyles} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className={labelStyles}>Категорія</label>
                            <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} className={inputStyles}>
                                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="repetition" className={labelStyles}>Повторення</label>
                            <select id="repetition" value={repetition} onChange={e => setRepetition(e.target.value as Repetition)} className={inputStyles}>
                                {REPETITIONS.map(rep => <option key={rep.value} value={rep.value}>{rep.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="location" className={labelStyles}>Місце <span className="text-sm font-normal text-slate-400">(необов'язково)</span></label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="notes" className={labelStyles}>Нотатки</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputStyles} />
                    </div>

                    {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        {event && (
                            <button
                                type="button"
                                onClick={() => downloadIcsFile(event)}
                                className="mr-auto p-2.5 rounded-lg text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:text-violet-500 transition-colors"
                                aria-label="Додати в календар (.ics)"
                                title="Додати в календар (.ics)"
                            >
                                <CalendarPlusIcon />
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-base font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Скасувати
                        </button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-base font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50">
                            {isSaving ? 'Збереження…' : 'Зберегти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
