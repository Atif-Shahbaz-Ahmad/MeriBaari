/**
 * Reply style is detected from the latest user message — not the app UI language.
 * UI chrome (buttons, errors) may still follow app language on the client.
 */
export type ReplyStyle = 'english' | 'urdu_script' | 'roman_urdu';

/** Whole-word markers that almost never appear in English customer queries. */
const HIGH_CONFIDENCE_ROMAN = new Set([
  'hai',
  'hain',
  'kya',
  'kia',
  'meri',
  'mera',
  'mere',
  'meray',
  'mujhe',
  'mujhay',
  'mujh',
  'aap',
  'aapki',
  'aapka',
  'apki',
  'apka',
  'qareeb',
  'kareeb',
  'nazdeek',
  'dhoondo',
  'dhoondho',
  'dhoondhein',
  'dhoondein',
  'chahiye',
  'chahye',
  'chahiye',
  'nahi',
  'nahin',
  'nhi',
  'kaise',
  'kaisay',
  'kesay',
  'kahan',
  'kahaan',
  'kidhar',
  'kyun',
  'kyu',
  'lekin',
  'magar',
  'theek',
  'thik',
  'acha',
  'accha',
  'shukriya',
  'dikhao',
  'batao',
  'bataen',
  'batao',
  'milay',
  'milega',
  'milegi',
  'milenge',
  'pehle',
  'pehlay',
  'baari',
  'bari',
  'kitne',
  'kitna',
  'kitni',
  'koi',
  'kuch',
  'zaroor',
  'zarur',
  'ayegi',
  'ayega',
  'hoga',
  'hogi',
  'honge',
  'karo',
  'karein',
  'kerein',
  'wali',
  'wala',
  'walay',
  'haan',
  'abhi',
  'phir',
  'yahan',
  'wahan',
  'jaldi',
  'intizar',
  'intezar',
  'qataar',
  'saath',
  'bahut',
  'bohat',
  'zyada',
  'thora',
  'thora',
  'doosra',
  'pehla',
  'lagao',
  'laga',
  'lagana',
  'lagado',
  'lagaado',
  'karwa',
  'karwana',
  'karwao',
  'karwadain',
  'shamil',
  'nikaal',
  'nikal',
  'nikalo',
  'nikaalo',
  'mansookh',
  'mansukh',
  'chahte',
  'chahtey',
  'chahta',
  'chahti',
  'chahun',
  'chahoon',
  'filhal',
]);

/** Counted only after at least one high-confidence hit (mixed English + Roman Urdu). */
const SUPPORTING_ROMAN = new Set([
  'mein',
  'hum',
  'tum',
  'yeh',
  'ye',
  'woh',
  'wo',
  'aur',
  'bhi',
  'jo',
  'ya',
  'ka',
  'ki',
  'ke',
  'se',
  'ap',
  'ji',
]);

function countArabicLetters(text: string): number {
  return (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? []).length;
}

export function detectReplyStyle(text: string): ReplyStyle {
  const raw = text.trim();
  if (!raw) return 'english';

  const lettersOnly = raw.replace(/[^A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g, '');
  const arabicCount = countArabicLetters(raw);
  if (lettersOnly.length > 0 && arabicCount / lettersOnly.length >= 0.2) {
    return 'urdu_script';
  }
  if (arabicCount >= 2) return 'urdu_script';

  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const high = tokens.filter((token) => HIGH_CONFIDENCE_ROMAN.has(token)).length;
  const support = tokens.filter((token) => SUPPORTING_ROMAN.has(token)).length;

  if (high >= 1) return 'roman_urdu';
  // Mixed Roman Urdu + English often has only a couple of supporting tokens.
  if (support >= 2 && tokens.length >= 4) return 'roman_urdu';
  if (support >= 3) return 'roman_urdu';
  return 'english';
}

export const REPLY_IN_INSTRUCTION: Record<ReplyStyle, string> = {
  english: 'Reply in English.',
  urdu_script: 'Reply in Urdu Nastaliq script. Do not use Roman Urdu.',
  roman_urdu:
    'Reply in Roman Urdu (Latin letters). Do not use Urdu Nastaliq script. Keep common English terms like barber, ticket, queue, dentist.',
};

export const LOCATION_UNAVAILABLE_MESSAGE: Record<ReplyStyle, string> = {
  english:
    "I'm unable to access your location. You can enable location permission or search by city/address.",
  roman_urdu:
    'Main aap ki location access nahi kar saka. Location permission on karein, ya city/address se search karein.',
  urdu_script:
    'میں آپ کی لوکیشن تک رسائی نہیں کر سکا۔ لوکیشن کی اجازت دیں، یا شہر/پتہ سے تلاش کریں۔',
};

export function replyStylePromptBlock(style: ReplyStyle): string {
  if (style === 'urdu_script') {
    return [
      'CURRENT USER MESSAGE STYLE: Urdu script (Nastaliq).',
      'You MUST reply in Urdu script for this turn.',
      'Do NOT reply in English. Do NOT reply in Roman Urdu.',
    ].join(' ');
  }
  if (style === 'roman_urdu') {
    return [
      'CURRENT USER MESSAGE STYLE: Roman Urdu (Urdu written in Latin letters).',
      'You MUST reply in Roman Urdu for this turn, e.g. "Ji haan, aap ke qareeb 3 barber shops milay hain."',
      'Do NOT translate into Urdu Nastaliq script.',
      'Do NOT reply in full English.',
      'You MAY keep common English words: barber, salon, dentist, ticket, queue, location, department, service.',
      'If the user mixed English + Roman Urdu, stay in Roman Urdu and keep those English terms.',
    ].join(' ');
  }
  return [
    'CURRENT USER MESSAGE STYLE: English.',
    'You MUST reply in English for this turn.',
    'Do NOT reply in Urdu script or Roman Urdu.',
  ].join(' ');
}
