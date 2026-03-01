import { ProductCard } from '@/components/products/ProductCard';
import { Category, Product } from '@/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getProductsByCategory(slug: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products?category=${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (category) {
    return {
      title: `${category.name} | Store`,
      description: category.description || `Browse ${category.name} products`,
    };
  }
  return {
    title: 'Category Not Found | Store',
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="bg-brand-cream min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-brand-pink">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/categories" className="hover:text-brand-pink">Categories</Link>
          <span className="mx-2">→</span>
          <span className="text-brand-purple">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-purple mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <p className="text-gray-500 mb-4">No products found in this category</p>
            <Link href="/products" className="btn-pink px-6 py-2 inline-block">
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
