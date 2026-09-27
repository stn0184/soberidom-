import type { Metadata } from 'next';
import { LegalPage, legalMetadata } from '@/components/legal/legal-page';

export function generateMetadata(): Metadata {
  return legalMetadata('offer');
}

// /legal/offer — публичная юр-страница (SPEC §0 маршруты, спека 006).
export default function OfferPage() {
  return <LegalPage slug="offer" />;
}
