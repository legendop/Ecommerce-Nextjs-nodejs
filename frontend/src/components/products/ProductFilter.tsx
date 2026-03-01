'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Category } from '@/types';

interface ProductFilterProps {
  categories: Category[];
}

export function ProductFilter({ categories }: ProductFilterProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-base font-bold text-brand-purple mb-4">Categories</h3>

      <div className="space-y-1">
        <Link
          href="/products"
          className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            !currentCategory
              ? 'bg-brand-pink text-white'
              : 'text-gray-600 hover:bg-brand-pink-light hover:text-brand-purple'
          }`}
        >
          All Products
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentCategory === category.slug
                ? 'bg-brand-pink text-white'
                : 'text-gray-600 hover:bg-brand-pink-light hover:text-brand-purple'
            }`}
          >
            {category.name}
            {category.productCount !== undefined && (
              <span className="ml-auto float-right text-xs opacity-60">
                {category.productCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
