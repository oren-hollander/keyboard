import {useCallback, useEffect, useRef, useState} from 'react';
import type {DisplayLine} from '../types/chat';
import {getColorForUsername} from '../utils/colors';
import {config} from '../config';

const JSONBIN_API_KEY = '$2a$10$n8bSMU9E.DgQwr.KOj86fedVsb8WQUxAmbvGIELPy8zkNcQK81s7i';
const JSONBIN_BIN_ID = '6969224c43b1c97be932ca0a';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

interface StoredMessage {
  id: string;
  text: string;
  timestamp: number;
}

interface DisplayMessage extends StoredMessage {
  username: string;
}

// User-keyed structure: { "alice": [...], "bob": [...] }
type BinData = Record<string, StoredMessage[]>;

export function useJsonBinChat(username: string) {
  const [messages, setMessages] = useState<DisplayLine[]>([]);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<DisplayMessage[]>([]);

  const updateDisplay = useCallback(() => {
    const displayLines = messagesRef.current
      .slice(-(config.maxVisibleLines - 1))
      .map(msg => ({
        id: msg.id,
        username: msg.username,
        text: msg.text,
        color: getColorForUsername(msg.username),
      }));
    setMessages(displayLines);
  }, []);

  // Read raw bin data (user-keyed structure)
  const readBin = useCallback(async (): Promise<BinData | null> => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
      console.error('JSONBin API key or Bin ID not configured');
      return null;
    }

    try {
      const response = await fetch(JSONBIN_URL, {
        headers: {
          'X-Access-Key': JSONBIN_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return (data.record as BinData) || {};
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    return null;
  }, []);

  // Flatten user-keyed data into sorted array with usernames
  const flattenMessages = useCallback((binData: BinData): DisplayMessage[] => {
    const allMessages: DisplayMessage[] = [];
    for (const [user, msgs] of Object.entries(binData)) {
      for (const msg of msgs) {
        allMessages.push({ ...msg, username: user });
      }
    }
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, []);

  // Fetch messages and update display
  const fetchMessages = useCallback(async () => {
    const binData = await readBin();
    if (binData) {
      messagesRef.current = flattenMessages(binData);
      updateDisplay();
    }
  }, [readBin, flattenMessages, updateDisplay]);

  // Save bin data (user-keyed structure)
  const saveBin = useCallback(async (binData: BinData): Promise<boolean> => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return false;

    try {
      const response = await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': JSONBIN_API_KEY,
        },
        body: JSON.stringify(binData),
      });
      return response.ok;
    } catch (e) {
      console.error('Save error:', e);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const pollInterval = setInterval(fetchMessages, 1000);
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  // Cleanup: keep only the latest N messages globally
  const runCleanup = useCallback(async () => {
    const binData = await readBin();
    if (!binData) return;

    // Flatten all messages with usernames
    const allMessages = flattenMessages(binData);

    // Keep only the latest maxVisibleLines messages
    const maxMessages = config.maxVisibleLines;
    if (allMessages.length <= maxMessages) return; // No cleanup needed

    const messagesToKeep = allMessages.slice(-maxMessages);

    // Rebuild user-keyed structure with only kept messages
    const cleanedBin: BinData = {};
    for (const msg of messagesToKeep) {
      const { username: user, ...storedMsg } = msg;
      if (!cleanedBin[user]) {
        cleanedBin[user] = [];
      }
      cleanedBin[user].push(storedMsg);
    }

    await saveBin(cleanedBin);
  }, [readBin, flattenMessages, saveBin]);

  // Run cleanup every 5 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(runCleanup, 5000);
    return () => clearInterval(cleanupInterval);
  }, [runCleanup]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setSending(true);

    const message: StoredMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      timestamp: Date.now(),
    };

    const MAX_RETRIES = 3;

    try {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        // Read current bin (user-keyed structure)
        const currentBin = await readBin();
        if (!currentBin) {
          console.error('Failed to fetch current state');
          return;
        }

        // Get my messages array
        const myMessages = currentBin[username] || [];

        // Check if message already exists
        const messageExists = myMessages.some(m => m.id === message.id);
        if (!messageExists) {
          // Append to my array, preserve other users' data
          const updatedBin: BinData = {
            ...currentBin,
            [username]: [...myMessages, message],
          };

          // Save to jsonbin
          const saved = await saveBin(updatedBin);
          if (!saved) {
            console.error('Failed to save messages');
            return;
          }
        }

        // Verify: read back and check if our message exists in our array
        const verifyBin = await readBin();
        if (!verifyBin) {
          console.error('Failed to verify message');
          return;
        }

        const verified = (verifyBin[username] || []).some(m => m.id === message.id);
        if (verified) {
          // Success - polling will update display
          return;
        }

        // Message not found - conflict detected, retry
        console.warn(`Write conflict detected (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
      }

      console.error('Failed to send message after max retries');
    } finally {
      setSending(false);
    }
  }, [username, readBin, saveBin]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
    fetchMessages,
    sending,
  };
}
