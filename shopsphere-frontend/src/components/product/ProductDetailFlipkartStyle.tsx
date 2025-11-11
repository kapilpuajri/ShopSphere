import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchProductById, fetchRecommendations, fetchFrequentlyBoughtTogether, fetchProducts } from '../../store/slices/productSlice';
import ProductList from './ProductList';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ProductCard from './ProductCard';

const ProductDetailFlipkartStyle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProduct, recommendations, frequentlyBoughtTogether, products, loading, error } = useAppSelector(state => state.products);
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 1;
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop';

  useEffect(() => {
    if (id) {
      const productId = Number(id);
      if (!isNaN(productId) && productId > 0) {
        dispatch(fetchProductById(productId));
        dispatch(fetchRecommendations(productId));
        dispatch(fetchFrequentlyBoughtTogether(productId));
        // Reset image error state when product changes
        setImageError(false);
        setSelectedImage(0);
      }
    }
  }, [id, dispatch]);

  // Fetch all products if not loaded (for similar products)
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [products.length, dispatch]);

  // Force image reload when product changes
  useEffect(() => {
    if (currentProduct) {
      // Reset image error and selected image when product changes
      setImageError(false);
      setSelectedImage(0);
    }
  }, [currentProduct?.id]);

  // Get similar products from same category
  const similarProducts = useMemo(() => {
    if (!currentProduct || products.length === 0) return [];
    return products
      .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
      .slice(0, 8);
  }, [currentProduct, products]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (currentProduct) {
      dispatch(addToCart({ userId, productId: currentProduct.id, quantity }));
      toast.success(`Added ${quantity} item(s) to cart!`);
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

  // Product images array - for iPhone 15 Pro, show 5 different angles
  // Add cache-busting parameter based on product ID to force image refresh when product changes
  const getImageUrl = (url: string) => {
    if (!url || !currentProduct) return defaultImage;
    // Add product ID as cache-busting parameter to force browser to reload image when product changes
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${currentProduct.id}`;
  };

  // iPhone 15 Pro images from different angles (from Unsplash)
  // Using different Unsplash photo IDs for various iPhone 15 Pro angles
  // Sources: https://unsplash.com/s/photos/iphone-15-pro
  const getIPhone15ProImages = () => {
    const baseUrl = 'https://images.unsplash.com/photo';
    // 5 different iPhone 15 Pro images from different angles
    const imageUrls = [
      `${baseUrl}-1592750475338-74b7b21085ab?w=600&h=600&fit=crop`, // Front view - white iPhone on colorful background
      `${baseUrl}-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop`, // Side/angled view - smartphone
      `${baseUrl}-1541807084-5c52b6b3adef?w=600&h=600&fit=crop`, // Top view - device detail
      `${baseUrl}-1496181133206-80ce9b88a853?w=600&h=600&fit=crop`, // Back view - device
      `${baseUrl}-1544244015-0df4b3a78725?w=600&h=600&fit=crop`, // Close-up detail - tablet/device
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is iPhone 15 Pro
  const isIPhone15Pro = currentProduct?.name?.toLowerCase().includes('iphone 15 pro');

  const productImages = currentProduct ? (
    isIPhone15Pro 
      ? getIPhone15ProImages() // 5 different angles for iPhone 15 Pro
      : [
          // For other products, use the main image (can be expanded later)
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
        ]
  ) : [];

  // Calculate discount
  const originalPrice = currentProduct ? currentProduct.price * 1.2 : 0;
  const discount = currentProduct ? Math.round(((originalPrice - currentProduct.price) / originalPrice) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentProduct) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error 
        ? "Request failed with status code 500"
        : "The product you're looking for doesn't exist or has been removed.";
    
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/products')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Browse Products
              </button>
              {error && (
                <button
                  onClick={() => {
                    if (id) {
                      const productId = Number(id);
                      if (!isNaN(productId) && productId > 0) {
                        dispatch(fetchProductById(productId));
                      }
                    }
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <button onClick={() => navigate('/')} className="hover:text-primary-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-primary-600">Products</button>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-md">{currentProduct.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <div>
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <img
                  key={`product-${currentProduct.id}-${selectedImage}`}
                  src={productImages[selectedImage] || defaultImage}
                  alt={currentProduct.name}
                  onError={() => setImageError(true)}
                  className="w-full h-96 object-contain mx-auto"
                />
              </div>
              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      key={`thumb-${currentProduct.id}-${idx}`}
                      src={img}
                      alt={`${currentProduct.name} view ${idx + 1}`}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product Info */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentProduct.name}
              </h1>

              {/* Rating Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded">
                  <span>{currentProduct.rating.toFixed(1)}</span>
                  <StarIconSolid className="w-4 h-4 ml-1" />
                </div>
                <span className="text-sm text-gray-600">
                  ({currentProduct.reviewCount} Ratings & {currentProduct.reviewCount} Reviews)
                </span>
              </div>

              {/* Price Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${currentProduct.price.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ${originalPrice.toFixed(2)}
                      </span>
                      <span className="text-lg text-green-600 font-semibold">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    You save ${(originalPrice - currentProduct.price).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Key Features */}
              <div className="mb-6 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Available offers</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <BanknotesIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Bank Offer</span> 10% off on credit card transactions, up to $50
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowPathIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Special Price</span> Get extra 5% off (price inclusive of discount)
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <TruckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Free Delivery</span> on orders above $50
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Highlights</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>{currentProduct.description}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>Category: {currentProduct.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>1 Year Manufacturer Warranty</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>7 Day Replacement Policy</span>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <TruckIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Delivery</p>
                    <p className="text-sm text-gray-600">Enter pincode for delivery options</p>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                      <button className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                        Check
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure transaction</p>
                    <p className="text-sm text-gray-600">Your transaction is secure and encrypted</p>
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {currentProduct.stock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckIcon className="w-5 h-5" />
                    <span>In Stock ({currentProduct.stock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 font-semibold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                {currentProduct.stock > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleWishlist}
                      className="px-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 transition flex items-center justify-center"
                      title="Add to Wishlist"
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

              {/* Seller Info */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Seller:</span> ShopSphere Retail
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">GST:</span> Available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Description, Specifications, Reviews */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'description'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'specifications'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'reviews'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Reviews ({currentProduct.reviewCount})
              </button>
            </div>
          </div>

          <div className="mt-4">
            {activeTab === 'description' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Product Description</h3>
                <p className="text-gray-700 leading-relaxed">{currentProduct.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
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
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`w-4 h-4 ${i < currentProduct.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Customer {review}</span>
                        <span className="text-xs text-gray-500">Verified Purchase</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Great product! Highly recommended. {currentProduct.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequently Bought Together Section */}
        {frequentlyBoughtTogether.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Bought Together</h2>
            <p className="text-gray-600 mb-4 text-sm">Customers who bought this item also bought:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {frequentlyBoughtTogether.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* You May Also Like / Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {recommendations.length > 8 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/products')}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  View All Recommendations →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailFlipkartStyle;

