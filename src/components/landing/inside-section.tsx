import {
  HardHat,
  MessagesSquare,
  ReceiptText,
  Scissors,
  Truck,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ru } from '@/lib/i18n/ru';

const INSIDE_ICONS = [Scissors, ReceiptText, Wallet, Truck, MessagesSquare, HardHat];

// Что входит в платный разбор (SPEC US-008…US-013) — между «Как это работает» и примером шага.
export function InsideSection() {
  return (
    <section id="inside" className="space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-semibold">{ru.landing.insideTitle}</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">{ru.landing.insideSubtitle}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ru.landing.inside.map((item, index) => {
          const Icon = INSIDE_ICONS[index] ?? Scissors;
          return (
            <Card key={item.title} className="h-full">
              <CardHeader>
                <Icon className="size-8 text-primary" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{item.text}</CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
