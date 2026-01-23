import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string): void => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '5px 10px',
          backgroundColor: i18n.language === 'en' ? '#1976d2' : '#f5f5f5',
          color: i18n.language === 'en' ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('es')}
        style={{
          padding: '5px 10px',
          backgroundColor: i18n.language === 'es' ? '#1976d2' : '#f5f5f5',
          color: i18n.language === 'es' ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('fr')}
        style={{
          padding: '5px 10px',
          backgroundColor: i18n.language === 'fr' ? '#1976d2' : '#f5f5f5',
          color: i18n.language === 'fr' ? 'white' : 'black',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        FR
      </button>
    </div>
  );
};

export default LanguageSwitcher;
