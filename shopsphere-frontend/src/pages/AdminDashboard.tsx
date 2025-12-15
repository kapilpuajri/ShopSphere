import React, { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AddProduct from '../components/admin/AddProduct';
import ProductManagement from '../components/admin/ProductManagement';
import { CogIcon, PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');

  // Check if user is admin
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Only allow admins to access admin dashboard
    if (user?.role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 max-w-[98%] xl:max-w-[95%]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CogIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage products, inventory, and more
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'add'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              Add Product
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'manage'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
              Manage Products
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
          {activeTab === 'add' ? <AddProduct /> : <ProductManagement />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

