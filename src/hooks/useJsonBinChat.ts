import {useCallback, useEffect, useRef, useState} from 'react';
import type {DisplayLine} from '../types/chat';
import {getColorForUsername} from '../utils/colors';
import {config} from '../config';

const JSONBIN_API_KEY = '$2a$10$n8bSMU9E.DgQwr.KOj86fedVsb8WQUxAmbvGIELPy8zkNcQK81s7i';
const JSONBIN_BIN_ID = '6969224c43b1c97be932ca0a';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

interface StoredMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

interface BinData {
  messages: StoredMessage[];
}

export function useJsonBinChat(username: string) {
  const [messages, setMessages] = useState<DisplayLine[]>([]);
  const messagesRef = useRef<StoredMessage[]>([]);

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

  const fetchMessages = useCallback(async (): Promise<StoredMessage[] | null> => {
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
        const binData = data.record as BinData;
        const stored = binData?.messages || [];
        messagesRef.current = stored;
        updateDisplay();
        return stored;
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    return null;
  }, [updateDisplay]);

  const saveMessages = useCallback(async (newMessages: StoredMessage[]): Promise<boolean> => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return false;

    try {
      const binData: BinData = {
        messages: newMessages.slice(-config.storageBufferSize),
      };

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

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const message: StoredMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      text: text.trim(),
      timestamp: Date.now(),
    };

    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Fetch current state
      const currentMessages = await fetchMessages();
      if (!currentMessages) {
        console.error('Failed to fetch current state');
        return;
      }

      // Merge: add our message if not already there
      const messageExists = currentMessages.some(m => m.id === message.id);
      const mergedMessages = messageExists
        ? currentMessages
        : [...currentMessages, message];

      // Save to jsonbin
      const saved = await saveMessages(mergedMessages);
      if (!saved) {
        console.error('Failed to save messages');
        return;
      }

      // Verify: read back and check if our message exists
      const verifyMessages = await fetchMessages();
      if (!verifyMessages) {
        console.error('Failed to verify message');
        return;
      }

      const verified = verifyMessages.some(m => m.id === message.id);
      if (verified) {
        return;
      }

      // Message not found - conflict detected, retry
      console.warn(`Write conflict detected (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
    }

    console.error('Failed to send message after max retries');
  }, [username, fetchMessages, saveMessages]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
    fetchMessages,
  };
}
