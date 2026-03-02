import { Category } from '@/types';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Categories fetch failed:', res.status);
      return [];
    }
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('Categories fetch error:', e);
    return [];
  }
}

const categoryEmojis: Record<string, string> = {
  default: '🧸',
  electronics: '💻',
  fashion: '👕',
  'home-living': '🏠',
  toys: '🧸',
  sports: '⚽',
};

function getCategoryEmoji(slug: string): string {
  return categoryEmojis[slug] || categoryEmojis.default;
}

export const metadata = {
  title: 'Categories | Store',
  description: 'Browse products by category',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="bg-brand-cream min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-purple mb-4">Shop by Category</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of products across different categories
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category: Category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all p-8 text-center"
              >
                <span className="text-6xl mb-4 block group-hover:scale-110 transition-transform">
                  {getCategoryEmoji(category.slug)}
                </span>
                <h2 className="text-xl font-bold text-brand-purple mb-2">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-500 text-sm mb-4">{category.description}</p>
                )}
                <span className="text-brand-pink font-medium text-sm">
                  {(category._count?.catalogs || category.productCount || 0)} products →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
}
