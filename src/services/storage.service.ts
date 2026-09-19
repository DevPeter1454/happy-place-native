import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Cloud Storage access for user-owned media.
 *
 * Everything lives under `users/{uid}/...`, which is exactly the subtree
 * storage.rules grants the signed-in user read/write on.
 */

/** A user's avatar always occupies one fixed path, so uploads replace it. */
function avatarRef(uid: string) {
  return ref(storage, `users/${uid}/profile/avatar.jpg`);
}

/**
 * Read a local asset into a Blob.
 *
 * It has to be a *native* Blob, not an ArrayBuffer or Uint8Array: the Firebase
 * SDK passes whatever it is given straight to `XMLHttpRequest.send()`, and React
 * Native's XHR rejects typed arrays with "Creating blobs from 'ArrayBuffer' and
 * 'ArrayBufferView' are not supported". Going through `fetch` yields a blob
 * backed by the file on disk, which RN's networking layer can send as-is.
 */
async function readBlob(localUri: string): Promise<Blob> {
  const response = await fetch(localUri);
  return response.blob();
}

interface UploadAvatarOptions {
  /** MIME type reported by the picker; JPEG is the safe default. */
  contentType?: string;
  /** Called with 0..1 as bytes go up, for a progress indicator. */
  onProgress?: (fraction: number) => void;
}

/**
 * Upload a picked image as the user's avatar and return its download URL.
 * The URL carries a fresh access token on every upload, so it also doubles as a
 * cache-buster for images already rendered from the previous avatar.
 */
export async function uploadAvatar(
  uid: string,
  localUri: string,
  { contentType = 'image/jpeg', onProgress }: UploadAvatarOptions = {}
): Promise<string> {
  const blob = await readBlob(localUri);

  const task = uploadBytesResumable(avatarRef(uid), blob, {
    contentType,
    cacheControl: 'public, max-age=31536000',
  });

  if (onProgress) {
    task.on(
      'state_changed',
      (snapshot) => {
        onProgress(
          snapshot.totalBytes
            ? snapshot.bytesTransferred / snapshot.totalBytes
            : 0
        );
      },
      // A failure is surfaced to the caller by `await task` below. This no-op
      // observer is only here so the SDK doesn't also report it as an unhandled
      // rejection — registering a progress observer without an error one leaves
      // the task's failure with nobody listening.
      () => {}
    );
  }

  await task;
  return getDownloadURL(task.snapshot.ref);
}

/** Delete the stored avatar. A missing file is treated as success. */
export async function deleteAvatar(uid: string): Promise<void> {
  try {
    await deleteObject(avatarRef(uid));
  } catch (e) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e
        ? String((e as { code: unknown }).code)
        : '';
    if (code !== 'storage/object-not-found') throw e;
  }
}
