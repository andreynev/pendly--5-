import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    getLocale, readLanguageSetting, resolveLanguage, saveLanguageSetting, setLanguage, translate,
    type Lang, type LangSetting, type MessageKey,
} from './index';

interface I18nValue {
    lang: Lang;
    locale: string;
    setting: LangSetting;
    setSetting: (setting: LangSetting) => void;
    t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [setting, setSettingState] = useState<LangSetting>(readLanguageSetting);
    const [deviceLang, setDeviceLang] = useState<Lang>(() => resolveLanguage('auto'));
    const lang = setting === 'auto' ? deviceLang : setting;

    // Keep the module-level language (used by services) and <html lang> in sync.
    setLanguage(lang);

    useEffect(() => {
        const onChange = () => setDeviceLang(resolveLanguage('auto'));
        window.addEventListener('languagechange', onChange);
        return () => window.removeEventListener('languagechange', onChange);
    }, []);

    const setSetting = useCallback((next: LangSetting) => {
        saveLanguageSetting(next);
        setSettingState(next);
    }, []);

    const value = useMemo<I18nValue>(() => ({
        lang,
        locale: getLocale(lang),
        setting,
        setSetting,
        t: (key, params) => translate(lang, key, params),
    }), [lang, setting, setSetting]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => {
    const value = useContext(I18nContext);
    if (!value) throw new Error('useI18n must be used inside I18nProvider');
    return value;
};
