import { useState, useEffect } from 'react';
import { TextDisplay } from './components/TextDisplay';
import { Keyboard } from './components/Keyboard';
import { NameEntry } from './components/NameEntry';
import { useJsonBinChat } from './hooks/useJsonBinChat';
import './App.css';

const STORAGE_KEY = 'keyboard-chat-username';
const CONVERSATION_TOKEN = 'demo';

type AppState = 'write' | 'entering-chat' | 'chat';

interface WriteState {
  lines: string[];
  currentLine: string;
}

function WritingRoom({
  writeState,
  setWriteState,
  onModeToggle,
}: {
  writeState: WriteState;
  setWriteState: React.Dispatch<React.SetStateAction<WriteState>>;
  onModeToggle: () => void;
}) {
  const { lines, currentLine } = writeState;

  const handleKeyPress = (key: string) => {
    setWriteState((prev) => ({ ...prev, currentLine: prev.currentLine + key }));
  };

  const handleSpace = () => {
    setWriteState((prev) => ({ ...prev, currentLine: prev.currentLine + ' ' }));
  };

  const handleBackspace = () => {
    if (currentLine.length > 0) {
      setWriteState((prev) => ({ ...prev, currentLine: prev.currentLine.slice(0, -1) }));
    } else if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      setWriteState((prev) => ({
        lines: prev.lines.slice(0, -1),
        currentLine: lastLine,
      }));
    }
  };

  const handleEnter = () => {
    setWriteState((prev) => ({
      lines: [...prev.lines, prev.currentLine],
      currentLine: '',
    }));
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
  const { messages, sendMessage, myColor, fetchMessages } = useJsonBinChat(CONVERSATION_TOKEN, username);

  // Fetch messages immediately when entering chat mode
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
  const [writeState, setWriteState] = useState<WriteState>({ lines: [], currentLine: '' });

  // Writing mode
  if (appState === 'write') {
    return (
      <div className="app">
        <WritingRoom
          writeState={writeState}
          setWriteState={setWriteState}
          onModeToggle={() => setAppState('entering-chat')}
        />
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
