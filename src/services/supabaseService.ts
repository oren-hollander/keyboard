import { config } from '../config';

export interface StoredMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

const getHeaders = () => ({
  'apikey': config.supabase.anonKey,
  'Authorization': `Bearer ${config.supabase.anonKey}`,
  'Content-Type': 'application/json',
});

const getBaseUrl = () => `${config.supabase.url}/rest/v1/messages`;

export const supabaseService = {
  async getMessages(limit: number = 100): Promise<StoredMessage[]> {
    const url = `${getBaseUrl()}?select=*&order=timestamp.desc&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error('Supabase read error:', response.status, await response.text());
      return [];
    }

    const messages = await response.json() as StoredMessage[];
    return messages.reverse();
  },

  async insertMessage(message: StoredMessage): Promise<boolean> {
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Supabase insert error:', response.status, await response.text());
      return false;
    }

    return true;
  },

  async deleteOldMessages(keepCount: number): Promise<boolean> {
    const messages = await this.getMessages(1000);

    if (messages.length <= keepCount) {
      return true;
    }

    const messagesToDelete = messages.slice(0, messages.length - keepCount);
    const idsToDelete = messagesToDelete.map(m => m.id);

    const url = `${getBaseUrl()}?id=in.(${idsToDelete.map(id => `"${id}"`).join(',')})`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      console.error('Supabase delete error:', response.status, await response.text());
      return false;
    }

    return true;
  },
};
