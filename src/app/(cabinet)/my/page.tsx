import type { Metadata } from 'next';
import { ru } from '@/lib/i18n/ru';
import { MyProjects } from './my-projects';

export const metadata: Metadata = {
  title: `${ru.my.title} — ${ru.common.appName}`,
};

export default function MyPage() {
  return <MyProjects />;
}
