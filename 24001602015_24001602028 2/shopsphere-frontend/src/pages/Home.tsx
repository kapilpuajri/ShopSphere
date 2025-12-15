import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts } from '../store/slices/productSlice';
import ProductList from '../components/product/ProductList';

const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector(state => state.products);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const featuredProducts = products.slice(0, 8);
  const topRatedProducts = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-700 dark:via-primary-800 dark:to-primary-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 text-center relative z-10 max-w-[98%] xl:max-w-[95%]">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Welcome to ShopSphere
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Discover amazing products at unbeatable prices
          </p>
            <div className="flex justify-center">
            <a
              href="/products"
              className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-gray-50 dark:fill-gray-900"/>
          </svg>
        </div>
      </section>

      {/* Featured Products */}
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 max-w-[98%] xl:max-w-[95%]">
        {loading ? (
          <div className="text-center py-12 text-gray-700 dark:text-gray-300">Loading products...</div>
        ) : (
          <>
            <ProductList
              products={featuredProducts}
              title="Featured Products"
              showCarousel={true}
            />
            <ProductList
              products={topRatedProducts}
              title="Top Rated Products"
              showCarousel={true}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Home;

