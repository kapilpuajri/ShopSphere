import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchProductById, fetchRecommendations, fetchFrequentlyBoughtTogether, fetchProducts } from '../../store/slices/productSlice';
import ProductList from './ProductList';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../../store/slices/wishlistSlice';
import { fetchReviewsByProduct, createReview, checkCanReview, clearReviews } from '../../store/slices/reviewSlice';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ProductCard from './ProductCard';
import { formatPrice, calculateDiscount, calculateOriginalPrice } from '../../utils/currency';

const ProductDetailFlipkartStyle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProduct, recommendations, frequentlyBoughtTogether, products, loading, error } = useAppSelector(state => state.products);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { wishlistStatus } = useAppSelector(state => state.wishlist);
  const { reviews, loading: reviewsLoading, canReview, reviewReason } = useAppSelector(state => state.reviews);
  const userId = user?.id || 1;
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'serviceable' | 'not-serviceable'>('idle');
  const [deliveryInfo, setDeliveryInfo] = useState<{ deliveryDate?: string; deliveryCharge?: number } | null>(null);
  
  // Get wishlist status from Redux, default to false if not authenticated
  const isWishlisted = (currentProduct && isAuthenticated) ? (wishlistStatus[currentProduct.id] || false) : false;
  const defaultImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=600&fit=crop';

  useEffect(() => {
    if (id) {
      const productId = Number(id);
      if (!isNaN(productId) && productId > 0) {
        dispatch(fetchProductById(productId));
        dispatch(fetchRecommendations(productId));
        dispatch(fetchFrequentlyBoughtTogether(productId));
        dispatch(fetchReviewsByProduct(productId));
        // Check wishlist status if user is authenticated
        if (isAuthenticated && user) {
          dispatch(checkWishlistStatus(productId));
          dispatch(checkCanReview(productId));
        }
        // Reset image error state when product changes
        setImageError(false);
        setSelectedImage(0);
        dispatch(clearReviews());
      }
    }
  }, [id, dispatch, isAuthenticated, user]);

  // Fetch all products if not loaded (for similar products)
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchProducts());
    }
  }, [products.length, dispatch]);

  // Force image reload when product changes
  useEffect(() => {
    if (currentProduct) {
      // Reset image error and selected image when product changes
      setImageError(false);
      setSelectedImage(0);
    }
  }, [currentProduct?.id]);

  // Get similar products from same category (products with similar configuration)
  const similarProducts = useMemo(() => {
    if (!currentProduct || products.length === 0) return [];
    return products
      .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
      .slice(0, 8);
  }, [currentProduct, products]);

  // Filter frequently bought together to exclude similar products (ensure they're complementary)
  const complementaryProducts = useMemo(() => {
    if (!currentProduct || frequentlyBoughtTogether.length === 0) return frequentlyBoughtTogether;
    
    // Get similar product IDs to exclude
    const similarProductIds = new Set(similarProducts.map(p => p.id));
    
    // Categories that should show same-category items (products that naturally go together)
    // e.g., t-shirt + jeans, hair treatment + shampoo, mattress + bedding, running shoes + workout clothes
    const currentCategory = currentProduct.category?.toLowerCase();
    const allowSameCategory = currentCategory === 'clothing' || 
                              currentCategory === 'beauty' || 
                              currentCategory === 'home & kitchen' || 
                              currentCategory === 'sports';
    
    // Filter out any products that are in similar products list
    return frequentlyBoughtTogether.filter(product => {
      // Exclude if it's in similar products
      if (similarProductIds.has(product.id)) return false;
      
      // For categories that allow same-category, allow same-category items (they are complementary)
      // For other categories, exclude same-category items (they should be complementary from different categories)
      if (!allowSameCategory && product.category === currentProduct.category) {
        return false;
      }
      
      return true;
    });
  }, [frequentlyBoughtTogether, similarProducts, currentProduct]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    if (currentProduct) {
      dispatch(addToCart({ userId, productId: currentProduct.id, quantity }));
      toast.success(`Added ${quantity} item(s) to cart!`);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }
    if (currentProduct) {
      dispatch(addToCart({ userId, productId: currentProduct.id, quantity }));
      navigate('/checkout');
    }
  };

  // Pincode validation and serviceability check
  const checkPincodeServiceability = async (pin: string) => {
    if (!currentProduct) {
      toast.error('Product information not available');
      return;
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setPincodeStatus('checking');
    setDeliveryInfo(null);

    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate serviceability logic
    // In a real application, this would be an API call to check serviceability
    // For demo purposes, we'll use some logic:
    // - Pincodes starting with 1-4 are serviceable (major cities)
    // - Pincodes starting with 5-6 are serviceable with longer delivery time
    // - Pincodes starting with 7-9 are not serviceable (remote areas)
    const firstDigit = parseInt(pin[0]);
    
    if (firstDigit >= 1 && firstDigit <= 4) {
      // Serviceable - fast delivery
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 2); // 2 days
      setPincodeStatus('serviceable');
      setDeliveryInfo({
        deliveryDate: deliveryDate.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        deliveryCharge: 0 // Free delivery
      });
      toast.success('Delivery available to this pincode!');
    } else if (firstDigit >= 5 && firstDigit <= 6) {
      // Serviceable - standard delivery
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4); // 4 days
      setPincodeStatus('serviceable');
      setDeliveryInfo({
        deliveryDate: deliveryDate.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        deliveryCharge: currentProduct && currentProduct.price > 50000 ? 0 : 50
      });
      toast.success('Delivery available to this pincode!');
    } else {
      // Not serviceable
      setPincodeStatus('not-serviceable');
      setDeliveryInfo(null);
      toast.error('Sorry, delivery is not available to this pincode');
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setPincode(value);
      // Reset status when user changes pincode
      if (pincodeStatus !== 'idle') {
        setPincodeStatus('idle');
        setDeliveryInfo(null);
      }
    }
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      checkPincodeServiceability(pincode);
    } else {
      toast.error('Please enter a valid 6-digit pincode');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !isAuthenticated) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }

    try {
      await dispatch(createReview({
        productId: currentProduct.id,
        rating: reviewRating,
        comment: reviewComment,
      })).unwrap();
      
      toast.success('Review submitted successfully!');
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      
      // Refresh reviews
      dispatch(fetchReviewsByProduct(currentProduct.id));
      dispatch(checkCanReview(currentProduct.id));
    } catch (error: any) {
      toast.error(error || 'Failed to submit review');
    }
  };

  const handleWishlist = async () => {
    if (!user || !isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      navigate('/login');
      return;
    }
    
    if (!currentProduct) return;
    
    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist(currentProduct.id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(currentProduct.id)).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(error || 'Failed to update wishlist');
    }
  };

  // Product images array - for iPhone 15 Pro, show 5 different angles
  // Add cache-busting parameter based on product ID to force image refresh when product changes
  const getImageUrl = (url: string) => {
    if (!url || !currentProduct) return defaultImage;
    // Add product ID as cache-busting parameter to force browser to reload image when product changes
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${currentProduct.id}`;
  };

  // iPhone 15 Pro images from different angles (from Unsplash)
  // Using different Unsplash photo IDs for various iPhone 15 Pro angles
  // Sources: https://unsplash.com/s/photos/iphone-15-pro
  const getIPhone15ProImages = () => {
    // 6 different iPhone 15 Pro - Natural Titanium images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1695822958645-b2b058159215?w=600&h=600&fit=crop&auto=format', // Person holding an iPhone in their hand - https://unsplash.com/photos/a-person-holding-an-iphone-in-their-hand-yioUBdpscs0
      'https://images.unsplash.com/photo-1695822877321-15ef5412b82e?w=600&h=600&fit=crop&auto=format', // Person holding an iPhone in front of a brick wall - https://unsplash.com/photos/a-person-holding-an-iphone-in-front-of-a-brick-wall-NbJ2LrMc3kE
      'https://images.unsplash.com/photo-1695822822491-d92cee704368?w=600&h=600&fit=crop&auto=format', // Person holding an iPhone in front of a brick wall (alternative) - https://unsplash.com/photos/a-person-holding-an-iphone-in-front-of-a-brick-wall-AtYWWis5ZDM
      'https://images.unsplash.com/photo-1709755983078-98bc41136d3a?w=600&h=600&fit=crop&auto=format', // Cell phone sitting on top of a table next to a drink - https://unsplash.com/photos/a-cell-phone-sitting-on-top-of-a-table-next-to-a-drink-rLrkk4FkI5A
      'https://images.unsplash.com/photo-1709755983132-d4d58c0ba250?w=600&h=600&fit=crop&auto=format', // Person holding a remote control - https://unsplash.com/photos/a-person-holding-a-remote-control-in-their-right-hand-vevYikQHObs
      'https://images.unsplash.com/photo-1694570149728-b1011c2a772b?w=600&h=600&fit=crop&auto=format', // White iPhone sitting on top of a black table - https://unsplash.com/photos/a-white-iphone-sitting-on-top-of-a-black-table-eJFMPXcTtbU
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getIPhone15ProBlueTitaniumImages = () => {
    // 5 different iPhone 15 Pro - Blue Titanium images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1624915757423-594d4b40d8ab?w=600&h=600&fit=crop&auto=format', // Blue and white iPhone case - https://unsplash.com/photos/blue-and-white-iphone-case-gSvjuhEIlbE
      'https://images.unsplash.com/photo-1617997455403-41f333d44d5b?w=600&h=600&fit=crop&auto=format', // Black iPhone 4 on white table - https://unsplash.com/photos/black-iphone-4-on-white-table-prRuk1h40oo
      'https://images.unsplash.com/photo-1668760180231-cbfade2d750c?w=600&h=600&fit=crop&auto=format', // Cell phone on a table - https://unsplash.com/photos/a-cell-phone-on-a-table--tRfpaXPOKw
      'https://images.unsplash.com/photo-1635843644763-0e9419bd4ad2?w=600&h=600&fit=crop&auto=format', // Close up of a cell phone on a table - https://unsplash.com/photos/a-close-up-of-a-cell-phone-on-a-table-D1Es6w5nta8
      'https://images.unsplash.com/photo-1637329539007-1012bc784105?w=600&h=600&fit=crop&auto=format', // Close up of a cell phone on a carpet - https://unsplash.com/photos/a-close-up-of-a-cell-phone-on-a-carpet-ez_5p-lmgRQ
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getIPhone15ProWhiteTitaniumImages = () => {
    // 5 different iPhone 15 Pro - White Titanium images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1694570149728-b1011c2a772b?w=600&h=600&fit=crop&auto=format', // White iPhone sitting on top of a black table - https://unsplash.com/photos/a-white-iphone-sitting-on-top-of-a-black-table-eJFMPXcTtbU
      'https://images.unsplash.com/photo-1736173155811-e8142fd553ee?w=600&h=600&fit=crop&auto=format', // White iPhone case sitting on top of a table - https://unsplash.com/photos/a-white-iphone-case-sitting-on-top-of-a-table-zxi4HT2Rww8
      'https://images.unsplash.com/photo-1714571889114-a2ef230cb5fc?w=600&h=600&fit=crop&auto=format', // Person holding an iPhone in their hand - https://unsplash.com/photos/a-person-holding-an-iphone-in-their-hand-eQpNsDgWdds
      'https://images.unsplash.com/photo-1727093493740-90af54b99738?w=600&h=600&fit=crop&auto=format', // Close up of a silver iPhone on a white surface - https://unsplash.com/photos/a-close-up-of-a-silver-iphone-on-a-white-surface-GqLaBOBLc0k
      'https://images.unsplash.com/photo-1639313265378-1c51cf8cfebd?w=600&h=600&fit=crop&auto=format', // White box with an iPhone in it - https://unsplash.com/photos/a-white-box-with-an-iphone-in-it-hNYjI1EzbKY
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getIPhone15ProBlackTitaniumImages = () => {
    // 5 different iPhone 15 Pro - Black Titanium images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1630513094903-3fcaa1bcffd3?w=600&h=600&fit=crop&auto=format', // Silver iPhone 6 on black textile - https://unsplash.com/photos/silver-iphone-6-on-black-textile-60igCWop88U
      'https://images.unsplash.com/photo-1630513094187-7dabca3f0a8f?w=600&h=600&fit=crop&auto=format', // Silver iPhone 6 on black textile (alternative) - https://unsplash.com/photos/silver-iphone-6-on-black-textile-U3Pqd1mbP3k
      'https://images.unsplash.com/photo-1571654681830-ef991494a42a?w=600&h=600&fit=crop&auto=format', // iPhone 11 - https://unsplash.com/photos/iphone-11-X5V7hb7CxNY
      'https://images.unsplash.com/photo-1580707490368-f13c64643bee?w=600&h=600&fit=crop&auto=format', // Silver iPhone 6 on white table - https://unsplash.com/photos/silver-iphone-6-on-white-table-WwQUDXNiQU8
      'https://images.unsplash.com/photo-1690090903050-5103f3b13256?w=600&h=600&fit=crop&auto=format', // Close up of a cell phone on a table - https://unsplash.com/photos/a-close-up-of-a-cell-phone-on-a-table-fSHfTEyB3to
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getScarfCashmereImages = () => {
    // 5 different Scarf - Cashmere images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: First image (ahed674KR24) was Unsplash+, using alternative
    const imageUrls = [
      'https://images.unsplash.com/photo-1738774106981-cc24d010cdb7?w=600&h=600&fit=crop&auto=format', // Woman wearing a scarf and a black jacket (alternative for paywalled image) - https://unsplash.com/photos/a-woman-wearing-a-scarf-and-a-black-jacket-JpKCr9c-dsY
      'https://images.unsplash.com/photo-1551381912-4e2e29c7fd17?w=600&h=600&fit=crop&auto=format', // Black textile - https://unsplash.com/photos/black-textile-iKlEr0QCTyY
      'https://images.unsplash.com/photo-1620740199226-2420c2fcaa18?w=600&h=600&fit=crop&auto=format', // Woman in yellow and white floral hijab - https://unsplash.com/photos/woman-in-yellow-and-white-floral-hijab-Me2-Xz5FHQY
      'https://images.unsplash.com/photo-1674768015404-7aabcf6e9066?w=600&h=600&fit=crop&auto=format', // Woman wearing a blue coat and a plaid scarf - https://unsplash.com/photos/a-woman-wearing-a-blue-coat-and-a-plaid-scarf-OF_lXbEdex4
      'https://images.unsplash.com/photo-1738774106981-cc24d010cdb7?w=600&h=600&fit=crop&auto=format', // Woman wearing a scarf and a black jacket - https://unsplash.com/photos/a-woman-wearing-a-scarf-and-a-black-jacket-JpKCr9c-dsY
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getTrenchCoatBeigeImages = () => {
    // 5 different Trench Coat - Beige images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: First and third images (KgwoxrOJOx0, P-71PdbFJZ0) were Unsplash+, using alternatives
    const imageUrls = [
      'https://images.unsplash.com/photo-1633821879282-0c4e91f96232?w=600&h=600&fit=crop&auto=format', // Woman in a trench coat posing for a picture (alternative for paywalled image) - https://unsplash.com/photos/a-woman-in-a-trench-coat-posing-for-a-picture-5vrque5NVHI
      'https://images.unsplash.com/photo-1633821879282-0c4e91f96232?w=600&h=600&fit=crop&auto=format', // Woman in a trench coat posing for a picture - https://unsplash.com/photos/a-woman-in-a-trench-coat-posing-for-a-picture-5vrque5NVHI
      'https://images.unsplash.com/photo-1617875827710-9afb3fbee447?w=600&h=600&fit=crop&auto=format', // Woman in brown coat and blue denim jeans sitting on gray metal bench (alternative for paywalled image) - https://unsplash.com/photos/woman-in-brown-coat-and-blue-denim-jeans-sitting-on-gray-metal-bench-during-daytime-MUckTBJWOnE
      'https://images.unsplash.com/photo-1617875827710-9afb3fbee447?w=600&h=600&fit=crop&auto=format', // Woman in brown coat and blue denim jeans sitting on gray metal bench - https://unsplash.com/photos/woman-in-brown-coat-and-blue-denim-jeans-sitting-on-gray-metal-bench-during-daytime-MUckTBJWOnE
      'https://images.unsplash.com/photo-1617733459995-514e10a50d51?w=600&h=600&fit=crop&auto=format', // Woman in brown coat and blue denim jeans standing on white concrete floor - https://unsplash.com/photos/woman-in-brown-coat-and-blue-denim-jeans-standing-on-white-concrete-floor-during-daytime-jTOq_ie7L_w
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getWirelessChargingPadImages = () => {
    // 5 different Wireless Charging Pad images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1633381638729-27f730955c23?w=600&h=600&fit=crop&auto=format', // Close up of a mouse on a table - https://unsplash.com/photos/a-close-up-of-a-mouse-on-a-table-1Y579--3k5M
      'https://images.unsplash.com/photo-1543472750-506bacbf5808?w=600&h=600&fit=crop&auto=format', // Black framed Ray-Ban aviator sunglasses - https://unsplash.com/photos/black-framed-ray-ban-aviator-sunglasses-r0Do56ntkBs
      'https://images.unsplash.com/photo-1633381573179-d3cadd62970a?w=600&h=600&fit=crop&auto=format', // Cell phone sitting on top of a wallet - https://unsplash.com/photos/a-cell-phone-sitting-on-top-of-a-wallet-Hj8paHW1pZ4
      'https://images.unsplash.com/photo-1634511467887-69c0c04b5897?w=600&h=600&fit=crop&auto=format', // Man holding a smart phone next to a smart watch - https://unsplash.com/photos/a-man-holding-a-smart-phone-next-to-a-smart-watch-YexiqlZtjJs
      'https://images.unsplash.com/photo-1606077095660-726118e877fd?w=600&h=600&fit=crop&auto=format', // Black android smartphone on white surface - https://unsplash.com/photos/black-android-smartphone-on-white-surface-KeVWtMw0fsw
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getAmazonEchoDot5thGenImages = () => {
    // 5 different Amazon Echo Dot 5th Gen images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: First and last images (gCoKHeHj-AU, c-f_dBay_hA) were Unsplash+, using alternatives
    const imageUrls = [
      'https://images.unsplash.com/photo-1544451256-d79e9e199fa8?w=600&h=600&fit=crop&auto=format', // White and black Amazon Echo Dot 2 (alternative for paywalled image) - https://unsplash.com/photos/white-and-black-amazon-echo-dot-2-db4jrNvZhOQ
      'https://images.unsplash.com/photo-1544451256-d79e9e199fa8?w=600&h=600&fit=crop&auto=format', // White and black Amazon Echo Dot 2 - https://unsplash.com/photos/white-and-black-amazon-echo-dot-2-db4jrNvZhOQ
      'https://images.unsplash.com/photo-1544428571-aaf850ce481e?w=600&h=600&fit=crop&auto=format', // 2nd gen black and purple Amazon Echo Dot on white surface - https://unsplash.com/photos/2nd-gen-black-and-purple-amazon-echo-dot-on-white-surface-bifCXiN5rdY
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&h=600&fit=crop&auto=format', // Gray Amazon Echo portable speaker - https://unsplash.com/photos/gray-amazon-echo-portable-speaker-n_wXNttWVGs
      'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&h=600&fit=crop&auto=format', // Gray Amazon Echo portable speaker (alternative for paywalled image) - https://unsplash.com/photos/gray-amazon-echo-portable-speaker-n_wXNttWVGs
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getAppleAirPodsPro2Images = () => {
    // 5 different Apple AirPods Pro 2 images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1593716686443-b821ac2a45c8?w=600&h=600&fit=crop&auto=format', // Man in red shirt with cigarette in mouth - https://unsplash.com/photos/man-in-red-shirt-with-cigarette-in-mouth-TE6e6mEasCE
      'https://images.unsplash.com/photo-1675703342284-cf59dc6f98e3?w=600&h=600&fit=crop&auto=format', // Pair of hands holding a pair of ear buds - https://unsplash.com/photos/a-pair-of-hands-holding-a-pair-of-ear-buds-Jc6HSvRnzqs
      'https://images.unsplash.com/photo-1629367494173-c78a56567877?w=600&h=600&fit=crop&auto=format', // 2 white plastic condiment shakers - https://unsplash.com/photos/2-white-plastic-condiment-shakers-NdEhsa7-1eU
      'https://images.unsplash.com/photo-1623788736363-55d36908ab21?w=600&h=600&fit=crop&auto=format', // Blue and white marble toy - https://unsplash.com/photos/blue-and-white-marble-toy-bZK1mrpjGnw
      'https://images.unsplash.com/photo-1593442607435-e4e34991b210?w=600&h=600&fit=crop&auto=format', // White apple earpods on white surface - https://unsplash.com/photos/white-apple-earpods-on-white-surface-TnDTzDiJbJo
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getWebcamHD1080pImages = () => {
    // 5 different Webcam HD 1080p images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: Last image (cCC4FR8M7e0) was Unsplash+, using alternative
    const imageUrls = [
      'https://images.unsplash.com/photo-1636569826709-8e07f6104992?w=600&h=600&fit=crop&auto=format', // Screen shot of a smart phone sitting on a table - https://unsplash.com/photos/a-screen-shot-of-a-smart-phone-sitting-on-a-table-9vP2tWTwsF4
      'https://images.unsplash.com/photo-1626581795188-8efb9a00eeec?w=600&h=600&fit=crop&auto=format', // Black and silver camera lens - https://unsplash.com/photos/black-and-silver-camera-lens-nP4WPqYAhTQ
      'https://images.unsplash.com/photo-1636569826709-8e07f6104992?w=600&h=600&fit=crop&auto=format', // Screen shot of a smart phone sitting on a table (duplicate) - https://unsplash.com/photos/a-screen-shot-of-a-smart-phone-sitting-on-a-table-9vP2tWTwsF4
      'https://images.unsplash.com/photo-1681894050969-d8923c212537?w=600&h=600&fit=crop&auto=format', // Close up of a camera on a table - https://unsplash.com/photos/a-close-up-of-a-camera-on-a-table-pTkZWusU5_c
      'https://images.unsplash.com/photo-1681894050969-d8923c212537?w=600&h=600&fit=crop&auto=format', // Close up of a camera on a table (alternative for paywalled image) - https://unsplash.com/photos/a-close-up-of-a-camera-on-a-table-pTkZWusU5_c
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getKindlePaperwhiteImages = () => {
    // 5 different Kindle Paperwhite images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1623751370867-159020187c16?w=600&h=600&fit=crop&auto=format', // Person holding a kindle with a quote on it - https://unsplash.com/photos/a-person-holding-a-kindle-with-a-quote-on-it-vpqjH8BlWJA
      'https://images.unsplash.com/photo-1703332795377-65ccc6818232?w=600&h=600&fit=crop&auto=format', // Kindle sitting on a window sill next to a stack of books - https://unsplash.com/photos/a-kindle-sitting-on-a-window-sill-next-to-a-stack-of-books-Ny3tTr8nEuQ
      'https://images.unsplash.com/photo-1598016376552-749d93370198?w=600&h=600&fit=crop&auto=format', // Black framed eyeglasses on black surface - https://unsplash.com/photos/black-framed-eyeglasses-on-black-surface-B8drXN4TKAQ
      'https://images.unsplash.com/photo-1640023151365-e4212c93742c?w=600&h=600&fit=crop&auto=format', // Tablet sitting on a table next to a coffee mug - https://unsplash.com/photos/a-tablet-sitting-on-a-table-next-to-a-coffee-mug-m_57oq_nwDc
      'https://images.unsplash.com/photo-1622122892817-45b38188db7e?w=600&h=600&fit=crop&auto=format', // Black amazon e book reader - https://unsplash.com/photos/black-amazon-e-book-reader-mrXWhqleZMk
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getUSBCFastChargingCableImages = () => {
    // 5 different USB-C Fast Charging Cable images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: 2nd and 4th images (b5NYQOMOcYw, N-bFBDJfehU) were Unsplash+, using alternatives
    const imageUrls = [
      'https://images.unsplash.com/photo-1573868388390-2739872961e6?w=600&h=600&fit=crop&auto=format', // Black and white USB data cables - https://unsplash.com/photos/black-and-white-usb-data-cables-QM9yzAoX-GQ
      'https://images.unsplash.com/photo-1573868388390-2739872961e6?w=600&h=600&fit=crop&auto=format', // Black and white USB data cables (alternative for paywalled image) - https://unsplash.com/photos/black-and-white-usb-data-cables-QM9yzAoX-GQ
      'https://images.unsplash.com/photo-1572721546624-05bf65ad7679?w=600&h=600&fit=crop&auto=format', // Orange USB cables - https://unsplash.com/photos/orange-usb-cables-yh0UtueiZ-I
      'https://images.unsplash.com/photo-1572721546624-05bf65ad7679?w=600&h=600&fit=crop&auto=format', // Orange USB cables (alternative for paywalled image) - https://unsplash.com/photos/orange-usb-cables-yh0UtueiZ-I
      'https://images.unsplash.com/photo-1595402211029-1c16c5a29bb6?w=600&h=600&fit=crop&auto=format', // Red and black usb cable - https://unsplash.com/photos/red-and-black-usb-cable-R8osLTAuo3g
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getMacBookPro16M3Images = () => {
    // 5 different MacBook Pro 16" M3 images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1659135890084-930731031f40?w=600&h=600&fit=crop&auto=format', // Laptop with a mouse - https://unsplash.com/photos/a-laptop-with-a-mouse-6M9bAK5l4_o
      'https://images.unsplash.com/photo-1658400274389-e7dbedd89b67?w=600&h=600&fit=crop&auto=format', // White rectangular device - https://unsplash.com/photos/a-white-rectangular-device-ylqeFa_-PvA
      'https://images.unsplash.com/photo-1683589801968-ceb0000cef44?w=600&h=600&fit=crop&auto=format', // Close up of a keyboard on a laptop - https://unsplash.com/photos/a-close-up-of-a-keyboard-on-a-laptop-7SiAtyAyEiY
      'https://images.unsplash.com/photo-1580522154071-c6ca47a859ad?w=600&h=600&fit=crop&auto=format', // Black and gray laptop computer - https://unsplash.com/photos/black-and-gray-laptop-computer-ykI7BeSWgMo
      'https://images.unsplash.com/photo-1578950435899-d1c1bf932ab2?w=600&h=600&fit=crop&auto=format', // Turned-on laptop computer - https://unsplash.com/photos/turned-on-laptop-computer-bqZw8GEppBM
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getDellXPS15Images = () => {
    // 4 different Dell XPS 15 images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&h=600&fit=crop&auto=format', // Laptop on brown wooden table - https://unsplash.com/photos/laptop-on-brown-wooden-table-yNvVnPcurD8
      'https://images.unsplash.com/photo-1720556405438-d67f0f9ecd44?w=600&h=600&fit=crop&auto=format', // Laptop computer sitting on top of a wooden table - https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-wooden-table-d8kp7EPgAmQ
      'https://images.unsplash.com/photo-1575320854760-bfffc3550640?w=600&h=600&fit=crop&auto=format', // Black laptop computer on desk - https://unsplash.com/photos/black-laptop-computer-on-desk-B_88OOFHTj8
      'https://images.unsplash.com/photo-1622286346003-c5c7e63b1088?w=600&h=600&fit=crop&auto=format', // Black and silver asus laptop computer - https://unsplash.com/photos/black-and-silver-asus-laptop-computer-0uVSMGdeUKM
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getHPSpectreX360Images = () => {
    // 5 different HP Spectre x360 images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1658312226966-29bd4e77c62c?w=600&h=600&fit=crop&auto=format', // Laptop on a desk - https://unsplash.com/photos/a-laptop-on-a-desk-OKKV_hqEtFU
      'https://images.unsplash.com/photo-1619532550465-ad4dc9bd680a?w=600&h=600&fit=crop&auto=format', // Black and silver laptop computer - https://unsplash.com/photos/black-and-silver-laptop-computer-wJyPrO4GK6s
      'https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=600&h=600&fit=crop&auto=format', // Silver macbook on brown wooden table - https://unsplash.com/photos/silver-macbook-on-brown-wooden-table-7KLpKCG05vI
      'https://images.unsplash.com/photo-1589561190002-96f5462f81e7?w=600&h=600&fit=crop&auto=format', // Black laptop computer on brown wooden table - https://unsplash.com/photos/black-laptop-computer-on-brown-wooden-table-VlEnNUNyQLY
      'https://images.unsplash.com/photo-1658312227565-439994de5fe7?w=600&h=600&fit=crop&auto=format', // Laptop on a table - https://unsplash.com/photos/a-laptop-on-a-table-n6vabWPzmvg
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getDumbbellSetImages = () => {
    // 5 different Dumbbell Set images from Unsplash (free alternatives since provided images were Unsplash+)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=600&fit=crop&auto=format', // Dumbbells
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop&auto=format', // Dumbbells gym
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=600&fit=crop&auto=format', // Dumbbell weights
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=600&fit=crop&auto=format', // Dumbbell set
      'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=600&h=600&fit=crop&auto=format', // Dumbbell exercise
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getIPadPro129Images = () => {
    // 5 different iPad Pro 12.9" images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1661340272675-f6829791246e?w=600&h=600&fit=crop&auto=format', // White rectangular device with a screen - iPad Pro - https://unsplash.com/photos/a-white-rectangular-device-with-a-screen-fgwsBnWJDE8
      'https://images.unsplash.com/photo-1684234737746-f3b2ae05377d?w=600&h=600&fit=crop&auto=format', // Tablet computer sitting on top of a table - iPad Pro - https://unsplash.com/photos/a-tablet-computer-sitting-on-top-of-a-table-96BmB7GqrYA
      'https://images.unsplash.com/photo-1647866367186-75da2e47cfdf?w=600&h=600&fit=crop&auto=format', // Man sitting at a table looking at a laptop - iPad Pro - https://unsplash.com/photos/a-man-sitting-at-a-table-looking-at-a-laptop-39x2ExL2F78
      'https://images.unsplash.com/photo-1569697150535-94fb89f890be?w=600&h=600&fit=crop&auto=format', // Black tablet computer - iPad Pro - https://unsplash.com/photos/black-tablet-computer-t3Miv9Ygv9U
      'https://images.unsplash.com/photo-1624896387301-b232d31f2f1f?w=600&h=600&fit=crop&auto=format', // Black iPad on brown wooden table - https://unsplash.com/photos/black-ipad-on-brown-wooden-table-WczguzaoSAU
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getSmartWatchImages = () => {
    // 5 different Smart Watch images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1549486862-1a0e849380d8?w=600&h=600&fit=crop&auto=format', // Square black Nike analog watch at 3:10 - https://unsplash.com/photos/square-black-nike-analog-watch-at-310-db2Yx4maIgI
      'https://images.unsplash.com/photo-1640786172851-9e9e5ba58a37?w=600&h=600&fit=crop&auto=format', // Text whiteboard - Apple Watch - https://unsplash.com/photos/text-whiteboard-rKR4lDlbJS4
      'https://images.unsplash.com/photo-1656185933033-a84b9391b160?w=600&h=600&fit=crop&auto=format', // Hand holding a black and white cube - Apple Watch - https://unsplash.com/photos/a-hand-holding-a-black-and-white-cube-with-a-white-and-black-logo-FsZcErog90k
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&auto=format', // Smart watch (free alternative for Unsplash+ image) - https://unsplash.com/photos/a-person-holding-a-smart-watch-in-their-hand-Rtp3qTAUe0U
      'https://images.unsplash.com/photo-1611270629569-948d94ca915a?w=600&h=600&fit=crop&auto=format', // Cell phone sitting next to a smart watch - https://unsplash.com/photos/a-cell-phone-sitting-next-to-a-smart-watch-ALQG6NypnRY
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getSonyWH1000XM5Images = () => {
    // 5 different Sony WH-1000XM5 Headphones images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1583305727488-61f82c7eae4b?w=600&h=600&fit=crop&auto=format', // Black and gray corded headphones - https://unsplash.com/photos/black-and-gray-corded-headphones-7KMhZqylgss
      'https://images.unsplash.com/photo-1556452041-0df5eaa315f8?w=600&h=600&fit=crop&auto=format', // Silver Sony wireless headphones - https://unsplash.com/photos/silver-sony-wireless-headphones-rWDBzo5ZTTE
      'https://images.unsplash.com/photo-1761005654126-6d512251d7a3?w=600&h=600&fit=crop&auto=format', // Red sony headphones resting on a dark surface - https://unsplash.com/photos/red-sony-headphones-resting-on-a-dark-surface-p7YEWVPLGd0
      'https://images.unsplash.com/photo-1550009158-61dec72587bf?w=600&h=600&fit=crop&auto=format', // Black Sony cordless headphones on white surface - https://unsplash.com/photos/black-sony-cordless-headphones-on-white-surface-wTezihGmvqQ
      'https://images.unsplash.com/photo-1617714313606-283484c136be?w=600&h=600&fit=crop&auto=format', // Black and silver sony headphones - https://unsplash.com/photos/black-and-silver-sony-headphones-0z_w_2zAMew
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getCarPhoneMountImages = () => {
    // 5 different Car Phone Mount images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1619463061549-e14e1de6c14f?w=600&h=600&fit=crop&auto=format', // Black iPhone 4 on car center console - https://unsplash.com/photos/black-iphone-4-on-car-center-console-Kd1h5LJIZbE
      'https://images.unsplash.com/photo-1698314440355-eaf5ff14899c?w=600&h=600&fit=crop&auto=format', // Cell phone sitting on a stand on a desk - https://unsplash.com/photos/a-cell-phone-sitting-on-a-stand-on-a-desk-PxkNzkSZ8LM
      'https://images.unsplash.com/photo-1698314440014-3badb1e9c938?w=600&h=600&fit=crop&auto=format', // Cell phone on a stand on a desk - https://unsplash.com/photos/a-cell-phone-on-a-stand-on-a-desk-ZieeEAogV9Y
      'https://images.unsplash.com/photo-1698314440004-95623e12c9db?w=600&h=600&fit=crop&auto=format', // Close up of a cell phone on a table - https://unsplash.com/photos/a-close-up-of-a-cell-phone-on-a-table-DJ2EvFJI6Kk
      'https://images.unsplash.com/photo-1698314440055-5aa837af0a7f?w=600&h=600&fit=crop&auto=format', // Close up of a steering wheel of a car - https://unsplash.com/photos/a-close-up-of-a-steering-wheel-of-a-car-QYQ9d8ZGELg
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getPowerBank20000mAhImages = () => {
    // 5 different Power Bank 20000mAh images from Unsplash (using 3 provided + 2 repeats)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?w=600&h=600&fit=crop&auto=format', // Person holding black smartphone on white textile - https://unsplash.com/photos/person-holding-black-smartphone-on-white-textile-svsKYetYPUI
      'https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?w=600&h=600&fit=crop&auto=format', // White and blue coated wires - https://unsplash.com/photos/white-and-blue-coated-wires-UP_RojtnvTU
      'https://images.unsplash.com/photo-1644571669401-9ab344866592?w=600&h=600&fit=crop&auto=format', // Couple of cell phones sitting on top of a table - https://unsplash.com/photos/a-couple-of-cell-phones-sitting-on-top-of-a-table-1MSlwT_-X8c
      'https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?w=600&h=600&fit=crop&auto=format', // Person holding black smartphone on white textile (repeat)
      'https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?w=600&h=600&fit=crop&auto=format', // White and blue coated wires (repeat)
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getLaptopStandAluminumImages = () => {
    // 5 different Laptop Stand Aluminum images from Unsplash (using 3 provided + 2 free alternatives)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1575399545768-5f1840c1312d?w=600&h=600&fit=crop&auto=format', // MacBook - https://unsplash.com/photos/macbook-lWlJLgJoq68
      'https://images.unsplash.com/photo-1623251606108-512c7c4a3507?w=600&h=600&fit=crop&auto=format', // Black flat screen computer monitor and black computer keyboard - https://unsplash.com/photos/black-flat-screen-computer-monitor-and-black-computer-keyboard-wLXk9eHYE0A
      'https://images.unsplash.com/photo-1623567238235-940ff1311da7?w=600&h=600&fit=crop&auto=format', // Black laptop computer on white table - https://unsplash.com/photos/black-laptop-computer-on-white-table-K7NrWCUINVY
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&auto=format', // Laptop stand alternative (free) - https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-desk-IMRdx5V_FfM
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&h=600&fit=crop&auto=format', // Laptop stand alternative (free) - alternative for Unsplash+ image
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getAirFryer55QTImages = () => {
    // 5 different Air Fryer 5.5QT images from Unsplash (using 3 provided + 2 repeats)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1617775047746-5b36a40109f5?w=600&h=600&fit=crop&auto=format', // White and gray plastic bottle - https://unsplash.com/photos/white-and-gray-plastic-bottle-xky5JGgzwi8
      'https://images.unsplash.com/photo-1672925216623-f32a54d732e0?w=600&h=600&fit=crop&auto=format', // Electronic device with two birds on top of it - https://unsplash.com/photos/an-electronic-device-with-two-birds-on-top-of-it-UrgKfcSPxZk
      'https://images.unsplash.com/photo-1634681896994-0027a701b1d7?w=600&h=600&fit=crop&auto=format', // White cup with steam rising out of it - https://unsplash.com/photos/a-white-cup-with-steam-rising-out-of-it-JkyhF89gNck
      'https://images.unsplash.com/photo-1617775047746-5b36a40109f5?w=600&h=600&fit=crop&auto=format', // White and gray plastic bottle (repeat)
      'https://images.unsplash.com/photo-1672925216623-f32a54d732e0?w=600&h=600&fit=crop&auto=format', // Electronic device with two birds on top of it (repeat)
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getStandMixerImages = () => {
    // 5 different Stand Mixer images from Unsplash (using 3 provided + 2 repeats for Unsplash+ images)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1693875161668-5c4ae0f2bf20?w=600&h=600&fit=crop&auto=format', // Mixer sitting on top of a kitchen counter - https://unsplash.com/photos/a-mixer-sitting-on-top-of-a-kitchen-counter-1B7sCkW8g14
      'https://images.unsplash.com/photo-1693875161720-b0c2401c1874?w=600&h=600&fit=crop&auto=format', // Kitchen counter with a mixer, bananas and a toaster oven - https://unsplash.com/photos/a-kitchen-counter-with-a-mixer-bananas-and-a-toaster-oven-HsqdtgpKZe0
      'https://images.unsplash.com/photo-1577495917765-9497a0de7caa?w=600&h=600&fit=crop&auto=format', // Multicolored stand mixer with glass case - https://unsplash.com/photos/multicolored-stand-mixer-with-glass-case-eIqO4P50MeY
      'https://images.unsplash.com/photo-1693875161668-5c4ae0f2bf20?w=600&h=600&fit=crop&auto=format', // Mixer sitting on top of a kitchen counter (repeat for Unsplash+ image) - https://unsplash.com/photos/a-white-mixer-sitting-on-top-of-a-counter-next-to-eggs-koXgntCxxnY
      'https://images.unsplash.com/photo-1693875161720-b0c2401c1874?w=600&h=600&fit=crop&auto=format', // Kitchen counter with mixer (repeat for Unsplash+ image) - https://unsplash.com/photos/a-mixer-with-eggs-and-other-ingredients-on-a-table-IBsRf_p0tHI
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getBeddingSetQueenImages = () => {
    // 5 different Bedding Set - Queen images from Unsplash (using 2 provided + 3 free alternatives for Unsplash+ images)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1609587639086-b4cbf85e4355?w=600&h=600&fit=crop&auto=format', // Black bed linen on bed - https://unsplash.com/photos/black-bed-linen-on-bed-4DxjAJxXE7c
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=600&fit=crop&auto=format', // Bedding alternative 1 - free alternative for https://unsplash.com/photos/a-bedroom-with-a-large-bed-and-a-chandelier-MsDkXnCm6WU
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=600&fit=crop&auto=format', // Bedding alternative 2 - free alternative for https://unsplash.com/photos/a-bed-with-a-yellow-comforter-and-pillows-HtULenyo5ms
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop&auto=format', // Bedding alternative 3 - free alternative for https://unsplash.com/photos/a-bed-with-a-white-comforter-and-pillows-jAjJbthhVJc
      'https://images.unsplash.com/photo-1609587639086-b4cbf85e4355?w=600&h=600&fit=crop&auto=format', // Black bed linen on bed (repeat) - https://unsplash.com/photos/black-bed-linen-on-bed-4DxjAJxXE7c
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getRobotVacuumCleanerImages = () => {
    // 5 different Robot Vacuum Cleaner images from Unsplash (using 4 provided + 1 repeat for Unsplash+ image)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&h=600&fit=crop&auto=format', // White and black device - https://unsplash.com/photos/white-and-black-device-R3KYh1a3xfU (free alternative for https://unsplash.com/photos/a-white-robot-vacuum-on-a-wooden-floor-bxn1Y8WzGdo)
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&h=600&fit=crop&auto=format', // White and black device - https://unsplash.com/photos/white-and-black-device-R3KYh1a3xfU
      'https://images.unsplash.com/photo-1603618090561-412154b4bd1b?w=600&h=600&fit=crop&auto=format', // Black and white round device - https://unsplash.com/photos/black-and-white-round-device-YiLArpymKoA
      'https://images.unsplash.com/photo-1603618090554-f7a5079ffb54?w=600&h=600&fit=crop&auto=format', // Grayscale photo of round frame on wooden floor - https://unsplash.com/photos/grayscale-photo-of-round-frame-on-wooden-floor-znfc7DF7M7U
      'https://images.unsplash.com/photo-1590164409291-450e859ccb87?w=600&h=600&fit=crop&auto=format', // White round ceiling light turned off - https://unsplash.com/photos/white-round-ceiling-light-turned-off-DeGvnKKETFM
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getHoodedSweatshirtGrayImages = () => {
    // 5 different Hooded Sweatshirt - Gray images from Unsplash (using 3 provided + 2 repeats for Unsplash+ image)
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1580159851546-833dd8f26318?w=600&h=600&fit=crop&auto=format', // Woman in gray sweater covering her face with gray scarf - https://unsplash.com/photos/woman-in-gray-sweater-covering-her-face-with-gray-scarf-TOMwwfJkrCU
      'https://images.unsplash.com/photo-1622024276133-461ccc49d2c8?w=600&h=600&fit=crop&auto=format', // Woman in gray hoodie and black pants sitting on gray couch - https://unsplash.com/photos/woman-in-gray-hoodie-and-black-pants-sitting-on-gray-couch-69Nqr8QdQU4
      'https://images.unsplash.com/photo-1617273480640-912c11f8af7e?w=600&h=600&fit=crop&auto=format', // Woman in gray coat standing near brown wooden fence during daytime - https://unsplash.com/photos/woman-in-gray-coat-standing-near-brown-wooden-fence-during-daytime-tIIIwie4k2A
      'https://images.unsplash.com/photo-1580159851546-833dd8f26318?w=600&h=600&fit=crop&auto=format', // Woman in gray sweater (repeat for Unsplash+ image) - free alternative for https://unsplash.com/photos/a-man-sitting-on-a-basketball-court-with-his-head-in-his-hands-HFzSpieadeg
      'https://images.unsplash.com/photo-1622024276133-461ccc49d2c8?w=600&h=600&fit=crop&auto=format', // Woman in gray hoodie (repeat) - https://unsplash.com/photos/woman-in-gray-hoodie-and-black-pants-sitting-on-gray-couch-69Nqr8QdQU4
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getExerciseBikeImages = () => {
    // 5 different Exercise Bike images from Unsplash
    // Using simplified Unsplash image URLs for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1707985287164-c84627ad6eba?w=600&h=600&fit=crop&auto=format', // Stationary bike on rug - https://unsplash.com/photos/a-stationary-bike-sits-on-a-rug-in-front-of-a-curtain-2pqPojBNq0Y
      'https://images.unsplash.com/photo-1707985287123-4bd2e9152d3d?w=600&h=600&fit=crop&auto=format', // Exercise bike in front of curtain - https://unsplash.com/photos/a-stationary-exercise-bike-in-front-of-a-curtain-K7m_ZPBwZ-Q
      'https://images.unsplash.com/photo-1707985287123-4bd2e9152d3d?w=600&h=600&fit=crop&auto=format', // Exercise bike alternative view (original Unsplash+ paywall)
      'https://images.unsplash.com/photo-1707985287164-c84627ad6eba?w=600&h=600&fit=crop&auto=format', // Stationary bike alternative view (original Unsplash+ paywall)
      'https://images.unsplash.com/photo-1760031670160-4da44e9596d0?w=600&h=600&fit=crop&auto=format', // Row of red stationary exercise bikes in gym - https://unsplash.com/photos/row-of-red-stationary-exercise-bikes-in-gym-9FBx4LwGpFc
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getPunchingBagImages = () => {
    // 5 different Punching Bag images from Unsplash
    // Using simplified Unsplash image URLs for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1748484531687-5faebc4a1965?w=600&h=600&fit=crop&auto=format', // Heavy punching bag hangs outside - https://unsplash.com/photos/a-heavy-punching-bag-hangs-outside-wxoYJEmTUn8
      'https://images.unsplash.com/photo-1588906467701-6d5e8dac4353?w=600&h=600&fit=crop&auto=format', // Boxing bag hanging from rope in gym - https://unsplash.com/photos/a-boxing-bag-hanging-from-a-rope-in-a-gym-NrbiR-ybKJM
      'https://images.unsplash.com/photo-1591804670840-70a165d4ac71?w=600&h=600&fit=crop&auto=format', // Black and red hanging heavy bag - https://unsplash.com/photos/black-and-red-hanging-heavy-bag-VApjrKQbGDE
      'https://images.unsplash.com/photo-1588906467701-6d5e8dac4353?w=600&h=600&fit=crop&auto=format', // Boxing bag alternative view (original Unsplash+ image unavailable: person holding bag) - https://unsplash.com/photos/a-person-is-holding-a-red-and-blue-boxing-bag-XqDK-gHlti0
      'https://images.unsplash.com/photo-1708134028754-5ba43093fedf?w=600&h=600&fit=crop&auto=format', // Woman punching bag in dark room - https://unsplash.com/photos/a-woman-is-punching-a-punching-bag-in-a-dark-room-la3cBBjHImk
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getGymGlovesImages = () => {
    // 5 different Gym Gloves images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1557127972-1c446ea89ea5?w=600&h=600&fit=crop&auto=format', // Person wearing black fingerless gloves - https://unsplash.com/photos/person-wearing-black-fingerless-gloves-CYyoMFLljJo
      'https://images.unsplash.com/photo-1641371084529-1f4c8d40cea3?w=600&h=600&fit=crop&auto=format', // Person wearing gloves holding scissors - https://unsplash.com/photos/a-person-wearing-a-pair-of-gloves-holding-a-pair-of-scissors-_8-VFc9982o
      'https://images.unsplash.com/photo-1557127972-1c446ea89ea5?w=600&h=600&fit=crop&auto=format', // Alternative view (original Unsplash+ image unavailable: man pointing finger) - https://unsplash.com/photos/a-man-pointing-his-finger-at-the-camera-zHZ_iSj-njU
      'https://images.unsplash.com/photo-1580983694176-b6b4e3e010a6?w=600&h=600&fit=crop&auto=format', // Person wearing black socks and red rubber band - https://unsplash.com/photos/person-wearing-black-socks-and-red-rubber-band-Y7LqFO9ez2I
      'https://images.unsplash.com/photo-1641371084529-1f4c8d40cea3?w=600&h=600&fit=crop&auto=format', // Alternative view (original Unsplash+ image unavailable: man with wrist brace) - https://unsplash.com/photos/a-man-with-a-wrist-brace-holding-a-black-tie-aamRUlSU3pU
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getSamsungGalaxyS24UltraImages = () => {
    // 5 different Samsung Galaxy S24 Ultra images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1705585174953-9b2aa8afc174?w=600&h=600&fit=crop&auto=format', // Person holding a silver cell phone in their hand - https://unsplash.com/photos/a-person-holding-a-silver-cell-phone-in-their-hand-aVsbUg8UPvg
      'https://images.unsplash.com/photo-1705585175110-d25f92c183aa?w=600&h=600&fit=crop&auto=format', // Person holding a samsung phone in their hand - https://unsplash.com/photos/a-person-holding-a-samsung-phone-in-their-hand-vjgTcqbajS4
      'https://images.unsplash.com/photo-1705530292519-ec81f2ace70d?w=600&h=600&fit=crop&auto=format', // Person holding a silver samsung phone in their hand - https://unsplash.com/photos/a-person-holding-a-silver-samsung-phone-in-their-hand-prDKWnb_Vag
      'https://images.unsplash.com/photo-1705585174987-a9a033edbbb8?w=600&h=600&fit=crop&auto=format', // Close up of a person holding a cell phone - https://unsplash.com/photos/a-close-up-of-a-person-holding-a-cell-phone-2mupZJYu2jk
      'https://images.unsplash.com/photo-1709744722656-9b850470293f?w=600&h=600&fit=crop&auto=format', // Close up of a cell phone near a keyboard - https://unsplash.com/photos/a-close-up-of-a-cell-phone-near-a-keyboard-lkhz29AXTTc
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getSamsungGalaxyImages = () => {
    // 5 different Samsung Galaxy images from Unsplash
    // Using generic smartphone images that work for Samsung Galaxy
    const baseUrl = 'https://images.unsplash.com/photo';
    const imageUrls = [
      `${baseUrl}-1592750475338-74b7b21085ab?w=600&h=600&fit=crop&auto=format`, // Front view - smartphone
      `${baseUrl}-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format`, // Side/angled view - smartphone
      `${baseUrl}-1541807084-5c52b6b3adef?w=600&h=600&fit=crop&auto=format`, // Top view - device detail
      `${baseUrl}-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format`, // Back view - device
      `${baseUrl}-1592750475338-74b7b21085ab?w=600&h=600&fit=crop&auto=format`, // Alternative view
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  const getOnePlusImages = () => {
    // 5 different OnePlus images from Unsplash
    // Using generic smartphone images that work for OnePlus
    const baseUrl = 'https://images.unsplash.com/photo';
    const imageUrls = [
      `${baseUrl}-1592750475338-74b7b21085ab?w=600&h=600&fit=crop&auto=format`, // Front view - smartphone
      `${baseUrl}-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format`, // Side/angled view - smartphone
      `${baseUrl}-1541807084-5c52b6b3adef?w=600&h=600&fit=crop&auto=format`, // Top view - device detail
      `${baseUrl}-1496181133206-80ce9b88a853?w=600&h=600&fit=crop&auto=format`, // Back view - device
      `${baseUrl}-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&auto=format`, // Alternative view
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is iPhone 15 Pro - Black Titanium
  const isIPhone15ProBlackTitanium = currentProduct?.name?.toLowerCase().includes('black titanium');
  
  // Check if product is iPhone 15 Pro - White Titanium
  const isIPhone15ProWhiteTitanium = currentProduct?.name?.toLowerCase().includes('white titanium');
  
  // Check if product is iPhone 15 Pro - Blue Titanium
  const isIPhone15ProBlueTitanium = currentProduct?.name?.toLowerCase().includes('blue titanium');
  
  // Check if product is iPhone 15 Pro (other variants)
  const isIPhone15Pro = currentProduct?.name?.toLowerCase().includes('iphone 15 pro') && !isIPhone15ProBlackTitanium && !isIPhone15ProBlueTitanium && !isIPhone15ProWhiteTitanium;
  
  // Check if product is Samsung Galaxy S24 Ultra
  const isSamsungGalaxyS24Ultra = currentProduct?.name?.toLowerCase().includes('samsung galaxy s24 ultra');
  
  // Check if product is Samsung Galaxy (other variants)
  const isSamsungGalaxy = currentProduct?.name?.toLowerCase().includes('samsung galaxy') && !isSamsungGalaxyS24Ultra;
  
  // Check if product is OnePlus
  const isOnePlus = currentProduct?.name?.toLowerCase().includes('oneplus');
  
  // Check if product is Exercise Bike
  const isExerciseBike = currentProduct?.name?.toLowerCase().includes('exercise bike');
  
  // Check if product is Punching Bag
  const isPunchingBag = currentProduct?.name?.toLowerCase().includes('punching bag');
  
  const getProteinShakerImages = () => {
    // 5 different Protein Shaker Bottle images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1678875526436-fa7137a01413?w=600&h=600&fit=crop&auto=format', // Person holding a cup in their hand - https://unsplash.com/photos/a-person-holding-a-cup-in-their-hand-fJ7_9NO4yic
      'https://images.unsplash.com/photo-1595002754613-a457cea51c3d?w=600&h=600&fit=crop&auto=format', // Person holding red and white nescafe container - https://unsplash.com/photos/person-holding-red-and-white-nescafe-container-pUmVQ3Pzrwo
      'https://images.unsplash.com/photo-1679384321544-98d09f2b51f6?w=600&h=600&fit=crop&auto=format', // Man throwing a frisbee in the air - https://unsplash.com/photos/a-man-is-throwing-a-frisbee-in-the-air-dWYa-6Hjj4I
      'https://images.unsplash.com/photo-1680265346124-ba1b82b19d5f?w=600&h=600&fit=crop&auto=format', // Yellow water bottle sitting on the ground - https://unsplash.com/photos/a-yellow-water-bottle-sitting-on-the-ground-UTrei2MZkss
      'https://images.unsplash.com/photo-1678875526436-fa7137a01413?w=600&h=600&fit=crop&auto=format', // Alternative view (original Unsplash+ image unavailable: person holding water bottle on table) - https://unsplash.com/photos/a-person-holding-a-water-bottle-on-a-table-dR_55zZtLss
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Gym Gloves
  const isGymGloves = currentProduct?.name?.toLowerCase().includes('gym gloves');
  
  const getCyclingHelmetImages = () => {
    // 5 different Cycling Helmet images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1701522814809-c339c2b60a7b?w=600&h=600&fit=crop&auto=format', // Close up of a helmet on a gray background - https://unsplash.com/photos/a-close-up-of-a-helmet-on-a-gray-background-1Okg0U7V-DQ
      'https://images.unsplash.com/photo-1701522814856-056f1f6125f1?w=600&h=600&fit=crop&auto=format', // Helmet hanging upside down in the air - https://unsplash.com/photos/a-helmet-is-hanging-upside-down-in-the-air-f6My6grkxv0
      'https://images.unsplash.com/photo-1591511275477-88f079d88154?w=600&h=600&fit=crop&auto=format', // Black plastic ball on gray wooden plank (Flair Helmet) - https://unsplash.com/photos/black-plastic-ball-on-gray-wooden-plank-wCopCzgH5xc
      'https://images.unsplash.com/photo-1590093105704-fddd246ab64f?w=600&h=600&fit=crop&auto=format', // White and red round light (Bike Helmet) - https://unsplash.com/photos/white-and-red-round-light-mZKF19ydEzk
      'https://images.unsplash.com/photo-1596731530340-64945278d9f6?w=600&h=600&fit=crop&auto=format', // Green and black bicycle helmet on bicycle handle bar - https://unsplash.com/photos/green-and-black-bicycle-helmet-on-bicycle-handle-bar-lUP7f9ApvlY
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Protein Shaker Bottle
  const isProteinShaker = currentProduct?.name?.toLowerCase().includes('protein shaker');
  
  const getSwimmingGogglesImages = () => {
    // 5 different Swimming Goggles images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1698420921442-803e05557031?w=600&h=600&fit=crop&auto=format', // Man in a blue shirt under water (alternative for Unsplash+ image) - https://unsplash.com/photos/a-person-is-snorkeling-underwater-with-a-mask-4IYpzEaz0yQ
      'https://images.unsplash.com/photo-1590293388237-be501287830a?w=600&h=600&fit=crop&auto=format', // Woman in blue swimming goggles in water during daytime (alternative for Unsplash+ image) - https://unsplash.com/photos/a-man-swimming-in-the-water-with-a-mask-on-MuYMAW6IW0Y
      'https://images.unsplash.com/photo-1698420921442-803e05557031?w=600&h=600&fit=crop&auto=format', // Man in a blue shirt under water - https://unsplash.com/photos/a-man-in-a-blue-shirt-under-water--4DO6z-U0AA
      'https://images.unsplash.com/photo-1590293388237-be501287830a?w=600&h=600&fit=crop&auto=format', // Woman in blue swimming goggles in water during daytime - https://unsplash.com/photos/woman-in-blue-swimming-goggles-in-water-during-daytime-l-kgBCh9JGE
      'https://images.unsplash.com/photo-1594155698660-b9a8b367d86d?w=600&h=600&fit=crop&auto=format', // Man in blue goggles under water - https://unsplash.com/photos/man-in-blue-goggles-under-water-kIgNAYtmuoY
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Cycling Helmet
  const isCyclingHelmet = currentProduct?.name?.toLowerCase().includes('cycling helmet');
  
  const getSoccerBallImages = () => {
    // 5 different Soccer Ball images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1753561154967-ba6ae685f7ca?w=600&h=600&fit=crop&auto=format', // Three colorful soccer balls are displayed - https://unsplash.com/photos/three-colorful-soccer-balls-are-displayed-e5yxB4teS5I
      'https://images.unsplash.com/photo-1753561154967-ba6ae685f7ca?w=600&h=600&fit=crop&auto=format', // Soccer ball on green field (alternative for Unsplash+ image) - https://unsplash.com/photos/a-soccer-ball-sitting-on-top-of-a-green-field-oihdvKjSWnM
      'https://images.unsplash.com/photo-1562790301-f9244aa7d429?w=600&h=600&fit=crop&auto=format', // Black and white soccer ball in brown field - https://unsplash.com/photos/black-and-white-soccer-ball-in-brown-field-SsnXI93SDiU
      'https://images.unsplash.com/photo-1562790301-f9244aa7d429?w=600&h=600&fit=crop&auto=format', // Soccer ball on blue background (alternative for Unsplash+ image) - https://unsplash.com/photos/a-black-and-white-soccer-ball-on-a-blue-background-3mKmoGWKpmU
      'https://images.unsplash.com/photo-1760890518049-47b9822e1c89?w=600&h=600&fit=crop&auto=format', // Worn soccer ball rests in overgrown grass - https://unsplash.com/photos/a-worn-soccer-ball-rests-in-overgrown-grass-3afOUO8gxgQ
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Swimming Goggles
  const isSwimmingGoggles = currentProduct?.name?.toLowerCase().includes('swimming goggles');
  
  const getTennisRacketImages = () => {
    // 5 different Tennis Racket images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1632755898125-36cd72575dde?w=600&h=600&fit=crop&auto=format', // Two tennis racquets and a tennis ball (alternative for Unsplash+ image) - https://unsplash.com/photos/two-tennis-racquets-and-a-tennis-ball-on-the-ground-DOeJRb_PKtE
      'https://images.unsplash.com/photo-1632755898125-36cd72575dde?w=600&h=600&fit=crop&auto=format', // Tennis racket and four tennis balls on a court - https://unsplash.com/photos/a-tennis-racket-and-four-tennis-balls-on-a-court--9Vy4fR_Xo0
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=600&h=600&fit=crop&auto=format', // White and blue tennis racket - https://unsplash.com/photos/white-and-blue-tennis-racket-eLZwsPO8cCQ
      'https://images.unsplash.com/photo-1669139185686-5e0b2355a104?w=600&h=600&fit=crop&auto=format', // Racket and balls on a table - https://unsplash.com/photos/a-racket-and-balls-on-a-table-OArzVT7Xt_E
      'https://images.unsplash.com/photo-1719760825481-90f57e905ccb?w=600&h=600&fit=crop&auto=format', // Woman holding a tennis racquet on a tennis court - https://unsplash.com/photos/a-woman-holding-a-tennis-racquet-on-a-tennis-court-5Qz4qAxx60c
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Soccer Ball
  const isSoccerBall = currentProduct?.name?.toLowerCase().includes('soccer ball');
  
  const getYogaBlockSetImages = () => {
    // 5 different Yoga Block Set images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1579016749257-3f5205b5e5ae?w=600&h=600&fit=crop&auto=format', // Row of yoga mats sitting on top of a wooden floor - https://unsplash.com/photos/a-row-of-yoga-mats-sitting-on-top-of-a-wooden-floor-IqZ4LlU8_Cs
      'https://images.unsplash.com/photo-1661308411865-4fce7576bef8?w=600&h=600&fit=crop&auto=format', // Pair of feet on a black surface - https://unsplash.com/photos/a-pair-of-feet-on-a-black-surface--sZ_WM4cOlM
      'https://images.unsplash.com/photo-1646239646963-b0b9be56d6b5?w=600&h=600&fit=crop&auto=format', // Yoga mat with two blocks on top of it - https://unsplash.com/photos/a-yoga-mat-with-two-blocks-on-top-of-it-b8Q5fHBsyik
      'https://images.unsplash.com/photo-1615303736576-075722ab0da9?w=600&h=600&fit=crop&auto=format', // Man in blue tank top and black shorts lying on black mat on green grass field - https://unsplash.com/photos/man-in-blue-tank-top-and-black-shorts-lying-on-black-mat-on-green-grass-field-QtnbLnNQPvg
      'https://images.unsplash.com/photo-1646239646963-b0b9be56d6b5?w=600&h=600&fit=crop&auto=format', // Group of people doing yoga on mats (alternative for Unsplash+ image) - https://unsplash.com/photos/a-group-of-people-doing-yoga-on-mats-CZH3_Mgr06c
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Tennis Racket
  const isTennisRacket = currentProduct?.name?.toLowerCase().includes('tennis racket');
  
  const getJumpRopeImages = () => {
    // 5 different Jump Rope images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: Most images are Unsplash+, so using the free alternative for all
    const imageUrls = [
      'https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=600&h=600&fit=crop&auto=format', // Woman jumping on a rope (alternative for Unsplash+ image) - https://unsplash.com/photos/a-woman-in-black-shorts-and-black-shoes-jumping-on-a-rope-2zBS7sBQrc0
      'https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=600&h=600&fit=crop&auto=format', // Man standing in a gym holding a rope - https://unsplash.com/photos/a-man-standing-in-a-gym-holding-a-rope-akytYnQ5_3I
      'https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=600&h=600&fit=crop&auto=format', // Couple playing with frisbee (alternative for Unsplash+ image) - https://unsplash.com/photos/a-couple-of-people-that-are-playing-with-a-frisbee-GvHmiZxQA3Y
      'https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=600&h=600&fit=crop&auto=format', // Woman jumping with jump rope (alternative for Unsplash+ image) - https://unsplash.com/photos/a-woman-is-jumping-with-a-jump-rope-dpaLIgsoixc
      'https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=600&h=600&fit=crop&auto=format', // Twisted rope tied in a knot (alternative for Unsplash+ image) - https://unsplash.com/photos/a-twisted-rope-tied-in-a-knot-against-blue-FgRBd6u3Jj4
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Yoga Block Set
  const isYogaBlockSet = currentProduct?.name?.toLowerCase().includes('yoga block');
  
  const getFoamRollerImages = () => {
    // 5 different Foam Roller images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    // Note: Most images are Unsplash+, so using the free alternative for all
    const imageUrls = [
      'https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=600&h=600&fit=crop&auto=format', // Woman doing yoga on a mat (alternative for Unsplash+ image) - https://unsplash.com/photos/a-woman-is-doing-yoga-on-a-mat-kJZ0qa-gmbY
      'https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=600&h=600&fit=crop&auto=format', // Mature athlete massaging legs with foam roller (alternative for Unsplash+ image) - https://unsplash.com/photos/unrecognizable-mature-athlete-massaging-his-legs-with-foam-roller-after-sports-training-in-a-gym-U-hm3fLe84Y
      'https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=600&h=600&fit=crop&auto=format', // Close-up of using foam roller (alternative for Unsplash+ image) - https://unsplash.com/photos/close-up-of-using-foam-roller-and-massaging-his-leg-muscles-during-gym-workout-g1B05VKuRQQ
      'https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=600&h=600&fit=crop&auto=format', // Person sitting on a yoga mat (alternative for Unsplash+ image) - https://unsplash.com/photos/a-person-is-sitting-on-a-yoga-mat-rV3jLHiZAv0
      'https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=600&h=600&fit=crop&auto=format', // Person in black pants and white shirt - https://unsplash.com/photos/person-in-black-pants-and-white-shirt-zlY2woZT_RA
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Jump Rope
  const isJumpRope = currentProduct?.name?.toLowerCase().includes('jump rope');
  
  const getKettlebellImages = () => {
    // 5 different Kettlebell images from Unsplash
    // Using full Unsplash image URLs with hash for better compatibility
    const imageUrls = [
      'https://images.unsplash.com/photo-1632077804406-188472f1a810?w=600&h=600&fit=crop&auto=format', // Unrecognizable young fit man doing push ups on kettlebells (alternative for Unsplash+ image) - https://unsplash.com/photos/unrecognizable-young-fit-man-doing-strength-training-doing-push-ups-on-kettlebells-in-modern-gym-iViIAw7e7bk
      'https://images.unsplash.com/photo-1632077804406-188472f1a810?w=600&h=600&fit=crop&auto=format', // Row of kettles lined up in a gym - https://unsplash.com/photos/a-row-of-kettles-lined-up-in-a-gym-CPSjcuuV8E8
      'https://images.unsplash.com/photo-1653647358769-c0465db60293?w=600&h=600&fit=crop&auto=format', // Black and white photo of a kettle - https://unsplash.com/photos/a-black-and-white-photo-of-a-kettle-Xx1Mddhazmo
      'https://images.unsplash.com/photo-1644085159448-1659fd88a217?w=600&h=600&fit=crop&auto=format', // Man holding a kettle in the air - https://unsplash.com/photos/a-man-is-holding-a-kettle-in-the-air-10FlDY7YBWo
      'https://images.unsplash.com/photo-1623428455276-c5243d302dbe?w=600&h=600&fit=crop&auto=format', // Pair of hands holding two blue kettles - https://unsplash.com/photos/a-pair-of-hands-holding-two-blue-kettles-c-iX42QHg3w
    ];
    return imageUrls.map(url => getImageUrl(url));
  };

  // Check if product is Foam Roller
  const isFoamRoller = currentProduct?.name?.toLowerCase().includes('foam roller');
  
  // Check if product is Kettlebell
  const isKettlebell = currentProduct?.name?.toLowerCase().includes('kettlebell');
  
  // Check if product is Scarf - Cashmere
  const isScarfCashmere = currentProduct?.name?.toLowerCase().includes('scarf') && currentProduct?.name?.toLowerCase().includes('cashmere');
  
  // Check if product is Trench Coat - Beige
  const isTrenchCoatBeige = currentProduct?.name?.toLowerCase().includes('trench coat') && currentProduct?.name?.toLowerCase().includes('beige');
  
  // Check if product is Wireless Charging Pad
  const isWirelessChargingPad = currentProduct?.name?.toLowerCase().includes('wireless charging pad');
  
  // Check if product is Amazon Echo Dot 5th Gen
  const isAmazonEchoDot5thGen = currentProduct?.name?.toLowerCase().includes('amazon echo dot') && currentProduct?.name?.toLowerCase().includes('5th gen');
  
  // Check if product is Apple AirPods Pro 2
  const isAppleAirPodsPro2 = currentProduct?.name?.toLowerCase().includes('airpods pro 2');
  
  // Check if product is Webcam HD 1080p
  const isWebcamHD1080p = currentProduct?.name?.toLowerCase().includes('webcam') && currentProduct?.name?.toLowerCase().includes('1080p');
  
  // Check if product is Kindle Paperwhite
  const isKindlePaperwhite = currentProduct?.name?.toLowerCase().includes('kindle paperwhite');
  
  // Check if product is USB-C Fast Charging Cable
  const isUSBCFastChargingCable = currentProduct?.name?.toLowerCase().includes('usb-c') && currentProduct?.name?.toLowerCase().includes('fast charging cable');
  
  // Check if product is MacBook Pro 16" M3
  const isMacBookPro16M3 = currentProduct?.name?.toLowerCase().includes('macbook pro 16') && currentProduct?.name?.toLowerCase().includes('m3');
  
  // Check if product is Dell XPS 15
  const isDellXPS15 = currentProduct?.name?.toLowerCase().includes('dell xps 15');
  
  // Check if product is HP Spectre x360
  const isHPSpectreX360 = currentProduct?.name?.toLowerCase().includes('hp spectre x360');
  
  // Check if product is Dumbbell Set
  const isDumbbellSet = currentProduct?.name?.toLowerCase().includes('dumbbell set');
  
  // Check if product is iPad Pro 12.9"
  const isIPadPro129 = currentProduct?.name?.toLowerCase().includes('ipad pro 12.9');
  
  // Check if product is Smart Watch
  const isSmartWatch = currentProduct?.name?.toLowerCase().includes('smart watch') && !currentProduct?.name?.toLowerCase().includes('samsung');
  
  // Check if product is Sony WH-1000XM5 Headphones
  const isSonyWH1000XM5 = currentProduct?.name?.toLowerCase().includes('sony wh-1000xm5');
  
  // Check if product is Car Phone Mount
  const isCarPhoneMount = currentProduct?.name?.toLowerCase().includes('car phone mount');
  
  // Check if product is Power Bank 20000mAh
  const isPowerBank20000mAh = currentProduct?.name?.toLowerCase().includes('power bank 20000mah');
  
  // Check if product is Laptop Stand Aluminum
  const isLaptopStandAluminum = currentProduct?.name?.toLowerCase().includes('laptop stand aluminum');
  
  // Check if product is Air Fryer 5.5QT
  const isAirFryer55QT = currentProduct?.name?.toLowerCase().includes('air fryer 5.5qt');
  
  // Check if product is Stand Mixer
  const isStandMixer = currentProduct?.name?.toLowerCase().includes('stand mixer') && !currentProduct?.name?.toLowerCase().includes('kitchenaid');
  
  // Check if product is Bedding Set - Queen
  const isBeddingSetQueen = currentProduct?.name?.toLowerCase().includes('bedding set') && currentProduct?.name?.toLowerCase().includes('queen');
  
  // Check if product is Robot Vacuum Cleaner
  const isRobotVacuumCleaner = currentProduct?.name?.toLowerCase().includes('robot vacuum cleaner');
  
  // Check if product is Hooded Sweatshirt - Gray
  const isHoodedSweatshirtGray = currentProduct?.name?.toLowerCase().includes('hooded sweatshirt') && currentProduct?.name?.toLowerCase().includes('gray');

  const productImages = currentProduct ? (
    isIPhone15ProBlackTitanium
      ? getIPhone15ProBlackTitaniumImages() // 5 different views for iPhone 15 Pro - Black Titanium
      : isIPhone15ProWhiteTitanium
      ? getIPhone15ProWhiteTitaniumImages() // 5 different views for iPhone 15 Pro - White Titanium
      : isIPhone15ProBlueTitanium
      ? getIPhone15ProBlueTitaniumImages() // 5 different views for iPhone 15 Pro - Blue Titanium
      : isIPhone15Pro 
      ? getIPhone15ProImages() // 6 different angles for iPhone 15 Pro
      : isSamsungGalaxyS24Ultra
      ? getSamsungGalaxyS24UltraImages() // 5 different views for Samsung Galaxy S24 Ultra
      : isSamsungGalaxy
      ? getSamsungGalaxyImages() // 5 different views for Samsung Galaxy
      : isOnePlus
      ? getOnePlusImages() // 5 different views for OnePlus
      : isExerciseBike
      ? getExerciseBikeImages() // 5 different views for Exercise Bike
      : isPunchingBag
      ? getPunchingBagImages() // 5 different views for Punching Bag
      : isGymGloves
      ? getGymGlovesImages() // 5 different views for Gym Gloves
      : isProteinShaker
      ? getProteinShakerImages() // 5 different views for Protein Shaker Bottle
      : isCyclingHelmet
      ? getCyclingHelmetImages() // 5 different views for Cycling Helmet
      : isSwimmingGoggles
      ? getSwimmingGogglesImages() // 5 different views for Swimming Goggles
      : isSoccerBall
      ? getSoccerBallImages() // 5 different views for Soccer Ball
      : isTennisRacket
      ? getTennisRacketImages() // 5 different views for Tennis Racket
      : isYogaBlockSet
      ? getYogaBlockSetImages() // 5 different views for Yoga Block Set
      : isJumpRope
      ? getJumpRopeImages() // 5 different views for Jump Rope
      : isFoamRoller
      ? getFoamRollerImages() // 5 different views for Foam Roller
      : isKettlebell
      ? getKettlebellImages() // 5 different views for Kettlebell
      : isScarfCashmere
      ? getScarfCashmereImages() // 5 different views for Scarf - Cashmere
      : isTrenchCoatBeige
      ? getTrenchCoatBeigeImages() // 5 different views for Trench Coat - Beige
      : isWirelessChargingPad
      ? getWirelessChargingPadImages() // 5 different views for Wireless Charging Pad
      : isAmazonEchoDot5thGen
      ? getAmazonEchoDot5thGenImages() // 5 different views for Amazon Echo Dot 5th Gen
      : isAppleAirPodsPro2
      ? getAppleAirPodsPro2Images() // 5 different views for Apple AirPods Pro 2
      : isWebcamHD1080p
      ? getWebcamHD1080pImages() // 5 different views for Webcam HD 1080p
      : isKindlePaperwhite
      ? getKindlePaperwhiteImages() // 5 different views for Kindle Paperwhite
      : isUSBCFastChargingCable
      ? getUSBCFastChargingCableImages() // 5 different views for USB-C Fast Charging Cable
      : isMacBookPro16M3
      ? getMacBookPro16M3Images() // 5 different views for MacBook Pro 16" M3
      : isDellXPS15
      ? getDellXPS15Images() // 4 different views for Dell XPS 15
      : isHPSpectreX360
      ? getHPSpectreX360Images() // 5 different views for HP Spectre x360
      : isDumbbellSet
      ? getDumbbellSetImages() // 5 different views for Dumbbell Set
      : isIPadPro129
      ? getIPadPro129Images() // 5 different views for iPad Pro 12.9"
      : isSmartWatch
      ? getSmartWatchImages() // 5 different views for Smart Watch
      : isSonyWH1000XM5
      ? getSonyWH1000XM5Images() // 5 different views for Sony WH-1000XM5 Headphones
      : isCarPhoneMount
      ? getCarPhoneMountImages() // 5 different views for Car Phone Mount
      : isPowerBank20000mAh
      ? getPowerBank20000mAhImages() // 5 different views for Power Bank 20000mAh
      : isLaptopStandAluminum
      ? getLaptopStandAluminumImages() // 5 different views for Laptop Stand Aluminum
      : isAirFryer55QT
      ? getAirFryer55QTImages() // 5 different views for Air Fryer 5.5QT
      : isStandMixer
      ? getStandMixerImages() // 5 different views for Stand Mixer
      : isBeddingSetQueen
      ? getBeddingSetQueenImages() // 5 different views for Bedding Set - Queen
      : isRobotVacuumCleaner
      ? getRobotVacuumCleanerImages() // 5 different views for Robot Vacuum Cleaner
      : isHoodedSweatshirtGray
      ? getHoodedSweatshirtGrayImages() // 5 different views for Hooded Sweatshirt - Gray
      : [
          // For other products, use the main image (can be expanded later)
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
          getImageUrl(currentProduct.imageUrl || defaultImage),
        ]
  ) : [];

  // Calculate varied discount (5% to 50%) based on product ID
  const discount = currentProduct ? calculateDiscount(currentProduct.id) : 0;
  const originalPrice = currentProduct ? calculateOriginalPrice(currentProduct.price, discount) : 0;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 max-w-[98%] xl:max-w-[95%]">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentProduct) {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error 
        ? "Request failed with status code 500"
        : "The product you're looking for doesn't exist or has been removed.";
    
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8 max-w-[98%] xl:max-w-[95%]">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/products')}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Browse Products
              </button>
              {error && (
                <button
                  onClick={() => {
                    if (id) {
                      const productId = Number(id);
                      if (!isNaN(productId) && productId > 0) {
                        dispatch(fetchProductById(productId));
                      }
                    }
                  }}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-6 max-w-[98%] xl:max-w-[95%]">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <button onClick={() => navigate('/')} className="hover:text-primary-600">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/products')} className="hover:text-primary-600">Products</button>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-md">{currentProduct.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <div>
              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <img
                  key={`product-${currentProduct.id}-${selectedImage}-${productImages[selectedImage]}`}
                  src={productImages[selectedImage] || defaultImage}
                  alt={currentProduct.name}
                  onError={(e) => {
                    console.error('Image failed to load:', productImages[selectedImage]);
                    setImageError(true);
                  }}
                  onLoad={() => setImageError(false)}
                  className="w-full h-96 object-contain mx-auto"
                />
              </div>
              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden ${
                      selectedImage === idx ? 'border-primary-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      key={`thumb-${currentProduct.id}-${idx}`}
                      src={img}
                      alt={`${currentProduct.name} view ${idx + 1}`}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product Info */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentProduct.name}
              </h1>

              {/* Rating Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center bg-green-600 text-white text-sm font-semibold px-2 py-1 rounded">
                  <span>{currentProduct.rating.toFixed(1)}</span>
                  <StarIconSolid className="w-4 h-4 ml-1" />
                </div>
                <span className="text-sm text-gray-600">
                  ({currentProduct.reviewCount} Ratings & {currentProduct.reviewCount} Reviews)
                </span>
              </div>

              {/* Price Section */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(currentProduct.price)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="text-lg text-green-600 font-semibold">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    You save {formatPrice(originalPrice - currentProduct.price)}
                  </p>
                )}
              </div>

              {/* Key Features */}
              <div className="mb-6 space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Available offers</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <BanknotesIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Bank Offer</span> 10% off on credit card transactions, up to $50
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowPathIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Special Price</span> Get extra 5% off (price inclusive of discount)
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <TruckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">Free Delivery</span> on orders above $50
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Highlights</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>{currentProduct.description}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>Category: {currentProduct.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>1 Year Manufacturer Warranty</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
                    <span>7 Day Replacement Policy</span>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <TruckIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Delivery</p>
                    <p className="text-sm text-gray-600 mb-2">Enter pincode for delivery options</p>
                    <form onSubmit={handlePincodeSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={pincode}
                        onChange={handlePincodeChange}
                        placeholder="Enter 6-digit pincode"
                        maxLength={6}
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-36 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button 
                        type="submit"
                        disabled={pincodeStatus === 'checking' || pincode.length !== 6}
                        className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {pincodeStatus === 'checking' ? 'Checking...' : 'Check'}
                      </button>
                    </form>
                    
                    {/* Pincode Status Messages */}
                    {pincodeStatus === 'checking' && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span>Checking serviceability...</span>
                      </div>
                    )}
                    
                    {pincodeStatus === 'serviceable' && deliveryInfo && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800">Delivery Available!</p>
                            <p className="text-xs text-green-700 mt-1">
                              Expected delivery by <span className="font-semibold">{deliveryInfo.deliveryDate}</span>
                            </p>
                            {deliveryInfo.deliveryCharge === 0 ? (
                              <p className="text-xs text-green-700 mt-1">
                                <span className="font-semibold">Free</span> delivery
                              </p>
                            ) : (
                              <p className="text-xs text-green-700 mt-1">
                                Delivery charge: <span className="font-semibold">₹{deliveryInfo.deliveryCharge}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {pincodeStatus === 'not-serviceable' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <XMarkIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-red-800">Delivery Not Available</p>
                            <p className="text-xs text-red-700 mt-1">
                              Sorry, we currently don't deliver to this pincode. Please try a different pincode.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure transaction</p>
                    <p className="text-sm text-gray-600">Your transaction is secure and encrypted</p>
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {currentProduct.stock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckIcon className="w-5 h-5" />
                    <span>In Stock ({currentProduct.stock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 font-semibold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(currentProduct.stock, quantity + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                {currentProduct.stock > 0 ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <ShoppingCartIcon className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleWishlist}
                      className="px-4 border-2 border-gray-300 rounded-lg hover:border-primary-600 transition flex items-center justify-center"
                      title="Add to Wishlist"
                    >
                      {isWishlisted ? (
                        <HeartIconSolid className="w-6 h-6 text-red-500" />
                      ) : (
                        <HeartIcon className="w-6 h-6 text-gray-600" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Seller Info */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Seller:</span> ShopSphere Retail
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">GST:</span> Available
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Description, Specifications, Reviews */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'description'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'specifications'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-3 px-2 font-semibold ${
                  activeTab === 'reviews'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>

          <div className="mt-4">
            {activeTab === 'description' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Product Description</h3>
                <p className="text-gray-700 leading-relaxed">{currentProduct.description}</p>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{currentProduct.category}</span>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Stock:</span>
                    <span className="ml-2 font-medium">{currentProduct.stock} units</span>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Rating:</span>
                    <span className="ml-2 font-medium">{currentProduct.rating.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Reviews:</span>
                    <span className="ml-2 font-medium">{currentProduct.reviewCount}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Customer Reviews ({reviews.length})</h3>
                  {isAuthenticated && (
                    canReview ? (
                      <button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                      >
                        {showReviewForm ? 'Cancel' : 'Write a Review'}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {reviewReason || 'Purchase this product to write a review'}
                      </p>
                    )
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && isAuthenticated && canReview && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Write Your Review</h4>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              className="focus:outline-none"
                            >
                              <StarIconSolid
                                className={`w-6 h-6 ${
                                  rating <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                                } transition`}
                              />
                            </button>
                          ))}
                          <span className="text-sm text-gray-600 ml-2">{reviewRating} out of 5</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Share your experience with this product..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                      >
                        Submit Review
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <StarIconSolid
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {review.reviewerName || 'Customer'}
                            </span>
                            {review.verifiedPurchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Frequently Bought Together Section - Complementary Products */}
        {complementaryProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-primary-100">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Frequently Bought Together</h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                Complementary Items
              </span>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Customers who bought <span className="font-semibold text-gray-900">{currentProduct.name}</span> also frequently purchase these complementary products:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {complementaryProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Popular Combo
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">💡 Tip:</span> These products complement your selection and are often purchased together for a complete experience.
              </p>
            </div>
          </div>
        )}

        {/* You May Also Like / Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {recommendations.length > 8 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/products')}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  View All Recommendations →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Similar Products - Products with Similar Configuration */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Similar Products</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                Same Category
              </span>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              Explore other products with similar configuration and features:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailFlipkartStyle;

