import type { AppNotification, NotificationCategory } from '@/types';



const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const hoursAgo = (h: number) => minutesAgo(h * 60);

const daysAgo = (d: number) => minutesAgo(d * 24 * 60);



export const MOCK_NOTIFICATIONS: AppNotification[] = [

  {

    id: 'n-1',

    title: 'Your turn is in 10 minutes',

    description: 'Ticket A-127 at City Hospital — about 3 people ahead in General OPD.',

    type: 'turn_soon',

    category: 'reminders',

    createdAt: minutesAgo(8),

    read: false,

  },

  {

    id: 'n-2',

    title: 'Your turn is next',

    description: 'Ticket B-058 at HBL Jail Road. Please head to Counter 02.',

    type: 'turn_next',

    category: 'queue',

    createdAt: minutesAgo(22),

    read: false,

  },

  {

    id: 'n-3',

    title: 'Queue delayed by 15 minutes',

    description: 'NADRA CNIC Renewal is running slower than usual. Updated wait: ~45 min.',

    type: 'queue_delayed',

    category: 'queue',

    createdAt: hoursAgo(2),

    read: false,

  },

  {

    id: 'n-4',

    title: 'Queue completed successfully',

    description: 'Thanks for visiting Punjab Institute of Cardiology. Ticket D-091 is done.',

    type: 'queue_completed',

    category: 'queue',

    createdAt: hoursAgo(5),

    read: true,

  },

  {

    id: 'n-5',

    title: 'Counter changed',

    description: 'Your service moved from Counter 03 to Counter 05 at City Hospital.',

    type: 'counter_changed',

    category: 'queue',

    createdAt: hoursAgo(6),

    read: true,

  },

  {

    id: 'n-6',

    title: 'Queue cancelled',

    description: 'Ticket F-012 at Shaukat Khanum was cancelled. Join again anytime.',

    type: 'queue_cancelled',

    category: 'system',

    createdAt: daysAgo(2),

    read: true,

  },

  {

    id: 'n-7',

    title: 'New organization nearby',

    description: 'Chughtai Lab is 1.1 km away and accepting digital queues right now.',

    type: 'org_nearby',

    category: 'promotions',

    createdAt: daysAgo(1),

    read: false,

  },

  {

    id: 'n-8',

    title: 'Joined queue successfully',

    description: 'You joined General OPD Consultation. Ticket A-127.',

    type: 'joined',

    category: 'queue',

    createdAt: minutesAgo(18),

    read: true,

  },

  {

    id: 'n-9',

    title: 'Weekend tip',

    description: 'Join early on Saturdays — hospitals and banks often get busier after 11 AM.',

    type: 'promo',

    category: 'promotions',

    createdAt: daysAgo(3),

    read: true,

  },

];



export function getUnreadCount(notifications: AppNotification[] = MOCK_NOTIFICATIONS): number {

  return notifications.filter((n) => !n.read).length;

}



export function filterNotificationsByCategory(

  notifications: AppNotification[],

  category: NotificationCategory | 'all',

): AppNotification[] {

  if (category === 'all') return notifications;

  return notifications.filter((n) => n.category === category);

}



export function groupNotificationsByDay(notifications: AppNotification[]) {

  const todayKey = dayKey(new Date());

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = dayKey(yesterday);



  const groups: { title: string; data: AppNotification[] }[] = [];

  const today: AppNotification[] = [];

  const yest: AppNotification[] = [];

  const earlier: AppNotification[] = [];



  const sorted = [...notifications].sort(

    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),

  );



  for (const n of sorted) {

    const key = dayKey(new Date(n.createdAt));

    if (key === todayKey) today.push(n);

    else if (key === yesterdayKey) yest.push(n);

    else earlier.push(n);

  }



  if (today.length) groups.push({ title: 'Today', data: today });

  if (yest.length) groups.push({ title: 'Yesterday', data: yest });

  if (earlier.length) groups.push({ title: 'Earlier', data: earlier });



  return groups;

}



function dayKey(d: Date) {

  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

}

