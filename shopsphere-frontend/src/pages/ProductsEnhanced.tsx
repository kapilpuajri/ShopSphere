import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProducts, searchProducts, setSearchQuery, setSelectedCategory } from '../store/slices/productSlice';
import ProductList from '../components/product/ProductList';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ProductsEnhanced: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, loading, searchQuery, error, selectedCategory: reduxSelectedCategory } = useAppSelector(state => state.products);
  const [localQuery, setLocalQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedCategory, setSelectedCategoryLocal] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Trending searches
  const trendingSearches = [
    'mobiles', 'laptops', 'shoes', 'watches', 'headphones', 
    'cameras', 'tablets', 't shirts', 'bags', 'sunglasses'
  ];

  useEffect(() => {
    console.log('ProductsEnhanced: Fetching products...');
    dispatch(fetchProducts());
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, [dispatch]);

  // Sync localQuery with searchQuery from Redux
  useEffect(() => {
    if (searchQuery) {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery]);

  // Sync selectedCategory with Redux state
  useEffect(() => {
    setSelectedCategoryLocal(reduxSelectedCategory);
  }, [reduxSelectedCategory]);

  // Initialize price range based on actual product prices (only once when products load)
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false);
  
  useEffect(() => {
    if (products.length > 0 && !priceRangeInitialized) {
      const prices = products.map(p => p.price);
      const maxProductPrice = Math.max(...prices);
      const minProductPrice = Math.min(...prices);
      setPriceRange({ 
        min: Math.floor(minProductPrice), 
        max: Math.ceil(maxProductPrice * 1.1) // 10% buffer
      });
      setPriceRangeInitialized(true);
    }
  }, [products.length, priceRangeInitialized]);

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];

    console.log('Filtering products:', {
      totalProducts: products.length,
      selectedCategory,
      priceRange,
      selectedRating,
      sortBy
    });

    // Category filter
    if (selectedCategory) {
      const beforeCategory = filtered.length;
      filtered = filtered.filter(p => p.category === selectedCategory);
      console.log(`Category filter (${selectedCategory}): ${beforeCategory} -> ${filtered.length}`);
    }

    // Price filter
    const beforePrice = filtered.length;
    filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);
    console.log(`Price filter (${priceRange.min}-${priceRange.max}): ${beforePrice} -> ${filtered.length}`);

    // Rating filter
    if (selectedRating !== null) {
      const beforeRating = filtered.length;
      filtered = filtered.filter(p => p.rating >= selectedRating);
      console.log(`Rating filter (>=${selectedRating}): ${beforeRating} -> ${filtered.length}`);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    console.log('Final filtered products:', filtered.length);
    return filtered;
  }, [products, selectedCategory, priceRange, selectedRating, sortBy]);

  useEffect(() => {
    console.log('ProductsEnhanced: Products updated:', products.length);
    console.log('ProductsEnhanced: Filtered products:', filteredProducts.length);
    console.log('ProductsEnhanced: Loading:', loading);
  }, [products, filteredProducts, loading]);

  const handleSearch = (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    const searchTerm = query || localQuery.trim();
    if (searchTerm) {
      // Save to recent searches
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      dispatch(setSearchQuery(searchTerm));
      dispatch(searchProducts(searchTerm));
      setShowSuggestions(false);
      setLocalQuery(searchTerm);
    } else {
      dispatch(setSearchQuery(''));
      dispatch(fetchProducts());
      setShowSuggestions(false);
    }
  };
  
  // Get search suggestions based on input
  const getSearchSuggestions = () => {
    if (!localQuery.trim()) {
      return {
        matching: [],
        recent: recentSearches,
        trending: trendingSearches
      };
    }
    
    const query = localQuery.toLowerCase();
    const matching = products
      .filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(p => p.name);
    
    const recentMatches = recentSearches.filter(s => 
      s.toLowerCase().includes(query)
    );
    
    const trendingMatches = trendingSearches.filter(s => 
      s.toLowerCase().includes(query)
    );
    
    return { matching, recent: recentMatches, trending: trendingMatches };
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    dispatch(setSearchQuery(''));
    dispatch(fetchProducts());
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setSelectedCategoryLocal(null);
    const maxProductPrice = products.length > 0 ? Math.max(...products.map(p => p.price)) : 100000;
    const minProductPrice = products.length > 0 ? Math.min(...products.map(p => p.price)) : 0;
    setPriceRange({ min: Math.floor(minProductPrice), max: Math.ceil(maxProductPrice * 1.1) });
    setSelectedRating(null);
    setSortBy('relevance');
    dispatch(setSelectedCategory(null));
    console.log('Filters cleared, price range:', { min: Math.floor(minProductPrice), max: Math.ceil(maxProductPrice * 1.1) });
  };

  const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price), 100000) : 100000;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-6 max-w-[98%] xl:max-w-[95%]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">All Products</h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => {
                    setLocalQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search for products, brands and more..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
                />
                {localQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {(() => {
                      const suggestions = getSearchSuggestions();
                      const hasContent = suggestions.matching.length > 0 || suggestions.recent.length > 0 || (suggestions.trending.length > 0 && !localQuery.trim());
                      
                      if (!hasContent) return null;
                      
                      return (
                        <div className="py-2">
                          {/* Matching Products */}
                          {suggestions.matching.length > 0 && (
                            <div className="px-4 py-2">
                              {suggestions.matching.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSearch(undefined, suggestion)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                                  <span>{suggestion}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Recent Searches */}
                          {suggestions.recent.length > 0 && (
                            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-3">Recent Searches</div>
                              {suggestions.recent.map((search, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSearch(undefined, search)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                  <ArrowPathIcon className="w-4 h-4 text-gray-400" />
                                  <span>{search}</span>
                                  {products.some(p => p.category.toLowerCase().includes(search.toLowerCase())) && (
                                    <span className="ml-auto text-xs text-primary-600 dark:text-primary-400">
                                      in {products.find(p => p.category.toLowerCase().includes(search.toLowerCase()))?.category}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Trending Searches */}
                          {!localQuery.trim() && suggestions.trending.length > 0 && (
                            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-3">Trending</div>
                              {suggestions.trending.map((trend, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSearch(undefined, trend)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                                  <span>{trend}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary-600 dark:bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition font-semibold"
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort and Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery 
                ? `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found for "${searchQuery}"`
                : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`}
            </div>
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500"
              >
                <option value="relevance">Sort by: Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="reviews">Most Reviewed</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                  selectedCategory || selectedRating !== null || priceRange.min > 0 || priceRange.max < maxPrice
                    ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
                {(selectedCategory || selectedRating !== null || priceRange.min > 0 || priceRange.max < maxPrice) && (
                  <span className="ml-1 bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Clear All
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Category</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('All Categories clicked');
                        setSelectedCategoryLocal(null);
                        dispatch(setSelectedCategory(null));
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        selectedCategory === null
                          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          console.log('Category filter clicked:', category);
                          setSelectedCategoryLocal(category);
                          dispatch(setSelectedCategory(category));
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                          selectedCategory === category
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => {
                          const newMin = Number(e.target.value) || 0;
                          console.log('Price min changed:', newMin);
                          setPriceRange({ ...priceRange, min: newMin });
                        }}
                        placeholder="Min"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => {
                          const newMax = Number(e.target.value) || priceRange.max;
                          console.log('Price max changed:', newMax);
                          setPriceRange({ ...priceRange, max: newMax });
                        }}
                        placeholder="Max"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Range: ₹{priceRange.min.toLocaleString('en-IN')} - ₹{priceRange.max.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Customer Rating</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => {
                          const newRating = selectedRating === rating ? null : rating;
                          console.log('Rating filter clicked:', newRating);
                          setSelectedRating(newRating);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition ${
                          selectedRating === rating
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span>& above</span>
                      </button>
                    ))}
                  </div>
                </div>
            </div>
          </div>

          {/* Mobile Filter Overlay */}
          {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
              <div className="bg-white dark:bg-gray-800 h-full w-80 overflow-y-auto p-6 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                {/* Category Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('All Categories clicked (mobile)');
                        setSelectedCategoryLocal(null);
                        dispatch(setSelectedCategory(null));
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                        selectedCategory === null
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          console.log('Category filter clicked (mobile):', category);
                          setSelectedCategoryLocal(category);
                          dispatch(setSelectedCategory(category));
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                          selectedCategory === category
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Price Filter */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => {
                          const newMin = Number(e.target.value) || 0;
                          console.log('Price min changed (mobile):', newMin);
                          setPriceRange({ ...priceRange, min: newMin });
                        }}
                        placeholder="Min"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => {
                          const newMax = Number(e.target.value) || priceRange.max;
                          console.log('Price max changed (mobile):', newMax);
                          setPriceRange({ ...priceRange, max: newMax });
                        }}
                        placeholder="Max"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Range: ₹{priceRange.min.toLocaleString('en-IN')} - ₹{priceRange.max.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                {/* Rating Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Rating</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => {
                          const newRating = selectedRating === rating ? null : rating;
                          console.log('Rating filter clicked (mobile):', newRating);
                          setSelectedRating(newRating);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition ${
                          selectedRating === rating
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span>& above</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-300 transition"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-md font-medium hover:bg-primary-700 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg transition-colors duration-200">
                <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
                <button
                  onClick={() => dispatch(fetchProducts())}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Reload Products
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg transition-colors duration-200">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery 
                    ? `No products found for "${searchQuery}"` 
                    : 'No products found'}
                </p>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition mb-4"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ProductList products={filteredProducts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsEnhanced;

