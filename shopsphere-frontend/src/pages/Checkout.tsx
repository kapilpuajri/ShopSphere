import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { clearCart } from '../store/slices/cartSlice';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../utils/currency';

const Checkout: React.FC = () => {
  const { items } = useAppSelector(state => state.cart);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shippingAddress: '',
    city: '',
    zipCode: '',
    country: '',
    phone: '',
    paymentMethod: 'card',
  });

  // Load saved shipping address from user profile
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (user?.id) {
        try {
          const response = await axios.get(`http://localhost:8080/api/auth/profile/${user.id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (response.data) {
            setFormData(prev => ({
              ...prev,
              shippingAddress: response.data.address || '',
              city: response.data.city || '',
              zipCode: response.data.zipCode || '',
              country: response.data.country || '',
              phone: response.data.phone || '',
            }));
          }
        } catch (error) {
          // Silently fail - user might not have saved address yet
          console.log('No saved address found');
        }
      }
    };

    if (isAuthenticated && user?.id) {
      loadSavedAddress();
    }
  }, [user, isAuthenticated]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 10;
  const total = subtotal + shipping;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/products')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orderData = {
        userId: user?.id,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: total,
        shippingAddress: `${formData.shippingAddress}, ${formData.city}, ${formData.zipCode}, ${formData.country}`,
        paymentMethod: formData.paymentMethod,
        phone: formData.phone,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
      };

      console.log('=== Placing Order ===');
      console.log('User ID from Redux:', user?.id);
      console.log('User ID type:', typeof user?.id);
      console.log('Order data:', orderData);
      console.log('Order data userId:', orderData.userId);
      console.log('Order data userId type:', typeof orderData.userId);
      
      const response = await axios.post('http://localhost:8080/api/orders', orderData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Order response status:', response.status);
      console.log('Order response data:', response.data);
      if (response.data && response.data.user) {
        console.log('Order user ID from response:', response.data.user.id);
      }
      
      // If we get a 200 status, the order was created successfully
      // The backend returns the Order object directly with fields like id, totalAmount, etc.
      if (response.status === 200 && response.data) {
        // Verify we have a valid order response (should have totalAmount or id)
        const hasValidOrderData = response.data.totalAmount !== undefined || 
                                  response.data.id !== undefined ||
                                  response.data.status !== undefined;
        
        if (hasValidOrderData) {
          dispatch(clearCart());
          toast.success('Order placed successfully!');
          console.log('Order created successfully, redirecting to orders page...');
          console.log('Order ID:', response.data.id);
          console.log('Order user ID:', response.data.user?.id);
          // Increased delay to ensure order is fully committed to database
          setTimeout(() => {
            console.log('Navigating to orders page, user ID:', user?.id);
            navigate('/orders');
          }, 2000); // Increased to 2 seconds to ensure database commit
        } else {
          // Even if format is unexpected, if status is 200, order was likely created
          console.warn('Unexpected response format, but status is 200. Proceeding...', response.data);
          dispatch(clearCart());
          toast.success('Order placed successfully!');
          setTimeout(() => {
            navigate('/orders');
          }, 2000); // Increased to 2 seconds
        }
      } else {
        throw new Error('Order creation failed - invalid response');
      }
    } catch (error: any) {
      console.error('Order placement error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to place order. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    required
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Place Order
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;









