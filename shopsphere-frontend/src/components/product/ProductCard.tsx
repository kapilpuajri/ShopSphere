import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../../store/slices/productSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../../store/slices/wishlistSlice';
import { toast } from 'react-hot-toast';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { formatPrice, calculateDiscount, calculateOriginalPrice } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { wishlistStatus } = useAppSelector(state => state.wishlist);
  // Only show wishlisted if user is authenticated, otherwise always false
  const isWishlisted = (isAuthenticated && user) ? (wishlistStatus[product.id] || false) : false;
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';

  // Check wishlist status when component mounts or user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(checkWishlistStatus(product.id));
    }
  }, [dispatch, product.id, isAuthenticated, user]);
  
  // Clear wishlist status when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Wishlist status will be cleared by the logout action in wishlistSlice
      // This effect ensures UI updates immediately
    }
  }, [isAuthenticated, user]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on buttons or links
    const target = e.target as HTMLElement;
    const clickedButton = target.closest('button');
    const clickedSvg = target.closest('svg');
    const clickedLink = target.closest('a');
    
    if (clickedButton || clickedSvg || clickedLink) {
      return;
    }
    
    // Navigate to product detail page
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product.id}`, { replace: false });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    dispatch(addToCart({ userId: user.id, productId: product.id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user || !isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }
    
    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(product.id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product.id)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(error || 'Failed to update wishlist');
    }
  };

  // Calculate varied discount (5% to 50%) based on product ID
  const discount = calculateDiscount(product.id);
  const originalPrice = calculateOriginalPrice(product.price, discount);

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/products/${product.id}`);
        }
      }}
    >
      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
        aria-label="Add to wishlist"
      >
        {isWishlisted ? (
          <HeartIconSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Product Image */}
      <div className="relative bg-gray-100 h-64 overflow-hidden">
        <img
          src={imageError ? defaultImage : (product.imageUrl || defaultImage)}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            <span>{product.rating.toFixed(1)}</span>
            <span className="ml-1">★</span>
          </div>
          <span className="text-xs text-gray-500 ml-2">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-xs text-green-600 font-semibold">
                  {discount}% off
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stock Status */}
        {product.stock > 0 ? (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-green-600 font-medium">In Stock</span>
            {product.stock < 10 && (
              <span className="text-xs text-orange-600">Only {product.stock} left!</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-red-600 font-medium mb-2 block">Out of Stock</span>
        )}

        {/* Quick Add to Cart */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

