import { notFound } from 'next/navigation'
import { paintings, getPainting } from '@/data/paintings'
import PintarClient from './PintarClient'

export function generateStaticParams() {
  return paintings.map(p => ({ id: p.id }))
}

export default async function PintarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const painting = getPainting(id)
  if (!painting) notFound()
  return <PintarClient painting={painting} />
}
