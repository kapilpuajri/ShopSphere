# ML-Based Recommendation System

## Overview

The ShopSphere e-commerce platform now uses a **Machine Learning-based recommendation system** that intelligently suggests products to users based on multiple ML approaches.

## ML Approaches Implemented

### 1. **Collaborative Filtering** (50% weight)
- **How it works**: Analyzes order history to find products that are frequently bought together
- **Example**: If customers who buy "iPhone 15" also frequently buy "Phone Case" and "Data Cable", these will be recommended
- **Algorithm**: Co-occurrence matrix that tracks product pairs in orders
- **Data Source**: Historical order data from all users

### 2. **Content-Based Filtering** (30% weight)
- **How it works**: Recommends products similar to the current product based on features
- **Features considered**:
  - **Category** (40%): Products in the same category (e.g., "Electronics > Phones")
  - **Price Range** (30%): Products in similar price ranges
  - **Rating** (30%): Products with similar customer ratings
- **Example**: If viewing a "Samsung Phone", it will recommend other phones with similar price and rating

### 3. **Association Rule Mining** (20% weight)
- **How it works**: Uses Apriori-like algorithm to find strong association rules
- **Metrics**:
  - **Support**: Minimum 2% of orders must contain the product pair
  - **Confidence**: If product A is bought, product B is bought at least 30% of the time
- **Example**: "Phone → Phone Cover" rule with 45% confidence means 45% of phone buyers also buy phone covers

## How It Works

### Initialization
- ML models are built automatically on application startup
- Models refresh every hour to incorporate new order data
- Models also refresh immediately when new orders are placed

### Recommendation Process

When a user views a product (e.g., "iPhone 15"):

1. **Collaborative Filtering** analyzes:
   - Which products were bought together with "iPhone 15" in past orders
   - Calculates co-occurrence frequency

2. **Content-Based Filtering** finds:
   - Products in same category (Electronics > Phones)
   - Products with similar price range
   - Products with similar ratings

3. **Association Rules** identify:
   - Strong patterns like "Phone → Phone Cover" (high confidence)
   - Complementary products frequently bought together

4. **Score Combination**:
   - All three approaches contribute weighted scores
   - Products are ranked by combined score
   - Top 8 recommendations are returned

## Real-World Examples

### Example 1: Phone Purchase
**User views**: "iPhone 15 Pro"
**ML System recommends**:
- Phone Case (collaborative: high co-occurrence)
- Data Cable (association rule: 42% confidence)
- Screen Protector (content-based: same category)
- Wireless Charger (collaborative + content-based)

### Example 2: Clothing Purchase
**User views**: "Blue Denim Shirt"
**ML System recommends**:
- Matching Trousers (content-based: same category, complementary)
- Belt (association rule: frequently bought together)
- Shoes (collaborative: customers who buy shirts also buy shoes)

### Example 3: Cart Recommendations
**User has in cart**: ["Laptop", "Mouse"]
**ML System recommends**:
- Laptop Bag (high co-occurrence with laptop)
- Keyboard (frequently bought with laptop + mouse)
- USB Hub (association rule)

## Technical Details

### Data Structures
- **Co-occurrence Matrix**: `Map<Long, Map<Long, Double>>` - Product pairs and their frequency
- **Similarity Matrix**: `Map<Long, Map<Long, Double>>` - Product similarity scores
- **Association Rules**: Calculated on-demand from order history

### Performance Optimizations
- **Caching**: Recommendations cached in Redis for fast retrieval
- **Lazy Initialization**: Models built only when needed
- **Scheduled Refresh**: Models update hourly in background
- **Incremental Updates**: Models refresh when new orders are placed

### Configuration
- **MIN_SUPPORT**: 0.02 (2% of orders)
- **MIN_CONFIDENCE**: 0.30 (30% confidence threshold)
- **Recommendation Limit**: 8 products per request
- **Refresh Interval**: 1 hour (3600000 ms)

## API Endpoints

The ML recommendation system uses the same endpoints as before:

- `GET /api/products/{id}/recommendations` - Get ML-based recommendations
- `GET /api/products/{id}/frequently-bought-together` - Get frequently bought together items
- `GET /api/cart/{userId}/recommendations` - Get cart-based recommendations

## Benefits Over Rule-Based System

1. **Learns from Data**: Adapts to actual customer behavior
2. **No Manual Configuration**: No need to manually set product associations
3. **Improves Over Time**: Gets better as more orders are placed
4. **Handles Edge Cases**: Works even for new products using content-based filtering
5. **Multi-Factor Analysis**: Combines multiple signals for better accuracy

## Future Enhancements

Potential improvements:
- User-based collaborative filtering (personalized recommendations)
- Deep learning models for complex pattern recognition
- Real-time learning from user interactions
- A/B testing framework for recommendation algorithms
- Seasonal and trend-based recommendations

