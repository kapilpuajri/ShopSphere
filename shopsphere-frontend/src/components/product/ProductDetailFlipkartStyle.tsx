import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchProductById, fetchRecommendations, fetchFrequentlyBoughtTogether, fetchProducts } from '../../store/slices/productSlice';
import ProductList from './ProductList';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../../store/slices/wishlistSlice';
import { toast } from 'react-hot-toast';
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  CheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  ArrowPathIcon
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
  const userId = user?.id || 1;
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  
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
        // Check wishlist status if user is authenticated
        if (isAuthenticated && user) {
          dispatch(checkWishlistStatus(productId));
        }
        // Reset image error state when product changes
        setImageError(false);
        setSelectedImage(0);
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
  
  // Check if product is Samsung Galaxy
  const isSamsungGalaxy = currentProduct?.name?.toLowerCase().includes('samsung galaxy');
  
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

  const productImages = currentProduct ? (
    isIPhone15ProBlackTitanium
      ? getIPhone15ProBlackTitaniumImages() // 5 different views for iPhone 15 Pro - Black Titanium
      : isIPhone15ProWhiteTitanium
      ? getIPhone15ProWhiteTitaniumImages() // 5 different views for iPhone 15 Pro - White Titanium
      : isIPhone15ProBlueTitanium
      ? getIPhone15ProBlueTitaniumImages() // 5 different views for iPhone 15 Pro - Blue Titanium
      : isIPhone15Pro 
      ? getIPhone15ProImages() // 6 different angles for iPhone 15 Pro
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
        <div className="container mx-auto px-4 py-8">
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
        <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-6">
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
                  <div>
                    <p className="font-semibold text-gray-900">Delivery</p>
                    <p className="text-sm text-gray-600">Enter pincode for delivery options</p>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        className="px-3 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                      <button className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                        Check
                      </button>
                    </div>
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
                Reviews ({currentProduct.reviewCount})
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
                <h3 className="font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`w-4 h-4 ${i < currentProduct.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Customer {review}</span>
                        <span className="text-xs text-gray-500">Verified Purchase</span>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Great product! Highly recommended. {currentProduct.description}
                      </p>
                    </div>
                  ))}
                </div>
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

