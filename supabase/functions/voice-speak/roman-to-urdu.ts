/**
 * Conservative Roman Urdu → Urdu-script conversion for Azure ur-PK TTS.
 * Does not translate meaning. Unreliable input returns ok: false (text-only fallback).
 */

export type SpeechPart = { kind: 'urdu' | 'en'; text: string };

const ENGLISH_KEEP = new Set([
  'queue',
  'queues',
  'ticket',
  'tickets',
  'service',
  'services',
  'department',
  'departments',
  'pause',
  'resume',
  'skip',
  'serve',
  'barber',
  'salon',
  'clinic',
  'pharmacy',
  'business',
  'customer',
  'customers',
  'ok',
  'id',
  'sms',
  'app',
  'meribaari',
]);

const LEXICON: Record<string, string> = {
  aaj: 'آج',
  ab: 'اب',
  abhi: 'ابھی',
  acha: 'اچھا',
  accha: 'اچھا',
  agla: 'اگلا',
  agle: 'اگلے',
  aglay: 'اگلے',
  alag: 'الگ',
  aur: 'اور',
  aap: 'آپ',
  aapka: 'آپ کا',
  apka: 'آپ کا',
  aapki: 'آپ کی',
  apki: 'آپ کی',
  aapke: 'آپ کے',
  apke: 'آپ کے',
  ap: 'آپ',
  aye: 'آئے',
  aaye: 'آئے',
  ayega: 'آئے گا',
  ayegi: 'آئے گی',
  aayega: 'آئے گا',
  aayegi: 'آئے گی',
  baad: 'بعد',
  baari: 'باری',
  bari: 'باری',
  bahut: 'بہت',
  bohat: 'بہت',
  band: 'بند',
  batao: 'بتاؤ',
  bataen: 'بتائیں',
  bataein: 'بتائیں',
  bhi: 'بھی',
  bulao: 'بلاؤ',
  bulaen: 'بلائیں',
  bulaye: 'بلائے',
  chahiye: 'چاہیے',
  chahye: 'چاہیے',
  chahte: 'چاہتے',
  chahtey: 'چاہتے',
  chahta: 'چاہتا',
  chahti: 'چاہتی',
  chahun: 'چاہوں',
  chahoon: 'چاہوں',
  der: 'دیر',
  dhoondo: 'ڈھونڈو',
  dhoondho: 'ڈھونڈو',
  dhoondhein: 'ڈھونڈیں',
  dhoondein: 'ڈھونڈیں',
  dikhao: 'دکھاؤ',
  doosra: 'دوسرا',
  filhal: 'فی الحال',
  haan: 'ہاں',
  hafta: 'ہفتہ',
  haftay: 'ہفتے',
  hai: 'ہے',
  hain: 'ہیں',
  hoga: 'ہوگا',
  hogi: 'ہوگی',
  honge: 'ہوں گے',
  hoon: 'ہوں',
  hun: 'ہوں',
  huay: 'ہوئے',
  hue: 'ہوئے',
  huey: 'ہوئے',
  intizar: 'انتظار',
  intezar: 'انتظار',
  jaldi: 'جلدی',
  ji: 'جی',
  ka: 'کا',
  kal: 'کل',
  kar: 'کر',
  karein: 'کریں',
  kerein: 'کریں',
  karo: 'کرو',
  karwa: 'کروانا',
  karwana: 'کروانا',
  karwao: 'کروانا',
  ke: 'کے',
  ki: 'کی',
  kia: 'کیا',
  kiya: 'کیا',
  kiye: 'کیے',
  kitna: 'کتنا',
  kitne: 'کتنے',
  kitni: 'کتنی',
  koi: 'کوئی',
  kuch: 'کچھ',
  kya: 'کیا',
  kyun: 'کیوں',
  kyu: 'کیوں',
  kaise: 'کیسے',
  kaisay: 'کیسے',
  kesay: 'کیسے',
  kahan: 'کہاں',
  kahaan: 'کہاں',
  kidhar: 'کیدھر',
  kholo: 'کھولو',
  lagao: 'لگاؤ',
  laga: 'لگا',
  lagana: 'لگانا',
  lagado: 'لگا دو',
  lagaado: 'لگا دو',
  lekin: 'لیکن',
  magar: 'مگر',
  main: 'میں',
  mein: 'میں',
  mera: 'میرا',
  mere: 'میرے',
  meray: 'میرے',
  meri: 'میری',
  milay: 'ملے',
  milega: 'ملے گا',
  milegi: 'ملے گی',
  milenge: 'ملیں گے',
  mujh: 'مجھ',
  mujhe: 'مجھے',
  mujhay: 'مجھے',
  nahi: 'نہیں',
  nahin: 'نہیں',
  nhi: 'نہیں',
  nazdeek: 'نزدیک',
  nikal: 'نکل',
  nikalo: 'نکالو',
  nikaalo: 'نکالو',
  nikaal: 'نکال',
  pehla: 'پہلا',
  pehle: 'پہلے',
  pehlay: 'پہلے',
  phir: 'پھر',
  pichle: 'پچھلے',
  pichlay: 'پچھلے',
  qareeb: 'قریب',
  kareeb: 'قریب',
  qataar: 'قطار',
  rahe: 'رہے',
  rahay: 'رہے',
  rahi: 'رہی',
  ruko: 'رکو',
  rukao: 'روکو',
  saath: 'ساتھ',
  shamil: 'شامل',
  shukriya: 'شکریہ',
  theek: 'ٹھیک',
  thik: 'ٹھیک',
  thora: 'تھوڑا',
  wahan: 'وہاں',
  yahan: 'یہاں',
  wala: 'والا',
  wali: 'والی',
  walay: 'والے',
  yeh: 'یہ',
  ye: 'یہ',
  woh: 'وہ',
  wo: 'وہ',
  zaroor: 'ضرور',
  zarur: 'ضرور',
  zyada: 'زیادہ',
  hum: 'ہم',
  tum: 'تم',
  se: 'سے',
  do: 'دو',
  jo: 'جو',
  ya: 'یا',
  mansookh: 'منسوخ',
  mansukh: 'منسوخ',
  bandhein: 'بند کریں',
  kholain: 'کھولیں',
  soch: 'سوچ',
  raha: 'رہا',
  rahiye: 'رہیے',
  liye: 'لیے',
  lye: 'لیے',
  apna: 'اپنا',
  apni: 'اپنی',
  apne: 'اپنے',
  number: 'نمبر',
  minute: 'منٹ',
  minutes: 'منٹ',
  min: 'منٹ',
  log: 'لوگ',
  aage: 'آگے',
  agay: 'آگے',
  wait: 'انتظار',
  waiting: 'انتظار',
  currently: 'اس وقت',
  please: 'براہ کرم',
  thanks: 'شکریہ',
  hello: 'السلام علیکم',
  salam: 'سلام',
  salaam: 'سلام',
  assalamualaikum: 'السلام علیکم',
  walikum: 'وعلیکم',
  haanji: 'ہاں جی',
  nahiin: 'نہیں',
  ghalat: 'غلط',
  masla: 'مسئلہ',
  available: 'دستیاب',
  nahiun: 'نہیں',
};

