'use client';

import { useWatch, type UseFormReturn } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/admin/file-upload';
import type { ProjectInput } from '@/lib/zod/admin';
import { ru } from '@/lib/i18n/ru';

const t = ru.admin.projects;
const IMAGE_ACCEPT = 'image/webp,image/png,image/jpeg';

// Медиа проекта: обложка, галерея, GLB-модель, изометрия-fallback (SPEC 2.4, 4.14).
export function ProjectFormMedia({ form }: { form: UseFormReturn<ProjectInput> }) {
  const gallery = useWatch({ control: form.control, name: 'gallery_urls' });
  const coverUrl = useWatch({ control: form.control, name: 'cover_image_url' });
  const modelUrl = useWatch({ control: form.control, name: 'model_glb_url' });
  const isometricUrl = useWatch({ control: form.control, name: 'isometric_fallback_url' });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t.coverImage}</Label>
        <FileUpload
          bucket="public-assets"
          accept={IMAGE_ACCEPT}
          value={coverUrl}
          onChange={(url) => form.setValue('cover_image_url', url, { shouldDirty: true })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t.gallery}</Label>
        {gallery.map((url, index) => (
          <div key={`${url}-${index}`} className="flex items-center gap-2">
            <span className="max-w-72 truncate text-xs text-muted-foreground" title={url}>
              {url}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                form.setValue(
                  'gallery_urls',
                  gallery.filter((_, i) => i !== index),
                  { shouldDirty: true }
                )
              }
            >
              <X />
              <span className="sr-only">{ru.admin.upload.remove}</span>
            </Button>
          </div>
        ))}
        <FileUpload
          bucket="public-assets"
          accept={IMAGE_ACCEPT}
          value=""
          onChange={(url) =>
            url && form.setValue('gallery_urls', [...gallery, url], { shouldDirty: true })
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t.modelGlb}</Label>
        <FileUpload
          bucket="models"
          accept=".glb,model/gltf-binary"
          value={modelUrl}
          onChange={(url) => form.setValue('model_glb_url', url, { shouldDirty: true })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t.isometricFallback}</Label>
        <FileUpload
          bucket="public-assets"
          accept={IMAGE_ACCEPT}
          value={isometricUrl}
          onChange={(url) =>
            form.setValue('isometric_fallback_url', url, { shouldDirty: true })
          }
        />
      </div>
    </div>
  );
}
