import { useState, useEffect } from 'react';
import { config } from '../config';
import './NameEntry.css';

interface NameEntryProps {
  onNameSubmit: (name: string) => void;
}

const STORAGE_KEY = 'keyboard-chat-username';

const strings = {
  hebrew: {
    title: 'הכנס את שמך',
    placeholder: 'השם שלך',
    button: 'הצטרף לצאט',
  },
  english: {
    title: 'Enter your name',
    placeholder: 'Your name',
    button: 'Join Chat',
  },
};

export function NameEntry({ onNameSubmit }: NameEntryProps) {
  const [name, setName] = useState('');
  const isRTL = config.language === 'hebrew';
  const t = strings[config.language];

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY);
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      localStorage.setItem(STORAGE_KEY, trimmedName);
      onNameSubmit(trimmedName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="name-entry" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t.title}</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.placeholder}
        autoFocus
      />
      <button onClick={handleSubmit} disabled={!name.trim()}>
        {t.button}
      </button>
    </div>
  );
}
