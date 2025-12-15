import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch } from './hooks/redux';
import { restoreAuth } from './store/slices/authSlice';
import { useTheme } from './hooks/useTheme';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import ProductsEnhanced from './pages/ProductsEnhanced';
import ProductDetailFlipkartStyle from './components/product/ProductDetailFlipkartStyle';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import SocialMedia from './pages/SocialMedia';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const dispatch = useAppDispatch();
  useTheme(); // Initialize theme

  useEffect(() => {
    // Restore authentication state from token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Always try to restore auth - this ensures user object is loaded
      dispatch(restoreAuth())
        .then((result) => {
          if (restoreAuth.fulfilled.match(result)) {
            console.log('Auth restored successfully:', result.payload.user);
          } else {
            console.warn('Auth restoration failed, but keeping session');
            // Retry after a short delay
            setTimeout(() => {
              dispatch(restoreAuth());
            }, 1000);
          }
        })
        .catch((error) => {
          console.error('Auth restoration error:', error);
          // Retry after delay
          setTimeout(() => {
            dispatch(restoreAuth());
          }, 2000);
        });
    }
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsEnhanced />} />
            <Route path="/products/:id" element={<ProductDetailFlipkartStyle />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/social/:platform" element={<SocialMedia />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
