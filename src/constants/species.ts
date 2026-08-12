import { EducationArticle } from '../types';

export const ANT_SPECIES: Record<string, { name: string; description: string; difficulty: number; color: string }> = {
  lasius_niger: {
    name: 'Black Garden Ant',
    description: 'Common beginner species. Hardy and easy to care for.',
    difficulty: 1,
    color: '#1a1a1a',
  },
  formica_rufa: {
    name: 'Red Wood Ant',
    description: 'Aggressive and active. Builds large colonies.',
    difficulty: 2,
    color: '#8B0000',
  },
  camponotus: {
    name: 'Carpenter Ant',
    description: 'Large ants that dig extensive tunnel systems.',
    difficulty: 2,
    color: '#2F1B0E',
  },
  messor_barbarus: {
    name: 'Harvester Ant',
    description: 'Seed collectors. Fascinating to watch forage.',
    difficulty: 3,
    color: '#4a4a4a',
  },
  atta: {
    name: 'Leafcutter Ant',
    description: 'Advanced species. Cuts leaves to grow fungus.',
    difficulty: 4,
    color: '#8B4513',
  },
};

export const EDUCATION_ARTICLES: EducationArticle[] = [
  {
    id: 'ant-anatomy',
    title: 'Ant Anatomy',
    summary: 'Learn about the three main body parts of an ant.',
    content: 'Ants have three main body segments: the head, thorax, and abdomen...',
    category: 'biology',
    imageUrl: '',
    unlockLevel: 1,
    order: 1,
  },
  {
    id: 'colony-life',
    title: 'Colony Life',
    summary: 'How ant colonies are structured and organized.',
    content: 'An ant colony consists of one or more queens and thousands of workers...',
    category: 'behavior',
    imageUrl: '',
    unlockLevel: 1,
    order: 2,
  },
  {
    id: 'ant-castes',
    title: 'Ant Castes',
    summary: 'Queens, workers, soldiers — each has a role.',
    content: 'Ant colonies have different castes: the queen lays eggs...',
    category: 'biology',
    imageUrl: '',
    unlockLevel: 2,
    order: 3,
  },
  {
    id: 'ant-communication',
    title: 'Ant Communication',
    summary: 'How ants use pheromones to talk to each other.',
    content: 'Ants communicate primarily through chemicals called pheromones...',
    category: 'behavior',
    imageUrl: '',
    unlockLevel: 2,
    order: 4,
  },
  {
    id: 'queen-catching',
    title: 'Queen Catching',
    summary: 'How to find and catch a queen ant.',
    content: 'After a nuptial flight, mated queens land and search for a nest site...',
    category: 'care',
    imageUrl: '',
    unlockLevel: 3,
    order: 5,
  },
];
