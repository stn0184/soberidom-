import { z } from 'zod';

// Тело PUT /api/my/[purchaseId]/tools/choice (спека 004): покупатель выбрал
// вариант под потребность. Принадлежность варианта потребности и потребности
// проекту покупки проверяет роут — схема этого не знает.
export const toolChoiceSchema = z.object({
  toolId: z.uuid(),
  variantId: z.uuid(),
});
