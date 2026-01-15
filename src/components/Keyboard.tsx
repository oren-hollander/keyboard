import { config } from '../config';
import './Keyboard.css';

const hebrewLayout = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'],
];

const englishLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  onSpace: () => void;
}

export function Keyboard({ onKeyPress, onBackspace, onEnter, onSpace }: KeyboardProps) {
  const layout = config.language === 'hebrew' ? hebrewLayout : englishLayout;

  return (
    <div className="keyboard">
      <div className="keyboard-row">
        {layout[0].map((key) => (
          <button
            key={key}
            className="key"
            onClick={() => onKeyPress(key)}
          >
            {key}
          </button>
        ))}
        <button className="key key-backspace" onClick={onBackspace}>
          ⌫
        </button>
      </div>
      <div className="keyboard-row">
        {layout[1].map((key) => (
          <button
            key={key}
            className="key"
            onClick={() => onKeyPress(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="keyboard-row">
        {layout[2].map((key) => (
          <button
            key={key}
            className="key"
            onClick={() => onKeyPress(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="keyboard-row">
        <button className="key key-space" onClick={onSpace}>
          רווח
        </button>
        <button className="key key-enter" onClick={onEnter}>
          ⏎
        </button>
      </div>
    </div>
  );
}
