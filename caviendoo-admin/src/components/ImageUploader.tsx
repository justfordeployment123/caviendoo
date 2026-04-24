import { useState } from 'react';
import { apiClient } from '../api/client';

interface Props {
  fruitId:   string;
  onSuccess: (cdnUrl: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export default function ImageUploader({ fruitId, onSuccess }: Props) {
  const [state, setState] = useState<UploadState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setState('uploading');
    setError('');

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

      setState('done');
      onSuccess(data.cdnUrl as string);
    } catch {
      setState('error');
      setError('Upload failed. Please try again.');
    }
  }

  return (
    <div className="space-y-3">
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-full max-w-xs h-40 object-cover rounded border border-white/10"
        />
      )}

      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className={`
          px-4 py-2 rounded text-sm font-medium transition-colors
          ${state === 'uploading'
            ? 'bg-white/10 text-cream/40 cursor-not-allowed'
            : 'bg-surface border border-white/20 text-cream hover:border-gold/60'}
        `}>
          {state === 'uploading' ? 'Uploading…' : state === 'done' ? 'Change image' : 'Choose image'}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={state === 'uploading'}
          className="sr-only"
        />
      </label>

      {state === 'done' && (
        <p className="text-emerald-400 text-xs">Image uploaded successfully.</p>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
