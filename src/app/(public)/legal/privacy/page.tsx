import type { Metadata } from 'next';
import { LegalPage, legalMetadata } from '@/components/legal/legal-page';

export function generateMetadata(): Metadata {
  return legalMetadata('privacy');
}

// /legal/privacy — публичная юр-страница (SPEC §0 маршруты, спека 006).
export default function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}
