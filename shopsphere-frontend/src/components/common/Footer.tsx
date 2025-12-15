import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-auto transition-colors duration-200">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-12 max-w-[98%] xl:max-w-[95%]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">ShopSphere</h3>
            <p className="text-gray-400">
              Your one-stop destination for all your shopping needs. Quality products at unbeatable prices.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-white">Products</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li><Link to="/profile" className="text-gray-400 hover:text-white">My Account</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white">Order History</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <p className="text-gray-400 mb-4">Follow us on social media</p>
            <div className="flex flex-col space-y-3">
              <Link 
                to="/social/facebook" 
                className="text-gray-400 hover:text-white transition flex items-center gap-2 group hover:translate-x-1"
                title="Visit our Facebook page"
              >
                <span className="text-2xl group-hover:scale-110 transition">📘</span>
                <span className="group-hover:font-medium transition">Facebook</span>
              </Link>
              <Link 
                to="/social/twitter" 
                className="text-gray-400 hover:text-white transition flex items-center gap-2 group hover:translate-x-1"
                title="Follow us on Twitter"
              >
                <span className="text-2xl group-hover:scale-110 transition">🐦</span>
                <span className="group-hover:font-medium transition">Twitter</span>
              </Link>
              <Link 
                to="/social/instagram" 
                className="text-gray-400 hover:text-white transition flex items-center gap-2 group hover:translate-x-1"
                title="Follow us on Instagram"
              >
                <span className="text-2xl group-hover:scale-110 transition">📷</span>
                <span className="group-hover:font-medium transition">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p>&copy; 2024 ShopSphere. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span>Created by:</span>
              <a href="mailto:chaudhri.diksha8@gmail.com" className="hover:text-white transition">Diksha</a>
              <span>&</span>
              <a href="mailto:kpujari52450@gmail.com" className="hover:text-white transition">Kapil Pujari</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;













