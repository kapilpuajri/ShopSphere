import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/currency';

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: Array<{
    product: {
      id: number;
      name: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
  }>;
}

const Orders: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  const fetchOrders = async (retryDelay: number = 500) => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    try {
      setLoading(true);
      console.log('=== Fetching Orders (Attempt ' + (retryCountRef.current + 1) + ') ===');
      console.log('User ID from Redux:', user?.id);
      console.log('User ID type:', typeof user?.id);
      
      // Try using the new endpoint that gets user ID from JWT token
      let response;
      try {
        console.log('Trying /my-orders endpoint (uses JWT token)...');
        response = await axios.get(`http://localhost:8080/api/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Successfully used /my-orders endpoint');
      } catch (myOrdersError: any) {
        console.warn('my-orders endpoint failed, trying user/{id} endpoint...', myOrdersError.response?.data);
        // Fallback to the original endpoint
        response = await axios.get(`http://localhost:8080/api/orders/user/${user?.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
      
      console.log('Orders API response status:', response.status);
      console.log('Orders API response data:', response.data);
      // Ensure response.data is an array
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      console.log('Fetched orders count:', ordersData.length);
      if (ordersData.length > 0) {
        console.log('First order:', ordersData[0]);
        console.log('First order user ID:', ordersData[0].user?.id);
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        console.warn('No orders found');
        // If no orders found and we haven't exceeded max retries, try again
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying in ${retryDelay}ms... (Attempt ${retryCountRef.current}/${maxRetries})`);
          setTimeout(() => {
            fetchOrders(retryDelay * 1.5); // Exponential backoff
          }, retryDelay);
          return;
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Retry on error if we haven't exceeded max retries
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`Retrying after error in ${retryDelay}ms... (Attempt ${retryCountRef.current}/${maxRetries})`);
        setTimeout(() => {
          fetchOrders(retryDelay * 1.5);
        }, retryDelay);
        return;
      }
      
      setOrders([]); // Set empty array on error after max retries
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Reset retry count when component mounts or location changes
    retryCountRef.current = 0;
    
    // Initial fetch with delay to ensure order is committed (especially after checkout)
    const timer = setTimeout(() => {
      fetchOrders(500);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user?.id, isAuthenticated, navigate, location.pathname]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading orders...</p>
      </div>
    );
  }

  const handleRefresh = async () => {
    if (!user?.id || !isAuthenticated) return;
    
    retryCountRef.current = 0;
    await fetchOrders(500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Orders'}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-block"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatPrice(order.totalAmount)}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Items:</h4>
                <div className="space-y-2">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.product.imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50&h=50&fit=crop'}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50&h=50&fit=crop';
                          }}
                        />
                        <div>
                          <Link
                            to={`/products/${item.product.id}`}
                            className="font-medium hover:text-primary-600"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

