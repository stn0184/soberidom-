import { z } from 'zod';

// Query GET /api/my/[purchaseId]/supplies (спека 003): этап, к которому
// собираем закупку. Схема одна на клиент и сервер — правило проекта.
export const suppliesQuerySchema = z.object({ stage: z.uuid() });
