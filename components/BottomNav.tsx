import React from 'react';
import type { Screen } from '../types';
import { HomeIcon, ArchiveIcon, SettingsIcon } from './Icons';

interface BottomNavProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
}

const NavItem: React.FC<{
    screen: Screen;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ screen, label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${isActive ? 'text-violet-500' : 'text-slate-500 dark:text-slate-400 hover:text-violet-500'}`}
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/50 z-30">
            <div className="max-w-2xl mx-auto h-full flex justify-around items-center px-4">
                 <NavItem
                    screen="home"
                    label="Головна"
                    icon={<HomeIcon />}
                    isActive={activeScreen === 'home'}
                    onClick={() => setActiveScreen('home')}
                />
                <NavItem
                    screen="archive"
                    label="Архів"
                    icon={<ArchiveIcon />}
                    isActive={activeScreen === 'archive'}
                    onClick={() => setActiveScreen('archive')}
                />
                <NavItem
                    screen="settings"
                    label="Налаштування"
                    icon={<SettingsIcon />}
                    isActive={activeScreen === 'settings'}
                    onClick={() => setActiveScreen('settings')}
                />
            </div>
        </nav>
    );
};

export default BottomNav;