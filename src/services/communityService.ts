import {
  ref, get, update, push, query, orderByChild,
  onValue, type Unsubscribe,
} from 'firebase/database';
import { db } from './firebase';
import { CommunityPost, Comment, Notification } from '../types';
import { toEpoch } from './time';

function sanitizePost(post: CommunityPost): CommunityPost {
  return { ...post, createdAt: toEpoch(post.createdAt) };
}

function sanitizeComment(comment: Comment): Comment {
  return { ...comment, createdAt: toEpoch(comment.createdAt) };
}

export async function getPost(postId: string): Promise<CommunityPost | null> {
  const snap = await get(ref(db, `communityPosts/${postId}`));
  return snap.exists() ? sanitizePost({ ...(snap.val() as CommunityPost), id: snap.key as string }) : null;
}

export async function createPost(
  userId: string, username: string, userAvatar: string,
  farmId: string, imageUrl: string, caption: string
) {
  await push(ref(db, 'communityPosts'), {
    userId, username, userAvatar, farmId, imageUrl, caption,
    likes: [],
    commentCount: 0,
    createdAt: Date.now(),
  });
}

export function subscribePosts(callback: (posts: CommunityPost[]) => void): Unsubscribe {
  const q = query(ref(db, 'communityPosts'), orderByChild('createdAt'));
  return onValue(q, (snap) => {
    const posts: CommunityPost[] = [];
    snap.forEach((child) => {
      posts.push(sanitizePost({ ...(child.val() as CommunityPost), id: child.key as string }));
    });
    callback(posts.reverse());
  });
}

export async function toggleLike(postId: string, userId: string, username: string) {
  const postRef = ref(db, `communityPosts/${postId}`);
  const snap = await get(postRef);
  if (!snap.exists()) return;
  const post = snap.val() as CommunityPost;
  const likes = post.likes ?? [];
  const isLiking = !likes.includes(userId);
  if (isLiking) {
    await update(postRef, { likes: [...likes, userId] });
    if (post.userId !== userId) {
      await addNotification({
        userId: post.userId,
        type: 'like',
        fromUserId: userId,
        fromUsername: username,
        postId,
        read: false,
      });
    }
  } else {
    await update(postRef, { likes: likes.filter((id) => id !== userId) });
  }
}

export async function addComment(postId: string, userId: string, username: string, userAvatar: string, text: string) {
  await push(ref(db, `comments/${postId}`), {
    userId, username, userAvatar, text, createdAt: Date.now(),
  });
  const postSnap = await get(ref(db, `communityPosts/${postId}`));
  const post = postSnap.val() as CommunityPost | undefined;
  if (post) {
    const currentCount = post.commentCount ?? 0;
    await update(ref(db, `communityPosts/${postId}`), { commentCount: currentCount + 1 });
    if (post.userId !== userId) {
      await addNotification({
        userId: post.userId,
        type: 'comment',
        fromUserId: userId,
        fromUsername: username,
        postId,
        read: false,
      });
    }
  }
}

export function subscribeComments(postId: string, callback: (comments: Comment[]) => void): Unsubscribe {
  const q = query(ref(db, `comments/${postId}`), orderByChild('createdAt'));
  return onValue(q, (snap) => {
    const comments: Comment[] = [];
    snap.forEach((child) => {
      comments.push(sanitizeComment({ ...(child.val() as Comment), id: child.key as string }));
    });
    callback(comments);
  });
}

export async function addNotification(notif: Omit<Notification, 'id' | 'createdAt'> & { createdAt?: number }) {
  await push(ref(db, `notifications/${notif.userId}`), { ...notif, createdAt: notif.createdAt ?? Date.now() });
}

export function subscribeNotifications(userId: string, callback: (notifs: Notification[]) => void): Unsubscribe {
  const q = query(ref(db, `notifications/${userId}`), orderByChild('createdAt'));
  return onValue(q, (snap) => {
    const notifs: Notification[] = [];
    snap.forEach((child) => {
      notifs.push({ ...(child.val() as Notification), id: child.key as string });
    });
    callback(notifs.reverse());
  });
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  for (const id of ids) {
    await update(ref(db, `notifications/${userId}/${id}`), { read: true });
  }
}
