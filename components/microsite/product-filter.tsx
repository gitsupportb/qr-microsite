'use client'

import type { ProductWithCategory } from '@/lib/queries/microsite'

interface ProductFilterProps {
  products: ProductWithCategory[]
  categories: Array<{ id: string; name: string; slug: string }>
}

/** Placeholder -- will be fully implemented in Task 2 */
export function ProductFilter({ products, categories }: ProductFilterProps) {
  return null
}
