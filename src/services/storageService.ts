import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadCommunityImage(userId: string, blob: Blob, mimeType: string): Promise<string> {
  const path = `community/${userId}/${Date.now()}.${mimeType.split('/')[1] ?? 'jpg'}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: mimeType });
  return getDownloadURL(storageRef);
}
