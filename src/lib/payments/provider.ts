// Абстракция платёжного провайдера (SPEC 3.17):
// этап 1 — ManualProvider (донат + ручная активация), позже — yookassa.
export type PayInstructions = {
  url: string; // ссылка на донат-сервис (NEXT_PUBLIC_DONATE_URL)
  comment: string; // код покупки SD-XXXXXX — указывается в комментарии платежа
  note: string;
};

export type PurchaseStatusUpdate = {
  purchaseId: string;
  status: 'active' | 'rejected';
};

export type PurchaseForPayment = {
  code: string;
  amountMinor: number;
  currency: string;
};

export interface PaymentProvider {
  createPayment(purchase: PurchaseForPayment): PayInstructions;
  handleWebhook(request: Request): Promise<PurchaseStatusUpdate | null>;
}
