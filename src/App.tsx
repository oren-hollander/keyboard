import { useState } from 'react';
import { TextDisplay } from './components/TextDisplay';
import { Keyboard } from './components/Keyboard';
import './App.css';

function App() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');

  const handleKeyPress = (key: string) => {
    setCurrentLine((prev) => prev + key);
  };

  const handleSpace = () => {
    setCurrentLine((prev) => prev + ' ');
  };

  const handleBackspace = () => {
    if (currentLine.length > 0) {
      setCurrentLine((prev) => prev.slice(0, -1));
    } else if (lines.length > 0) {
      // Move to previous line
      const lastLine = lines[lines.length - 1];
      setLines((prev) => prev.slice(0, -1));
      setCurrentLine(lastLine);
    }
  };

  const handleEnter = () => {
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine('');
  };

  return (
    <div className="app">
      <TextDisplay lines={lines} currentLine={currentLine} />
      <Keyboard
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onSpace={handleSpace}
      />
    </div>
  );
}

export default App;
