import type { ReplyStyle } from './reply-style.ts';

type HelpEntry = { title: string; body: string };

const HELP: Record<ReplyStyle, Record<string, HelpEntry>> = {
  english: {
    join_queue: {
      title: 'How to join a queue',
      body:
        'On Home, tap Find Places (or ask this assistant). Open a business, choose a department, then a service, and confirm. You can also ask the assistant to join a queue — it will collect the business and service, then show Confirm & Join Queue. You receive a digital ticket only after you confirm.',
    },
    cancel_ticket: {
      title: 'How to cancel a ticket',
      body:
        'Open My Tickets, tap your active ticket, then Cancel Queue. You can also ask this assistant to cancel — it will show your ticket and ask you to tap Yes, Cancel Ticket. You leave the line and the ticket moves to history as cancelled.',
    },
    notifications: {
      title: 'How notifications work',
      body:
        'MeriBaari sends in-app (and optional push) alerts when your turn is approaching, when you are called, and for queue pauses or closures. Open the Notifications tab. Change preferences in Profile → Settings.',
    },
    language: {
      title: 'How to change language',
      body:
        'Go to Profile → Language and choose English or Urdu. The app text updates immediately. Urdu uses a right-to-left layout. The assistant still replies in the language you type.',
    },
    favorites: {
      title: 'How to add a favorite',
      body:
        'Open a business and tap the heart, or tap the heart on a business card. Saved places appear under Home → Favorites.',
    },
    nearby: {
      title: 'How to find nearby businesses',
      body:
        'Allow location permission when asked. Home shows nearby places sorted by distance. You can also search in Discover and filter by distance (2, 5, 10, or 25 km) or search by city/address if location is off.',
    },
    tickets: {
      title: 'Tickets and queue status',
      body:
        'My Tickets shows your active digital ticket, including people ahead and estimated wait. Home also shows your current queue card when you are waiting. History is under Home → History.',
    },
    overview: {
      title: 'How MeriBaari works',
      body:
        'MeriBaari is a digital queue app. Customers find businesses, join a service queue, and wait with a ticket instead of standing in line. You can search nearby, save favorites, get notified when your turn is close, and review visits after you are served.',
    },
  },
  roman_urdu: {
    join_queue: {
      title: 'Queue join kaise karein',
      body:
        'Home par Find Places (ya assistant) tap karein. Business kholen, department phir service choose karein, confirm karein. Assistant se bhi queue join karwa sakte hain — pehle business/service confirm hongi, phir Confirm & Join Queue. Digital ticket tab milti hai jab aap confirm karein.',
    },
    cancel_ticket: {
      title: 'Ticket cancel kaise karein',
      body:
        'My Tickets kholen, apni active ticket tap karein, phir Cancel Queue. Assistant se bhi cancel karwa sakte hain — pehle ticket dikhegi, phir Yes, Cancel Ticket tap karein. Aap line se nikal jate hain aur ticket history mein cancelled ho jati hai.',
    },
    notifications: {
      title: 'Notifications kaise kaam karti hain',
      body:
        'MeriBaari in-app (aur optional push) alerts bhejti hai jab aap ki bari qareeb ho, jab aap ko call kiya jaye, aur queue pause/close ho. Notifications tab kholen. Preferences Profile → Settings mein change karein.',
    },
    language: {
      title: 'Language kaise change karein',
      body:
        'Profile → Language mein English ya Urdu choose karein. App ka text turant update hota hai. Assistant aap ke typed message ki language follow karta hai.',
    },
    favorites: {
      title: 'Favorite kaise add karein',
      body:
        'Business kholen aur heart tap karein, ya card par heart tap karein. Saved places Home → Favorites mein milte hain.',
    },
    nearby: {
      title: 'Qareebi businesses kaise dhoondhein',
      body:
        'Location permission allow karein. Home qareebi places distance ke mutabiq dikhata hai. Discover mein 2, 5, 10, ya 25 km filter use karein, ya location off ho to city/address se search karein.',
    },
    tickets: {
      title: 'Tickets aur queue status',
      body:
        'My Tickets mein aap ki active digital ticket, people ahead, aur estimated wait dikhai deti hai. Home par bhi current queue card hota hai. History Home → History mein hai.',
    },
    overview: {
      title: 'MeriBaari kaise kaam karti hai',
      body:
        'MeriBaari digital queue app hai. Customers businesses dhoondhte hain, service queue join karte hain, aur ticket ke sath wait karte hain — line mein khare hone ki zaroorat nahi. Nearby search, favorites, notifications, aur visit ke baad review milte hain.',
    },
  },
  urdu_script: {
    join_queue: {
      title: 'قطار میں کیسے شامل ہوں',
      body:
        'ہوم پر Find Places (یا اسسٹنٹ) دبائیں۔ کاروبار کھولیں، ڈیپارٹمنٹ پھر سروس منتخب کریں، تصدیق کریں۔ اسسٹنٹ سے بھی قطار میں شامل ہو سکتے ہیں — پہلے کاروبار/سروس طے ہوگی، پھر Confirm & Join Queue۔ ڈیجیٹل ٹکٹ تب ملتی ہے جب آپ تصدیق کریں۔',
    },
    cancel_ticket: {
      title: 'ٹکٹ کیسے منسوخ کریں',
      body:
        'My Tickets کھولیں، اپنی فعال ٹکٹ دبائیں، پھر Cancel Queue۔ اسسٹنٹ سے بھی منسوخ کروا سکتے ہیں — پہلے ٹکٹ دکھے گی، پھر Yes, Cancel Ticket دبائیں۔ آپ قطار سے نکل جاتے ہیں اور ٹکٹ ہسٹری میں cancelled ہو جاتی ہے۔',
    },
    notifications: {
      title: 'نوٹیفکیشن کیسے کام کرتے ہیں',
      body:
        'میری باری ان-ایپ (اور اختیاری پش) الرٹس بھیجتی ہے جب آپ کی باری قریب ہو، جب آپ کو بلایا جائے، اور قطار رکے یا بند ہو۔ Notifications ٹیب کھولیں۔ ترجیحات Profile → Settings میں بدلیں۔',
    },
    language: {
      title: 'زبان کیسے بدلیں',
      body:
        'Profile → Language میں انگریزی یا اردو منتخب کریں۔ ایپ کا متن فوراً بدل جاتا ہے۔ اسسٹنٹ آپ کے لکھے ہوئے پیغام کی زبان میں جواب دیتا ہے۔',
    },
    favorites: {
      title: 'پسندیدہ کیسے شامل کریں',
      body:
        'کاروبار کھولیں اور دل کا نشان دبائیں، یا کارڈ پر دل دبائیں۔ محفوظ جگہیں Home → Favorites میں ملتی ہیں۔',
    },
    nearby: {
      title: 'قریبی کاروبار کیسے تلاش کریں',
      body:
        'لوکیشن کی اجازت دیں۔ ہوم قریبی جگہیں فاصلے کے مطابق دکھاتا ہے۔ Discover میں 2، 5، 10 یا 25 کلومیٹر فلٹر استعمال کریں، یا لوکیشن بند ہو تو شہر/پتہ سے تلاش کریں۔',
    },
    tickets: {
      title: 'ٹکٹ اور قطار کی صورتحال',
      body:
        'My Tickets میں آپ کی فعال ڈیجیٹل ٹکٹ، آگے لوگ، اور اندازاً انتظار نظر آتا ہے۔ ہوم پر بھی موجودہ قطار کا کارڈ ہوتا ہے۔ ہسٹری Home → History میں ہے۔',
    },
    overview: {
      title: 'میری باری کیسے کام کرتی ہے',
      body:
        'میری باری ڈیجیٹل قطار کی ایپ ہے۔ گاہک کاروبار تلاش کرتے ہیں، سروس کی قطار میں شامل ہوتے ہیں، اور ٹکٹ کے ساتھ انتظار کرتے ہیں — لائن میں کھڑے ہونے کی ضرورت نہیں۔ قریبی تلاش، پسندیدہ، نوٹیفکیشن، اور وزٹ کے بعد ریویو ملتے ہیں۔',
    },
  },
};

