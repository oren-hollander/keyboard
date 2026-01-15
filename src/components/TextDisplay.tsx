import { config } from '../config';
import type { DisplayLine } from '../types/chat';
import './TextDisplay.css';

interface TextDisplayProps {
  lines: DisplayLine[];
  currentLine: string;
  currentUsername: string;
  currentColor: string;
}

export function TextDisplay({ lines, currentLine, currentUsername, currentColor }: TextDisplayProps) {
  const isRTL = config.language === 'hebrew';
  const isChatMode = currentUsername !== '';

  const visibleLines = lines.slice(-(config.maxVisibleLines - 1));
  const emptyLinesCount = Math.max(0, config.maxVisibleLines - 1 - visibleLines.length);

  return (
    <div className="text-display" dir={isRTL ? 'rtl' : 'ltr'}>
      {Array.from({ length: emptyLinesCount }).map((_, index) => (
        <div key={`empty-${index}`} className="text-line">
          {'\u00A0'}
        </div>
      ))}

      {visibleLines.map((line) => (
        <div key={line.id} className="text-line">
          {line.username && (
            <span className="username" style={{ color: line.color }}>{line.username}:</span>
          )}
          <span className="message">{line.text}</span>
        </div>
      ))}

      <div className="text-line current-line">
        {isChatMode && (
          <span className="username" style={{ color: currentColor }}>{currentUsername}:</span>
        )}
        <span className="message">{currentLine}</span>
        <span className="cursor" />
      </div>
    </div>
  );
}