const PHONETIC_DIGRAPHS: Array<[string, string]> = [
  ['kh', 'خ'],
  ['gh', 'غ'],
  ['ch', 'چ'],
  ['sh', 'ش'],
  ['zh', 'ژ'],
  ['th', 'تھ'],
  ['dh', 'دھ'],
  ['ph', 'پھ'],
  ['bh', 'بھ'],
  ['rh', 'ڑھ'],
  ['ng', 'نگ'],
  ['aa', 'ا'],
  ['ai', 'ی'],
  ['ay', 'ے'],
  ['ae', 'ے'],
  ['ee', 'ی'],
  ['ii', 'ی'],
  ['oo', 'و'],
  ['uu', 'و'],
  ['au', 'او'],
  ['ou', 'او'],
];

const PHONETIC_SINGLE: Record<string, string> = {
  a: 'ا',
  b: 'ب',
  c: 'ک',
  d: 'د',
  e: 'ے',
  f: 'ف',
  g: 'گ',
  h: 'ہ',
  i: 'ی',
  j: 'ج',
  k: 'ک',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'و',
  p: 'پ',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ت',
  u: 'و',
  v: 'و',
  w: 'و',
  x: 'کس',
  y: 'ی',
  z: 'ز',
};

export function transliterateRomanUrdu(
  text: string,
): { ok: true; parts: SpeechPart[] } | { ok: false } {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { ok: false };

  const parts: SpeechPart[] = [];
  let romanWordCount = 0;
  let unknownCount = 0;
  let urduCharCount = 0;

  for (const token of tokens) {
    if (!token.word) {
      appendPart(parts, 'urdu', token.raw);
      continue;
    }

    const lower = token.word.toLowerCase();
    if (/^\d+[a-z]?$/.test(lower) || /^[#@]/.test(token.word)) {
      appendPart(parts, 'en', token.raw);
      continue;
    }

    romanWordCount += 1;

    if (ENGLISH_KEEP.has(lower)) {
      appendPart(parts, 'en', token.word);
      continue;
    }

    const lex = LEXICON[lower];
    if (lex) {
      appendPart(parts, 'urdu', preserveWrap(token.raw, token.word, lex));
      urduCharCount += lex.length;
      continue;
    }

    if (looksLikeEnglish(lower) && !looksLikeRomanUrdu(lower)) {
      appendPart(parts, 'en', token.word);
      continue;
    }

    if (!looksLikeRomanUrdu(lower)) {
      unknownCount += 1;
      appendPart(parts, 'en', token.word);
      continue;
    }

    const phonetic = phoneticMap(lower);
    if (!phonetic) {
      unknownCount += 1;
      appendPart(parts, 'en', token.word);
      continue;
    }

    appendPart(parts, 'urdu', preserveWrap(token.raw, token.word, phonetic));
    urduCharCount += phonetic.length;
  }

  if (urduCharCount < 2) return { ok: false };
  if (romanWordCount > 0 && unknownCount / romanWordCount > 0.4) return { ok: false };

  const merged = mergeParts(parts);
  if (!merged.some((part) => part.kind === 'urdu' && /[\u0600-\u06FF]/.test(part.text))) {
    return { ok: false };
  }
  return { ok: true, parts: merged };
}

export function splitUrduWithEnglish(text: string): SpeechPart[] {
  const tokens = tokenize(text);
  const parts: SpeechPart[] = [];
  for (const token of tokens) {
    if (!token.word) {
      appendPart(parts, 'urdu', token.raw);
      continue;
    }
    const lower = token.word.toLowerCase();
    if (ENGLISH_KEEP.has(lower) && !/[\u0600-\u06FF]/.test(token.word)) {
      appendPart(parts, 'en', token.word);
    } else {
      appendPart(parts, 'urdu', token.raw);
    }
  }
  return mergeParts(parts);
}

function tokenize(text: string): Array<{ raw: string; word: string | null }> {
  const out: Array<{ raw: string; word: string | null }> = [];
  const re = /[A-Za-z\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+|\d+[A-Za-z]?|[^\s]|(\s+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const raw = match[0];
    if (/^\s+$/.test(raw) || /^[^\w\u0600-\u06FF]+$/.test(raw) || /^\d/.test(raw)) {
      out.push({ raw, word: null });
    } else if (/^[A-Za-z\u0600-\u06FF]+$/.test(raw)) {
      out.push({ raw, word: raw });
    } else {
      out.push({ raw, word: null });
    }
  }
  return out;
}

function looksLikeRomanUrdu(token: string): boolean {
  return /aa|ee|oo|kh|gh|q|ain$|ao$|ein$|ay$|ye$|un$|ain|oun/.test(token) ||
    (token.length >= 3 && /[aeiou]/.test(token) && /(?:hai|kya|mein|aap)/.test(token));
}

function looksLikeEnglish(token: string): boolean {
  if (token.length < 4) return false;
  return /(tion|ness|ment|ally|ous|ity|ful|less|able|ence|ance|ing|ers?)$/.test(token);
}

function phoneticMap(token: string): string | null {
  if (token.length < 3 || token.length > 16) return null;
  let i = 0;
  let out = '';
  while (i < token.length) {
    const two = token.slice(i, i + 2);
    const digraph = PHONETIC_DIGRAPHS.find(([from]) => from === two);
    if (digraph) {
      out += i === 0 && digraph[0] === 'aa' ? 'آ' : digraph[1];
      i += 2;
      continue;
    }
    const one = token[i];
    const mapped = PHONETIC_SINGLE[one];
    if (!mapped) return null;
    out += i === 0 && one === 'a' ? 'ا' : mapped;
    i += 1;
  }
  return out.length >= 2 ? out : null;
}

function preserveWrap(raw: string, word: string, converted: string): string {
  const start = raw.indexOf(word);
  if (start < 0) return converted;
  return raw.slice(0, start) + converted + raw.slice(start + word.length);
}

function appendPart(parts: SpeechPart[], kind: SpeechPart['kind'], text: string): void {
  if (!text) return;
  const last = parts[parts.length - 1];
  if (last && last.kind === kind) {
    last.text += text;
    return;
  }
  parts.push({ kind, text });
}

function mergeParts(parts: SpeechPart[]): SpeechPart[] {
  return parts.filter((part) => part.text.length > 0);
}
