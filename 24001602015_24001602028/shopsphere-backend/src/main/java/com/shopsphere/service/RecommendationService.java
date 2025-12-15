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
    // Temporarily disable cache to ensure fresh recommendations
    // @Cacheable(value = "mlRecommendations", key = "#productId")
    public List<Product> getRecommendations(Long productId) {
        // Verify product exists
        Product currentProduct = productRepository.findById(productId).orElse(null);
        if (currentProduct == null) {
            throw new RuntimeException("Product not found");
        }
        
        String currentCategory = currentProduct.getCategory() != null 
            ? currentProduct.getCategory().trim().toLowerCase() 
            : "";
        
        // Initialize models if empty
        if (coOccurrenceMatrix.isEmpty()) {
            buildCoOccurrenceMatrix();
        }
        if (similarityMatrix.isEmpty()) {
            buildSimilarityMatrix();
        }
        
        // Helper method to check if two categories match (handles variations like "mens-shirts" and "clothing")
        java.util.function.Function<String, Boolean> isSameCategory = (String cat) -> {
            if (cat == null || currentCategory.isEmpty()) return false;
            String normalizedCat = cat.trim().toLowerCase();
            String normalizedCurrent = currentCategory.trim().toLowerCase();
            
            // Exact match
            if (normalizedCat.equals(normalizedCurrent)) return true;
            
            // Handle variations: "mens-shirts", "mens-shoes", "mens-watches" all match "clothing"
            if ((normalizedCurrent.contains("mens-") || normalizedCurrent.contains("clothing")) &&
                (normalizedCat.contains("mens-") || normalizedCat.contains("clothing"))) {
                return true;
            }
            
            // Handle "clothing" matching any clothing subcategory
            if (normalizedCurrent.equals("clothing") && 
                (normalizedCat.contains("shirt") || normalizedCat.contains("shoe") || 
                 normalizedCat.contains("watch") || normalizedCat.contains("pant") ||
                 normalizedCat.contains("jeans") || normalizedCat.contains("dress") ||
                 normalizedCat.contains("mens-"))) {
                return true;
            }
            
            // Handle reverse: clothing subcategories match "clothing"
            if (normalizedCurrent.contains("mens-") && normalizedCat.equals("clothing")) {
                return true;
            }
            
            return false;
        };
        
        // Helper method to check if category is related (e.g., clothing-related)
        java.util.function.Function<String, Boolean> isRelatedCategory = (String cat) -> {
            if (cat == null || currentCategory.isEmpty()) return false;
            String normalizedCat = cat.trim().toLowerCase();
            String normalizedCurrent = currentCategory.trim().toLowerCase();
            
            // If current is clothing-related, related categories are clothing, accessories (but NOT kitchen-accessories)
            if (normalizedCurrent.contains("mens-") || normalizedCurrent.contains("clothing")) {
                return (normalizedCat.contains("clothing") || normalizedCat.contains("mens-")) || 
                       (normalizedCat.equals("accessories") && !normalizedCat.contains("kitchen"));
            }
            
            // If current is electronics, related are electronics, accessories (but NOT kitchen-accessories)
            if (normalizedCurrent.contains("electronics")) {
                return normalizedCat.contains("electronics") || 
                       (normalizedCat.equals("accessories") && !normalizedCat.contains("kitchen"));
            }
            
            // If current is beauty, related are beauty, accessories (but NOT kitchen-accessories)
            if (normalizedCurrent.contains("beauty")) {
                return normalizedCat.contains("beauty") || 
                       (normalizedCat.equals("accessories") && !normalizedCat.contains("kitchen"));
            }
            
            // If current is home & kitchen, related are home & kitchen, kitchen-accessories
            if (normalizedCurrent.contains("home") || normalizedCurrent.contains("kitchen")) {
                return normalizedCat.contains("home") || normalizedCat.contains("kitchen");
            }
            
            // If current is sports, related are sports, clothing, accessories (but NOT kitchen-accessories)
            if (normalizedCurrent.contains("sports")) {
                return normalizedCat.contains("sports") || normalizedCat.contains("clothing") || 
                       (normalizedCat.equals("accessories") && !normalizedCat.contains("kitchen"));
            }
            
            return false;
        };
        
        // Combine scores from different ML approaches, but only for same/related category products
        Map<Long, Double> recommendationScores = new HashMap<>();
        
        // 1. Collaborative Filtering (50% weight) - Based on co-occurrence
        Map<Long, Double> coOccurrences = coOccurrenceMatrix.getOrDefault(productId, new HashMap<>());
        for (Map.Entry<Long, Double> entry : coOccurrences.entrySet()) {
            if (entry.getValue() >= MIN_SUPPORT) {
                Product p = productRepository.findById(entry.getKey()).orElse(null);
                if (p != null && !currentCategory.isEmpty()) {
                    String cat = p.getCategory() != null ? p.getCategory() : "";
                    // Only include if same or related category
                    if (isSameCategory.apply(cat) || isRelatedCategory.apply(cat)) {
                        recommendationScores.merge(entry.getKey(), entry.getValue() * 0.5, Double::sum);
                    }
                } else if (p != null && currentCategory.isEmpty()) {
                    // If no category, include all
                recommendationScores.merge(entry.getKey(), entry.getValue() * 0.5, Double::sum);
                }
            }
        }
        
        // 2. Content-Based Filtering (30% weight) - Similar products
        Map<Long, Double> similarities = similarityMatrix.getOrDefault(productId, new HashMap<>());
        for (Map.Entry<Long, Double> entry : similarities.entrySet()) {
            Product p = productRepository.findById(entry.getKey()).orElse(null);
            if (p != null && !currentCategory.isEmpty()) {
                String cat = p.getCategory() != null ? p.getCategory() : "";
                // Only include if same or related category
                if (isSameCategory.apply(cat) || isRelatedCategory.apply(cat)) {
                    recommendationScores.merge(entry.getKey(), entry.getValue() * 0.3, Double::sum);
                }
            } else if (p != null && currentCategory.isEmpty()) {
                // If no category, include all
            recommendationScores.merge(entry.getKey(), entry.getValue() * 0.3, Double::sum);
            }
        }
        
        // 3. Association Rules (20% weight) - Find complementary products
        Map<Long, Double> associations = findAssociationRules(productId);
        for (Map.Entry<Long, Double> entry : associations.entrySet()) {
            Product p = productRepository.findById(entry.getKey()).orElse(null);
            if (p != null && !currentCategory.isEmpty()) {
                String cat = p.getCategory() != null ? p.getCategory() : "";
                // Only include if same or related category
                if (isSameCategory.apply(cat) || isRelatedCategory.apply(cat)) {
                    recommendationScores.merge(entry.getKey(), entry.getValue() * 0.2, Double::sum);
                }
            } else if (p != null && currentCategory.isEmpty()) {
                // If no category, include all
            recommendationScores.merge(entry.getKey(), entry.getValue() * 0.2, Double::sum);
            }
        }
        
        // STRICT APPROACH: Show ONLY exact same-category products, exclude exact same product, limit to top 4
        // Also exclude products with similar names (e.g., if viewing a watch, don't show other watches)
        if (!currentCategory.isEmpty()) {
            // Get all products in the EXACT same category (excluding the current product)
            List<Product> allProducts = productRepository.findAll();
            
            // Extract key words from current product name to identify product type
            String currentProductName = currentProduct.getName() != null ? currentProduct.getName().toLowerCase() : "";
            String[] currentNameWords = currentProductName.split("\\s+");
            java.util.Set<String> currentProductTypeWords = new java.util.HashSet<>();
            for (String word : currentNameWords) {
                if (word.length() > 3) { // Only meaningful words
                    currentProductTypeWords.add(word);
                }
            }
            
            List<Product> sameCategoryProducts = allProducts.stream()
                .filter(p -> {
                    // Exclude the exact same product
                    if (p.getId().equals(productId)) {
                        return false;
                    }
                    // Only include products with stock
                    if (p.getStock() == null || p.getStock() <= 0) {
                        return false;
                    }
                    // STRICT: Only include exact same category (case-insensitive)
                    String cat = p.getCategory() != null ? p.getCategory().trim() : "";
                    String normalizedCat = cat.toLowerCase();
                    String normalizedCurrent = currentCategory.toLowerCase();
                    
                    // Exact category match only - no special cases, no related categories
                    if (!normalizedCat.equals(normalizedCurrent)) {
                        return false;
                    }
                    
                    // Exclude products with similar names (e.g., if viewing "watch", don't show other "watch" products)
                    String productName = p.getName() != null ? p.getName().toLowerCase() : "";
                    
                    // Check for common product type keywords that indicate same product type
                    String[] productTypeKeywords = {"watch", "shirt", "shoe", "sneaker", "sneakers", "boot", "boots", 
                                                     "jordan", "cleat", "cleats", "trainer", "trainers",
                                                     "jacket", "dress", "jeans", "pant", "pants", 
                                                     "phone", "iphone", "samsung", "laptop", "tablet",
                                                     "earbud", "earbuds", "headphone", "headphones", 
                                                     "mouse", "keyboard", "monitor", "tv", "television", 
                                                     "camera", "speaker", "charger", "cable"};
                    
                    // Check if both products contain the same product type keyword
                    for (String keyword : productTypeKeywords) {
                        boolean currentHasKeyword = currentProductName.contains(keyword);
                        boolean productHasKeyword = productName.contains(keyword);
                        
                        // If both have the same keyword, they're likely the same product type - exclude
                        if (currentHasKeyword && productHasKeyword) {
                            return false;
                        }
                    }
                    
                    // Special case: Watch brands (Rolex, Longines, etc.) - if both are watch brands, exclude
                    String[] watchBrands = {"rolex", "longines", "omega", "tag heuer", "breitling", "patek", "audemars"};
                    boolean currentIsWatchBrand = false;
                    boolean productIsWatchBrand = false;
                    for (String brand : watchBrands) {
                        if (currentProductName.contains(brand)) {
                            currentIsWatchBrand = true;
                        }
                        if (productName.contains(brand)) {
                            productIsWatchBrand = true;
                        }
                    }
                    // If both are watch brands, they're both watches - exclude
                    if (currentIsWatchBrand && productIsWatchBrand) {
                        return false;
                    }
                    
                    // Special case: if one has "jordan" and the other has "sneaker"/"shoe", they're both shoes
                    if ((currentProductName.contains("jordan") && (productName.contains("sneaker") || productName.contains("shoe") || productName.contains("cleat") || productName.contains("trainer"))) ||
                        (productName.contains("jordan") && (currentProductName.contains("sneaker") || currentProductName.contains("shoe") || currentProductName.contains("cleat") || currentProductName.contains("trainer")))) {
                        return false;
                    }
                    
                    // Also check for matching significant words (fallback)
                    String[] productNameWords = productName.split("\\s+");
                    long matchingWords = java.util.Arrays.stream(productNameWords)
                        .filter(word -> word.length() > 3 && currentProductTypeWords.contains(word))
                        .count();
                    
                    // If more than 2 matching words, it's likely the same product type
                    if (matchingWords > 2) {
                        return false;
                    }
                    
                    return true;
                })
                .sorted((p1, p2) -> {
                    // First, prioritize products with ML scores (if available)
                    Double score1 = recommendationScores.get(p1.getId());
                    Double score2 = recommendationScores.get(p2.getId());
                    
                    if (score1 != null && score2 != null) {
                        return Double.compare(score2, score1); // Higher score first
                    }
                    if (score1 != null) return -1; // Products with scores first
                    if (score2 != null) return 1;
                    
                    // Then, prioritize products similar to the current product (based on name/description keywords)
                    String currentNameForSort = currentProduct.getName() != null ? currentProduct.getName().toLowerCase() : "";
                    String currentDesc = currentProduct.getDescription() != null ? currentProduct.getDescription().toLowerCase() : "";
                    String p1Name = p1.getName() != null ? p1.getName().toLowerCase() : "";
                    String p1Desc = p1.getDescription() != null ? p1.getDescription().toLowerCase() : "";
                    String p2Name = p2.getName() != null ? p2.getName().toLowerCase() : "";
                    String p2Desc = p2.getDescription() != null ? p2.getDescription().toLowerCase() : "";
                    
                    // Extract keywords from current product
                    String[] currentKeywords = (currentNameForSort + " " + currentDesc).split("\\s+");
                    java.util.Set<String> currentKeywordSet = new java.util.HashSet<>();
                    for (String kw : currentKeywords) {
                        if (kw.length() > 3) { // Only meaningful words
                            currentKeywordSet.add(kw);
                        }
                    }
                    
                    // Count matching keywords
                    long p1Matches = java.util.Arrays.stream((p1Name + " " + p1Desc).split("\\s+"))
                        .filter(kw -> kw.length() > 3 && currentKeywordSet.contains(kw))
                        .count();
                    long p2Matches = java.util.Arrays.stream((p2Name + " " + p2Desc).split("\\s+"))
                        .filter(kw -> kw.length() > 3 && currentKeywordSet.contains(kw))
                        .count();
                    
                    if (p1Matches != p2Matches) {
                        return Long.compare(p2Matches, p1Matches); // More matches first
                    }
                    
                    // Then sort by popularity (rating * reviewCount)
                    double popularity1 = (p1.getRating() != null ? p1.getRating() : 0) * (p1.getReviewCount() != null ? p1.getReviewCount() : 0);
                    double popularity2 = (p2.getRating() != null ? p2.getRating() : 0) * (p2.getReviewCount() != null ? p2.getReviewCount() : 0);
                    return Double.compare(popularity2, popularity1);
                })
                .limit(4) // STRICT LIMIT: Only top 4 products
            .collect(Collectors.toList());
            
            // Return top 4 same-category products only
            return sameCategoryProducts;
        }
        
        // If no category, return empty list
        return new ArrayList<>();
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
     * Get frequently bought together products - STRICT: Only same-category products
     * Returns top 4 products from the exact same category (excluding the current product)
     */
    // @Cacheable(value = "mlFrequentlyBoughtTogether", key = "#productId") // Disabled cache for testing
    public List<Product> getFrequentlyBoughtTogether(Long productId) {
        Product currentProduct = productRepository.findById(productId).orElse(null);
        if (currentProduct == null) {
            return new ArrayList<>();
        }
        
        String currentCategory = currentProduct.getCategory() != null 
            ? currentProduct.getCategory().trim().toLowerCase() 
            : "";
        
        if (currentCategory.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Build co-occurrence matrix if empty (for ML scores)
        if (coOccurrenceMatrix.isEmpty()) {
            buildCoOccurrenceMatrix();
        }
        
        // Get ML scores for same-category products only
        Map<Long, Double> mlScores = new HashMap<>();
        Map<Long, Double> coOccurrences = coOccurrenceMatrix.getOrDefault(productId, new HashMap<>());
        for (Map.Entry<Long, Double> entry : coOccurrences.entrySet()) {
            if (entry.getValue() >= MIN_SUPPORT) {
                Product p = productRepository.findById(entry.getKey()).orElse(null);
                if (p != null) {
                    String cat = p.getCategory() != null ? p.getCategory().trim().toLowerCase() : "";
                    // Only include exact same category
                    if (cat.equals(currentCategory)) {
                        mlScores.put(entry.getKey(), entry.getValue());
                    }
                }
            }
        }
        
        List<Product> allProducts = productRepository.findAll();
        
        // STRICT: Get ONLY same-category products (exact match, no related categories)
        // Also exclude products with similar names (e.g., if viewing a watch, don't show other watches)
        final String finalCurrentCategory = currentCategory;
        final Map<Long, Double> finalMlScores = mlScores;
        
        // Extract key words from current product name to identify product type
        String currentProductName = currentProduct.getName() != null ? currentProduct.getName().toLowerCase() : "";
        String[] currentNameWords = currentProductName.split("\\s+");
        java.util.Set<String> currentProductTypeWords = new java.util.HashSet<>();
        for (String word : currentNameWords) {
            if (word.length() > 3) { // Only meaningful words
                currentProductTypeWords.add(word);
            }
        }
        
        List<Product> sameCategoryProducts = allProducts.stream()
            .filter(Objects::nonNull)
            .filter(p -> {
                // Exclude the exact same product
                if (p.getId().equals(productId)) {
                    return false;
                }
                // Only include products with stock
                if (p.getStock() == null || p.getStock() <= 0) {
                    return false;
                }
                // STRICT: Only exact same category (case-insensitive)
                String cat = p.getCategory() != null ? p.getCategory().trim().toLowerCase() : "";
                if (!cat.equals(finalCurrentCategory)) {
                    return false;
                }
                
                // Exclude products with similar names (e.g., if viewing "watch", don't show other "watch" products)
                String productName = p.getName() != null ? p.getName().toLowerCase() : "";
                
                // Check for common product type keywords that indicate same product type
                String[] productTypeKeywords = {"watch", "shirt", "shoe", "sneaker", "sneakers", "boot", "boots", 
                                                 "jordan", "cleat", "cleats", "trainer", "trainers",
                                                 "jacket", "dress", "jeans", "pant", "pants", 
                                                 "phone", "iphone", "samsung", "laptop", "tablet",
                                                 "earbud", "earbuds", "headphone", "headphones", 
                                                 "mouse", "keyboard", "monitor", "tv", "television", 
                                                 "camera", "speaker", "charger", "cable"};
                
                // Check if both products contain the same product type keyword
                for (String keyword : productTypeKeywords) {
                    boolean currentHasKeyword = currentProductName.contains(keyword);
                    boolean productHasKeyword = productName.contains(keyword);
                    
                    // If both have the same keyword, they're likely the same product type - exclude
                    if (currentHasKeyword && productHasKeyword) {
                        return false;
                    }
                }
                
                // Special case: Watch brands (Rolex, Longines, etc.) - if both are watch brands, exclude
                String[] watchBrands = {"rolex", "longines", "omega", "tag heuer", "breitling", "patek", "audemars"};
                boolean currentIsWatchBrand = false;
                boolean productIsWatchBrand = false;
                for (String brand : watchBrands) {
                    if (currentProductName.contains(brand)) {
                        currentIsWatchBrand = true;
                    }
                    if (productName.contains(brand)) {
                        productIsWatchBrand = true;
                    }
                }
                // If both are watch brands, they're both watches - exclude
                if (currentIsWatchBrand && productIsWatchBrand) {
                    return false;
                }
                
                // Special case: if one has "jordan" and the other has "sneaker"/"shoe", they're both shoes
                if ((currentProductName.contains("jordan") && (productName.contains("sneaker") || productName.contains("shoe") || productName.contains("cleat") || productName.contains("trainer"))) ||
                    (productName.contains("jordan") && (currentProductName.contains("sneaker") || currentProductName.contains("shoe") || currentProductName.contains("cleat") || currentProductName.contains("trainer")))) {
                    return false;
                }
                
                // Also check for matching significant words (fallback)
                String[] productNameWords = productName.split("\\s+");
                long matchingWords = java.util.Arrays.stream(productNameWords)
                    .filter(word -> word.length() > 3 && currentProductTypeWords.contains(word))
                    .count();
                
                // If more than 2 matching words, it's likely the same product type
                if (matchingWords > 2) {
                    return false;
                }
                
                return true;
            })
            .sorted((p1, p2) -> {
                // First, prioritize products with ML scores (if available)
                Double score1 = finalMlScores.get(p1.getId());
                Double score2 = finalMlScores.get(p2.getId());
                
                if (score1 != null && score2 != null) {
                    return Double.compare(score2, score1); // Higher score first
                }
                if (score1 != null) return -1; // Products with scores first
                if (score2 != null) return 1;
                
                // Then sort by popularity (rating * reviewCount)
                double popularity1 = (p1.getRating() != null ? p1.getRating() : 0) * (p1.getReviewCount() != null ? p1.getReviewCount() : 0);
                double popularity2 = (p2.getRating() != null ? p2.getRating() : 0) * (p2.getReviewCount() != null ? p2.getReviewCount() : 0);
                return Double.compare(popularity2, popularity1);
            })
            .limit(4) // STRICT LIMIT: Only top 4 products
            .collect(Collectors.toList());
        
        // Return top 4 same-category products only
        return sameCategoryProducts;
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