export function getAppHelp(
  topic?: string,
  replyStyle: ReplyStyle = 'english',
): {
  topic: string;
  title: string;
  body: string;
  availableTopics: string[];
  replyStyle: ReplyStyle;
} {
  const key = normalizeTopic(topic);
  const catalog = HELP[replyStyle] ?? HELP.english;
  const entry = catalog[key] ?? catalog.overview;
  return {
    topic: key,
    title: entry.title,
    body: entry.body,
    availableTopics: Object.keys(HELP.english),
    replyStyle,
  };
}

function normalizeTopic(topic?: string): string {
  const raw = (topic ?? 'overview').toLowerCase().trim();
  if (!raw || raw === 'how_it_works' || raw === 'meribaari') return 'overview';
  if (raw.includes('join') || raw.includes('book') || raw.includes('queue')) {
    return 'join_queue';
  }
  if (raw.includes('cancel')) return 'cancel_ticket';
  if (raw.includes('notif')) return 'notifications';
  if (raw.includes('lang') || raw.includes('urdu') || raw.includes('english')) {
    return 'language';
  }
  if (raw.includes('fav') || raw.includes('heart')) return 'favorites';
  if (raw.includes('near') || raw.includes('distance') || raw.includes('location')) {
    return 'nearby';
  }
  if (raw.includes('ticket') || raw.includes('wait') || raw.includes('turn')) {
    return 'tickets';
  }
  return HELP.english[raw] ? raw : 'overview';
}
