/** Strip markdown / JSON / card-like dumps so TTS only speaks the main reply. */

export const VOICE_MAX_SPEAK_CHARS = 400;
export const VOICE_MAX_RAW_CHARS = 2_000;

export function toSpeakableText(raw: string, max = VOICE_MAX_SPEAK_CHARS): string {
  let text = (raw ?? '').replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  const compact = text.replace(/\s+/g, '');
  if (
    (compact.startsWith('{') && compact.endsWith('}')) ||
    (compact.startsWith('[') && compact.endsWith(']'))
  ) {
    return '';
  }

  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`[^`]*`/g, ' ');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/<\/?[^>]+>/g, ' ');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+[.)]\s+/gm, '');
  text = text.replace(/\|/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}
