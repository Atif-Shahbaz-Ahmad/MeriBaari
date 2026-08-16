import type { ReplyStyle } from '../_shared/chatbot/reply-style.ts';

type HelpEntry = { title: string; body: string };

const HELP: Record<ReplyStyle, Record<string, HelpEntry>> = {
  english: {
    queues: {
      title: 'How queues work',
      body:
        'Each service has its own live queue. Customers join from the app and receive a ticket. On Queue you can call the next customer, mark them serving or served, skip them, and pause or resume the queue. Calling a customer sends them a notification automatically.',
    },
    departments: {
      title: 'Departments',
      body:
        'Open Services, then add a department (for example Hair or Beard). Departments group your services. You can edit or deactivate a department from its details screen.',
    },
    services: {
      title: 'Services',
      body:
        'Inside a department, add services with a name, price in Rs., and estimated duration. Queues are created when customers join a service. Inactive services are hidden from customers.',
    },
    notifications: {
      title: 'Notifications',
      body:
        'When you call, serve, skip, pause, or resume a queue, MeriBaari already notifies waiting customers. You do not need to send a separate message. Check Notifications in the app for your own alerts, such as a customer joining.',
    },
    profile: {
      title: 'Business profile',
      body:
        'Open Dashboard → Manage organization to edit name, description, category, phone, address, city, working hours, and logo. Customers see this after your subscription is approved.',
    },
    location: {
      title: 'Business location',
      body:
        'Set your street address and map coordinates in Manage organization. Coordinates are required for customers searching nearby. Use current location if you are at the shop.',
    },
    subscription: {
      title: 'Subscription and approval',
      body:
        'Customers can find your business when the subscription is active, the organization is active, and an admin has not hidden it. After an admin approves a payment you must wait 31 days before paying again. Admins can hide a business for complaints, bad reviews, or conduct issues. Submit payment from Subscription. This assistant can tell you the status but cannot approve payments or change visibility.',
    },
    customers: {
      title: 'Customer management',
      body:
        'The Queue tab lists waiting customers by ticket number. Call next, start serving, mark served, or skip. Walk-in is available from the dashboard when you want to add someone who is already at the shop.',
    },
    history: {
      title: 'History',
      body:
        'Business History shows served, cancelled, and skipped tickets from the database — not the local activity timeline. Use it for questions like how many customers you served today.',
    },
    pause_resume: {
      title: 'Pause, resume, and close',
      body:
        'Pause temporarily stops new joins and tells waiting customers the queue is paused. Resume opens it again. Close is a stronger stop. If you say "band kar do", the assistant will ask whether you mean pause or close.',
    },
    calling: {
      title: 'Calling customers',
      body:
        'Call Next takes the longest-waiting customer, marks them called, and sends their existing ticket notification. Then mark them serving and served when you finish. Do not invent ticket numbers.',
    },
    overview: {
      title: 'Business assistant overview',
      body:
        'Ask about today’s customers, waiting count, who is next, services and prices, queue status, history, and account approval. You can also ask to call next, pause, resume, serve, or skip. Skip and close need confirmation. The assistant only sees your own business.',
    },
  },
  roman_urdu: {
    queues: {
      title: 'Queues kaise kaam karti hain',
      body:
        'Har service ki apni live queue hoti hai. Customers app se join karke ticket lete hain. Queue screen par aap next customer bula sakte hain, serving/served mark kar sakte hain, skip kar sakte hain, aur pause/resume kar sakte hain. Call karne par customer ko notification khud chali jati hai.',
    },
    departments: {
      title: 'Departments',
      body:
        'Services kholen aur department add karein (jaise Hair ya Beard). Departments services ko group karte hain. Details screen se edit ya deactivate kar sakte hain.',
    },
    services: {
      title: 'Services',
      body:
        'Department ke andar service add karein: naam, Rs. mein price, aur estimated duration. Jab customer join kare to queue ban jati hai. Inactive services customers ko nahi dikhti.',
    },
    notifications: {
      title: 'Notifications',
      body:
        'Call, serve, skip, pause, ya resume par MeriBaari pehle se customers ko notify karti hai. Alag se message bhejne ki zaroorat nahi. Apni alerts Notifications mein dekhein.',
    },
    profile: {
      title: 'Business profile',
      body:
        'Dashboard → Manage organization mein naam, description, category, phone, address, city, hours, aur logo edit karein. Customers ye tab dekhte hain jab subscription approve ho.',
    },
    location: {
      title: 'Business location',
      body:
        'Manage organization mein address aur map coordinates set karein. Nearby search ke liye coordinates zaroori hain. Shop par hon to current location use karein.',
    },
    subscription: {
      title: 'Subscription aur approval',
      body:
        'Customers tab dhoondhte hain jab subscription active ho, business active ho, aur admin ne hide na kiya ho. Admin approval ke 31 din baad hi next payment submit ho sakti hai. Shikayat, buri reviews, ya conduct issues par admin business hide kar sakta hai. Subscription se payment submit karein. Yeh assistant status bata sakta hai, approve ya visibility change nahi kar sakta.',
    },
    customers: {
      title: 'Customer management',
      body:
        'Queue tab waiting customers ko ticket number se dikhati hai. Call next, serving, served, ya skip. Walk-in dashboard se available hai.',
    },
    history: {
      title: 'History',
      body:
        'Business History served, cancelled, aur skipped tickets database se dikhati hai — local activity timeline nahi. Aaj kitne serve hue, ye yahan se aata hai.',
    },
    pause_resume: {
      title: 'Pause, resume, aur close',
      body:
        'Pause thori der ke liye joins rokta hai. Resume dobara kholta hai. Close zyada strong stop hai. "Band kar do" par assistant poochhe ga ke pause chahiye ya close.',
    },
    calling: {
      title: 'Customers ko call karna',
      body:
        'Call Next sab se pehle waiting customer ko called mark karta hai aur unki existing notification bhejta hai. Kaam khatam hone par serving phir served mark karein.',
    },
    overview: {
      title: 'Business assistant',
      body:
        'Aaj ke customers, waiting count, next kaun hai, services/prices, queue status, history, aur approval ke baare mein poochhein. Call next, pause, resume, serve, ya skip bhi karwa sakte hain. Skip aur close confirmation maangte hain. Assistant sirf aap ka business dekhta hai.',
    },
  },
  urdu_script: {
    queues: {
      title: 'قطاریں کیسے کام کرتی ہیں',
      body:
        'ہر سروس کی اپنی لائیو قطار ہوتی ہے۔ گاہک ایپ سے شامل ہو کر ٹکٹ لیتے ہیں۔ قطار اسکرین پر آپ اگلے گاہک کو بلا سکتے ہیں، سرویڈ نشان زد کر سکتے ہیں، چھوڑ سکتے ہیں، اور قطار روک یا دوبارہ چلا سکتے ہیں۔ بلانے پر نوٹیفکیشن خود جاتی ہے۔',
    },
    departments: {
      title: 'ڈیپارٹمنٹس',
      body:
        'سروسز کھولیں اور ڈیپارٹمنٹ شامل کریں۔ ڈیپارٹمنٹ سروسز کو گروپ کرتا ہے۔ تفصیلات سے ترمیم یا غیر فعال کر سکتے ہیں۔',
    },
    services: {
      title: 'سروسز',
      body:
        'ڈیپارٹمنٹ میں نام، قیمت روپے میں، اور اندازاً دورانیہ کے ساتھ سروس شامل کریں۔ گاہک شامل ہونے پر قطار بنتی ہے۔ غیر فعال سروسز گاہکوں کو نہیں دکھتیں۔',
    },
    notifications: {
      title: 'نوٹیفکیشنز',
      body:
        'کال، سروی، چھوڑنا، توقف یا دوبارہ شروع کرنے پر میری باری گاہکوں کو پہلے سے مطلع کرتی ہے۔ الگ پیغام بھیجنے کی ضرورت نہیں۔'
    },
    profile: {
      title: 'کاروباری پروفائل',
      body:
        'ڈیش بورڈ → تنظیم منظم کریں سے نام، تفصیل، کیٹگری، فون، پتہ، شہر، اوقات اور لوگو تبدیل کریں۔ منظوری کے بعد گاہک یہ دیکھتے ہیں۔',
    },
    location: {
      title: 'کاروباری مقام',
      body:
        'تنظیم منظم کریں میں پتہ اور نقشے کے کوآرڈینیٹس سیٹ کریں۔ قریبی تلاش کے لیے کوآرڈینیٹس ضروری ہیں۔',
    },
    subscription: {
      title: 'سبسکرپشن اور منظوری',
      body:
        'گاہک تب تلاش کرتے ہیں جب سبسکرپشن فعال ہو اور ایڈمن نے کاروبار چھپایا نہ ہو۔ ایڈمن منظوری کے 31 دن بعد ہی اگلی ادائیگی جمع ہو سکتی ہے۔ شکایات، بری ریویوز یا رویے کے مسائل پر ایڈمن کاروبار چھپا سکتا ہے۔ یہ اسسٹنٹ صرف حیثیت بتا سکتا ہے۔',
    },
    customers: {
      title: 'گاہک انتظام',
      body:
        'قطار ٹیب انتظار کرنے والے گاہک ٹکٹ نمبر سے دکھاتی ہے۔ اگلا بلائیں، سرویڈ کریں، یا چھوڑیں۔ واک اِن ڈیش بورڈ سے دستیاب ہے۔'
    },
    history: {
      title: 'تاریخ',
      body:
        'کاروباری ہسٹری مکمل، منسوخ اور چھوڑی گئی ٹکٹیں ڈیٹابیس سے دکھاتی ہے — مقامی ٹائم لائن نہیں۔',
    },
    pause_resume: {
      title: 'توقف، دوبارہ شروع، بند',
      body:
        'توقف عارضی طور پر نئی شمولیت روکتا ہے۔ دوبارہ شروع کھولتا ہے۔ بند زیادہ مضبوط ہے۔ "بند کر دو" پر اسسٹنٹ پوچھے گا کہ توقف چاہیے یا بند۔',
    },
    calling: {
      title: 'گاہکوں کو بلانا',
      body:
        'کال نیکسٹ سب سے پہلے انتظار کرنے والے گاہک کو بلاتا ہے اور ان کا موجودہ نوٹیفکیشن بھیجتا ہے۔',
    },
    overview: {
      title: 'کاروباری اسسٹنٹ',
      body:
        'آج کے گاہک، انتظار، اگلا کون ہے، سروسز اور قیمتیں، قطار کی حیثیت، ہسٹری اور منظوری پوچھیں۔ اگلا بلائیں، توقف، دوبارہ شروع، سروی یا چھوڑنا بھی کروا سکتے ہیں۔ چھوڑنا اور بند تصدیق مانگتے ہیں۔ اسسٹنٹ صرف آپ کا کاروبار دیکھتا ہے۔'
    },
  },
};

const TOPIC_ALIASES: Record<string, string> = {
  queue: 'queues',
  queues: 'queues',
  department: 'departments',
  departments: 'departments',
  service: 'services',
  services: 'services',
  notification: 'notifications',
  notifications: 'notifications',
  profile: 'profile',
  business: 'profile',
  location: 'location',
  address: 'location',
  subscription: 'subscription',
  approval: 'subscription',
  payment: 'subscription',
  customer: 'customers',
  customers: 'customers',
  history: 'history',
  activity: 'history',
  pause: 'pause_resume',
  resume: 'pause_resume',
  close: 'pause_resume',
  pause_resume: 'pause_resume',
  call: 'calling',
  calling: 'calling',
  next: 'calling',
  overview: 'overview',
  help: 'overview',
};

export function getBusinessHelp(topic: string | undefined, style: ReplyStyle): HelpEntry {
  const key = topic ? TOPIC_ALIASES[topic.trim().toLowerCase()] ?? 'overview' : 'overview';
  const pack = HELP[style] ?? HELP.english;
  return pack[key] ?? pack.overview;
}
