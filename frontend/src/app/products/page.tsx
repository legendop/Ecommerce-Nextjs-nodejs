import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilter } from '@/components/products/ProductFilter';
import { Category, Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getProducts(category?: string, search?: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    params.append('limit', '24');
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_URL}/products?${params}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(params.category, params.search),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <ProductFilter categories={categories} />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-brand-purple">
              {params.category
                ? categories.find((c: Category) => c.slug === params.category)?.name || 'Products'
                : params.search
                ? `Results: "${params.search}"`
                : 'All Products'}
            </h1>
            <span className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
              {products.length} products
            </span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <span className="text-5xl">🔍</span>
              <p className="text-brand-purple font-semibold mt-4">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different category or search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
