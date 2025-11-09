import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../store/slices/productSlice';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = React.useState(false);
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
          <img
            src={imageError ? defaultImage : (product.imageUrl || defaultImage)}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary-600">
              ${product.price.toFixed(2)}
            </span>
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {product.rating.toFixed(1)} ({product.reviewCount})
              </span>
            </div>
          </div>
          {product.stock > 0 ? (
            <span className="text-green-600 text-sm">In Stock</span>
          ) : (
            <span className="text-red-600 text-sm">Out of Stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

