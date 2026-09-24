import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastKind = 'info' | 'success' | 'error';

interface ToastOptions {
    kind?: ToastKind;
    action?: { label: string; onClick: () => void };
    durationMs?: number;
}

interface ToastItem extends ToastOptions {
    id: number;
    message: string;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);

const KIND_STYLES: Record<ToastKind, string> = {
    info: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts(current => current.filter(t => t.id !== id));
    }, []);

    const show = useCallback<ShowToast>((message, options = {}) => {
        const id = nextId.current++;
        setToasts(current => [...current.slice(-2), { id, message, ...options }]);
        setTimeout(() => dismiss(id), options.durationMs ?? (options.action ? 6000 : 3500));
    }, [dismiss]);

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div className="fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        role={toast.kind === 'error' ? 'alert' : 'status'}
                        className={`animate-fade-in pointer-events-auto flex items-center gap-4 max-w-md w-full sm:w-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${KIND_STYLES[toast.kind ?? 'info']}`}
                    >
                        <span className="flex-grow">{toast.message}</span>
                        {toast.action && (
                            <button
                                onClick={() => { toast.action!.onClick(); dismiss(toast.id); }}
                                className="font-bold uppercase tracking-wide text-violet-300 dark:text-violet-500 hover:underline"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
