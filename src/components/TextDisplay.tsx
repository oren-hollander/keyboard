import { config } from '../config';
import './TextDisplay.css';

interface TextDisplayProps {
  lines: string[];
  currentLine: string;
}

export function TextDisplay({ lines, currentLine }: TextDisplayProps) {
  const isRTL = config.language === 'hebrew';

  // Get the visible lines (last maxVisibleLines - 1 completed lines + current line)
  const visibleCompletedLines = lines.slice(-(config.maxVisibleLines - 1));
  const allVisibleLines = [...visibleCompletedLines, currentLine];

  // Pad to exactly maxVisibleLines so layout is consistent
  while (allVisibleLines.length < config.maxVisibleLines) {
    allVisibleLines.unshift('');
  }

  const isCurrentLine = (index: number) => index === allVisibleLines.length - 1;

  return (
    <div className="text-display" dir={isRTL ? 'rtl' : 'ltr'}>
      {allVisibleLines.map((line, index) => (
        <div key={index} className="text-line">
          {line || '\u00A0'}
          {isCurrentLine(index) && <span className="cursor" />}
        </div>
      ))}
    </div>
  );
}
