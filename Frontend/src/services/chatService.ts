import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<string> {
  const { data } = await api.post<{ reply: string }>('/api/chat', { message, history });
  return data.reply;
}
