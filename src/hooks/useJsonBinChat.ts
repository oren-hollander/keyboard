import { useEffect, useState, useCallback, useRef } from 'react';
import type { DisplayLine } from '../types/chat';
import { getColorForUsername } from '../utils/colors';
import { config } from '../config';

// You need to set these:
// 1. Get API key from https://jsonbin.io/api-keys
// 2. Create a bin and get its ID
const JSONBIN_API_KEY = '$2a$10$n8bSMU9E.DgQwr.KOj86fedVsb8WQUxAmbvGIELPy8zkNcQK81s7i';
const JSONBIN_BIN_ID = '6969224c43b1c97be932ca0a';

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

interface StoredMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export function useJsonBinChat(conversationToken: string, username: string) {
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

  // Fetch messages from jsonbin
  const fetchMessages = useCallback(async () => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
      console.error('JSONBin API key or Bin ID not configured');
      return;
    }

    try {
      const response = await fetch(JSONBIN_URL, {
        headers: {
          'X-Access-Key': JSONBIN_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const stored = data.record?.[conversationToken] || [];
        messagesRef.current = stored;
        updateDisplay();
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, [conversationToken, updateDisplay]);

  // Save messages to jsonbin
  const saveMessages = useCallback(async (newMessages: StoredMessage[]) => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return;

    try {
      // First fetch current state to preserve other conversations
      const response = await fetch(JSONBIN_URL, {
        headers: {
          'X-Access-Key': JSONBIN_API_KEY,
        },
      });

      let currentData: Record<string, StoredMessage[]> = {};
      if (response.ok) {
        const data = await response.json();
        currentData = data.record || {};
      }

      // Update our conversation
      currentData[conversationToken] = newMessages.slice(-6);

      // Save back
      await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': JSONBIN_API_KEY,
        },
        body: JSON.stringify(currentData),
      });
    } catch (e) {
      console.error('Save error:', e);
    }
  }, [conversationToken]);

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

    // Optimistic update
    messagesRef.current = [...messagesRef.current, message].slice(-6);
    updateDisplay();

    // Save to jsonbin
    await saveMessages(messagesRef.current);
  }, [username, updateDisplay, saveMessages]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
  };
}
