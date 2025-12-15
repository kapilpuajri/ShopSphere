import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchProductById, fetchRecommendations } from '../../store/slices/productSlice';
import ProductList from './ProductList';
import { addToCart } from '../../store/slices/cartSlice';
import { formatPrice } from '../../utils/currency';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentProduct, recommendations, loading, error } = useAppSelector(state => state.products);
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 1;
  const [imageError, setImageError] = useState(false);
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop';

  useEffect(() => {
    if (id) {
      const productId = Number(id);
      if (!isNaN(productId) && productId > 0) {
        dispatch(fetchProductById(productId));
        dispatch(fetchRecommendations(productId));
      }
    }
  }, [id, dispatch]);

  const handleAddToCart = async () => {
    if (currentProduct) {
      try {
        await dispatch(addToCart({ userId, productId: currentProduct.id, quantity: 1 })).unwrap();
      } catch (error: any) {
        const errorMessage = error || 'Failed to add item to cart';
        console.error('Error adding to cart:', errorMessage);
        // Error is handled by the cart slice, no need to show toast here
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <a
            href="/products"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-block"
          >
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <img
            src={imageError ? defaultImage : (currentProduct.imageUrl || defaultImage)}
            alt={currentProduct.name}
            onError={() => setImageError(true)}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {currentProduct.name}
          </h1>
          <div className="flex items-center mb-4">
            <span className="text-yellow-400 text-2xl">★</span>
            <span className="text-xl text-gray-600 ml-2">
              {currentProduct.rating.toFixed(1)} ({currentProduct.reviewCount} reviews)
            </span>
          </div>
          <p className="text-3xl font-bold text-primary-600 mb-6">
            {formatPrice(currentProduct.price)}
          </p>
          <p className="text-gray-700 mb-6">{currentProduct.description}</p>
          <div className="mb-6">
            <span className="text-sm text-gray-600">Category: </span>
            <span className="text-sm font-semibold text-primary-600">
              {currentProduct.category}
            </span>
          </div>
          {currentProduct.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Add to Cart
            </button>
          ) : (
            <button
              disabled
              className="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <ProductList
          products={recommendations}
          title="Recommended for You"
          showCarousel={true}
        />
      )}
    </div>
  );
};

export default ProductDetail;

