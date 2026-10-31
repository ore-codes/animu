import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/Logo';
import { ResultView } from '@/components/ResultView';

export const metadata = { title: 'Your episode | Animu' };

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ tvmazeId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const id = Number((await params).tvmazeId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const q = ((await searchParams).q ?? '').trim().slice(0, 300);
  if (q.length < 3) redirect('/');
  return (
    <>
      <Header nav={false} />
      <ResultView tvmazeId={id} query={q} />
    </>
  );
}
