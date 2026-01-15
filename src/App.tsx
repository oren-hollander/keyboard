import { useState } from 'react';
import { TextDisplay } from './components/TextDisplay';
import { Keyboard } from './components/Keyboard';
import { NameEntry } from './components/NameEntry';
import { useJsonBinChat } from './hooks/useJsonBinChat';
import './App.css';

const STORAGE_KEY = 'keyboard-chat-username';
const CONVERSATION_TOKEN = 'demo';

type AppState = 'write' | 'entering-chat' | 'chat';

function WritingRoom({ onModeToggle }: { onModeToggle: () => void }) {
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
      const lastLine = lines[lines.length - 1];
      setLines((prev) => prev.slice(0, -1));
      setCurrentLine(lastLine);
    }
  };

  const handleEnter = () => {
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine('');
  };

  const displayLines = lines.map((text, index) => ({
    id: `line-${index}`,
    username: '',
    text,
    color: '#ffffff',
  }));

  return (
    <>
      <TextDisplay
        lines={displayLines}
        currentLine={currentLine}
        currentUsername=""
        currentColor="#ffffff"
      />
      <Keyboard
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onSpace={handleSpace}
        mode="write"
        onModeToggle={onModeToggle}
      />
    </>
  );
}

function ChatRoom({
  username,
  onModeToggle,
}: {
  username: string;
  onModeToggle: () => void;
}) {
  const [currentLine, setCurrentLine] = useState('');
  const { messages, sendMessage, myColor } = useJsonBinChat(CONVERSATION_TOKEN, username);

  const handleKeyPress = (key: string) => {
    setCurrentLine((prev) => prev + key);
  };

  const handleSpace = () => {
    setCurrentLine((prev) => prev + ' ');
  };

  const handleBackspace = () => {
    if (currentLine.length > 0) {
      setCurrentLine((prev) => prev.slice(0, -1));
    }
  };

  const handleEnter = () => {
    if (currentLine.trim()) {
      sendMessage(currentLine);
      setCurrentLine('');
    }
  };

  return (
    <>
      <TextDisplay
        lines={messages}
        currentLine={currentLine}
        currentUsername={username}
        currentColor={myColor}
      />
      <Keyboard
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onEnter={handleEnter}
        onSpace={handleSpace}
        mode="chat"
        onModeToggle={onModeToggle}
      />
    </>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>('write');
  const [username, setUsername] = useState<string>('');

  // Writing mode
  if (appState === 'write') {
    return (
      <div className="app">
        <WritingRoom onModeToggle={() => setAppState('entering-chat')} />
      </div>
    );
  }

  // Entering chat - show name entry only if no username set this session
  if (appState === 'entering-chat') {
    if (username) {
      setAppState('chat');
      return null;
    }
    return (
      <NameEntry
        onNameSubmit={(name) => {
          localStorage.setItem(STORAGE_KEY, name);
          setUsername(name);
          setAppState('chat');
        }}
      />
    );
  }

  // Chat mode
  return (
    <div className="app">
      <ChatRoom
        username={username}
        onModeToggle={() => setAppState('write')}
      />
    </div>
  );
}

export default App;
