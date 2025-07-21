
import React, { useState, useEffect } from 'react';
import type { PendlyEvent, Category, Repetition } from '../types';
import { CATEGORIES, REPETITIONS } from '../constants';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<PendlyEvent, 'id' | 'displayDate'>) => void;
    event?: PendlyEvent;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState<Category>('other');
    const [notes, setNotes] = useState('');
    const [repetition, setRepetition] = useState<Repetition>('none');

    useEffect(() => {
        if (isOpen) {
            if (event) {
                setName(event.name);
                setDate(event.date);
                setTime(event.time || '');
                setLocation(event.location || '');
                setCategory(event.category);
                setNotes(event.notes || '');
                setRepetition(event.repetition);
            } else {
                const today = new Date().toISOString().split('T')[0];
                setName('');
                setDate(today);
                setTime('');
                setLocation('');
                setCategory('other');
                setNotes('');
                setRepetition('none');
            }
        }
    }, [event, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date) {
            alert('Назва та дата є обов\'язковими.');
            return;
        }
        onSave({ name, date, time, location, category, notes, repetition });
    };

    if (!isOpen) return null;
    
    const inputStyles = "mt-1 block w-full p-3 rounded-md border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    {event ? 'Редагувати подію' : 'Нова подія'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-base font-medium text-slate-700 dark:text-slate-300">Назва події</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="date" className="block text-base font-medium text-slate-700 dark:text-slate-300">Дата</label>
                             <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-base font-medium text-slate-700 dark:text-slate-300">Час (необов'язково)</label>
                            <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className={inputStyles} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-base font-medium text-slate-700 dark:text-slate-300">Категорія</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value as Category)} className={inputStyles}>
                            {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="repetition" className="block text-base font-medium text-slate-700 dark:text-slate-300">Повторення</label>
                        <select id="repetition" value={repetition} onChange={e => setRepetition(e.target.value as Repetition)} className={inputStyles}>
                            {REPETITIONS.map(rep => <option key={rep.value} value={rep.value}>{rep.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="location" className="block text-base font-medium text-slate-700 dark:text-slate-300">Місце (необов'язково)</label>
                        <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-base font-medium text-slate-700 dark:text-slate-300">Нотатки</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputStyles} />
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-base font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Скасувати
                        </button>
                        <button type="submit" className="px-5 py-2.5 text-base font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors">
                            Зберегти
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;