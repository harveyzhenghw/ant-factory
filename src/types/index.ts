export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  honeydew: number;
  level: number;
  xp: number;
  createdAt: number;
  inventory?: string[];
}

export interface AntFarm {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  lastFedAt: number;
  lastWateredAt: number;
  lastCleanedAt: number;
  /** Clock for time-integrated health/population changes; advanced every decay tick. */
  lastTickAt: number;
  health: number;
  population: number;
  foodLevel: number;
  waterLevel: number;
  cleanliness: number;
  size: { width: number; height: number };
  chambers: Chamber[];
  tunnels: Tunnel[];
  decorations: Decoration[];
  /** An installed queen raises the colony's population cap and growth. */
  queenId?: string;
  queenSpecies?: string;
  queenFertility?: number;
}

export interface Chamber {
  id: string;
  type: 'queen' | 'nursery' | 'food_storage' | 'waste' | 'empty';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tunnel {
  id: string;
  points: { x: number; y: number }[];
}

export interface Decoration {
  id: string;
  type: 'plant' | 'rock' | 'branch' | 'shell';
  x: number;
  y: number;
}

export interface Ant {
  id: string;
  farmId: string;
  type: 'queen' | 'worker' | 'soldier' | 'larva' | 'egg';
  x: number;
  y: number;
  state: 'idle' | 'moving' | 'eating' | 'digging' | 'carrying';
  facing?: 'left' | 'right';
}

export interface Queen {
  id: string;
  userId: string;
  species: string;
  health: number;
  fertility: number;
  forSale: boolean;
  price: number;
  /** Set when the queen has been installed into one of the owner's farms. */
  installedFarmId?: string;
}

export interface ShopItem {
  id: string;
  type: 'food' | 'decoration' | 'expansion' | 'supplies';
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  queenId?: string;
  colonyPartId?: string;
  type: 'queen' | 'colony_part';
  price: number;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  farmId: string;
  imageUrl: string;
  caption: string;
  createdAt: number;
  likes: string[];
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  createdAt: number;
}

export interface EducationArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'species' | 'biology' | 'behavior' | 'care';
  imageUrl: string;
  unlockLevel: number;
  order: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  fromUserId: string;
  fromUsername: string;
  postId?: string;
  read: boolean;
  createdAt: number;
}
