export type ChatMessage = {
  id: string;
  text: string;
  sentAt: string;
  isOutgoing: boolean;
  status?: 'sent' | 'delivered' | 'read';
};

export type ChatSummary = {
  id: string;
  name: string;
  avatarLabel: string;
  avatarColor: string;
  preview: string;
  dateLabel: string;
  unreadCount?: number;
  pinned?: boolean;
  isGroup?: boolean;
  groupCount?: number;
};

export type AttentionItem = {
  id: string;
  tone: 'critical' | 'warning';
  text: string;
};

export type ConversationBrief = {
  id: string;
  name: string;
  avatarLabel: string;
  unreadCount: number;
  priority: 'Low' | 'Medium' | 'High';
  summary: string;
  plans: string[];
};

export type BusinessCategory = {
  id: string;
  label: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  etaLabel: string;
  feeLabel: string;
  tags: string[];
  imageColor: string;
  description: string;
  address: string;
  menu: MenuCategory[];
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export type CallEntry = {
  id: string;
  name: string;
  avatarLabel: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timeLabel: string;
};

export type UserProfile = {
  name: string;
  email: string;
  avatarLabel: string;
};

export const userProfile: UserProfile = {
  name: 'Gocha',
  email: 'gocha.admin@gmail.com',
  avatarLabel: 'G',
};

export const chatSummaries: ChatSummary[] = [
  {
    id: 'liam',
    name: 'Liam Becker',
    avatarLabel: 'LB',
    avatarColor: '#5b8def',
    preview: 'Anytime! Ship it 🚀',
    dateLabel: '8/8/26',
    pinned: true,
  },
  {
    id: 'design-team',
    name: 'Design Team',
    avatarLabel: 'DT',
    avatarColor: '#7c6cf0',
    preview: 'Final mockups are in the shared folder 👍',
    dateLabel: '8/7/26',
    unreadCount: 4,
    pinned: true,
    isGroup: true,
    groupCount: 4,
  },
  {
    id: 'sofia',
    name: 'Sofia Martinez',
    avatarLabel: 'SM',
    avatarColor: '#e07a5f',
    preview: 'Can you review the deck before tomorrow?',
    dateLabel: '8/6/26',
    unreadCount: 2,
  },
  {
    id: 'weekend-trip',
    name: 'Weekend Trip',
    avatarLabel: 'WT',
    avatarColor: '#3d9a8b',
    preview: 'Who is bringing snacks for Saturday? 🏔️',
    dateLabel: '8/5/26',
    unreadCount: 3,
    isGroup: true,
    groupCount: 6,
  },
  {
    id: 'noah',
    name: 'Noah Park',
    avatarLabel: 'NP',
    avatarColor: '#f4a261',
    preview: 'Game night Friday?',
    dateLabel: '8/4/26',
  },
  {
    id: 'aria',
    name: 'Aria Chen',
    avatarLabel: 'AC',
    avatarColor: '#9b5de5',
    preview: "Loved the demo. Let's sync next week 🎉",
    dateLabel: '8/3/26',
  },
];

export const chatMessages: Record<string, ChatMessage[]> = {
  liam: [
    {
      id: '1',
      text: 'Thanks for the review 🙏',
      sentAt: '2:14 AM',
      isOutgoing: false,
    },
    {
      id: '2',
      text: 'Anytime! Ship it 🚀',
      sentAt: '2:14 AM',
      isOutgoing: true,
      status: 'read',
    },
  ],
  sofia: [
    {
      id: '1',
      text: 'Can you review the deck before tomorrow?',
      sentAt: '9:02 AM',
      isOutgoing: false,
    },
    {
      id: '2',
      text: 'Coffee at 10am still works?',
      sentAt: '9:03 AM',
      isOutgoing: false,
    },
  ],
};

export const briefingText =
  "You've been busy while away! You have a coffee meeting with Sofia at 10am tomorrow, and you still need to address her question about the presentation. Also, keep in mind you've committed to bringing food for the weekend trip this Saturday.";

export const attentionItems: AttentionItem[] = [
  {
    id: 'a1',
    tone: 'critical',
    text: 'Sofia is waiting for a reply regarding the presentation status.',
  },
  {
    id: 'a2',
    tone: 'warning',
    text: 'Weekend trip planning: Saturday 7am departure, you are responsible for the food.',
  },
  {
    id: 'a3',
    tone: 'warning',
    text: 'Coffee meeting with Sofia tomorrow at 10am.',
  },
];

export const conversationBriefs: ConversationBrief[] = [
  {
    id: 'noah',
    name: 'Noah Park',
    avatarLabel: 'NP',
    unreadCount: 0,
    priority: 'Low',
    summary: 'Noah checked in about a potential game night this Friday.',
    plans: ['Friday game night'],
  },
];

export const businessCategories: BusinessCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food & Drink' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'services', label: 'Services' },
  { id: 'shop', label: 'Shop' },
];

export const businesses: Business[] = [
  {
    id: 'bella-napoli',
    name: 'Bella Napoli',
    category: 'food',
    rating: 4.7,
    reviewCount: 1284,
    priceLevel: '$$',
    etaLabel: '25-35 min',
    feeLabel: '$2.99 delivery',
    tags: ['pizza', 'pasta', 'italian'],
    imageColor: '#c45c26',
    description: 'Wood-fired pizzas and handmade pasta from Naples.',
    address: '142 Mulberry St',
    menu: [
      {
        id: 'pizza',
        title: 'Pizza',
        items: [
          {
            id: 'margherita',
            name: 'Margherita Pizza',
            description: 'Tomato, fresh mozzarella, basil, olive oil',
            price: '$14.50',
          },
          {
            id: 'diavola',
            name: 'Diavola',
            description: 'Spicy salami, chili, mozzarella',
            price: '$16.00',
          },
        ],
      },
      {
        id: 'pasta',
        title: 'Pasta',
        items: [
          {
            id: 'carbonara',
            name: 'Carbonara',
            description: 'Egg, pecorino, guanciale, black pepper',
            price: '$15.50',
          },
        ],
      },
    ],
  },
  {
    id: 'cityride',
    name: 'CityRide',
    category: 'services',
    rating: 4.6,
    reviewCount: 8932,
    priceLevel: '$$',
    etaLabel: '5-10 min',
    feeLabel: '$0.00',
    tags: ['ride', 'transport', 'taxi'],
    imageColor: '#1e6f8c',
    description: 'On-demand rides across the city.',
    address: 'Citywide',
    menu: [],
  },
];

export const aiOrderSuggestions = [
  'Order me lunch 🥗',
  'Get my usual coffee ☕',
  'Groceries for dinner tonight 🛒',
  'I need a ride to the airport 🚕',
];

export const calls: CallEntry[] = [
  {
    id: 'c1',
    name: 'Liam Becker',
    avatarLabel: 'LB',
    type: 'outgoing',
    timeLabel: 'Today, 2:14 AM',
  },
  {
    id: 'c2',
    name: 'Sofia Martinez',
    avatarLabel: 'SM',
    type: 'missed',
    timeLabel: 'Yesterday, 4:45 PM',
  },
  {
    id: 'c3',
    name: 'Design Team',
    avatarLabel: 'DT',
    type: 'incoming',
    timeLabel: 'Aug 7, 11:20 AM',
  },
];

export function getChatById(id: string): ChatSummary | undefined {
  return chatSummaries.find((c) => c.id === id);
}

export function getBusinessById(id: string): Business | undefined {
  return businesses.find((b) => b.id === id);
}
