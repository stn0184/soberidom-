import type { PaymentProvider, PayInstructions, PurchaseForPayment } from './provider';
import { ru } from '@/lib/i18n/ru';

// Провайдер этапа 1 (SPEC 3.17, US-006): перевод по ссылке донат-сервиса
// с кодом покупки в комментарии; активация — вручную админом.
export class ManualProvider implements PaymentProvider {
  createPayment(purchase: PurchaseForPayment): PayInstructions {
    return {
      url: process.env.NEXT_PUBLIC_DONATE_URL ?? '',
      comment: purchase.code,
      note: ru.buy.payNote,
    };
  }

  async handleWebhook(): Promise<null> {
    return null; // у ручного провайдера вебхуков нет
  }
}

export const manualProvider = new ManualProvider();
