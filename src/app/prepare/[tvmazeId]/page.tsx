import { notFound } from 'next/navigation';
import { Header } from '@/components/Logo';
import { PrepareView } from '@/components/PrepareView';

export const metadata = { title: 'Preparing a show | Animu' };

export default async function PreparePage({
  params,
  searchParams,
}: {
  params: Promise<{ tvmazeId: string }>;
  searchParams: Promise<{ q?: string; title?: string }>;
}) {
  const id = Number((await params).tvmazeId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { q = '', title = 'this show' } = await searchParams;
  return (
    <>
      <Header nav={false} />
      <PrepareView tvmazeId={id} title={title.slice(0, 120)} query={q.slice(0, 300)} />
    </>
  );
}
