import { ProductCard } from '@/components/products/ProductCard';
import { Hero } from '@/components/layout/Hero';
import { Category, Product } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/products?limit=8`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Products fetch failed:', res.status);
      return [];
    }
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.error('Products fetch error:', e);
    return [];
  }
}

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

export const revalidate = 60;

const categoryEmojis: Record<string, string> = {
  default: '🧸',
  action: '🦸',
  puzzle: '🧩',
  outdoor: '🏃',
  educational: '📚',
  art: '🎨',
  vehicle: '🚗',
  doll: '👧',
  building: '🏗️',
  board: '🎲',
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return categoryEmojis.default;
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="bg-brand-cream min-h-screen">
      <Hero />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Find the perfect toy for every child</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((category: Category) => (
                <a
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group flex flex-col items-center gap-3 p-5 bg-brand-pink-light rounded-2xl hover:bg-brand-pink hover:shadow-lg transition-all"
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">
                    {getCategoryEmoji(category.name)}
                  </span>
                  <div className="text-center">
                    <h3 className="font-semibold text-brand-purple group-hover:text-white text-sm">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-400 group-hover:text-pink-100 mt-0.5">
                      {(category._count?.catalogs || category.productCount || 0)} items
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-10 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹499' },
              { icon: '🛡️', title: 'Safe & Non-toxic', desc: 'BIS certified toys' },
              { icon: '↩️', title: 'Easy Returns', desc: '7-day return policy' },
              { icon: '💬', title: '24/7 Support', desc: 'We\'re here to help' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center p-4 bg-white rounded-2xl shadow-sm">
                <span className="text-3xl mb-2">{item.icon}</span>
                <h4 className="font-semibold text-brand-purple text-sm">{item.title}</h4>
                <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">Handpicked favourites for your little ones</p>
            </div>
            <a href="/products" className="text-brand-pink font-semibold text-sm hover:underline hidden sm:block">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <a href="/products" className="btn-pink px-8 py-2.5">View All Products</a>
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className="py-14 bg-brand-pink-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-brand-purple rounded-3xl px-8 py-12 text-center text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink opacity-10 rounded-full blur-2xl" />
            <div className="relative">
              <p className="text-brand-pink font-semibold text-sm uppercase tracking-widest mb-2">Limited Time Offer</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Get 20% Off Your First Order</h2>
              <p className="text-gray-300 mb-8 max-w-lg mx-auto">Use code <span className="text-brand-pink font-bold">WELCOME20</span> at checkout. Valid for new customers only.</p>
              <a href="/products" className="btn-pink text-base px-8 py-3 shadow-lg">
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
