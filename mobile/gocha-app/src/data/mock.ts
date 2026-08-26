/** @deprecated Use src/chat/types and ChatContext instead */
export type { ChatMessage, ChatRecord as ChatSummary } from '../chat/types';

export type CommunityGroup = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  privacy: 'discoverable' | 'private';
  avatarLabel: string;
  avatarColor: string;
  interestTags: string[];
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

export const discoverableGroups: CommunityGroup[] = [
  {
    id: 'musicians-shore',
    name: 'Musicians on the Shore',
    description: 'Local jams, open mics, and shoreline gigs.',
    memberCount: 128,
    privacy: 'discoverable',
    avatarLabel: 'MS',
    avatarColor: '#1B00D8',
    interestTags: ['music', 'local'],
  },
  {
    id: 'thursday-basketball',
    name: 'Thursday Basketball',
    description: 'Pickup games every Thursday at 6pm.',
    memberCount: 42,
    privacy: 'discoverable',
    avatarLabel: 'TB',
    avatarColor: '#00669c',
    interestTags: ['sports', 'weekly'],
  },
  {
    id: 'hiking-buddies',
    name: 'Hiking Buddies',
    description: 'Weekend trails and group hikes.',
    memberCount: 89,
    privacy: 'discoverable',
    avatarLabel: 'HB',
    avatarColor: '#00734a',
    interestTags: ['outdoors', 'hiking'],
  },
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

export function getBusinessById(id: string): Business | undefined {
  return businesses.find((b) => b.id === id);
}
