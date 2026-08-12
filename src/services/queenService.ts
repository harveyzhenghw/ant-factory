import { ref, get, update, push, query, orderByChild, equalTo } from 'firebase/database';
import { db } from './firebase';
import { Queen } from '../types';

export async function getMyQueens(userId: string): Promise<Queen[]> {
  const snap = await get(query(ref(db, 'queens'), orderByChild('userId'), equalTo(userId)));
  const queens: Queen[] = [];
  snap.forEach((child) => {
    queens.push({ ...(child.val() as Queen), id: child.key as string });
  });
  return queens;
}

export async function addQueen(userId: string, species: string, health: number, fertility: number): Promise<string> {
  const newRef = await push(ref(db, 'queens'), {
    userId,
    species,
    health,
    fertility,
    forSale: false,
    price: 0,
  });
  return newRef.key as string;
}

export async function updateQueen(queenId: string, updates: Partial<Queen>) {
  await update(ref(db, `queens/${queenId}`), updates);
}
