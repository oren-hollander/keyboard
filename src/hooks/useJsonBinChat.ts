import {useCallback, useEffect, useRef, useState} from 'react';
import type {DisplayLine} from '../types/chat';
import {getColorForUsername} from '../utils/colors';
import {config} from '../config';

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
        messagesRef.current = data.record?.[conversationToken] || [];
        updateDisplay();
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  }, [conversationToken, updateDisplay]);

  // Fetch current state from jsonbin (returns messages for our conversation)
  const fetchCurrentState = useCallback(async (): Promise<{ allData: Record<string, StoredMessage[]>, ourMessages: StoredMessage[] } | null> => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return null;

    try {
      const response = await fetch(JSONBIN_URL, {
        headers: {
          'X-Access-Key': JSONBIN_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allData = data.record || {};
        const ourMessages = allData[conversationToken] || [];
        return { allData, ourMessages };
      }
    } catch (e) {
      console.error('Fetch current state error:', e);
    }
    return null;
  }, [conversationToken]);

  // Save messages to jsonbin
  const saveMessages = useCallback(async (allData: Record<string, StoredMessage[]>, newMessages: StoredMessage[]) => {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) return false;

    try {
      // Update our conversation with storage buffer size limit
      allData[conversationToken] = newMessages.slice(-config.storageBufferSize);

      // Save back
      const response = await fetch(JSONBIN_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': JSONBIN_API_KEY,
        },
        body: JSON.stringify(allData),
      });
      return response.ok;
    } catch (e) {
      console.error('Save error:', e);
      return false;
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

    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Fetch current state
      const state = await fetchCurrentState();
      if (!state) {
        console.error('Failed to fetch current state');
        return;
      }

      // Merge: add our message to current messages (if not already there)
      const messageExists = state.ourMessages.some(m => m.id === message.id);
      const mergedMessages = messageExists
        ? state.ourMessages
        : [...state.ourMessages, message];

      // Save to jsonbin
      const saved = await saveMessages(state.allData, mergedMessages);
      if (!saved) {
        console.error('Failed to save messages');
        return;
      }

      // Verify: read back and check if our message exists
      const verifyState = await fetchCurrentState();
      if (!verifyState) {
        console.error('Failed to verify message');
        return;
      }

      const verified = verifyState.ourMessages.some(m => m.id === message.id);
      if (verified) {
        // Success - update local state with server state
        messagesRef.current = verifyState.ourMessages;
        updateDisplay();
        return;
      }

      // Message not found - conflict detected, retry
      console.warn(`Write conflict detected (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
    }

    console.error('Failed to send message after max retries');
  }, [username, updateDisplay, fetchCurrentState, saveMessages]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
    fetchMessages,
  };
}
