import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchCart, removeFromCart } from '../store/slices/cartSlice';
import ProductList from '../components/product/ProductList';

const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, recommendations } = useAppSelector(state => state.cart);
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id || 1;

  useEffect(() => {
    dispatch(fetchCart(userId));
  }, [dispatch, userId]);

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleRemove = (productId: number) => {
    dispatch(removeFromCart({ userId, productId }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-xl">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-6 mb-4 flex items-center gap-4"
                >
                  <img
                    src={item.product.imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.product.name}</h3>
                    <p className="text-primary-600 font-bold">
                      ${item.product.price.toFixed(2)}
                    </p>
                    <p className="text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>$10.00</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>${(total + 10).toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  className="block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition text-center"
                >
                  Checkout
                </Link>
              </div>
            </div>
          </div>

          {recommendations.length > 0 && (
            <ProductList
              products={recommendations}
              title="You May Also Like"
              showCarousel={true}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Cart;

