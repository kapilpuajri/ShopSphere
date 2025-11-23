package com.shopsphere.service;

import com.shopsphere.model.Order;
import com.shopsphere.model.Product;
import com.shopsphere.model.ProductAssociation;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.ProductAssociationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * ML-Based Recommendation Service
 * 
 * Implements multiple ML approaches:
 * 1. Collaborative Filtering - Based on order history (items bought together)
 * 2. Content-Based Filtering - Based on product features (category, price, rating)
 * 3. Association Rule Mining - Finds patterns in purchase behavior
 */
@Service
@Transactional
public class RecommendationService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ProductAssociationRepository associationRepository;
    
    // In-memory cache for co-occurrence matrix (product -> product -> frequency)
    private Map<Long, Map<Long, Double>> coOccurrenceMatrix = new HashMap<>();
    
    // In-memory cache for product similarity scores
    private Map<Long, Map<Long, Double>> similarityMatrix = new HashMap<>();
    
    // Minimum support for association rules (products must appear together in at least 2% of orders)
    private static final double MIN_SUPPORT = 0.02;
    
    // Minimum confidence for association rules (if A is bought, B is bought 30% of the time)
    private static final double MIN_CONFIDENCE = 0.30;
    
    /**
     * Initialize ML models on startup and periodically refresh
     */
    @Scheduled(fixedRate = 3600000) // Refresh every hour
    public void initializeMLModels() {
        buildCoOccurrenceMatrix();
        buildSimilarityMatrix();
    }
    
    /**
     * Build co-occurrence matrix from order history
     * This captures which products are frequently bought together
     */
    private void buildCoOccurrenceMatrix() {
        coOccurrenceMatrix.clear();
        List<Order> orders = orderRepository.findAllWithOrderItems();
        
        if (orders.isEmpty()) {
            return;
        }
        
        int totalOrders = orders.size();
        
        // Count co-occurrences
        for (Order order : orders) {
            if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
                continue;
            }
            
            List<Long> productIds = order.getOrderItems().stream()
                .map(item -> item.getProduct().getId())
                .distinct()
                .collect(Collectors.toList());
            
            // Build co-occurrence pairs
            for (int i = 0; i < productIds.size(); i++) {
                Long productId1 = productIds.get(i);
                for (int j = i + 1; j < productIds.size(); j++) {
                    Long productId2 = productIds.get(j);
                    
                    // Add bidirectional co-occurrence
                    coOccurrenceMatrix.computeIfAbsent(productId1, k -> new HashMap<>())
                        .merge(productId2, 1.0, Double::sum);
                    coOccurrenceMatrix.computeIfAbsent(productId2, k -> new HashMap<>())
                        .merge(productId1, 1.0, Double::sum);
                }
            }
        }
        
        // Normalize by total orders (convert to support percentage)
        for (Map<Long, Double> coOccurrences : coOccurrenceMatrix.values()) {
            for (Long productId : new HashSet<>(coOccurrences.keySet())) {
                coOccurrences.put(productId, coOccurrences.get(productId) / totalOrders);
            }
        }
    }
    
    /**
     * Build product similarity matrix using content-based features
     * Similarity based on: category, price range, rating
     */
    private void buildSimilarityMatrix() {
        similarityMatrix.clear();
        List<Product> allProducts = productRepository.findAll();
        
        for (Product product1 : allProducts) {
            Map<Long, Double> similarities = new HashMap<>();
            for (Product product2 : allProducts) {
                if (!product1.getId().equals(product2.getId())) {
                    double similarity = calculateProductSimilarity(product1, product2);
                    if (similarity > 0.1) { // Only store meaningful similarities
                        similarities.put(product2.getId(), similarity);
                    }
                }
            }
            if (!similarities.isEmpty()) {
                similarityMatrix.put(product1.getId(), similarities);
            }
        }
    }
    
    /**
     * Calculate similarity between two products using content-based features
     */
    private double calculateProductSimilarity(Product p1, Product p2) {
        double similarity = 0.0;
        double weight = 0.0;
        
        // Category similarity (40% weight)
        if (p1.getCategory() != null && p2.getCategory() != null) {
            if (p1.getCategory().equalsIgnoreCase(p2.getCategory())) {
                similarity += 1.0 * 0.4;
            } else {
                // Partial match for subcategories (e.g., "Electronics > Phones" vs "Electronics > Accessories")
                String[] cat1 = p1.getCategory().split(">");
                String[] cat2 = p2.getCategory().split(">");
                if (cat1.length > 0 && cat2.length > 0 && cat1[0].trim().equalsIgnoreCase(cat2[0].trim())) {
                    similarity += 0.5 * 0.4;
                }
            }
            weight += 0.4;
        }
        
        // Price similarity (30% weight) - products in similar price ranges
        if (p1.getPrice() != null && p2.getPrice() != null) {
            BigDecimal price1 = p1.getPrice();
            BigDecimal price2 = p2.getPrice();
            BigDecimal avgPrice = price1.add(price2).divide(BigDecimal.valueOf(2));
            BigDecimal priceDiff = price1.subtract(price2).abs();
            
            if (avgPrice.compareTo(BigDecimal.ZERO) > 0) {
                double priceSimilarity = 1.0 - Math.min(1.0, priceDiff.divide(avgPrice, 2, java.math.RoundingMode.HALF_UP).doubleValue());
                similarity += priceSimilarity * 0.3;
            }
            weight += 0.3;
        }
        
        // Rating similarity (30% weight)
        if (p1.getRating() != null && p2.getRating() != null) {
            double ratingDiff = Math.abs(p1.getRating() - p2.getRating());
            double ratingSimilarity = 1.0 - Math.min(1.0, ratingDiff / 5.0); // Normalize by max rating (5.0)
            similarity += ratingSimilarity * 0.3;
            weight += 0.3;
        }
        
        return weight > 0 ? similarity / weight : 0.0;
    }
    
    /**
     * Get ML-based recommendations for a product
     * Combines collaborative filtering, content-based filtering, and association rules
     */
    @Cacheable(value = "mlRecommendations", key = "#productId")
    public List<Product> getRecommendations(Long productId) {
        // Verify product exists
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found");
        }
        
        // Initialize models if empty
        if (coOccurrenceMatrix.isEmpty()) {
            buildCoOccurrenceMatrix();
        }
        if (similarityMatrix.isEmpty()) {
            buildSimilarityMatrix();
        }
        
        // Combine scores from different ML approaches
        Map<Long, Double> recommendationScores = new HashMap<>();
        
        // 1. Collaborative Filtering (50% weight) - Based on co-occurrence
        Map<Long, Double> coOccurrences = coOccurrenceMatrix.getOrDefault(productId, new HashMap<>());
        for (Map.Entry<Long, Double> entry : coOccurrences.entrySet()) {
            if (entry.getValue() >= MIN_SUPPORT) {
                recommendationScores.merge(entry.getKey(), entry.getValue() * 0.5, Double::sum);
            }
        }
        
        // 2. Content-Based Filtering (30% weight) - Similar products
        Map<Long, Double> similarities = similarityMatrix.getOrDefault(productId, new HashMap<>());
        for (Map.Entry<Long, Double> entry : similarities.entrySet()) {
            recommendationScores.merge(entry.getKey(), entry.getValue() * 0.3, Double::sum);
        }
        
        // 3. Association Rules (20% weight) - Find complementary products
        Map<Long, Double> associations = findAssociationRules(productId);
        for (Map.Entry<Long, Double> entry : associations.entrySet()) {
            recommendationScores.merge(entry.getKey(), entry.getValue() * 0.2, Double::sum);
        }
        
        // Filter and rank recommendations
        return recommendationScores.entrySet().stream()
            .filter(entry -> {
                Product p = productRepository.findById(entry.getKey()).orElse(null);
                return p != null && p.getStock() > 0 && !p.getId().equals(productId);
            })
            .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
            .limit(8)
            .map(entry -> productRepository.findById(entry.getKey()).orElse(null))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }
    
    /**
     * Find association rules for a product (Apriori-like algorithm)
     * Returns products that are frequently bought together with high confidence
     */
    private Map<Long, Double> findAssociationRules(Long productId) {
        Map<Long, Double> rules = new HashMap<>();
        List<Order> orders = orderRepository.findAllWithOrderItems();
        
        if (orders.isEmpty()) {
            return rules;
        }
        
        // Count how many times productId appears in orders
        long productFrequency = orders.stream()
            .filter(order -> order.getOrderItems() != null)
            .filter(order -> order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct().getId().equals(productId)))
            .count();
        
        if (productFrequency == 0) {
            return rules;
        }
        
        // For each other product, calculate confidence: P(B|A) = P(A and B) / P(A)
        Map<Long, Long> productWithTargetCount = new HashMap<>();
        
        for (Order order : orders) {
            if (order.getOrderItems() == null) continue;
            
            boolean containsTarget = order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct().getId().equals(productId));
            
            if (containsTarget) {
                order.getOrderItems().stream()
                    .map(item -> item.getProduct().getId())
                    .filter(id -> !id.equals(productId))
                    .forEach(id -> productWithTargetCount.merge(id, 1L, Long::sum));
            }
        }
        
        // Calculate confidence scores
        for (Map.Entry<Long, Long> entry : productWithTargetCount.entrySet()) {
            double confidence = (double) entry.getValue() / productFrequency;
            if (confidence >= MIN_CONFIDENCE) {
                rules.put(entry.getKey(), confidence);
            }
        }
        
        return rules;
    }
    
    /**
     * Get frequently bought together products using ML
     * Returns complementary products that are DIFFERENT from similar products (different category/configuration)
     * Example: Phone -> Phone Cover, Data Cable (complementary, not similar phones)
     */
    @Cacheable(value = "mlFrequentlyBoughtTogether", key = "#productId")
    public List<Product> getFrequentlyBoughtTogether(Long productId) {
        Product currentProduct = productRepository.findById(productId).orElse(null);
        if (currentProduct == null) {
            return new ArrayList<>();
        }
        
        // Build co-occurrence matrix if empty
        if (coOccurrenceMatrix.isEmpty()) {
            buildCoOccurrenceMatrix();
        }
        
        // Define complementary category mappings
        // Categories that should show same-category items: clothing, beauty, home & kitchen, sports
        // These categories have products that naturally go together (e.g., mattress + bedding, t-shirt + jeans)
        Map<String, List<String>> complementaryCategories = new HashMap<>();
        complementaryCategories.put("electronics", Arrays.asList("accessories")); // Electronics show accessories
        complementaryCategories.put("clothing", Arrays.asList("clothing", "accessories")); // Allow same-category for clothing
        complementaryCategories.put("home & kitchen", Arrays.asList("home & kitchen", "accessories")); // Allow same-category for home & kitchen
        complementaryCategories.put("sports", Arrays.asList("sports", "accessories", "clothing")); // Allow same-category for sports
        complementaryCategories.put("beauty", Arrays.asList("beauty", "accessories")); // Allow same-category for beauty
        complementaryCategories.put("accessories", Arrays.asList("electronics", "clothing")); // Accessories show electronics/clothing
        
        String currentCategory = currentProduct.getCategory() != null 
            ? currentProduct.getCategory().trim().toLowerCase() 
            : "";
        
        // Categories that should show same-category items (products that naturally go together)
        boolean allowSameCategory = "clothing".equals(currentCategory) || 
                                   "beauty".equals(currentCategory) || 
                                   "home & kitchen".equals(currentCategory) || 
                                   "sports".equals(currentCategory);
        
        List<String> preferredCategories = complementaryCategories.getOrDefault(currentCategory, 
            Arrays.asList("accessories")); // Default to accessories if no mapping
        
        List<Product> allProducts = productRepository.findAll();
        
        // First, check for explicit product associations (highest priority)
        List<ProductAssociation> associations = associationRepository.findTopAssociationsByProductId(productId);
        if (!associations.isEmpty()) {
            // For beauty/clothing, prioritize same-category associations
            if (allowSameCategory) {
                List<Product> sameCategoryAssociations = associations.stream()
                    .filter(assoc -> assoc.getAssociatedProduct() != null)
                    .filter(assoc -> assoc.getType() == ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER || 
                                    assoc.getType() == ProductAssociation.AssociationType.COMPLEMENTARY)
                    .filter(assoc -> {
                        Product p = assoc.getAssociatedProduct();
                        return p.getStock() != null && p.getStock() > 0 && !p.getId().equals(productId);
                    })
                    .filter(assoc -> {
                        Product p = assoc.getAssociatedProduct();
                        if (p.getCategory() != null && !currentCategory.isEmpty()) {
                            return p.getCategory().trim().toLowerCase().equals(currentCategory);
                        }
                        return false;
                    })
                    .sorted((a1, a2) -> Double.compare(
                        a2.getAssociationStrength() != null ? a2.getAssociationStrength() : 0.0,
                        a1.getAssociationStrength() != null ? a1.getAssociationStrength() : 0.0))
                    .limit(6)
                    .map(ProductAssociation::getAssociatedProduct)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
                
                if (sameCategoryAssociations.size() >= 3) {
                    return sameCategoryAssociations;
                }
            }
            
            // Otherwise, get all associations (for non-beauty/clothing, or if not enough same-category)
            List<Product> fromAssociations = associations.stream()
                .filter(assoc -> assoc.getAssociatedProduct() != null)
                .filter(assoc -> assoc.getType() == ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER || 
                                assoc.getType() == ProductAssociation.AssociationType.COMPLEMENTARY)
                .filter(assoc -> {
                    Product p = assoc.getAssociatedProduct();
                    return p.getStock() != null && p.getStock() > 0 && !p.getId().equals(productId);
                })
                .filter(assoc -> {
                    // For clothing and beauty, allow same-category items
                    // For other categories, apply category filtering if needed
                    if (allowSameCategory) {
                        return true; // Allow all for clothing and beauty (we already checked same-category above)
                    }
                    Product p = assoc.getAssociatedProduct();
                    if (p.getCategory() != null && !currentCategory.isEmpty()) {
                        return !p.getCategory().trim().toLowerCase().equals(currentCategory);
                    }
                    return true;
                })
                .sorted((a1, a2) -> {
                    // For beauty/clothing, prioritize same-category
                    if (allowSameCategory) {
                        Product p1 = a1.getAssociatedProduct();
                        Product p2 = a2.getAssociatedProduct();
                        boolean p1SameCategory = p1 != null && p1.getCategory() != null && 
                                p1.getCategory().trim().toLowerCase().equals(currentCategory);
                        boolean p2SameCategory = p2 != null && p2.getCategory() != null && 
                                p2.getCategory().trim().toLowerCase().equals(currentCategory);
                        if (p1SameCategory != p2SameCategory) {
                            return p1SameCategory ? -1 : 1;
                        }
                    }
                    // Then by strength
                    return Double.compare(
                        a2.getAssociationStrength() != null ? a2.getAssociationStrength() : 0.0,
                        a1.getAssociationStrength() != null ? a1.getAssociationStrength() : 0.0);
                })
                .limit(6)
                .map(ProductAssociation::getAssociatedProduct)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            
            // For categories that allow same-category, only return if we have enough same-category items
            if (!fromAssociations.isEmpty()) {
                if (allowSameCategory) {
                    long sameCategoryCount = fromAssociations.stream()
                        .filter(p -> p.getCategory() != null && 
                                p.getCategory().trim().toLowerCase().equals(currentCategory))
                        .count();
                    // Only return if we have at least 3 same-category items
                    // Otherwise, skip associations and fall through to fallback which will prioritize same-category
                    if (sameCategoryCount >= 3) {
                        return fromAssociations;
                    }
                    // Don't return associations if we don't have enough same-category items
                    // Fall through to fallback which will find same-category products
                } else {
                    return fromAssociations;
                }
            }
        }
        
        // Second, try to get from co-occurrence matrix (ML-based)
        final boolean finalAllowSameCategory = allowSameCategory;
        final String finalCurrentCategoryForML = currentCategory;
        
        // For clothing and beauty, prioritize same-category items from ML
        if (finalAllowSameCategory) {
            List<Product> sameCategoryFromML = coOccurrenceMatrix.getOrDefault(productId, new HashMap<>()).entrySet().stream()
                .filter(entry -> entry.getValue() >= MIN_SUPPORT)
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                .map(entry -> productRepository.findById(entry.getKey()).orElse(null))
                .filter(Objects::nonNull)
                .filter(p -> p.getStock() != null && p.getStock() > 0)
                .filter(p -> !p.getId().equals(productId))
                .filter(p -> {
                    if (p.getCategory() != null && !finalCurrentCategoryForML.isEmpty()) {
                        return p.getCategory().trim().toLowerCase().equals(finalCurrentCategoryForML);
                    }
                    return false;
                })
                .limit(6)
                .collect(Collectors.toList());
            
            // If we have enough same-category items from ML, return them
            if (sameCategoryFromML.size() >= 3) {
                return sameCategoryFromML;
            }
        }
        
        // Otherwise, get all ML results (including complementary categories)
        List<Product> fromML = coOccurrenceMatrix.getOrDefault(productId, new HashMap<>()).entrySet().stream()
            .filter(entry -> entry.getValue() >= MIN_SUPPORT)
            .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
            .map(entry -> productRepository.findById(entry.getKey()).orElse(null))
            .filter(Objects::nonNull)
            .filter(p -> p.getStock() != null && p.getStock() > 0)
            .filter(p -> !p.getId().equals(productId))
            .filter(p -> {
                // For clothing and beauty, allow same-category items
                // For other categories, exclude same-category items
                if (p.getCategory() != null && !finalCurrentCategoryForML.isEmpty()) {
                    String productCategory = p.getCategory().trim().toLowerCase();
                    if (finalAllowSameCategory) {
                        // For clothing and beauty, prioritize same-category items
                        return productCategory.equals(finalCurrentCategoryForML) || 
                               preferredCategories.contains(productCategory);
                    } else {
                        // For other categories, exclude same-category items
                        return !productCategory.equals(finalCurrentCategoryForML);
                    }
                }
                return true;
            })
            .sorted((p1, p2) -> {
                // Prioritize same-category items
                if (finalAllowSameCategory) {
                    String cat1 = p1.getCategory() != null ? p1.getCategory().trim().toLowerCase() : "";
                    String cat2 = p2.getCategory() != null ? p2.getCategory().trim().toLowerCase() : "";
                    boolean p1SameCategory = cat1.equals(finalCurrentCategoryForML);
                    boolean p2SameCategory = cat2.equals(finalCurrentCategoryForML);
                    if (p1SameCategory != p2SameCategory) {
                        return p1SameCategory ? -1 : 1;
                    }
                }
                return 0;
            })
            .limit(6)
            .collect(Collectors.toList());
        
        // If we have ML results, check if they're appropriate
        // For categories that allow same-category, skip ML if it doesn't have same-category items
        if (!fromML.isEmpty()) {
            if (!finalAllowSameCategory) {
                // For categories that don't allow same-category, return ML results as-is
                return fromML;
            } else {
                // For categories that allow same-category, check if ML has same-category items
                long sameCategoryCount = fromML.stream()
                    .filter(p -> p.getCategory() != null && 
                            p.getCategory().trim().toLowerCase().equals(finalCurrentCategoryForML))
                    .count();
                // Only return ML if we have at least 3 same-category items
                // Otherwise, fall through to fallback which will prioritize same-category
                if (sameCategoryCount >= 3) {
                    return fromML;
                }
                // Fall through to fallback for better same-category prioritization
            }
        }
        
        // Fallback: Get products from complementary categories
        final String finalCurrentCategory = currentCategory;
        final List<String> finalPreferredCategories = preferredCategories;
        final boolean finalAllowSameCategoryFallback = allowSameCategory;
        
        // First, get same-category products if allowed
        List<Product> sameCategoryProducts = new ArrayList<>();
        if (finalAllowSameCategoryFallback) {
            sameCategoryProducts = allProducts.stream()
                .filter(Objects::nonNull)
                .filter(p -> p.getStock() != null && p.getStock() > 0)
                .filter(p -> !p.getId().equals(productId))
                .filter(p -> {
                    if (p.getCategory() != null && !finalCurrentCategory.isEmpty()) {
                        String productCategory = p.getCategory().trim().toLowerCase();
                        return productCategory.equals(finalCurrentCategory);
                    }
                    return false;
                })
                .sorted((p1, p2) -> {
                    // Sort by popularity
                    double score1 = (p1.getRating() != null ? p1.getRating() : 0) * (p1.getReviewCount() != null ? p1.getReviewCount() : 0);
                    double score2 = (p2.getRating() != null ? p2.getRating() : 0) * (p2.getReviewCount() != null ? p2.getReviewCount() : 0);
                    return Double.compare(score2, score1);
                })
                .limit(6)
                .collect(Collectors.toList());
            
            // For categories that allow same-category, return same-category products if we have any
            if (!sameCategoryProducts.isEmpty()) {
                return sameCategoryProducts.stream().limit(6).collect(Collectors.toList());
            }
        }
        
        // Otherwise, include complementary categories
        List<Product> frequentlyBought = allProducts.stream()
            .filter(Objects::nonNull)
            .filter(p -> p.getStock() != null && p.getStock() > 0)
            .filter(p -> !p.getId().equals(productId))
            .filter(p -> {
                if (p.getCategory() != null && !finalCurrentCategory.isEmpty()) {
                    String productCategory = p.getCategory().trim().toLowerCase();
                    if (finalAllowSameCategoryFallback) {
                        // For categories that allow same-category, prioritize same-category items
                        // Include same-category first, then complementary categories
                        return productCategory.equals(finalCurrentCategory) || 
                               finalPreferredCategories.contains(productCategory);
                    } else {
                        // For other categories, exclude same-category items
                        if (productCategory.equals(finalCurrentCategory)) {
                            return false;
                        }
                        // Prioritize preferred complementary categories
                        return finalPreferredCategories.contains(productCategory) || 
                               !productCategory.equals(finalCurrentCategory);
                    }
                }
                return true;
            })
            .sorted((p1, p2) -> {
                // Score products: for categories that allow same-category, prioritize same-category items first
                String cat1 = p1.getCategory() != null ? p1.getCategory().trim().toLowerCase() : "";
                String cat2 = p2.getCategory() != null ? p2.getCategory().trim().toLowerCase() : "";
                
                if (finalAllowSameCategoryFallback) {
                    // For categories that allow same-category: same-category items first, then preferred categories
                    boolean p1SameCategory = cat1.equals(finalCurrentCategory);
                    boolean p2SameCategory = cat2.equals(finalCurrentCategory);
                    
                    if (p1SameCategory != p2SameCategory) {
                        return p1SameCategory ? -1 : 1; // Same-category items first
                    }
                }
                
                boolean p1Preferred = finalPreferredCategories.contains(cat1);
                boolean p2Preferred = finalPreferredCategories.contains(cat2);
                
                if (p1Preferred != p2Preferred) {
                    return p1Preferred ? -1 : 1; // Preferred categories first
                }
                
                // Then sort by popularity
                double score1 = (p1.getRating() != null ? p1.getRating() : 0) * (p1.getReviewCount() != null ? p1.getReviewCount() : 0);
                double score2 = (p2.getRating() != null ? p2.getRating() : 0) * (p2.getReviewCount() != null ? p2.getReviewCount() : 0);
                return Double.compare(score2, score1);
            })
            .limit(6)
            .collect(Collectors.toList());
        
        // If we have same-category products and allow same-category, combine them with complementary
        if (finalAllowSameCategoryFallback && !sameCategoryProducts.isEmpty()) {
            // Combine same-category with complementary, prioritizing same-category
            List<Product> combined = new ArrayList<>(sameCategoryProducts);
            Set<Long> sameCategoryIds = sameCategoryProducts.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());
            
            // Add complementary products that aren't already in same-category list
            for (Product p : frequentlyBought) {
                if (!sameCategoryIds.contains(p.getId()) && combined.size() < 6) {
                    combined.add(p);
                }
            }
            return combined.stream().limit(6).collect(Collectors.toList());
        }
        
        return frequentlyBought;
    }
    
    /**
     * Get cart-based recommendations using ML
     * Analyzes all items in cart and finds products that complement the entire cart
     */
    public List<Product> getCartRecommendations(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        if (coOccurrenceMatrix.isEmpty()) {
            buildCoOccurrenceMatrix();
        }
        
        // Aggregate co-occurrence scores for all cart items
        Map<Long, Double> aggregatedScores = new HashMap<>();
        
        for (Long cartProductId : productIds) {
            Map<Long, Double> coOccurrences = coOccurrenceMatrix.getOrDefault(cartProductId, new HashMap<>());
            for (Map.Entry<Long, Double> entry : coOccurrences.entrySet()) {
                if (!productIds.contains(entry.getKey())) {
                    aggregatedScores.merge(entry.getKey(), entry.getValue(), Double::sum);
                }
            }
        }
        
        // Normalize by number of cart items
        int cartSize = productIds.size();
        aggregatedScores.replaceAll((k, v) -> v / cartSize);
        
        return aggregatedScores.entrySet().stream()
            .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
            .limit(5)
            .map(entry -> productRepository.findById(entry.getKey()).orElse(null))
            .filter(Objects::nonNull)
            .filter(p -> p.getStock() > 0)
            .collect(Collectors.toList());
    }
    
    /**
     * Clear cache when new orders are placed (to refresh recommendations)
     */
    @CacheEvict(value = {"mlRecommendations", "mlFrequentlyBoughtTogether"}, allEntries = true)
    public void evictCache() {
        // Cache eviction handled by annotation
    }
}
