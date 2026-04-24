import { useState } from 'react';
import { apiClient } from '../api/client';

interface Props {
  fruitId:     string;
  currentHero?: string | null;
  onSuccess:   (cdnUrl: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';
type AutoState   = 'idle' | 'queued' | 'error';

export default function ImageUploader({ fruitId, currentHero, onSuccess }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [autoState,   setAutoState]   = useState<AutoState>('idle');
  const [preview,     setPreview]     = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [autoError,   setAutoError]   = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploadState('uploading');
    setUploadError('');

    try {
      const { data } = await apiClient.post('/images/presign', {
        fruitId,
        imageType: 'hero',
        mimeType:  file.type,
      });

      await fetch(data.uploadUrl, {
        method:  'PUT',
        body:    file,
        headers: { 'Content-Type': file.type },
      });

      setUploadState('done');
      onSuccess(data.cdnUrl as string);
    } catch {
      setUploadState('error');
      setUploadError('Upload failed. Please try again.');
    }
  }

  async function handleAutoFetch() {
    setAutoState('queued');
    setAutoError('');
    try {
      await apiClient.post(`/images/refresh/${fruitId}`);
      setAutoState('queued');
      // Refresh will complete in background — let parent know after a short delay
      setTimeout(() => onSuccess(''), 4000);
    } catch {
      setAutoState('error');
      setAutoError('Auto-fetch failed. Check API logs.');
    }
  }

  const displaySrc = preview ?? currentHero ?? null;

  return (
    <div className="space-y-4">
      {/* Current / preview image */}
      {displaySrc && (
        <img
          src={displaySrc}
          alt="Current hero"
          className="w-full max-w-sm h-40 object-cover rounded-lg border border-border"
        />
      )}

      {/* Manual upload */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className={`
            px-4 py-2 rounded text-sm font-medium transition-colors
            ${uploadState === 'uploading'
              ? 'bg-border text-muted cursor-not-allowed'
              : 'bg-canvas border border-border text-cream hover:border-gold'}
          `}>
            {uploadState === 'uploading' ? 'Uploading…' : uploadState === 'done' ? 'Change image' : 'Upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploadState === 'uploading'}
            className="sr-only"
          />
        </label>

        {/* Auto-fetch from image sources */}
        <button
          type="button"
          onClick={handleAutoFetch}
          disabled={autoState === 'queued'}
          className="px-4 py-2 rounded text-sm font-medium border border-gold/30 text-gold hover:border-gold/60 hover:bg-gold/10 transition-colors disabled:opacity-40"
        >
          {autoState === 'queued' ? 'Fetching…' : '↺ Auto-fetch image'}
        </button>
      </div>

      <p className="text-muted text-xs">
        Auto-fetch searches Pixabay, Unsplash, Pexels, and Wikimedia Commons and picks the best match.
      </p>

      {uploadState === 'done' && <p className="text-green-700 text-xs">Image uploaded successfully.</p>}
      {autoState   === 'queued' && <p className="text-gold text-xs">Image fetch queued — refresh the page in a few seconds to see the result.</p>}
      {uploadError && <p className="text-red-600 text-xs">{uploadError}</p>}
      {autoError   && <p className="text-red-600 text-xs">{autoError}</p>}
    </div>
  );
}
