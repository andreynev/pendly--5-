
import React from 'react';
import { GoogleIcon } from './Icons';

interface LoginScreenProps {
    onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-center p-4">
            <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-2">Pendly</h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">Відстежуйте ваші найважливіші події.</p>
            <button
                onClick={onLogin}
                className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-base"
            >
                <GoogleIcon />
                Увійти через Google
            </button>
        </div>
    );
};

export default LoginScreen;