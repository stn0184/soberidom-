import { apiFetch } from '@/lib/admin/fetcher';
import type { ToolVariantRow } from '@/lib/admin/types';
import type { VariantDraft } from '@/components/admin/tool-variants-field';

const toMinor = (text: string): number | null => {
  const trimmed = text.trim();
  return trimmed === '' ? null : Math.round(Number(trimmed));
};

const body = (toolId: string, draft: VariantDraft, sort: number) => ({
  tool_id: toolId,
  name: draft.name.trim(),
  description: draft.description.trim(),
  recommendation: draft.recommendation,
  price_minor: toMinor(draft.priceText),
  rent_day_minor: toMinor(draft.rentDayText),
  speed_note: draft.speedNote.trim(),
  is_beginner_choice: draft.isBeginnerChoice,
  sort,
});

// Форма правит варианты одним экраном, а API знает их по одному: сохраняем
// разницу — удалённые DELETE, оставшиеся PATCH, новые POST (спека 004).
export async function saveVariants(
  toolId: string,
  saved: ToolVariantRow[],
  drafts: VariantDraft[]
): Promise<void> {
  const keptIds = new Set(drafts.map((d) => d.id).filter((id): id is string => id !== null));
  for (const row of saved) {
    if (!keptIds.has(row.id)) {
      await apiFetch(`/api/admin/tool-variants/${row.id}`, { method: 'DELETE' });
    }
  }
  for (const [index, draft] of drafts.entries()) {
    const payload = JSON.stringify(body(toolId, draft, index));
    if (draft.id) {
      await apiFetch(`/api/admin/tool-variants/${draft.id}`, { method: 'PATCH', body: payload });
    } else {
      await apiFetch('/api/admin/tool-variants', { method: 'POST', body: payload });
    }
  }
}
