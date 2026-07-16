'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ru } from '@/lib/i18n/ru';

const MAX_SIZE = 20 * 1024 * 1024; // 20 МБ (SPEC 5.8)

type FileUploadProps = {
  bucket: 'public-assets' | 'models';
  accept: string; // например 'image/webp,image/png,image/jpeg' или '.glb'
  value: string;
  onChange: (url: string) => void;
};

// Загрузка в Supabase Storage (bucket-политики: запись только admin).
export function FileUpload({ bucket, accept, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError(ru.admin.upload.tooLarge);
      return;
    }
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${crypto.randomUUID()}-${safeName}`;
    // У .glb в браузере часто пустой MIME — bucket требует model/gltf-binary.
    const contentType = bucket === 'models' ? 'model/gltf-binary' : file.type;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType });
    if (uploadError) {
      setError(ru.admin.upload.failed);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}
          {busy ? ru.admin.upload.uploading : ru.admin.upload.choose}
        </Button>
        {value && (
          <>
            <span className="max-w-56 truncate text-xs text-muted-foreground" title={value}>
              {value}
            </span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange('')}>
              <X />
              <span className="sr-only">{ru.admin.upload.remove}</span>
            </Button>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
