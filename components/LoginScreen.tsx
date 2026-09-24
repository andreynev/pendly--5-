import React, { useState } from 'react';
import { GoogleIcon, SpinnerIcon } from './Icons';

interface LoginScreenProps {
    onLogin: () => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setIsSigningIn(true);
        setError('');
        try {
            await onLogin();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не вдалося увійти. Спробуйте ще раз.');
            setIsSigningIn(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-center p-4">
            <img src="/icons/icon.svg" alt="" className="w-20 h-20 rounded-2xl shadow-lg mb-6" />
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-2">Pendly</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">Відстежуйте ваші найважливіші події.</p>
            <button
                onClick={handleLogin}
                disabled={isSigningIn}
                className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-base disabled:opacity-60"
            >
                {isSigningIn ? <SpinnerIcon /> : <GoogleIcon />}
                {isSigningIn ? 'Вхід…' : 'Увійти через Google'}
            </button>
            {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
};

export default LoginScreen;
