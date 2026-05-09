export const AVATARS: Record<string, string> = {
  ghost:   '👻',
  skull:   '💀',
  fire:    '🔥',
  sword:   '⚔️',
  eye:     '👁️',
  moon:    '🌙',
  storm:   '⚡',
  shadow:  '🌑',
  bat:     '🦇',
  wolf:    '🐺',
  spider:  '🕷️',
  dragon:  '🐉',
  crown:   '👑',
  gem:     '💎',
  zombie:  '🧟',
  reaper:  '☠️',
};

export const DEFAULT_AVATAR = 'ghost';

/** Devuelve el emoji correspondiente a la clave de avatar. */
export function getAvatar(key?: string | null): string {
  return AVATARS[key ?? ''] ?? AVATARS['ghost']!;
}
