/**
 * Currency formatting utilities
 */

/**
 * Format price in Indian Rupees (INR)
 * @param price - Price value
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

/**
 * Calculate a varied discount percentage based on product ID
 * This ensures each product gets a consistent but varied discount (5% to 50%)
 * @param productId - Product ID to generate consistent discount
 * @returns Discount percentage between 5 and 50
 */
export const calculateDiscount = (productId: number): number => {
  // Use product ID to generate a consistent discount for each product
  // This ensures the same product always shows the same discount
  const hash = productId % 46; // 46 possible values (5 to 50)
  return hash + 5; // Returns 5 to 50
};

/**
 * Calculate original price based on current price and discount percentage
 * @param currentPrice - Current discounted price
 * @param discountPercent - Discount percentage
 * @returns Original price before discount
 */
export const calculateOriginalPrice = (currentPrice: number, discountPercent: number): number => {
  // originalPrice = currentPrice / (1 - discountPercent/100)
  return currentPrice / (1 - discountPercent / 100);
};

