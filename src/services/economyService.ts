import {
  ref, get, update, remove, push, query, orderByChild,
  onValue, runTransaction, increment, type Unsubscribe,
} from 'firebase/database';
import { db } from './firebase';
import { ShopItem, MarketListing } from '../types';

// Balances are client-trusted: this is a single-player colony sim with no
// server, so a determined user could inflate their own honeydew. That only
// affects their own colony and is accepted. What the rules DO enforce is that
// no one can tamper with another player's record beyond paying them for a
// market sale (see database.rules.json). All balance changes go through atomic
// transactions/increments below so concurrent care, income and purchases never
// clobber each other. To make balances server-authoritative, move these writes
// behind a Netlify Function using the Firebase Admin SDK (see README).
export async function purchaseItem(userId: string, item: ShopItem): Promise<boolean> {
  const result = await runTransaction(ref(db, `users/${userId}/honeydew`), (current) => {
    const balance = current ?? 0;
    if (balance < item.price) return; // abort: not enough honeydew
    return balance - item.price;
  });
  return result.committed;
}

export async function addHoneydew(userId: string, amount: number) {
  await runTransaction(ref(db, `users/${userId}/honeydew`), (current) => {
    return Math.max(0, (current ?? 0) + amount);
  });
}

export function subscribeMarketListings(callback: (listings: MarketListing[]) => void): Unsubscribe {
  const q = query(ref(db, 'marketListings'), orderByChild('createdAt'));
  return onValue(q, (snap) => {
    const listings: MarketListing[] = [];
    snap.forEach((child) => {
      const listing = { ...(child.val() as MarketListing & { buyerId?: string }), id: child.key as string };
      if (!listing.buyerId) listings.push(listing); // hide claimed-but-unremoved listings
    });
    callback(listings.reverse());
  });
}

export async function getMarketListings(): Promise<MarketListing[]> {
  const snap = await get(ref(db, 'marketListings'));
  const listings: MarketListing[] = [];
  snap.forEach((child) => {
    const listing = { ...(child.val() as MarketListing & { buyerId?: string }), id: child.key as string };
    if (!listing.buyerId) listings.push(listing);
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

  // Pre-check the buyer's own balance for a friendly failure; the rules also
  // enforce it (honeydew can't go negative) so this can't be bypassed to steal.
  const buyerBalSnap = await get(ref(db, `users/${buyerId}/honeydew`));
  if ((buyerBalSnap.val() ?? 0) < listing.price) return false;

  // Atomically claim the listing so two concurrent buyers can't both win.
  const claim = await runTransaction(listingRef, (current) => {
    if (!current) return; // gone
    if (current.buyerId) return; // already claimed
    current.buyerId = buyerId;
    return current;
  });
  if (!claim.committed || !claim.snapshot.exists()) return false;

  // Pay with server-side increments so we never need to read the seller's
  // (unreadable) balance, and transfer the queen + remove the listing in one
  // atomic multi-path write.
  const updates: Record<string, unknown> = {
    [`users/${buyerId}/honeydew`]: increment(-listing.price),
    [`users/${listing.sellerId}/honeydew`]: increment(listing.price),
    [`marketListings/${listingId}`]: null,
  };
  if (listing.queenId) {
    updates[`queens/${listing.queenId}/userId`] = buyerId;
    updates[`queens/${listing.queenId}/forSale`] = false;
    updates[`queens/${listing.queenId}/price`] = 0;
  }

  await update(ref(db), updates);
  return true;
}
