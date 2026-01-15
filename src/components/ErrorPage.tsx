import { config } from '../config';
import './ErrorPage.css';

const strings = {
  hebrew: {
    title: 'כתובת לא תקינה',
    instruction: 'כדי להצטרף לצאט, השתמש בכתובת בפורמט:',
    example: 'לדוגמה:',
  },
  english: {
    title: 'Invalid URL',
    instruction: 'To join a chat, use a URL in this format:',
    example: 'Example:',
  },
};

export function ErrorPage() {
  const isRTL = config.language === 'hebrew';
  const t = strings[config.language];

  return (
    <div className="error-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t.title}</h1>
      <p>{t.instruction}</p>
      <code>/keyboard/#&lt;conversation-token&gt;</code>
      <p className="example">{t.example} /keyboard/#my-chat-room</p>
    </div>
  );
}
