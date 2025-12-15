package com.shopsphere.service;

import com.shopsphere.model.Product;
import com.shopsphere.model.ProductAssociation;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.ProductAssociationRepository;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.WishlistRepository;
import com.shopsphere.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeederService implements CommandLineRunner {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ProductAssociationRepository associationRepository;
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Override
    public void run(String... args) {
        try {
            // Check if products already exist
            long productCount = productRepository.count();
            if (productCount > 0) {
                System.out.println("Products already exist (" + productCount + "), skipping data seeding.");
                return;
            }
            
            // Clear existing data in correct order to avoid foreign key constraint violations
            // Delete cart items, wishlist, orders, and reviews first (they reference products)
            cartRepository.deleteAll();
            wishlistRepository.deleteAll();
            orderRepository.deleteAll();
            reviewRepository.deleteAll(); // Delete reviews before products
            // Then delete associations and products
            associationRepository.deleteAll();
            
            // Delete specific products by ID before clearing all
            List<Long> productsToDelete = List.of(6788L, 6807L, 6817L, 6905L, 7091L, 7092L, 7100L, 7260L);
            for (Long productId : productsToDelete) {
                try {
                    productRepository.findById(productId).ifPresent(product -> {
                        // Delete associations where this product is the main product
                        List<ProductAssociation> associations = associationRepository.findByProductId(productId);
                        associationRepository.deleteAll(associations);
                        
                        // Delete associations where this product is the associated product
                        List<ProductAssociation> reverseAssociations = associationRepository.findAll().stream()
                            .filter(pa -> pa.getAssociatedProduct() != null && pa.getAssociatedProduct().getId().equals(productId))
                            .collect(java.util.stream.Collectors.toList());
                        associationRepository.deleteAll(reverseAssociations);
                        
                        // Delete the product
                        productRepository.delete(product);
                        System.out.println("Deleted product with ID: " + productId);
                    });
                } catch (Exception e) {
                    // Product might not exist, continue
                    System.out.println("Product with ID " + productId + " not found or already deleted: " + e.getMessage());
                }
            }
            
            productRepository.deleteAll();
            seedProducts();
        } catch (Exception e) {
            System.err.println("Error during data seeding: " + e.getMessage());
            e.printStackTrace();
            // Don't throw - allow app to continue starting
        }
    }
    
    private void seedProducts() {
        List<Product> allProducts = new ArrayList<>();
        
        // ========== ELECTRONICS ==========
        // Smartphones - iPhone 15 Pro Variations
        allProducts.add(createProduct("iPhone 15 Pro - Natural Titanium", 
            "Latest iPhone with A17 Pro chip, 6.1-inch Super Retina XDR display, Pro camera system with 48MP main camera, Natural Titanium finish", 
            new BigDecimal("55000"), 
            "https://images.unsplash.com/photo-1695822958645-b2b058159215?w=500&h=500&fit=crop&auto=format",
            "Electronics", 50, 4.8, 120));
        
        allProducts.add(createProduct("iPhone 15 Pro - Blue Titanium", 
            "Latest iPhone with A17 Pro chip, 6.1-inch Super Retina XDR display, Pro camera system with 48MP main camera, Blue Titanium finish", 
            new BigDecimal("56000"), 
            "https://images.unsplash.com/photo-1624915757423-594d4b40d8ab?w=500&h=500&fit=crop&auto=format",
            "Electronics", 45, 4.8, 110));
        
        allProducts.add(createProduct("iPhone 15 Pro - White Titanium", 
            "Latest iPhone with A17 Pro chip, 6.1-inch Super Retina XDR display, Pro camera system with 48MP main camera, White Titanium finish", 
            new BigDecimal("57000"), 
            "https://images.unsplash.com/photo-1694570149728-b1011c2a772b?w=500&h=500&fit=crop&auto=format",
            "Electronics", 40, 4.9, 105));
        
        allProducts.add(createProduct("iPhone 15 Pro - Black Titanium", 
            "Latest iPhone with A17 Pro chip, 6.1-inch Super Retina XDR display, Pro camera system with 48MP main camera, Black Titanium finish", 
            new BigDecimal("58000"), 
            "https://images.unsplash.com/photo-1630513094903-3fcaa1bcffd3?w=500&h=500&fit=crop&auto=format",
            "Electronics", 48, 4.8, 115));
        
        // iPhone 15 Pro Max - Natural Titanium REMOVED (ID: 6788)
        
        allProducts.add(createProduct("Samsung Galaxy S24 Ultra", 
            "Flagship Android smartphone with 6.8-inch Dynamic AMOLED display, 200MP camera, S Pen support", 
            new BigDecimal("59000"), 
            "https://images.unsplash.com/photo-1705585174953-9b2aa8afc174?w=500&h=500&fit=crop&auto=format",
            "Electronics", 40, 4.7, 95));
        
        allProducts.add(createProduct("OnePlus 12", 
            "Premium Android phone with Snapdragon 8 Gen 3, 6.82-inch LTPO display, 50MP triple camera", 
            new BigDecimal("52000"), 
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop&auto=format",
            "Electronics", 35, 4.6, 88));
        
        // Laptops
        allProducts.add(createProduct("MacBook Pro 16\" M3", 
            "M3 Pro chip, 16GB RAM, 512GB SSD, Liquid Retina XDR display, 22-hour battery life", 
            new BigDecimal("75000"), 
            "https://images.unsplash.com/photo-1659135890084-930731031f40?w=500&h=500&fit=crop&auto=format",
            "Electronics", 30, 4.9, 85));
        
        allProducts.add(createProduct("Dell XPS 15", 
            "Intel i7-13700H, 16GB RAM, 1TB SSD, 15.6-inch 4K OLED touchscreen, NVIDIA RTX 4050", 
            new BigDecimal("72000"), 
            "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&h=500&fit=crop&auto=format",
            "Electronics", 25, 4.6, 70));
        
        allProducts.add(createProduct("HP Spectre x360", 
            "Intel i7, 16GB RAM, 512GB SSD, 13.5-inch 3K OLED touchscreen, 2-in-1 convertible", 
            new BigDecimal("78000"), 
            "https://images.unsplash.com/photo-1658312226966-29bd4e77c62c?w=500&h=500&fit=crop&auto=format",
            "Electronics", 20, 4.5, 65));
        
        // ========== CLOTHING ==========
        // Men's Clothing
        allProducts.add(createProduct("Classic White T-Shirt", 
            "100% cotton, comfortable fit, breathable fabric, perfect for everyday wear", 
            new BigDecimal("1200"), 
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
            "Clothing", 150, 4.5, 200));
        
        allProducts.add(createProduct("Denim Jeans - Blue", 
            "Classic fit denim jeans, 98% cotton 2% elastane, stretch comfort, regular fit", 
            new BigDecimal("2500"), 
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=500&fit=crop",
            "Clothing", 100, 4.4, 180));
        
        allProducts.add(createProduct("Leather Jacket", 
            "Genuine leather jacket, classic biker style, quilted lining, multiple pockets", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop",
            "Clothing", 40, 4.7, 95));
        
        allProducts.add(createProduct("Nike Running Shoes", 
            "Lightweight running shoes with cushioned sole, breathable mesh upper, perfect for jogging", 
            new BigDecimal("2200"), 
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
            "Clothing", 80, 4.6, 150));
        
        // Women's Clothing
        allProducts.add(createProduct("Floral Summer Dress", 
            "Beautiful floral print dress, lightweight fabric, perfect for summer occasions", 
            new BigDecimal("1800"), 
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=500&fit=crop",
            "Clothing", 120, 4.5, 175));
        
        allProducts.add(createProduct("Designer Handbag", 
            "Premium leather handbag, spacious interior, multiple compartments, elegant design", 
            new BigDecimal("2900"), 
            "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=500&fit=crop",
            "Clothing", 60, 4.8, 110));
        
        allProducts.add(createProduct("High Heel Sandals", 
            "Elegant high heel sandals, comfortable padding, perfect for parties and events", 
            new BigDecimal("1600"), 
            "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop",
            "Clothing", 90, 4.4, 140));
        
        // ========== HOME & KITCHEN ==========
        allProducts.add(createProduct("Stainless Steel Cookware Set", 
            "10-piece cookware set, non-stick coating, dishwasher safe, induction compatible", 
            new BigDecimal("15000"), 
            "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&h=500&fit=crop",
            "Home & Kitchen", 45, 4.6, 125));
        
        allProducts.add(createProduct("Memory Foam Mattress", 
            "Queen size memory foam mattress, pressure-relieving, hypoallergenic, 10-year warranty", 
            new BigDecimal("28000"), 
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=500&fit=crop",
            "Home & Kitchen", 25, 4.7, 88));
        
        allProducts.add(createProduct("Coffee Maker", 
            "12-cup programmable coffee maker, auto shut-off, reusable filter, glass carafe", 
            new BigDecimal("12000"), 
            "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&h=500&fit=crop",
            "Home & Kitchen", 70, 4.5, 160));
        
        allProducts.add(createProduct("Smart LED TV 55\"", 
            "55-inch 4K UHD Smart TV, HDR support, Android TV, voice control, multiple HDMI ports", 
            new BigDecimal("4500"), 
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop",
            "Electronics", 35, 4.8, 200));
        
        // ========== ACCESSORIES ==========
        allProducts.add(createProduct("Wireless Bluetooth Earbuds", 
            "True wireless earbuds, noise cancellation, 30-hour battery, water resistant, touch controls", 
            new BigDecimal("3500"), 
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
            "Accessories", 200, 4.6, 300));
        
        allProducts.add(createProduct("Smart Watch", 
            "Fitness tracking smartwatch, heart rate monitor, GPS, water resistant, 7-day battery", 
            new BigDecimal("18000"), 
            "https://images.unsplash.com/photo-1549486862-1a0e849380d8?w=500&h=500&fit=crop&auto=format",
            "Accessories", 80, 4.7, 180));
        
        // Phone Case - Clear REMOVED (ID: 6807)
        
        allProducts.add(createProduct("USB-C Fast Charging Cable", 
            "6ft braided cable, 3A fast charging, data transfer, durable design, multiple device support", 
            new BigDecimal("2500"), 
            "https://images.unsplash.com/photo-1573868388390-2739872961e6?w=500&h=500&fit=crop&auto=format",
            "Accessories", 500, 4.6, 400));
        
        allProducts.add(createProduct("Wireless Charging Pad", 
            "15W fast wireless charger, LED indicator, non-slip surface, compatible with all Qi devices", 
            new BigDecimal("3200"), 
            "https://images.unsplash.com/photo-1633381638729-27f730955c23?w=500&h=500&fit=crop&auto=format",
            "Accessories", 150, 4.7, 220));
        
        allProducts.add(createProduct("Laptop Backpack", 
            "Waterproof laptop backpack, padded compartment for 15\" laptop, USB charging port, multiple pockets", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
            "Accessories", 100, 4.5, 180));
        
        allProducts.add(createProduct("Wireless Mouse", 
            "Ergonomic wireless mouse, 2.4GHz connectivity, 1600 DPI, long battery life, silent clicks", 
            new BigDecimal("2200"), 
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
            "Accessories", 200, 4.4, 250));
        
        allProducts.add(createProduct("Mechanical Keyboard", 
            "RGB mechanical keyboard, Cherry MX switches, customizable backlighting, aluminum frame", 
            new BigDecimal("6500"), 
            "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop",
            "Accessories", 80, 4.6, 190));
        
        // ========== BEAUTY & PERSONAL CARE ==========
        allProducts.add(createProduct("Skincare Set", 
            "Complete skincare routine set, cleanser, toner, moisturizer, serum, suitable for all skin types", 
            new BigDecimal("3200"), 
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop",
            "Beauty", 60, 4.5, 140));
        
        allProducts.add(createProduct("Perfume - Eau de Parfum", 
            "Luxury fragrance, long-lasting scent, elegant bottle, perfect for special occasions", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop",
            "Beauty", 90, 4.6, 165));
        
        // ========== SPORTS & OUTDOORS ==========
        allProducts.add(createProduct("Yoga Mat", 
            "Premium yoga mat, non-slip surface, extra thick padding, eco-friendly material, carrying strap", 
            new BigDecimal("1800"), 
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop",
            "Sports", 120, 4.5, 180));
        
        allProducts.add(createProduct("Dumbbell Set", 
            "Adjustable dumbbell set, 5-50 lbs per dumbbell, compact design, perfect for home gym", 
            new BigDecimal("3200"), 
            "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=500&h=500&fit=crop&auto=format",
            "Sports", 40, 4.7, 95));
        
        // Resistance Bands Set REMOVED (ID: 6817)
        
        allProducts.add(createProduct("Running Shoes - Men", 
            "Lightweight running shoes with cushioned sole, breathable mesh, perfect for jogging and daily runs", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
            "Sports", 60, 4.5, 150));
        
        allProducts.add(createProduct("Basketball", 
            "Official size basketball, premium composite leather, perfect grip, suitable for indoor and outdoor", 
            new BigDecimal("1500"), 
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=500&fit=crop",
            "Sports", 100, 4.4, 200));
        
        // ========== MORE ELECTRONICS ==========
        allProducts.add(createProduct("iPad Pro 12.9\"", 
            "M2 chip, 12.9-inch Liquid Retina XDR display, 128GB storage, supports Apple Pencil and Magic Keyboard", 
            new BigDecimal("4800"), 
            "https://images.unsplash.com/photo-1661340272675-f6829791246e?w=500&h=500&fit=crop&auto=format",
            "Electronics", 25, 4.8, 95));
        
        allProducts.add(createProduct("Sony WH-1000XM5 Headphones", 
            "Premium noise-canceling headphones, 30-hour battery, quick charge, exceptional sound quality", 
            new BigDecimal("3500"), 
            "https://images.unsplash.com/photo-1583305727488-61f82c7eae4b?w=500&h=500&fit=crop&auto=format",
            "Electronics", 45, 4.9, 180));
        
        allProducts.add(createProduct("Gaming Monitor 27\" 4K", 
            "27-inch 4K UHD gaming monitor, 144Hz refresh rate, HDR support, G-Sync compatible", 
            new BigDecimal("4200"), 
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
            "Electronics", 30, 4.7, 110));
        
        allProducts.add(createProduct("Webcam HD 1080p", 
            "Full HD 1080p webcam, auto-focus, built-in microphone, perfect for video calls and streaming", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1636569826709-8e07f6104992?w=500&h=500&fit=crop&auto=format",
            "Electronics", 150, 4.5, 250));
        
        // ========== MORE ACCESSORIES ==========
        allProducts.add(createProduct("Car Phone Mount", 
            "Magnetic car phone mount, 360° rotation, strong magnetic grip, easy installation, universal fit", 
            new BigDecimal("2400"), 
            "https://images.unsplash.com/photo-1619463061549-e14e1de6c14f?w=500&h=500&fit=crop&auto=format",
            "Accessories", 200, 4.5, 180));
        
        allProducts.add(createProduct("Power Bank 20000mAh", 
            "High capacity power bank, 20000mAh, fast charging, dual USB ports, LED indicator, compact design", 
            new BigDecimal("2900"), 
            "https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?w=500&h=500&fit=crop&auto=format",
            "Accessories", 120, 4.6, 200));
        
        allProducts.add(createProduct("Laptop Stand Aluminum", 
            "Ergonomic aluminum laptop stand, adjustable height, improves posture, fits all laptop sizes", 
            new BigDecimal("3600"), 
            "https://images.unsplash.com/photo-1575399545768-5f1840c1312d?w=500&h=500&fit=crop&auto=format",
            "Accessories", 90, 4.5, 150));
        
        // ========== MORE HOME & KITCHEN ==========
        allProducts.add(createProduct("Air Fryer 5.5QT", 
            "Large capacity air fryer, 5.5-quart, digital display, 7 cooking presets, non-stick basket", 
            new BigDecimal("18000"), 
            "https://images.unsplash.com/photo-1617775047746-5b36a40109f5?w=500&h=500&fit=crop&auto=format",
            "Home & Kitchen", 55, 4.6, 170));
        
        allProducts.add(createProduct("Stand Mixer", 
            "5-quart stand mixer, 10-speed settings, includes dough hook, whisk, and paddle attachments", 
            new BigDecimal("25000"), 
            "https://images.unsplash.com/photo-1693875161668-5c4ae0f2bf20?w=500&h=500&fit=crop&auto=format",
            "Home & Kitchen", 35, 4.8, 95));
        
        allProducts.add(createProduct("Bedding Set - Queen", 
            "Premium cotton bedding set, includes comforter, sheets, pillowcases, soft and breathable", 
            new BigDecimal("11000"), 
            "https://images.unsplash.com/photo-1609587639086-b4cbf85e4355?w=500&h=500&fit=crop&auto=format",
            "Home & Kitchen", 70, 4.5, 140));
        
        allProducts.add(createProduct("Robot Vacuum Cleaner", 
            "Smart robot vacuum, Wi-Fi enabled, app control, auto-docking, works on carpets and hard floors", 
            new BigDecimal("22000"), 
            "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&h=500&fit=crop&auto=format",
            "Home & Kitchen", 40, 4.7, 120));
        
        // ========== MORE CLOTHING ==========
        // ========== MORE BEAUTY ==========
        allProducts.add(createProduct("Hair Dryer Professional", 
            "Professional hair dryer, 1875W, multiple heat settings, ionic technology, reduces frizz", 
            new BigDecimal("2400"), 
            "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500&h=500&fit=crop",
            "Beauty", 75, 4.6, 150));
        
        // ========== 10+ MORE ELECTRONICS ==========
        allProducts.add(createProduct("Amazon Echo Dot 5th Gen", 
            "Smart speaker with Alexa, improved sound quality, temperature sensor, privacy controls", 
            new BigDecimal("3200"), 
            "https://images.unsplash.com/photo-1544451256-d79e9e199fa8?w=500&h=500&fit=crop&auto=format",
            "Electronics", 150, 4.6, 300));
        
        allProducts.add(createProduct("Kindle Paperwhite", 
            "6.8-inch e-reader, waterproof, adjustable warm light, 8GB storage, weeks of battery", 
            new BigDecimal("3800"), 
            "https://images.unsplash.com/photo-1623751370867-159020187c16?w=500&h=500&fit=crop&auto=format",
            "Electronics", 110, 4.8, 280));
        
        // ========== 10+ MORE CLOTHING ==========
        allProducts.add(createProduct("Hooded Sweatshirt - Gray", 
            "Comfortable cotton blend hoodie, front pocket, adjustable drawstring, perfect for casual wear", 
            new BigDecimal("1500"), 
            "https://images.unsplash.com/photo-1580159851546-833dd8f26318?w=500&h=500&fit=crop&auto=format",
            "Clothing", 130, 4.5, 190));
        
        allProducts.add(createProduct("Trench Coat - Beige", 
            "Classic trench coat, water-resistant, belted waist, timeless design, perfect for spring/fall", 
            new BigDecimal("2700"), 
            "https://images.unsplash.com/photo-1633821879282-0c4e91f96232?w=500&h=500&fit=crop&auto=format",
            "Clothing", 40, 4.8, 90));
        
        allProducts.add(createProduct("Scarf - Cashmere", 
            "Luxury cashmere scarf, soft and warm, elegant design, perfect accessory for winter", 
            new BigDecimal("1900"), 
            "https://images.unsplash.com/photo-1674768015404-7aabcf6e9066?w=500&h=500&fit=crop&auto=format",
            "Clothing", 55, 4.7, 115));
        
        // ========== 10+ MORE HOME & KITCHEN ==========
        // ========== 10+ MORE ACCESSORIES ==========
        allProducts.add(createProduct("Apple AirPods Pro 2", 
            "Active noise cancellation, spatial audio, adaptive EQ, MagSafe charging case, 30-hour battery", 
            new BigDecimal("22000"), 
            "https://images.unsplash.com/photo-1593716686443-b821ac2a45c8?w=500&h=500&fit=crop&auto=format",
            "Accessories", 180, 4.9, 400));
        
        allProducts.add(createProduct("Logitech MX Master 3S Mouse", 
            "Ergonomic wireless mouse, precision tracking, multi-device connectivity, 70-day battery", 
            new BigDecimal("5800"), 
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
            "Accessories", 130, 4.8, 280));
        
        allProducts.add(createProduct("Keychron K8 Mechanical Keyboard", 
            "Wireless mechanical keyboard, RGB backlighting, hot-swappable switches, Mac/Windows compatible", 
            new BigDecimal("6800"), 
            "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop",
            "Accessories", 105, 4.7, 260));
        
        // ========== 10+ MORE BEAUTY ==========
        allProducts.add(createProduct("Dyson Supersonic Hair Dryer", 
            "Professional hair dryer, intelligent heat control, fast drying, reduces heat damage", 
            new BigDecimal("3800"), 
            "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500&h=500&fit=crop",
            "Beauty", 35, 4.9, 120));
        
        // ========== 10+ MORE SPORTS ==========
        // Adjustable Weight Bench REMOVED (ID: 6905)
        
        allProducts.add(createProduct("Pull-Up Bar Doorway", 
            "Doorway pull-up bar, no drilling required, multiple grip positions, supports up to 300 lbs", 
            new BigDecimal("2200"), 
            "https://images.unsplash.com/photo-1561051984-67b8078c1a1d?w=500&h=500&fit=crop&auto=format",
            "Sports", 90, 4.6, 200));
        
        allProducts.add(createProduct("Kettlebell 20 lbs", 
            "Cast iron kettlebell, 20 lbs, perfect for full-body workouts, compact design", 
            new BigDecimal("2800"), 
            "https://images.unsplash.com/photo-1632077804406-188472f1a810?w=500&h=500&fit=crop&auto=format",
            "Sports", 70, 4.6, 180));
        
        allProducts.add(createProduct("Foam Roller 36\"", 
            "High-density foam roller, 36 inches, muscle recovery, improves flexibility, textured surface", 
            new BigDecimal("1600"), 
            "https://images.unsplash.com/photo-1591741535585-9c4f52b3f13f?w=500&h=500&fit=crop&auto=format",
            "Sports", 110, 4.5, 250));
        
        allProducts.add(createProduct("Jump Rope - Speed", 
            "Professional speed jump rope, adjustable length, ball bearings, perfect for cardio", 
            new BigDecimal("1200"), 
            "https://images.unsplash.com/photo-1709315872247-644b7ff5ed10?w=500&h=500&fit=crop&auto=format",
            "Sports", 150, 4.5, 300));
        
        allProducts.add(createProduct("Yoga Block Set - 2 Pack", 
            "Eco-friendly cork yoga blocks, 2-pack, improves alignment, perfect for all levels", 
            new BigDecimal("1400"), 
            "https://images.unsplash.com/photo-1646239646963-b0b9be56d6b5?w=500&h=500&fit=crop&auto=format",
            "Sports", 130, 4.6, 280));
        
        allProducts.add(createProduct("Tennis Racket - Professional", 
            "Professional tennis racket, graphite frame, pre-strung, perfect for intermediate to advanced players", 
            new BigDecimal("3600"), 
            "https://images.unsplash.com/photo-1632755898125-36cd72575dde?w=500&h=500&fit=crop&auto=format",
            "Sports", 50, 4.7, 140));
        
        allProducts.add(createProduct("Soccer Ball - Size 5", 
            "Official size 5 soccer ball, premium composite leather, perfect grip, suitable for all surfaces", 
            new BigDecimal("1800"), 
            "https://images.unsplash.com/photo-1753561154967-ba6ae685f7ca?w=500&h=500&fit=crop&auto=format",
            "Sports", 95, 4.5, 220));
        
        allProducts.add(createProduct("Swimming Goggles - Anti-Fog", 
            "Professional swimming goggles, anti-fog coating, UV protection, comfortable fit, adjustable strap", 
            new BigDecimal("1600"), 
            "https://images.unsplash.com/photo-1698420921442-803e05557031?w=500&h=500&fit=crop&auto=format",
            "Sports", 120, 4.6, 260));
        
        allProducts.add(createProduct("Cycling Helmet - MIPS", 
            "Safety cycling helmet, MIPS technology, adjustable fit, ventilation system, multiple colors", 
            new BigDecimal("3200"), 
            "https://images.unsplash.com/photo-1701522814809-c339c2b60a7b?w=500&h=500&fit=crop&auto=format",
            "Sports", 65, 4.7, 160));
        
        allProducts.add(createProduct("Protein Shaker Bottle", 
            "32 oz protein shaker, mixing ball included, leak-proof, BPA-free, perfect for post-workout", 
            new BigDecimal("1100"), 
            "https://images.unsplash.com/photo-1678875526436-fa7137a01413?w=500&h=500&fit=crop&auto=format",
            "Sports", 200, 4.5, 400));
        
        allProducts.add(createProduct("Gym Gloves - Full Finger", 
            "Protective gym gloves, full finger coverage, padded palms, breathable material, adjustable wrist strap", 
            new BigDecimal("1400"), 
            "https://images.unsplash.com/photo-1557127972-1c446ea89ea5?w=500&h=500&fit=crop&auto=format",
            "Sports", 140, 4.5, 290));
        
        allProducts.add(createProduct("Punching Bag - Heavy Duty", 
            "70 lbs heavy-duty punching bag, filled with fabric, includes chains and swivel, perfect for boxing", 
            new BigDecimal("3800"), 
            "https://images.unsplash.com/photo-1748484531687-5faebc4a1965?w=500&h=500&fit=crop&auto=format",
            "Sports", 25, 4.6, 95));
        
        allProducts.add(createProduct("Exercise Bike - Stationary", 
            "Magnetic resistance exercise bike, LCD display, adjustable seat, perfect for home cardio", 
            new BigDecimal("3500"), 
            "https://images.unsplash.com/photo-1707985287164-c84627ad6eba?w=500&h=500&fit=crop&auto=format",
            "Sports", 20, 4.7, 80));
        
        // Save all products
        List<Product> savedProducts = new ArrayList<>();
        for (Product product : allProducts) {
            savedProducts.add(productRepository.save(product));
        }
        
        // Create associations - Find products by name for reliability
        Product phone1 = savedProducts.stream().filter(p -> p.getName().contains("iPhone")).findFirst().orElse(null);
        Product phone2 = savedProducts.stream().filter(p -> p.getName().contains("Samsung")).findFirst().orElse(null);
        Product phone3 = savedProducts.stream().filter(p -> p.getName().contains("OnePlus")).findFirst().orElse(null);
        
        Product case1 = savedProducts.stream().filter(p -> p.getName().contains("Phone Case")).findFirst().orElse(null);
        Product cable = savedProducts.stream().filter(p -> p.getName().contains("USB-C") || p.getName().contains("Cable")).findFirst().orElse(null);
        Product charger = savedProducts.stream().filter(p -> p.getName().contains("Wireless Charging")).findFirst().orElse(null);
        Product earbuds = savedProducts.stream().filter(p -> p.getName().contains("Earbuds")).findFirst().orElse(null);
        Product watch = savedProducts.stream().filter(p -> p.getName().contains("Smart Watch")).findFirst().orElse(null);
        
        // Phone recommendations
        if (phone1 != null) {
            if (case1 != null) createAssociation(phone1.getId(), case1.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.95);
            if (cable != null) createAssociation(phone1.getId(), cable.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
            if (charger != null) createAssociation(phone1.getId(), charger.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            if (earbuds != null) createAssociation(phone1.getId(), earbuds.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
            if (watch != null) createAssociation(phone1.getId(), watch.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
        }
        
        if (phone2 != null) {
            if (case1 != null) createAssociation(phone2.getId(), case1.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.95);
            if (cable != null) createAssociation(phone2.getId(), cable.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
            if (charger != null) createAssociation(phone2.getId(), charger.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            if (earbuds != null) createAssociation(phone2.getId(), earbuds.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
        }
        
        if (phone3 != null) {
            if (case1 != null) createAssociation(phone3.getId(), case1.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.95);
            if (cable != null) createAssociation(phone3.getId(), cable.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
        }
        
        // Laptop accessories
        Product laptop1 = savedProducts.stream().filter(p -> p.getName().contains("MacBook")).findFirst().orElse(null);
        Product laptop2 = savedProducts.stream().filter(p -> p.getName().contains("Dell")).findFirst().orElse(null);
        Product laptop3 = savedProducts.stream().filter(p -> p.getName().contains("HP")).findFirst().orElse(null);
        
        Product backpack = savedProducts.stream().filter(p -> p.getName().contains("Backpack")).findFirst().orElse(null);
        Product mouse = savedProducts.stream().filter(p -> p.getName().contains("Mouse")).findFirst().orElse(null);
        Product keyboard = savedProducts.stream().filter(p -> p.getName().contains("Keyboard")).findFirst().orElse(null);
        
        if (laptop1 != null) {
            if (backpack != null) createAssociation(laptop1.getId(), backpack.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
            if (mouse != null) createAssociation(laptop1.getId(), mouse.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            if (keyboard != null) createAssociation(laptop1.getId(), keyboard.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
        }
        
        if (laptop2 != null) {
            if (backpack != null) createAssociation(laptop2.getId(), backpack.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
            if (mouse != null) createAssociation(laptop2.getId(), mouse.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            if (keyboard != null) createAssociation(laptop2.getId(), keyboard.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
        }
        
        if (laptop3 != null) {
            if (backpack != null) createAssociation(laptop3.getId(), backpack.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.90);
            if (mouse != null) createAssociation(laptop3.getId(), mouse.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        }
        
        // Clothing recommendations - similar items
        Product tshirt = savedProducts.stream().filter(p -> p.getName().contains("T-Shirt")).findFirst().orElse(null);
        Product jeans = savedProducts.stream().filter(p -> p.getName().contains("Jeans")).findFirst().orElse(null);
        Product jacket = savedProducts.stream().filter(p -> p.getName().contains("Jacket")).findFirst().orElse(null);
        Product shoes = savedProducts.stream().filter(p -> p.getName().contains("Shoes")).findFirst().orElse(null);
        
        if (tshirt != null && jeans != null) {
            createAssociation(tshirt.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
        }
        if (jeans != null && shoes != null) {
            createAssociation(jeans.getId(), shoes.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.70);
        }
        if (jacket != null && tshirt != null) {
            createAssociation(jacket.getId(), tshirt.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.65);
        }
        
        // Home & Kitchen - complementary items
        Product cookware = savedProducts.stream().filter(p -> p.getName().contains("Cookware")).findFirst().orElse(null);
        Product coffeeMaker = savedProducts.stream().filter(p -> p.getName().contains("Coffee")).findFirst().orElse(null);
        
        if (cookware != null && coffeeMaker != null) {
            createAssociation(cookware.getId(), coffeeMaker.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.60);
        }
        
        // ========== FREQUENTLY BOUGHT TOGETHER ASSOCIATIONS ==========
        
        // Phone + Case + Screen Protector + Cable (Frequently Bought Together)
        Product screenProtector = savedProducts.stream().filter(p -> p.getName().contains("Screen Protector")).findFirst().orElse(null);
        if (phone1 != null && case1 != null && screenProtector != null && cable != null) {
            createAssociation(phone1.getId(), case1.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.98);
            createAssociation(phone1.getId(), screenProtector.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.95);
            createAssociation(phone1.getId(), cable.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
            // Cross associations
            if (case1 != null && screenProtector != null) {
                createAssociation(case1.getId(), screenProtector.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            }
        }
        
        // Laptop + Mouse + Keyboard + Backpack (Frequently Bought Together)
        Product laptopStand = savedProducts.stream().filter(p -> p.getName().contains("Laptop Stand")).findFirst().orElse(null);
        if (laptop1 != null && mouse != null && keyboard != null && backpack != null) {
            createAssociation(laptop1.getId(), mouse.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            createAssociation(laptop1.getId(), keyboard.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
            createAssociation(laptop1.getId(), backpack.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.82);
            if (laptopStand != null) {
                createAssociation(laptop1.getId(), laptopStand.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.75);
            }
        }
        
        // Gaming Setup: Monitor + Keyboard + Mouse (Frequently Bought Together)
        Product gamingMonitor = savedProducts.stream().filter(p -> p.getName().contains("Gaming Monitor")).findFirst().orElse(null);
        if (gamingMonitor != null && keyboard != null && mouse != null) {
            createAssociation(gamingMonitor.getId(), keyboard.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            createAssociation(gamingMonitor.getId(), mouse.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            if (keyboard != null && mouse != null) {
                createAssociation(keyboard.getId(), mouse.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
            }
        }
        
        // Workout Bundle: Dumbbells + Resistance Bands + Yoga Mat
        Product resistanceBands = savedProducts.stream().filter(p -> p.getName().contains("Resistance Bands")).findFirst().orElse(null);
        Product yogaMat = savedProducts.stream().filter(p -> p.getName().contains("Yoga Mat")).findFirst().orElse(null);
        Product dumbbells = savedProducts.stream().filter(p -> p.getName().contains("Dumbbell")).findFirst().orElse(null);
        if (dumbbells != null && resistanceBands != null && yogaMat != null) {
            createAssociation(dumbbells.getId(), resistanceBands.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.80);
            createAssociation(dumbbells.getId(), yogaMat.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.75);
            if (resistanceBands != null && yogaMat != null) {
                createAssociation(resistanceBands.getId(), yogaMat.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.70);
            }
        }
        
        // Kitchen Bundle: Coffee Maker + Stand Mixer + Air Fryer
        Product airFryer = savedProducts.stream().filter(p -> p.getName().contains("Air Fryer")).findFirst().orElse(null);
        Product standMixer = savedProducts.stream().filter(p -> p.getName().contains("Stand Mixer")).findFirst().orElse(null);
        if (coffeeMaker != null && standMixer != null) {
            createAssociation(coffeeMaker.getId(), standMixer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.65);
        }
        if (coffeeMaker != null && airFryer != null) {
            createAssociation(coffeeMaker.getId(), airFryer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.60);
        }
        
        // Clothing Bundle: T-Shirt + Jeans + Shoes (Frequently Bought Together)
        if (tshirt != null && jeans != null && shoes != null) {
            createAssociation(tshirt.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
            createAssociation(tshirt.getId(), shoes.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.80);
            createAssociation(jeans.getId(), shoes.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.82);
        }
        
        // Beauty Bundle: Skincare Set + Makeup Brushes + Hair Dryer
        Product skincareSet = savedProducts.stream().filter(p -> p.getName().contains("Skincare Set")).findFirst().orElse(null);
        Product makeupBrushes = savedProducts.stream().filter(p -> p.getName().contains("Makeup Brush")).findFirst().orElse(null);
        Product hairDryer = savedProducts.stream().filter(p -> p.getName().contains("Hair Dryer")).findFirst().orElse(null);
        if (skincareSet != null && makeupBrushes != null) {
            createAssociation(skincareSet.getId(), makeupBrushes.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.70);
        }
        if (makeupBrushes != null && hairDryer != null) {
            createAssociation(makeupBrushes.getId(), hairDryer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.65);
        }
        
        // Electronics Bundle: iPad + Apple Pencil + Case
        Product ipad = savedProducts.stream().filter(p -> p.getName().contains("iPad")).findFirst().orElse(null);
        if (ipad != null && case1 != null) {
            createAssociation(ipad.getId(), case1.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
        }
        
        // Headphones + Power Bank (Frequently Bought Together)
        Product headphones = savedProducts.stream().filter(p -> p.getName().contains("Headphones")).findFirst().orElse(null);
        Product powerBank = savedProducts.stream().filter(p -> p.getName().contains("Power Bank")).findFirst().orElse(null);
        if (headphones != null && powerBank != null) {
            createAssociation(headphones.getId(), powerBank.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.75);
        }
        
        // Watch + Sunglasses (Frequently Bought Together)
        Product classicWatch = savedProducts.stream().filter(p -> p.getName().contains("Wristwatch")).findFirst().orElse(null);
        Product sunglasses = savedProducts.stream().filter(p -> p.getName().contains("Sunglasses")).findFirst().orElse(null);
        if (classicWatch != null && sunglasses != null) {
            createAssociation(classicWatch.getId(), sunglasses.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.68);
        }
        
        // Home Bundle: Mattress + Bedding Set (Frequently Bought Together)
        Product mattress = savedProducts.stream().filter(p -> p.getName().contains("Mattress")).findFirst().orElse(null);
        Product beddingSet = savedProducts.stream().filter(p -> p.getName().contains("Bedding Set")).findFirst().orElse(null);
        if (mattress != null && beddingSet != null) {
            createAssociation(mattress.getId(), beddingSet.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
        }
        
        // TV + Soundbar (Frequently Bought Together)
        Product tv = savedProducts.stream().filter(p -> p.getName().contains("TV")).findFirst().orElse(null);
        if (tv != null && headphones != null) {
            createAssociation(tv.getId(), headphones.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.72);
        }
        
        // ========== ENHANCED CONTEXTUAL RECOMMENDATIONS ==========
        
        // Clothing: Pants/Jeans/Chinos -> T-Shirts, Polo Shirts, Hoodies (Complementary)
        Product chinos = savedProducts.stream().filter(p -> p.getName().contains("Chino")).findFirst().orElse(null);
        Product poloShirt = savedProducts.stream().filter(p -> p.getName().contains("Polo")).findFirst().orElse(null);
        Product hoodie = savedProducts.stream().filter(p -> p.getName().contains("Hooded") || p.getName().contains("Hoodie")).findFirst().orElse(null);
        Product cardigan = savedProducts.stream().filter(p -> p.getName().contains("Cardigan")).findFirst().orElse(null);
        Product blazer = savedProducts.stream().filter(p -> p.getName().contains("Blazer")).findFirst().orElse(null);
        
        // Pants/Jeans/Chinos -> T-Shirts (High association - frequently bought together)
        if (jeans != null && tshirt != null) {
            createAssociation(jeans.getId(), tshirt.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            createAssociation(tshirt.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
        }
        if (chinos != null && tshirt != null) {
            createAssociation(chinos.getId(), tshirt.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.87);
            createAssociation(tshirt.getId(), chinos.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.87);
        }
        
        // Pants/Jeans/Chinos -> Polo Shirts (Business casual)
        if (jeans != null && poloShirt != null) {
            createAssociation(jeans.getId(), poloShirt.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            createAssociation(poloShirt.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        }
        if (chinos != null && poloShirt != null) {
            createAssociation(chinos.getId(), poloShirt.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            createAssociation(poloShirt.getId(), chinos.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
        }
        
        // Pants/Jeans -> Hoodies (Casual wear)
        if (jeans != null && hoodie != null) {
            createAssociation(jeans.getId(), hoodie.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.82);
            createAssociation(hoodie.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.82);
        }
        
        // Blazer + Chinos/Pants (Formal wear)
        if (blazer != null && chinos != null) {
            createAssociation(blazer.getId(), chinos.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
            createAssociation(chinos.getId(), blazer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
        }
        if (blazer != null && poloShirt != null) {
            createAssociation(blazer.getId(), poloShirt.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
        }
        
        // Cardigan + T-Shirt (Layering)
        if (cardigan != null && tshirt != null) {
            createAssociation(cardigan.getId(), tshirt.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
            createAssociation(tshirt.getId(), cardigan.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
        }
        
        // Gym Equipment: Comprehensive associations
        Product weightBench = savedProducts.stream().filter(p -> p.getName().contains("Weight Bench")).findFirst().orElse(null);
        Product kettlebell = savedProducts.stream().filter(p -> p.getName().contains("Kettlebell")).findFirst().orElse(null);
        Product pullUpBar = savedProducts.stream().filter(p -> p.getName().contains("Pull-Up")).findFirst().orElse(null);
        Product foamRoller = savedProducts.stream().filter(p -> p.getName().contains("Foam Roller")).findFirst().orElse(null);
        Product yogaBlocks = savedProducts.stream().filter(p -> p.getName().contains("Yoga Block")).findFirst().orElse(null);
        Product gymGloves = savedProducts.stream().filter(p -> p.getName().contains("Gym Gloves")).findFirst().orElse(null);
        Product proteinShaker = savedProducts.stream().filter(p -> p.getName().contains("Protein Shaker")).findFirst().orElse(null);
        Product exerciseBike = savedProducts.stream().filter(p -> p.getName().contains("Exercise Bike")).findFirst().orElse(null);
        Product punchingBag = savedProducts.stream().filter(p -> p.getName().contains("Punching Bag")).findFirst().orElse(null);
        
        // Dumbbells -> Other gym equipment (Frequently Bought Together)
        if (dumbbells != null) {
            if (weightBench != null) {
                createAssociation(dumbbells.getId(), weightBench.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
                createAssociation(weightBench.getId(), dumbbells.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
            }
            if (resistanceBands != null) {
                createAssociation(dumbbells.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            }
            if (kettlebell != null) {
                createAssociation(dumbbells.getId(), kettlebell.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
                createAssociation(kettlebell.getId(), dumbbells.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            }
            if (gymGloves != null) {
                createAssociation(dumbbells.getId(), gymGloves.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            }
            if (proteinShaker != null) {
                createAssociation(dumbbells.getId(), proteinShaker.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
            }
        }
        
        // Weight Bench -> Dumbbells, Resistance Bands, Gym Gloves
        if (weightBench != null) {
            if (dumbbells != null) {
                createAssociation(weightBench.getId(), dumbbells.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
            }
            if (resistanceBands != null) {
                createAssociation(weightBench.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
            }
            if (gymGloves != null) {
                createAssociation(weightBench.getId(), gymGloves.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            }
        }
        
        // Resistance Bands -> Yoga Mat, Foam Roller (Flexibility and recovery)
        if (resistanceBands != null) {
            if (yogaMat != null) {
                createAssociation(resistanceBands.getId(), yogaMat.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
                createAssociation(yogaMat.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
            }
            if (foamRoller != null) {
                createAssociation(resistanceBands.getId(), foamRoller.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.78);
                createAssociation(foamRoller.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.78);
            }
        }
        
        // Yoga Mat -> Yoga Blocks, Foam Roller (Yoga essentials)
        if (yogaMat != null) {
            if (yogaBlocks != null) {
                createAssociation(yogaMat.getId(), yogaBlocks.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
                createAssociation(yogaBlocks.getId(), yogaMat.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            }
            if (foamRoller != null) {
                createAssociation(yogaMat.getId(), foamRoller.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.82);
            }
        }
        
        // Pull-Up Bar -> Gym Gloves, Resistance Bands
        if (pullUpBar != null) {
            if (gymGloves != null) {
                createAssociation(pullUpBar.getId(), gymGloves.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            }
            if (resistanceBands != null) {
                createAssociation(pullUpBar.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
            }
        }
        
        // Exercise Bike -> Gym Gloves, Protein Shaker, Foam Roller
        if (exerciseBike != null) {
            if (gymGloves != null) {
                createAssociation(exerciseBike.getId(), gymGloves.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.70);
            }
            if (proteinShaker != null) {
                createAssociation(exerciseBike.getId(), proteinShaker.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
            }
            if (foamRoller != null) {
                createAssociation(exerciseBike.getId(), foamRoller.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.72);
            }
        }
        
        // Punching Bag -> Gym Gloves (Essential)
        if (punchingBag != null && gymGloves != null) {
            createAssociation(punchingBag.getId(), gymGloves.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.95);
            createAssociation(gymGloves.getId(), punchingBag.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.95);
        }
        
        // Kettlebell -> Dumbbells, Resistance Bands, Gym Gloves
        if (kettlebell != null) {
            if (dumbbells != null) {
                createAssociation(kettlebell.getId(), dumbbells.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
            }
            if (resistanceBands != null) {
                createAssociation(kettlebell.getId(), resistanceBands.getId(), 
                    ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
            }
            if (gymGloves != null) {
                createAssociation(kettlebell.getId(), gymGloves.getId(), 
                    ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
            }
        }
        
        // Running Shoes -> Athletic Shorts, Gym Gloves (Sports wear)
        Product runningShoes = savedProducts.stream().filter(p -> p.getName().contains("Running Shoes")).findFirst().orElse(null);
        Product athleticShorts = savedProducts.stream().filter(p -> p.getName().contains("Athletic Shorts")).findFirst().orElse(null);
        if (runningShoes != null && athleticShorts != null) {
            createAssociation(runningShoes.getId(), athleticShorts.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            createAssociation(athleticShorts.getId(), runningShoes.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
        }
        
        // More Clothing Combinations
        Product sneakers = savedProducts.stream().filter(p -> p.getName().contains("Sneakers")).findFirst().orElse(null);
        if (sneakers != null && jeans != null) {
            createAssociation(sneakers.getId(), jeans.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
        }
        if (sneakers != null && tshirt != null) {
            createAssociation(sneakers.getId(), tshirt.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.80);
        }
        
        // Winter/Outerwear combinations
        Product winterJacket = savedProducts.stream().filter(p -> p.getName().contains("Winter Jacket")).findFirst().orElse(null);
        Product woolCoat = savedProducts.stream().filter(p -> p.getName().contains("Wool Coat")).findFirst().orElse(null);
        Product scarf = savedProducts.stream().filter(p -> p.getName().contains("Scarf")).findFirst().orElse(null);
        Product trenchCoat = savedProducts.stream().filter(p -> p.getName().contains("Trench Coat")).findFirst().orElse(null);
        
        if (winterJacket != null && scarf != null) {
            createAssociation(winterJacket.getId(), scarf.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
            createAssociation(scarf.getId(), winterJacket.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.85);
        }
        if (woolCoat != null && scarf != null) {
            createAssociation(woolCoat.getId(), scarf.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
        }
        if (trenchCoat != null && scarf != null) {
            createAssociation(trenchCoat.getId(), scarf.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.82);
        }
        
        // Home & Kitchen: More comprehensive associations
        Product knifeSet = savedProducts.stream().filter(p -> p.getName().contains("Knife Set")).findFirst().orElse(null);
        Product cuttingBoard = savedProducts.stream().filter(p -> p.getName().contains("Cutting Board")).findFirst().orElse(null);
        Product toaster = savedProducts.stream().filter(p -> p.getName().contains("Toaster")).findFirst().orElse(null);
        
        if (knifeSet != null && cuttingBoard != null) {
            createAssociation(knifeSet.getId(), cuttingBoard.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
            createAssociation(cuttingBoard.getId(), knifeSet.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.92);
        }
        if (coffeeMaker != null && toaster != null) {
            createAssociation(coffeeMaker.getId(), toaster.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
        }
        
        // Beauty: Skincare combinations
        Product serum = savedProducts.stream().filter(p -> p.getName().contains("Serum") && !p.getName().contains("Set")).findFirst().orElse(null);
        Product moisturizer = savedProducts.stream().filter(p -> p.getName().contains("Moisturizing") || p.getName().contains("Cream")).findFirst().orElse(null);
        Product cleanser = savedProducts.stream().filter(p -> p.getName().contains("Cleanser")).findFirst().orElse(null);
        
        if (serum != null && moisturizer != null) {
            createAssociation(serum.getId(), moisturizer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
            createAssociation(moisturizer.getId(), serum.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.90);
        }
        if (cleanser != null && moisturizer != null) {
            createAssociation(cleanser.getId(), moisturizer.getId(), 
                ProductAssociation.AssociationType.FREQUENTLY_BOUGHT_TOGETHER, 0.88);
        }
        if (cleanser != null && serum != null) {
            createAssociation(cleanser.getId(), serum.getId(), 
                ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        }
    }
    
    private Product createProduct(String name, String description, 
                                 BigDecimal price, String imageUrl, 
                                 String category, Integer stock, 
                                 Double rating, Integer reviewCount) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setImageUrl(imageUrl);
        product.setCategory(category);
        product.setStock(stock);
        product.setRating(rating);
        product.setReviewCount(reviewCount);
        return product;
    }
    
    private void createAssociation(Long productId, Long associatedProductId, 
                                  ProductAssociation.AssociationType type, 
                                  Double strength) {
        Product product = productRepository.findById(productId).orElse(null);
        Product associatedProduct = productRepository.findById(associatedProductId).orElse(null);
        
        if (product != null && associatedProduct != null) {
            ProductAssociation association = new ProductAssociation();
            association.setProduct(product);
            association.setAssociatedProduct(associatedProduct);
            association.setType(type);
            association.setAssociationStrength(strength);
            associationRepository.save(association);
        }
    }
}
