import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchProductById, fetchRecommendations, fetchProducts } from '../../store/slices/productSlice';
import ProductList from './ProductList';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  StarIcon,
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatPrice, calculateDiscount, calculateOriginalPrice } from '../../utils/currency';

const ProductDetailEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProduct, recommendations, products, loading, error } = useAppSelector(state => state.products);
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 1;
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
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

  // Fetch all products if not loaded (for similar products)
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [products.length, dispatch]);

  // Get similar products from same category
  const similarProducts = useMemo(() => {
    if (!currentProduct || products.length === 0) return [];
    return products
      .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
      .slice(0, 4);
  }, [currentProduct, products]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (currentProduct) {
      try {
        await dispatch(addToCart({ userId, productId: currentProduct.id, quantity })).unwrap();
        toast.success(`Added ${quantity} item(s) to cart!`);
      } catch (error: any) {
        const errorMessage = error || 'Failed to add item to cart';
        toast.error(errorMessage);
        // Don't navigate to login - let the error message handle it
      }
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    if (currentProduct) {
      dispatch(addToCart({ userId, productId: currentProduct.id, quantity }));
      navigate('/checkout');
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Mock images array (in real app, this would come from backend)
  const productImages = currentProduct ? [
    currentProduct.imageUrl || defaultImage,
    currentProduct.imageUrl || defaultImage,
    currentProduct.imageUrl || defaultImage,
  ] : [];

  // Calculate varied discount (5% to 50%) based on product ID
  const discount = currentProduct ? calculateDiscount(currentProduct.id) : 0;
  const originalPrice = currentProduct ? calculateOriginalPrice(currentProduct.price, discount) : 0;

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
          <button
            onClick={() => navigate('/products')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-primary-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-primary-600">Products</button>
          <span>/</span>
          <span className="text-gray-900">{currentProduct.name}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div>
              <div className="mb-4">
                <img
                  src={productImages[selectedImage] || defaultImage}
                  alt={currentProduct.name}
                  onError={() => setImageError(true)}
                  className="w-full h-96 object-contain rounded-lg border border-gray-200"
                />
              </div>
              <div className="flex gap-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${currentProduct.name} view ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {currentProduct.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded">
                  <span>{currentProduct.rating.toFixed(1)}</span>
                  <StarIconSolid className="w-4 h-4 ml-1" />
                </div>
                <span className="text-gray-600">
                  ({currentProduct.reviewCount} Ratings & Reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(currentProduct.price)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="text-lg text-green-600 font-semibold">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    You save {formatPrice(originalPrice - currentProduct.price)}
                  </p>
                )}
              </div>

              {/* Highlights */}
              <div className="mb-6 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-2">Highlights</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span>{currentProduct.description}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span>Category: {currentProduct.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span>Warranty: 1 Year Manufacturer Warranty</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    ({currentProduct.stock} available)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                {currentProduct.stock > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleWishlist}
                      className="px-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 transition flex items-center justify-center"
                    >
                      {isWishlisted ? (
                        <HeartIconSolid className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Delivery Info */}
              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <TruckIcon className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Free Delivery</p>
                    <p className="text-sm text-gray-600">Order above $50 for free delivery</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure payment options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
          <p className="text-gray-700 leading-relaxed">{currentProduct.description}</p>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-b border-gray-200 pb-2">
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{currentProduct.category}</span>
            </div>
            <div className="border-b border-gray-200 pb-2">
              <span className="text-gray-600">Stock:</span>
              <span className="ml-2 font-medium">{currentProduct.stock} units</span>
            </div>
            <div className="border-b border-gray-200 pb-2">
              <span className="text-gray-600">Rating:</span>
              <span className="ml-2 font-medium">{currentProduct.rating.toFixed(1)} / 5.0</span>
            </div>
            <div className="border-b border-gray-200 pb-2">
              <span className="text-gray-600">Reviews:</span>
              <span className="ml-2 font-medium">{currentProduct.reviewCount}</span>
            </div>
          </div>
        </div>

        {/* Recommendations Section - Flipkart Style */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
          {recommendations.length > 0 ? (
            <ProductList
              products={recommendations}
              title=""
              showCarousel={false}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recommendations available at the moment</p>
            </div>
          )}
        </div>

        {/* Similar Products - Based on Category */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <ProductList
              products={similarProducts}
              title=""
              showCarousel={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailEnhanced;

