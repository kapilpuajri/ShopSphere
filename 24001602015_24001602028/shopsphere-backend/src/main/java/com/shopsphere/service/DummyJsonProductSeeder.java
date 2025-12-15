package com.shopsphere.service;

import com.shopsphere.model.Product;
import com.shopsphere.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Component
@Order(3) // Run after DataSeederService and ReviewSeederService
public class DummyJsonProductSeeder implements CommandLineRunner {
    
    @Autowired
    private ProductRepository productRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String DUMMY_JSON_URL = "https://dummyjson.com/products?limit=100";
    
    @Override
    public void run(String... args) {
        try {
            System.out.println("Fetching products from DummyJSON API...");
            
            // Fetch products from DummyJSON API
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(DUMMY_JSON_URL, Map.class);
            
            if (response == null || !response.containsKey("products")) {
                System.out.println("No products found in DummyJSON API response");
                return;
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> products = (List<Map<String, Object>>) response.get("products");
            
            int addedCount = 0;
            int skippedCount = 0;
            
            for (Map<String, Object> productData : products) {
                try {
                    // Check if product has images
                    @SuppressWarnings("unchecked")
                    List<String> images = (List<String>) productData.get("images");
                    
                    if (images == null || images.isEmpty()) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Get the first image
                    String imageUrl = images.get(0);
                    if (imageUrl == null || imageUrl.trim().isEmpty()) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Extract product data
                    String title = (String) productData.get("title");
                    String description = (String) productData.get("description");
                    String category = (String) productData.get("category");
                    Double price = ((Number) productData.get("price")).doubleValue();
                    Double rating = productData.get("rating") != null ? 
                        ((Number) productData.get("rating")).doubleValue() : 0.0;
                    Integer stock = productData.get("stock") != null ? 
                        ((Number) productData.get("stock")).intValue() : 0;
                    
                    // Get review count from reviews array
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> reviews = (List<Map<String, Object>>) productData.get("reviews");
                    Integer reviewCount = (reviews != null) ? reviews.size() : 0;
                    
                    // Check if product already exists (by name)
                    if (productRepository.findByName(title).isPresent()) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Map category to our category names
                    String mappedCategory = mapCategory(category);
                    
                    // Convert price to INR (assuming USD, multiply by ~83)
                    BigDecimal priceInINR = new BigDecimal(price * 83);
                    
                    // Create and save product
                    Product product = new Product();
                    product.setName(title);
                    product.setDescription(description != null ? description : "No description available");
                    product.setPrice(priceInINR);
                    product.setImageUrl(imageUrl);
                    product.setCategory(mappedCategory);
                    product.setStock(stock);
                    product.setRating(rating);
                    product.setReviewCount(reviewCount);
                    
                    productRepository.save(product);
                    addedCount++;
                    
                } catch (Exception e) {
                    System.err.println("Error processing product: " + e.getMessage());
                    skippedCount++;
                }
            }
            
            System.out.println("DummyJSON products seeding completed! Added: " + addedCount + ", Skipped: " + skippedCount);
            
        } catch (Exception e) {
            System.err.println("Error fetching products from DummyJSON: " + e.getMessage());
            e.printStackTrace();
            // Don't throw - allow app to continue starting
        }
    }
    
    private String mapCategory(String category) {
        if (category == null) {
            return "Other";
        }
        
        String lowerCategory = category.toLowerCase().replace("-", " ").replace("_", " ");
        
        // Map DummyJSON categories to our categories
        if (lowerCategory.contains("beauty") || lowerCategory.contains("cosmetic") || 
            lowerCategory.contains("fragrance") || lowerCategory.contains("perfume") ||
            lowerCategory.contains("skincare") || lowerCategory.contains("makeup")) {
            return "Beauty";
        } else if (lowerCategory.contains("grocer") || lowerCategory.contains("food")) {
            return "Groceries"; // Food items go to Groceries, not Home & Kitchen
        } else if (lowerCategory.contains("kitchen") || lowerCategory.contains("cooking")) {
            // Only kitchen accessories/appliances, not food
            return "Home & Kitchen";
        } else if (lowerCategory.contains("furniture") || lowerCategory.contains("home") ||
                   lowerCategory.contains("lighting") || lowerCategory.contains("decoration")) {
            return "Home & Kitchen";
        } else if (lowerCategory.contains("laptop") || lowerCategory.contains("smartphone") || 
                   lowerCategory.contains("tablet") || lowerCategory.contains("mobile") ||
                   lowerCategory.contains("phone") || lowerCategory.contains("computer")) {
            return "Electronics";
        } else if (lowerCategory.contains("watch")) {
            return "Clothing"; // Watches go to Clothing, not Accessories
        } else if (lowerCategory.contains("sunglass") || lowerCategory.contains("automotive") || 
                   lowerCategory.contains("motorcycle")) {
            return "Accessories";
        } else if (lowerCategory.contains("shirt") || lowerCategory.contains("clothing") ||
                   lowerCategory.contains("dress") || lowerCategory.contains("jacket") ||
                   lowerCategory.contains("pants") || lowerCategory.contains("jeans") ||
                   lowerCategory.contains("shoe") || lowerCategory.contains("boot")) {
            return "Clothing";
        } else if (lowerCategory.contains("sport") || lowerCategory.contains("fitness") ||
                   lowerCategory.contains("gym") || lowerCategory.contains("exercise")) {
            return "Sports";
        } else {
            // Default mapping - capitalize properly
            return capitalizeFirst(category.replace("-", " ").replace("_", " "));
        }
    }
    
    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) {
            return "Other";
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}

