import Link from 'next/link';

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-brand-pink-light">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-300 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-brand-pink text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              New Collection 2024
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-purple leading-tight mb-4">
              Spark Joy,{' '}
              <span className="text-brand-pink">Ignite</span>{' '}
              Imagination
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-lg">
              Discover our magical collection of toys crafted to inspire creativity and bring smiles to every child&apos;s face.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/products" className="btn-pink text-base px-8 py-3 shadow-lg shadow-brand-pink/30">
                Shop Now
              </Link>
              <Link href="/categories" className="btn-secondary text-base px-8 py-3">
                Browse Categories
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap gap-6 justify-center md:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚚</span>
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔒</span>
                <span>Safe & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">↩️</span>
                <span>Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-brand-pink rounded-full opacity-10 animate-pulse" />
              <div className="absolute inset-8 bg-brand-pink rounded-full opacity-15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-9xl select-none">🎠</span>
              </div>
              {/* Floating badges */}
              <div className="absolute top-4 right-0 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-bold text-brand-purple">
                ⭐ 4.9 Rating
              </div>
              <div className="absolute bottom-8 left-0 bg-white rounded-2xl shadow-lg px-3 py-2 text-xs font-bold text-brand-purple">
                🎁 500+ Products
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
