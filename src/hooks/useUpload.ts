// FriendlyTeaching.cl — useUpload: Firebase Storage upload hook
import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export type UploadFolder = 'audio' | 'images' | 'documents';

export interface UploadState {
  uploading: boolean;
  progress: number;   // 0–100
  error: string | null;
  url: string | null;
}

export function useUpload(folder: UploadFolder = 'images') {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    url: null,
  });

  const upload = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        // Validate file type
        const isAudio = folder === 'audio';
        const isImage = folder === 'images';
        if (isAudio && !file.type.startsWith('audio/')) {
          const err = 'Solo se permiten archivos de audio (mp3, m4a, wav, ogg)';
          setState(s => ({ ...s, error: err }));
          reject(new Error(err));
          return;
        }
        if (isImage && !file.type.startsWith('image/')) {
          const err = 'Solo se permiten imágenes (jpg, png, gif, webp)';
          setState(s => ({ ...s, error: err }));
          reject(new Error(err));
          return;
        }

        // Max size: 20MB audio, 5MB images
        const maxMB = isAudio ? 20 : 5;
        if (file.size > maxMB * 1024 * 1024) {
          const err = `El archivo supera el límite de ${maxMB}MB`;
          setState(s => ({ ...s, error: err }));
          reject(new Error(err));
          return;
        }

        // Build storage path: folder/timestamp_filename
        const ext = file.name.split('.').pop() ?? '';
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, `${folder}/${safeName}`);

        setState({ uploading: true, progress: 0, error: null, url: null });

        const task = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        });

        task.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setState(s => ({ ...s, progress: pct }));
          },
          (err) => {
            setState({ uploading: false, progress: 0, error: err.message, url: null });
            reject(err);
          },
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            setState({ uploading: false, progress: 100, error: null, url });
            resolve(url);
          }
        );
      });
    },
    [folder]
  );

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, error: null, url: null });
  }, []);

  return { ...state, upload, reset };
}

// Helper: delete a file from Storage by its download URL
export async function deleteStorageFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch {
    // Silently ignore — file may already be deleted or URL could be external
  }
}
