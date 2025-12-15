import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts, searchProducts, setSearchQuery } from '../store/slices/productSlice';
import ProductList from '../components/product/ProductList';

const Products: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector(state => state.products);
  const [localQuery, setLocalQuery] = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      dispatch(setSearchQuery(localQuery));
      dispatch(searchProducts(localQuery));
    } else {
      dispatch(fetchProducts());
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 max-w-[98%] xl:max-w-[95%]">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">All Products</h1>
      
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => dispatch(fetchProducts())}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-primary-600 hover:text-white transition"
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                // Filter by category logic would go here
                dispatch(fetchProducts());
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-primary-600 hover:text-white transition"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
};

export default Products;

