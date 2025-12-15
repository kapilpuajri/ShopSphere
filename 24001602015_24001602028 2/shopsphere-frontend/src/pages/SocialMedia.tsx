import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const SocialMedia: React.FC = () => {
  const { platform } = useParams<{ platform: string }>();
  
  const platformInfo: { [key: string]: { name: string; color: string; icon: string; description: string } } = {
    facebook: {
      name: 'Facebook',
      color: 'bg-blue-600',
      icon: '📘',
      description: 'Connect with us on Facebook for the latest updates, deals, and community discussions.'
    },
    twitter: {
      name: 'Twitter',
      color: 'bg-blue-400',
      icon: '🐦',
      description: 'Follow us on Twitter for real-time updates, product announcements, and customer support.'
    },
    instagram: {
      name: 'Instagram',
      color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
      icon: '📷',
      description: 'Follow us on Instagram for product photos, behind-the-scenes content, and exclusive offers.'
    }
  };

  const info = platformInfo[platform?.toLowerCase() || ''] || {
    name: 'Social Media',
    color: 'bg-gray-600',
    icon: '🔗',
    description: 'Connect with us on social media for the latest updates and offers.'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Platform Icon */}
          <div className={`${info.color} w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl`}>
            {info.icon}
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {info.name}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            {info.description}
          </p>

          {/* Coming Soon Message */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Coming Soon!
            </h2>
            <p className="text-gray-600">
              We're working on setting up our {info.name} page. Check back soon for updates, exclusive deals, and more!
            </p>
          </div>

          {/* Alternative Contact */}
          <div className="border-t pt-6">
            <p className="text-gray-600 mb-4">
              In the meantime, you can reach us through:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Contact Us
              </Link>
              <Link
                to="/products"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Browse Products
              </Link>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            ShopSphere - Your trusted online shopping destination
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;

