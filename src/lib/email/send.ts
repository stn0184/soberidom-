import { Resend } from 'resend';
import { ru } from '@/lib/i18n/ru';

// Письма через Resend (SPEC 5.5). Без RESEND_API_KEY — заглушка с логом,
// чтобы не блокировать разработку. TODO: добавить RESEND_API_KEY в .env.local
// и заменить адрес отправителя (ru.email.from) на верифицированный домен.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: ru.email.from,
    to,
    subject,
    text,
  });
  if (error) {
    // Письмо не должно валить бизнес-операцию — логируем и продолжаем.
    console.error(`[email:error] to=${to} subject="${subject}": ${error.message}`);
  }
}
