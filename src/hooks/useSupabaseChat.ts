import {useCallback, useEffect, useRef, useState} from 'react';
import type {DisplayLine} from '../types/chat';
import {getColorForUsername} from '../utils/colors';
import {config} from '../config';
import {type StoredMessage, supabaseService} from '../services/supabaseService';

export function useSupabaseChat(username: string) {
  const [messages, setMessages] = useState<DisplayLine[]>([]);
  const [sending, setSending] = useState(false);
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

  const fetchMessages = useCallback(async () => {
    messagesRef.current = await supabaseService.getMessages(config.storageBufferSize);
    updateDisplay();
  }, [updateDisplay]);

  useEffect(() => {
    fetchMessages();
    const pollInterval = setInterval(fetchMessages, config.polling.interval);
    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

  const runCleanup = useCallback(async () => {
    await supabaseService.deleteOldMessages(config.maxVisibleLines);
  }, []);

  useEffect(() => {
    const cleanupInterval = setInterval(runCleanup, config.polling.cleanupInterval);
    return () => clearInterval(cleanupInterval);
  }, [runCleanup]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setSending(true);

    const message: StoredMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      text: text.trim(),
      timestamp: Date.now(),
    };

    try {
      const success = await supabaseService.insertMessage(message);
      if (success) {
        await fetchMessages();
      } else {
        console.error('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  }, [username, fetchMessages]);

  const myColor = getColorForUsername(username);

  return {
    messages,
    sendMessage,
    myColor,
    fetchMessages,
    sending,
  };
}
