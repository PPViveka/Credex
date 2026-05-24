import { notFound } from 'next/navigation';
import { getAudit } from '../../../lib/db';
import AuditResultsClient from './AuditResultsClient';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);
  
  if (!audit) {
    return {
      title: 'Audit Not Found - Credex Spend Audit',
    };
  }

  const savings = audit.results.totalMonthlySavings;
  
  return {
    title: `AI Spend Audit ($${savings}/mo Saved!) - Credex`,
    description: `Instantly verify license waste and double-spending across active AI developer resources and developer APIs.`,
  };
}

export default async function AuditPage({ params }: PageProps) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  return <AuditResultsClient audit={audit} />;
}
