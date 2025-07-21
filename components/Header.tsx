
import React from 'react';

interface HeaderProps {
    userName: string;
}

const BokehCircle: React.FC<{ className: string; animationDelay: string }> = ({ className, animationDelay }) => (
    <div
        className={`absolute rounded-full bg-white/10 filter blur-2xl animate-pulse ${className}`}
        style={{ animationDelay }}
    ></div>
);

const Header: React.FC<HeaderProps> = ({ userName }) => {
    const today = new Date().toLocaleDateString('uk-UA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="relative h-56 bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-300 rounded-b-3xl overflow-hidden p-6 text-white shadow-lg">
            <div className="absolute inset-0">
                <BokehCircle className="w-48 h-48 -top-10 -left-10" animationDelay="0s" />
                <BokehCircle className="w-32 h-32 -bottom-10 right-20" animationDelay="1s" />
                <BokehCircle className="w-40 h-40 top-10 -right-16" animationDelay="2s" />
            </div>
            <div className="relative z-10">
                <h1 className="text-4xl font-bold drop-shadow-sm">Привіт, {userName.split(' ')[0]}!</h1>
                <p className="text-base opacity-90 mt-1 drop-shadow-sm">{today}</p>
            </div>
        </header>
    );
};

export default Header;