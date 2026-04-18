
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg bg-black/40 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center group relative overflow-hidden"
      title={i18n.language.startsWith('en') ? 'हिंदी में बदलें' : 'Switch to English'}
    >
      <Languages className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
      <span className="sr-only">Toggle Language</span>
      <div className="absolute opacity-0 group-hover:opacity-100 bg-white/10 w-full h-full inset-0 rounded-lg transition-opacity pointer-events-none" />
    </button>
  );
}
