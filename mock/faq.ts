import type { AboutContent, FaqItem } from '@/types';



import { AppConfig } from '@/constants/config';



export const MOCK_FAQ: FaqItem[] = [

  {

    id: 'faq-1',

    question: 'How do I join a queue?',

    answer:

      'Open Join Queue from Home, pick an organization, department, and service, then confirm. You’ll receive a digital ticket instantly.',

    category: 'getting-started',

  },

  {

    id: 'faq-2',

    question: 'Will I be notified when it’s my turn?',

    answer:

      'Yes. Enable turn reminders in Settings. MeriBaari alerts you when you are a few positions away and when it’s your turn.',

    category: 'queues',

  },

  {

    id: 'faq-3',

    question: 'Can I cancel a ticket?',

    answer:

      'Open the active ticket and tap Cancel Queue. You’ll leave the line and the ticket moves to Cancelled history.',

    category: 'tickets',

  },

  {

    id: 'faq-4',

    question: 'What if I miss my turn?',

    answer:

      'If you miss your call, the ticket is marked Missed. You can join the same service again from Join Queue.',

    category: 'tickets',

  },

  {

    id: 'faq-5',

    question: 'Does MeriBaari work offline?',

    answer:

      'You need a connection to join queues and receive live updates. Saved tickets remain visible offline as a reference.',

    category: 'getting-started',

  },

  {

    id: 'faq-6',

    question: 'How do I change the theme?',

    answer:

      'Go to Profile → Settings → Theme, or use Appearance on your profile. Choose System, Light, or Dark.',

    category: 'account',

  },

  {

    id: 'faq-7',

    question: 'Is my data private?',

    answer:

      'We only use your account details to manage tickets. Review Privacy settings anytime. Backend sync arrives in a later phase.',

    category: 'account',

  },

  {

    id: 'faq-8',

    question: 'When can a business pay the next subscription fee?',

    answer:

      'After an administrator approves a payment, the business owner can submit the next subscription fee only after 31 days from that approval date.',

    category: 'account',

  },

  {

    id: 'faq-9',

    question: 'Can MeriBaari hide a business from customers?',

    answer:

      'Yes. Administrators may hide a business if there are complaints, bad reviews, or behaviour issues. The subscription can stay active, but customers will not see the business until an admin restores visibility.',

    category: 'account',

  },

];



export const MOCK_ABOUT: AboutContent = {

  version: '1.0.0',

  description:

    'MeriBaari (My Turn) is a smart digital queue companion that helps people skip physical waiting lines at hospitals, banks, government offices, and everyday service counters across Pakistan.',

  mission:

    'To make waiting fair, transparent, and stress-free — so everyone knows exactly when it’s their turn.',

  vision:

    'A Pakistan where queues are digital-first: fewer crowded halls, clearer expectations, and better service experiences.',

  goal:

    'Deliver a production-ready mobile experience that connects citizens and organizations through reliable, real-time queue management.',

  technologies: [

    'React Native',

    'Expo SDK 54',

    'Expo Router',

    'TypeScript',

    'Zustand',

    'React Query',

    'Reanimated',

    'NativeWind',

  ],

  team: [

    { name: 'Atif', role: 'Product & Engineering' },

    { name: 'MeriBaari Team', role: 'Design & Research' },

  ],

  supportEmail: 'atif.s.ahmad2@gmail.com',

  supportPhone: '+92 324 9780380',

};



export const APP_DISPLAY_NAME = AppConfig.name;

