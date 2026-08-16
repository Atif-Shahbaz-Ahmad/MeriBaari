/** Mirrors the Edge Function detector. UI chrome may follow app language. */
export type ReplyStyle = 'english' | 'urdu_script' | 'roman_urdu';

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
  'aaj',
  'kal',
  'hafta',
  'haftay',
  'pichlay',
  'pichle',
  'bulao',
  'bulaen',
  'bulaye',
  'agla',
  'aglay',
  'agle',
  'band',
  'kholo',
  'ruko',
  'rukao',
  'huay',
  'hue',
  'huey',
  'aye',
  'aaye',
  'kiye',
  'kiya',
  'kar',
  'rahay',
  'rahe',
  'rahi',
]);

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
  'do',
]);

function countArabicLetters(text: string): number {
  return (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) ?? []).length;
}

/** Detected from the latest user message — not the app UI language. */
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
  if (support >= 2 && tokens.length >= 4) return 'roman_urdu';
  if (support >= 3) return 'roman_urdu';
  return 'english';
}
