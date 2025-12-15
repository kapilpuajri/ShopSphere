package com.shopsphere.config;

import com.shopsphere.model.Product;
import com.shopsphere.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Migrates product categories on application startup:
 * - mens-shoes -> Clothing
 * - mens-shirts -> Clothing
 * - mens-watches -> Clothing (moved from Accessories)
 * - All watches -> Clothing
 * - Food items from Home & Kitchen -> Groceries
 */
@Component
@Order(1) // Run early, before other seeders
public class CategoryMigrationService implements CommandLineRunner {

    @Autowired
    private ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            List<Product> allProducts = productRepository.findAll();
            int updatedCount = 0;
            int watchesMoved = 0;
            int foodItemsMoved = 0;

            // Keywords that indicate food/grocery items (not kitchen appliances)
            String[] foodKeywords = {"apple", "apples", "beef", "chicken", "egg", "eggs", "milk", "rice", "potato", 
                                     "potatoes", "onion", "onions", "lemon", "lemons", "cucumber", "pepper", 
                                     "honey", "ice cream", "juice", "water", "strawberry", 
                                     "strawberries", "kiwi", "mulberry", "soft drink", "soft drinks", 
                                     "tissue", "cat food", "dog food", "fish", "cooking oil", "protein powder",
                                     "grocer", "food", "meat", "steak", "vegetable", "fruit", "nescafe"};
            
            // Keywords that indicate kitchen appliances (should stay in Home & Kitchen)
            String[] applianceKeywords = {"maker", "mixer", "fryer", "vacuum", "cookware", "mattress", 
                                          "bedding", "sofa", "bed", "chair", "table", "lamp", "decoration",
                                          "furniture", "swing", "frame", "plant", "pot", "sink", "mirror"};

            for (Product product : allProducts) {
                String category = product.getCategory();
                if (category == null) continue;

                String normalizedCategory = category.trim().toLowerCase();
                String productName = product.getName() != null ? product.getName().toLowerCase() : "";
                boolean updated = false;

                // Migrate mens-shoes and mens-shirts to Clothing
                if (normalizedCategory.equals("mens-shoes") || normalizedCategory.equals("mens-shirts")) {
                    product.setCategory("Clothing");
                    updated = true;
                }
                // Migrate all watches to Clothing (from Accessories or mens-watches)
                // Also migrate specific Rolex and Longines watches by name
                else if (normalizedCategory.equals("mens-watches") || 
                        (normalizedCategory.equals("accessories") && productName.contains("watch")) ||
                        productName.contains("longines master collection") ||
                        productName.contains("rolex cellini date black dial") ||
                        productName.contains("rolex cellini moonphase") ||
                        productName.contains("rolex datejust")) {
                    product.setCategory("Clothing");
                    updated = true;
                    watchesMoved++;
                }
                // Check if product in Groceries is actually an appliance (should be in Home & Kitchen)
                else if (normalizedCategory.equals("groceries")) {
                    boolean isAppliance = false;
                    for (String keyword : applianceKeywords) {
                        if (productName.contains(keyword)) {
                            isAppliance = true;
                            break;
                        }
                    }
                    if (isAppliance) {
                        product.setCategory("Home & Kitchen");
                        updated = true;
                    }
                }
                // Migrate food items from Home & Kitchen to Groceries
                // First check for specific food items (like Potatoes) before checking appliances
                else if (productName.contains("potato") || productName.contains("potatoes")) {
                    if (!normalizedCategory.equals("groceries")) {
                        product.setCategory("Groceries");
                        updated = true;
                        foodItemsMoved++;
                    }
                }
                else if (normalizedCategory.equals("home & kitchen") || normalizedCategory.equals("home and kitchen")) {
                    // First check if it's a kitchen appliance (should stay in Home & Kitchen)
                    // But exclude "pot" keyword if the product is actually "potatoes" (food item)
                    boolean isAppliance = false;
                    if (!productName.contains("potato")) { // Don't treat potatoes as appliance
                        for (String keyword : applianceKeywords) {
                            if (productName.contains(keyword)) {
                                isAppliance = true;
                                break;
                            }
                        }
                    }
                    
                    // Only move to Groceries if it's a food item AND not an appliance
                    if (!isAppliance) {
                        boolean isFoodItem = false;
                        for (String keyword : foodKeywords) {
                            if (productName.contains(keyword)) {
                                isFoodItem = true;
                                break;
                            }
                        }
                        
                        if (isFoodItem) {
                            product.setCategory("Groceries");
                            updated = true;
                            foodItemsMoved++;
                        }
                    }
                }

                if (updated) {
                    productRepository.save(product);
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                System.out.println("✅ Category migration completed! Updated " + updatedCount + " products:");
                System.out.println("   - mens-shoes -> Clothing");
                System.out.println("   - mens-shirts -> Clothing");
                System.out.println("   - All watches -> Clothing (" + watchesMoved + " watches moved)");
                System.out.println("   - Food items -> Groceries (" + foodItemsMoved + " items moved)");
            } else {
                System.out.println("✅ Category migration: No products needed updating");
            }
        } catch (Exception e) {
            System.err.println("❌ Category migration failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

