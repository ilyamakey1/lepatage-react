import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'by', name: 'Беларуская', flag: '🇧🇾' },
];

export const LanguageSwitcher: React.FC = () => {
  // const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages[0]; // Временно используем первый язык

  const changeLanguage = (_langCode: string) => {
    // i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-luxury-950 hover:text-primary-950 transition-colors duration-300"
        aria-label="Change language"
      >
        <Globe size={20} />
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-luxury-200 rounded-lg shadow-lg z-20">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-luxury-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  currentLanguage.code === language.code ? 'bg-luxury-50 text-primary-950' : 'text-luxury-950'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

