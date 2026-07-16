'use client';

import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Box, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { LAYER_KEYS, type LayerState } from '@/components/three/model-viewer';
import { ru } from '@/lib/i18n/ru';

// three — только в клиенте, динамический импорт без SSR (правило CLAUDE.md).
const ModelViewer = dynamic(() => import('@/components/three/model-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

const LOAD_TIMEOUT_MS = 10_000; // >10 c → fallback-изометрия (US-002)

function subscribeMedia(callback: () => void) {
  const mql = window.matchMedia('(min-width: 640px)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

// ErrorBoundary: ошибка загрузки GLB → fallback (US-002).
class ViewerBoundary extends Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Project3d({
  modelUrl,
  fallbackUrl,
  title,
}: {
  modelUrl: string;
  fallbackUrl: string;
  title: string;
}) {
  // На десктопе 3D грузится сразу, на мобильном — по кнопке (US-002).
  const isDesktop = useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia('(min-width: 640px)').matches,
    () => false
  );
  const [manualStart, setManualStart] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [layers, setLayers] = useState<LayerState>({
    frame: true,
    roof: true,
    exterior: true,
    interior: true,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const started = (manualStart || isDesktop) && Boolean(modelUrl) && !failed;

  // Таймер fallback взводится при каждом старте показа (и на автостарте десктопа).
  useEffect(() => {
    if (!started) return;
    timerRef.current = setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [started, attempt]);

  const handleLoaded = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  function start() {
    setManualStart(true);
    setFailed(false);
    setAttempt((n) => n + 1);
  }

  const fallbackImage = fallbackUrl || null;

  if (!modelUrl || failed) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
          {fallbackImage ? (
            <Image src={fallbackImage} alt={title} fill className="object-contain" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Box className="size-10" />
            </div>
          )}
        </div>
        {modelUrl && failed && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{ru.project.fallback3dNote}</span>
            <Button variant="outline" size="sm" onClick={start}>
              <RotateCcw />
              {ru.project.retry3d}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted">
        {fallbackImage && (
          <Image src={fallbackImage} alt={title} fill className="object-contain" unoptimized />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button size="lg" onClick={start}>
            <Box />
            {ru.project.show3d}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-xl border bg-muted">
        <ViewerBoundary key={attempt} onError={() => setFailed(true)}>
          <ModelViewer url={modelUrl} layers={layers} onLoaded={handleLoaded} />
        </ViewerBoundary>
      </div>
      <div className="flex flex-wrap gap-4">
        {LAYER_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <Switch
              checked={layers[key]}
              onCheckedChange={(v) => setLayers((prev) => ({ ...prev, [key]: v }))}
            />
            {ru.project.layers[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
