import { ShopItem } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'food-granules',
    type: 'food',
    name: 'Granules',
    description: 'Basic ant food. Lasts a few days.',
    price: 10,
    icon: 'fast-food',
  },
  {
    id: 'food-sugar',
    type: 'food',
    name: 'Sugar Water',
    description: 'Ants love this. Restores more food.',
    price: 25,
    icon: 'water',
  },
  {
    id: 'food-protein',
    type: 'food',
    name: 'Protein Mix',
    description: 'Helps colony grow faster.',
    price: 40,
    icon: 'fish',
  },
  {
    id: 'decoration-plant',
    type: 'decoration',
    name: 'Small Plant',
    description: 'A decorative plant for the surface.',
    price: 30,
    icon: 'leaf',
  },
  {
    id: 'decoration-rock',
    type: 'decoration',
    name: 'Decorative Rock',
    description: 'A natural-looking rock.',
    price: 20,
    icon: 'ellipse',
  },
  {
    id: 'decoration-branch',
    type: 'decoration',
    name: 'Twig',
    description: 'A small branch for enrichment.',
    price: 15,
    icon: 'remove',
  },
  {
    id: 'expansion-small',
    type: 'expansion',
    name: 'Small Expansion',
    description: 'Adds a small chamber to your farm.',
    price: 100,
    icon: 'add-circle',
  },
  {
    id: 'expansion-large',
    type: 'expansion',
    name: 'Large Expansion',
    description: 'Adds a large chamber with tunnel connection.',
    price: 250,
    icon: 'add-circle',
  },
  {
    id: 'supplies-test-tube',
    type: 'supplies',
    name: 'Test Tube Setup',
    description: 'Essential for catching new queens.',
    price: 50,
    icon: 'flask',
  },
];

export function calculateQueenPrice(species: string, health: number, fertility: number): number {
  const basePrices: Record<string, number> = {
    lasius_niger: 50,
    formica_rufa: 80,
    camponotus: 120,
    messor_barbarus: 150,
    atta: 300,
  };
  const base = basePrices[species] ?? 50;
  return Math.floor(base * (health / 100) * (fertility / 100));
}
