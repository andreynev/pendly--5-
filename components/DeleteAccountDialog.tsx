import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SpinnerIcon } from './Icons';

interface DeleteAccountDialogProps {
    isOpen: boolean;
    eventCount: number;
    onCancel: () => void;
    onConfirm: () => Promise<void>;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ isOpen, eventCount, onCancel, onConfirm }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsDeleting(false);
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, isDeleting, onCancel]);

    if (!isOpen) return null;

    // Kept synchronous up to onConfirm so a sign-in popup (if needed) opens from the tap.
    const handleConfirm = () => {
        setIsDeleting(true);
        setError('');
        onConfirm().catch(err => {
            setError(err instanceof Error ? err.message : 'Не вдалося видалити акаунт.');
            setIsDeleting(false);
        });
    };

    // Portal to <body>: inside the page content it would sit under the bottom navigation.
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && onCancel()}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                aria-describedby="delete-account-text"
                className="animate-fade-in bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md sm:m-4 p-6"
                onClick={e => e.stopPropagation()}
            >
                <h2 id="delete-account-title" className="text-xl font-bold text-slate-900 dark:text-white">Видалити акаунт?</h2>
                <div id="delete-account-text" className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                        Буде назавжди видалено ваш акаунт Pendly і всі події
                        {eventCount > 0 ? ` (${eventCount})` : ''}. Відновити їх буде неможливо.
                    </p>
                    <p>Ваш Google-акаунт і Google Calendar не зміняться. Можливо, Google попросить підтвердити вхід.</p>
                </div>
                {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="px-5 py-2.5 text-base font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-5 py-2.5 text-base font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                        {isDeleting ? <><SpinnerIcon /> Видалення…</> : 'Видалити назавжди'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default DeleteAccountDialog;
