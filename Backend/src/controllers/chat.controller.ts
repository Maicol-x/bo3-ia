import { Request, Response } from 'express';
import { chatWithAI, type ChatMessage } from '../services/chat.service.js';

export async function chatHandler(req: Request, res: Response): Promise<void> {
  const { message, history } = req.body as { message?: string; history?: ChatMessage[] };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    return;
  }

  if (message.trim().length > 500) {
    res.status(400).json({ error: 'El mensaje es demasiado largo (máx. 500 caracteres)' });
    return;
  }

  try {
    const reply = await chatWithAI({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
    });
    res.json({ reply });
  } catch (err) {
    console.error('[chatHandler]', err);
    res.status(503).json({ error: 'El asistente de IA no está disponible. ¿Está Ollama corriendo?' });
  }
}
