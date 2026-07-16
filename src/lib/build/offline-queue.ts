import { ApiError, apiFetch } from '@/lib/admin/fetcher';

// Офлайн-очередь отметок шагов (edge case 1): optimistic UI, очередь в
// localStorage (sd_progress_queue), синк при событии online.
const KEY = 'sd_progress_queue';

export type QueueItem = { purchaseId: string; stepId: string; done: boolean };

export function readQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function enqueue(item: QueueItem) {
  const queue = readQueue().filter(
    (i) => !(i.purchaseId === item.purchaseId && i.stepId === item.stepId)
  );
  queue.push(item);
  writeQueue(queue);
}

export function queueSize(purchaseId: string): number {
  return readQueue().filter((i) => i.purchaseId === purchaseId).length;
}

export async function sendProgress(item: QueueItem): Promise<void> {
  await apiFetch(`/api/my/${item.purchaseId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ stepId: item.stepId, done: item.done }),
  });
}

// Отправляем очередь по порядку. Ошибка сети останавливает синк (попробуем позже),
// отказ сервера (ApiError) выбрасывает элемент — иначе очередь зациклится.
export async function flushQueue(): Promise<void> {
  for (const item of readQueue()) {
    try {
      await sendProgress(item);
      writeQueue(
        readQueue().filter(
          (i) => !(i.purchaseId === item.purchaseId && i.stepId === item.stepId)
        )
      );
    } catch (e) {
      if (e instanceof ApiError) {
        writeQueue(
          readQueue().filter(
            (i) => !(i.purchaseId === item.purchaseId && i.stepId === item.stepId)
          )
        );
      } else {
        break;
      }
    }
  }
}
