export type Category = 'seafood' | 'steaks' | 'egyptian' | 'cocktails'

export interface MenuItem {
  id: string
  category: Category
  nameEn: string
  descriptionEn: string
  price: number
  image: string
  badge?: 'Chef' | 'Popular' | 'New' | 'Vegan'
}

export const MENU_ITEMS: MenuItem[] = [
  // RED SEA SEAFOOD
  {
    id: 'sf-1',
    category: 'seafood',
    nameEn: 'Red Sea Grilled Fish',
    descriptionEn: 'Freshly caught daily, grilled with lemon herb butter and seasonal vegetables',
    price: 38.0,
    image: '/images/seafood-grilled-fish.png',
    badge: 'Chef',
  },
  {
    id: 'sf-2',
    category: 'seafood',
    nameEn: 'Royal Seafood Platter',
    descriptionEn: 'Lobster, king prawns, scallops, and oysters on crushed Red Sea ice',
    price: 89.0,
    image: '/images/seafood-platter.png',
    badge: 'Popular',
  },
  {
    id: 'sf-3',
    category: 'seafood',
    nameEn: 'Crispy Calamari',
    descriptionEn: 'Golden-fried Red Sea calamari rings with house aioli and fresh lemon',
    price: 24.0,
    image: '/images/calamari.png',
  },
  // PREMIUM STEAKS
  {
    id: 'st-1',
    category: 'steaks',
    nameEn: 'Wagyu Ribeye A5',
    descriptionEn: 'Japanese A5 Wagyu with truffle butter, roasted garlic, and asparagus',
    price: 145.0,
    image: '/images/wagyu-steak.png',
    badge: 'Chef',
  },
  {
    id: 'st-2',
    category: 'steaks',
    nameEn: 'Herb-Crusted Rack of Lamb',
    descriptionEn: 'French-trimmed lamb with pomegranate reduction and grilled vegetables',
    price: 68.0,
    image: '/images/lamb-chops.png',
    badge: 'Popular',
  },
  {
    id: 'st-3',
    category: 'steaks',
    nameEn: 'Beef Tenderloin Fillet',
    descriptionEn: 'Premium center-cut fillet with morel mushroom sauce and potato gratin',
    price: 75.0,
    image: '/images/fillet-steak.png',
  },
  // TRADITIONAL EGYPTIAN
  {
    id: 'eg-1',
    category: 'egyptian',
    nameEn: 'Koshari Royal',
    descriptionEn: 'Egypt\'s national dish — rice, lentils, pasta, crispy onions and spiced tomato',
    price: 18.0,
    image: '/images/koshari.png',
    badge: 'Vegan',
  },
  {
    id: 'eg-2',
    category: 'egyptian',
    nameEn: 'Kofta & Tahini',
    descriptionEn: 'Charcoal-grilled spiced kofta with tahini, pita bread, and pickled vegetables',
    price: 32.0,
    image: '/images/kofta.png',
    badge: 'Popular',
  },
  {
    id: 'eg-3',
    category: 'egyptian',
    nameEn: 'Mezze Royale',
    descriptionEn: 'Hummus, baba ganoush, falafel, tabbouleh, and freshly baked pita',
    price: 28.0,
    image: '/images/mezze.png',
    badge: 'New',
  },
  // EXOTIC COCKTAILS
  {
    id: 'ck-1',
    category: 'cocktails',
    nameEn: 'Red Sea Blue Lagoon',
    descriptionEn: 'Blue curaçao, tropical vodka, fresh lemon, and sparkling water',
    price: 22.0,
    image: '/images/blue-lagoon.png',
    badge: 'Popular',
  },
  {
    id: 'ck-2',
    category: 'cocktails',
    nameEn: 'Tropical Sunset Punch',
    descriptionEn: 'Mango, passion fruit, pineapple, grenadine, and premium rum',
    price: 18.0,
    image: '/images/tropical-punch.png',
    badge: 'New',
  },
  {
    id: 'ck-3',
    category: 'cocktails',
    nameEn: 'Classic Mojito',
    descriptionEn: 'Havana Club rum, fresh mint, lime juice, brown sugar, and club soda',
    price: 16.0,
    image: '/images/mojito.png',
  },
]
