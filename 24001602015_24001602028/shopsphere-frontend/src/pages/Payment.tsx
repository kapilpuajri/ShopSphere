import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatPrice } from '../utils/currency';
import { useAppDispatch } from '../hooks/redux';
import { clearCart } from '../store/slices/cartSlice';

interface PaymentData {
  orderData: any;
  totalAmount: number;
  paymentMethod: string;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  useEffect(() => {
    // Get payment data from location state
    if (location.state && location.state.paymentData) {
      setPaymentData(location.state.paymentData);
    } else {
      // If no payment data, redirect back to checkout
      toast.error('Invalid payment session. Redirecting to checkout...');
      navigate('/checkout');
    }
  }, [location, navigate]);

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number (add spaces every 4 digits)
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.replace(/\s/g, '').length <= 16) {
        setCardDetails(prev => ({ ...prev, [name]: formatted }));
      }
    }
    // Format expiry date (MM/YY)
    else if (name === 'expiryDate') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    }
    // Format CVV (max 3 digits)
    else if (name === 'cvv') {
      const formatted = value.replace(/\D/g, '').slice(0, 3);
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    }
    else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateCardDetails = (): boolean => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }
    if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    if (!cardDetails.cardholderName || cardDetails.cardholderName.length < 3) {
      toast.error('Please enter cardholder name');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    if (paymentData.paymentMethod === 'card' || paymentData.paymentMethod === 'paypal') {
      if (!validateCardDetails()) {
        return;
      }
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create order with payment verification
      const orderData = {
        ...paymentData.orderData,
        paymentVerified: true,
        paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Axios interceptor handles auth headers automatically
      const response = await axios.post('http://localhost:8080/api/orders', orderData);

      if (response.status === 200 && response.data) {
        dispatch(clearCart());
        toast.success('Payment successful! Order placed.');
        setTimeout(() => {
          navigate('/orders');
        }, 1500);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Don't navigate to login - axios interceptor handles auth
      // Only show error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Payment failed. Please try again.';
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  if (!paymentData) {
    return (
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 text-center max-w-[98%] xl:max-w-[95%]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payment...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 max-w-[98%] xl:max-w-[95%]">
      <h1 className="text-3xl font-bold mb-8">Complete Payment</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Total Amount</span>
            <span className="font-bold text-lg">{formatPrice(paymentData.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment Method</span>
            <span className="capitalize">
              {paymentData.paymentMethod === 'card' ? 'Credit/Debit Card' : 
               paymentData.paymentMethod === 'paypal' ? 'PayPal' : 
               paymentData.paymentMethod}
            </span>
          </div>
        </div>
      </div>

      {(paymentData.paymentMethod === 'card' || paymentData.paymentMethod === 'paypal') ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={cardDetails.cardholderName}
                onChange={handleCardInputChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={cardDetails.expiryDate}
                  onChange={handleCardInputChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleCardInputChange}
                  placeholder="123"
                  maxLength={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a demo payment gateway. In production, this would integrate with Razorpay, Stripe, or similar payment processors.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-xl font-semibold mb-2">Cash on Delivery</h2>
            <p className="text-gray-600 mb-6">
              You will pay when your order is delivered.
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate('/checkout')}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          disabled={processing}
        >
          Back to Checkout
        </button>
        <button
          onClick={handlePayment}
          disabled={processing}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Pay ${formatPrice(paymentData.totalAmount)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default Payment;

