import {
  ref, get, set, update, remove, push, query, orderByChild, equalTo,
  onValue, runTransaction, type Unsubscribe,
} from 'firebase/database';
import { db } from './firebase';
import { ShopItem, MarketListing, UserProfile } from '../types';

// TODO(market): balances are client-enforced. There are no Cloud Functions, so
// a determined user could edit their own honeydew via the API/console. Accepted
// for this app; see README "Security note (intentional)".
export async function purchaseItem(userId: string, item: ShopItem): Promise<boolean> {
  const userRef = ref(db, `users/${userId}`);
  const userSnap = await get(userRef);
  if (!userSnap.exists()) return false;

  const profile = userSnap.val() as UserProfile;
  if (profile.honeydew < item.price) return false;

  await update(userRef, { honeydew: profile.honeydew - item.price });
  return true;
}

export async function addHoneydew(userId: string, amount: number) {
  const userRef = ref(db, `users/${userId}`);
  const userSnap = await get(userRef);
  if (!userSnap.exists()) return;
  const profile = userSnap.val() as UserProfile;
  await update(userRef, { honeydew: Math.max(0, profile.honeydew + amount) });
}

export function subscribeMarketListings(callback: (listings: MarketListing[]) => void): Unsubscribe {
  const q = query(ref(db, 'marketListings'), orderByChild('createdAt'));
  return onValue(q, (snap) => {
    const listings: MarketListing[] = [];
    snap.forEach((child) => {
      listings.push({ ...(child.val() as MarketListing), id: child.key as string });
    });
    callback(listings.reverse());
  });
}

export async function getMarketListings(): Promise<MarketListing[]> {
  const snap = await get(ref(db, 'marketListings'));
  const listings: MarketListing[] = [];
  snap.forEach((child) => {
    listings.push({ ...(child.val() as MarketListing), id: child.key as string });
  });
  return listings.reverse();
}

export async function createMarketListing(listing: Omit<MarketListing, 'id' | 'createdAt'>) {
  await push(ref(db, 'marketListings'), {
    ...listing,
    createdAt: Date.now(),
  });
}

export async function removeMarketListing(listingId: string) {
  await remove(ref(db, `marketListings/${listingId}`));
}

export async function buyMarketListing(listingId: string, buyerId: string): Promise<boolean> {
  const listingRef = ref(db, `marketListings/${listingId}`);
  const listingSnap = await get(listingRef);
  if (!listingSnap.exists()) return false;

  const listing = listingSnap.val() as MarketListing;
  if (listing.sellerId === buyerId) return false;

  const buyerRef = ref(db, `users/${buyerId}`);
  const buyerSnap = await get(buyerRef);
  if (!buyerSnap.exists()) return false;

  const buyer = buyerSnap.val() as UserProfile;
  if (buyer.honeydew < listing.price) return false;

  await runTransaction(listingRef, (current) => {
    if (!current || current.buyerId) throw new Error('Listing was already sold');
    return { ...current, buyerId };
  });

  const updates: Record<string, unknown> = {};
  updates[`users/${buyerId}/honeydew`] = buyer.honeydew - listing.price;

  const sellerRef = ref(db, `users/${listing.sellerId}`);
  const sellerSnap = await get(sellerRef);
  if (sellerSnap.exists()) {
    const seller = sellerSnap.val() as UserProfile;
    updates[`users/${listing.sellerId}/honeydew`] = seller.honeydew + listing.price;
  }

  if (listing.queenId) {
    updates[`queens/${listing.queenId}/userId`] = buyerId;
    updates[`queens/${listing.queenId}/forSale`] = false;
    updates[`queens/${listing.queenId}/price`] = 0;
  }

  await update(ref(db), updates);
  await remove(listingRef);

  return true;
}
