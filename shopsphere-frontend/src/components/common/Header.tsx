import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { ShoppingCartIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Header: React.FC = () => {
  const cartItems = useAppSelector(state => state.cart.items);
  const { isAuthenticated, user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            ShopSphere
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-primary-600 transition">
              Products
            </Link>
            <Link to="/cart" className="text-gray-700 hover:text-primary-600 transition relative">
              <ShoppingCartIcon className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-primary-600 transition flex items-center">
                  <UserIcon className="w-5 h-5 mr-1" />
                  {user?.firstName}
                </Link>
                <Link to="/orders" className="text-gray-700 hover:text-primary-600 transition">
                  Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2">
            <Link to="/" className="block py-2 text-gray-700 hover:text-primary-600">Home</Link>
            <Link to="/products" className="block py-2 text-gray-700 hover:text-primary-600">Products</Link>
            <Link to="/cart" className="block py-2 text-gray-700 hover:text-primary-600">
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-600">Profile</Link>
                <Link to="/orders" className="block py-2 text-gray-700 hover:text-primary-600">Orders</Link>
                <button onClick={handleLogout} className="block py-2 text-gray-700 hover:text-primary-600 w-full text-left">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700 hover:text-primary-600">Login</Link>
                <Link to="/register" className="block py-2 text-gray-700 hover:text-primary-600">Sign Up</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

