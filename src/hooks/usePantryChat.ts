import { useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayLine } from '../types/chat';
import { getColorForUsername } from '../utils/colors';
import { config } from '../config';
import { pantryService, type BasketData } from '../services/pantryService';

interface StoredMessage {
  id: string;
  text: string;
  timestamp: number;
}

interface DisplayMessage extends StoredMessage {
  username: string;
}

export function usePantryChat(username: string) {
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

  // Flatten user-keyed data into sorted array with usernames
  const flattenMessages = useCallback((basketData: BasketData): DisplayMessage[] => {
    const allMessages: DisplayMessage[] = [];
    for (const [user, msgs] of Object.entries(basketData)) {
      // Skip entries that aren't valid message arrays
      if (!Array.isArray(msgs)) continue;
      for (const msg of msgs) {
        // Validate message structure
        if (msg) {
          allMessages.push({ ...msg, username: user });
        }
      }
    }
    return allMessages.sort((a, b) => a.timestamp - b.timestamp);
  }, []);

  // Fetch messages and update display
  const fetchMessages = useCallback(async () => {
    const basketData = await pantryService.readBasket();
    if (basketData) {
      messagesRef.current = flattenMessages(basketData);
      updateDisplay();
    }
  }, [flattenMessages, updateDisplay]);

  useEffect(() => {
    fetchMessages();
    const pollInterval = setInterval(fetchMessages, config.polling.interval);
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  // Cleanup: keep only the latest N messages globally
  const runCleanup = useCallback(async () => {
    const basketData = await pantryService.readBasket();
    if (!basketData) return;

    // Flatten all messages with usernames
    const allMessages = flattenMessages(basketData);

    // Keep only the latest maxVisibleLines messages
    const maxMessages = config.maxVisibleLines;
    if (allMessages.length <= maxMessages) return; // No cleanup needed

    const messagesToKeep = allMessages.slice(-maxMessages);

    // Rebuild user-keyed structure with only kept messages
    const cleanedBasket: BasketData = {};
    for (const msg of messagesToKeep) {
      const { username: user, ...storedMsg } = msg;
      if (!cleanedBasket[user]) {
        cleanedBasket[user] = [];
      }
      cleanedBasket[user].push(storedMsg);
    }

    await pantryService.replaceBasket(cleanedBasket);
  }, [flattenMessages]);

  // Run cleanup at configured interval
  useEffect(() => {
    const cleanupInterval = setInterval(runCleanup, config.polling.cleanupInterval);
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
        // Read current basket (user-keyed structure)
        const currentBasket = await pantryService.readBasket();
        if (!currentBasket) {
          console.error('Failed to fetch current state');
          return;
        }

        // Get my messages array (validate it's actually an array)
        const myMessages = Array.isArray(currentBasket[username]) ? currentBasket[username] : [];

        // Check if message already exists
        const messageExists = myMessages.some(m => m.id === message.id);
        if (!messageExists) {
          // Append to my array using merge update
          const updateData: BasketData = {
            [username]: [...myMessages, message],
          };

          // Use PUT (merge) to update basket
          const saved = await pantryService.updateBasket(updateData);
          if (!saved) {
            console.error('Failed to save messages');
            return;
          }
        }

        // Verify: read back and check if our message exists in our array
        const verifyBasket = await pantryService.readBasket();
        if (!verifyBasket) {
          console.error('Failed to verify message');
          return;
        }

        const verifyMessages = Array.isArray(verifyBasket[username]) ? verifyBasket[username] : [];
        const verified = verifyMessages.some(m => m.id === message.id);
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
  }, [username]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
    fetchMessages,
    sending,
  };
}
