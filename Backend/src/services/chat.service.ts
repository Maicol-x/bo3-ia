import { SOE_KNOWLEDGE } from '../data/soe_knowledge.js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const knowledgeSummary = SOE_KNOWLEDGE.map(
    (k) => `[${k.category.toUpperCase()}] ${k.title}: ${k.tip}${k.detail ? ' ' + k.detail : ''}`,
  ).join('\n');

  return `Eres un asistente táctico experto en Call of Duty: Black Ops 3 Zombies, mapa "Shadows of Evil" (SoE).
Tu misión es ayudar al jugador durante una partida activa con consejos concretos y directos.

REGLAS:
- Responde SIEMPRE en español.
- Adapta la longitud al contexto: preguntas simples → 2-3 oraciones; análisis de build, estrategia o crisis → hasta 6-8 oraciones con pasos claros.
- Usa listas numeradas o con guiones cuando haya varios pasos o prioridades.
- Da consejos específicos de SoE, no genéricos.
- Si el jugador está en crisis (compañeros muertos, ronda alta, sin perks), prioriza la supervivencia inmediata y explica POR QUÉ.
- No inventes mecánicas que no existen en el mapa.

CONOCIMIENTO BASE DE SHADOWS OF EVIL:
${knowledgeSummary}

ZONAS DEL MAPA:
- Junction: hub central, acceso a todas las zonas, buena para entrenar en rondas medias.
- The Rift: zona del Pack-a-Punch, espacio abierto, ideal para rondas altas.
- Waterfront District: zona tranquila, buena para abrir al inicio.
- Canal District: zona peligrosa, spawns complejos, evitar para entrenar.
- Footlight District: zona con Ruby Rabbit y buenas rutas de entrenamiento.

ENEMIGOS ESPECIALES:
- Margwa (ronda 6, 12, 20+): 3 cabezas, apuntar SOLO a las bocas abiertas. No desperdicies balas en el cuerpo.
- Parásito: vuelan y explotan. Mantener distancia o matarlos de un disparo antes de que exploten.
- Meatball: lanza minas. Moverse constantemente para evitar las minas.
- Keeper (ronda 25+): tanque. Necesita armas PaP o Apothicon Servant.

PRIORIDADES DE SUPERVIVENCIA EN CRISIS:
1. Si estás solo: ir a The Rift o Footlight para entrenar en círculos.
2. Si no tenés Juggernog: conseguirlo ANTES que cualquier otra cosa.
3. Si estás en ronda alta sin PaP: priorizar puntos para PaP sobre comprar perks.`;
}

// ─── Llamada a Groq ───────────────────────────────────────────────────────────

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

export async function chatWithAI(req: ChatRequest): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'pega_tu_key_aqui') {
    throw new Error('GROQ_API_KEY no configurada en .env');
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...req.history.slice(-10),
    { role: 'user', content: req.message },
  ];

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as GroqResponse;
  return data.choices[0]?.message.content.trim() ?? '';
}
