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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Welcome to ShopSphere
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100">
            Discover amazing products at unbeatable prices
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/products"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </a>
            <a
              href="/products"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition transform hover:scale-105"
            >
              Browse Products
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
          </svg>
        </div>
      </section>

      {/* Featured Products */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">Loading products...</div>
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

