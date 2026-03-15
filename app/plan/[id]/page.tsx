import { notFound } from 'next/navigation';
import { getPlan } from '@/lib/db';
import Header from '@/components/Header';
import PlanClient from './PlanClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);

  if (!plan) notFound();

  return (
    <>
      <Header />
      <PlanClient initialPlan={plan} />
    </>
  );
}
