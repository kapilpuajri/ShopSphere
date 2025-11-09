package com.shopsphere.service;

import com.shopsphere.model.Product;
import com.shopsphere.model.ProductAssociation;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.ProductAssociationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Component
public class DataSeederService implements CommandLineRunner {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ProductAssociationRepository associationRepository;
    
    @Override
    @Transactional
    public void run(String... args) {
        if (productRepository.count() == 0) {
            seedProducts();
        }
    }
    
    private void seedProducts() {
        // Electronics - Phones
        Product phone1 = createProduct("iPhone 15 Pro", 
            "Latest iPhone with A17 Pro chip, 6.1-inch Super Retina XDR display, Pro camera system", 
            new BigDecimal("999.99"), 
            "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop",
            "Electronics", 50, 4.8, 120);
        
        Product phone2 = createProduct("Samsung Galaxy S24", 
            "Flagship Android smartphone with 6.2-inch Dynamic AMOLED display, triple camera system", 
            new BigDecimal("899.99"), 
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
            "Electronics", 40, 4.7, 95);
        
        // Phone Accessories
        Product phoneCover1 = createProduct("iPhone 15 Pro Case", 
            "Protective case for iPhone 15 Pro with shock absorption and clear design", 
            new BigDecimal("29.99"), 
            "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop",
            "Accessories", 100, 4.5, 200);
        
        Product phoneCover2 = createProduct("Samsung Galaxy S24 Case", 
            "Protective case for Galaxy S24 with military-grade protection", 
            new BigDecimal("24.99"), 
            "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop",
            "Accessories", 80, 4.4, 150);
        
        Product dataCable = createProduct("USB-C Data Cable", 
            "Fast charging USB-C cable with 3A support, 6ft length, braided design", 
            new BigDecimal("19.99"), 
            "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=400&fit=crop",
            "Accessories", 200, 4.6, 300);
        
        Product screenProtector = createProduct("Tempered Glass Screen Protector", 
            "9H hardness screen protector with bubble-free installation and crystal clear clarity", 
            new BigDecimal("14.99"), 
            "https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=400&h=400&fit=crop",
            "Accessories", 150, 4.5, 250);
        
        Product wirelessCharger = createProduct("Wireless Charging Pad", 
            "15W fast wireless charger with LED indicator and non-slip surface", 
            new BigDecimal("39.99"), 
            "https://images.unsplash.com/photo-1609091839311-d5365f9ff1e8?w=400&h=400&fit=crop",
            "Accessories", 60, 4.7, 180);
        
        // Laptops
        Product laptop1 = createProduct("MacBook Pro 16\"", 
            "M3 Pro chip, 16GB RAM, 512GB SSD, Liquid Retina XDR display", 
            new BigDecimal("2499.99"), 
            "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
            "Electronics", 30, 4.9, 85);
        
        Product laptop2 = createProduct("Dell XPS 15", 
            "Intel i7, 16GB RAM, 1TB SSD, 15.6-inch 4K OLED display", 
            new BigDecimal("1899.99"), 
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
            "Electronics", 25, 4.6, 70);
        
        // Laptop Accessories
        Product laptopBag = createProduct("Laptop Backpack", 
            "Waterproof laptop backpack with padded compartment, USB charging port, and multiple pockets", 
            new BigDecimal("79.99"), 
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
            "Accessories", 50, 4.5, 120);
        
        Product mouse = createProduct("Wireless Mouse", 
            "Ergonomic wireless mouse with 2.4GHz connectivity, 1600 DPI, and long battery life", 
            new BigDecimal("29.99"), 
            "https://images.unsplash.com/photo-1527814050087-3793812759?w=400&h=400&fit=crop",
            "Accessories", 100, 4.4, 200);
        
        Product keyboard = createProduct("Mechanical Keyboard", 
            "RGB mechanical keyboard with Cherry MX switches, customizable backlighting, and aluminum frame", 
            new BigDecimal("99.99"), 
            "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
            "Accessories", 40, 4.6, 150);
        
        // Save all products
        productRepository.save(phone1);
        productRepository.save(phone2);
        productRepository.save(phoneCover1);
        productRepository.save(phoneCover2);
        productRepository.save(dataCable);
        productRepository.save(screenProtector);
        productRepository.save(wirelessCharger);
        productRepository.save(laptop1);
        productRepository.save(laptop2);
        productRepository.save(laptopBag);
        productRepository.save(mouse);
        productRepository.save(keyboard);
        
        // Create associations - Phone recommendations
        createAssociation(phone1.getId(), phoneCover1.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.9);
        createAssociation(phone1.getId(), dataCable.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        createAssociation(phone1.getId(), screenProtector.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.8);
        createAssociation(phone1.getId(), wirelessCharger.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
        
        createAssociation(phone2.getId(), phoneCover2.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.9);
        createAssociation(phone2.getId(), dataCable.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        createAssociation(phone2.getId(), screenProtector.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.8);
        
        // Laptop recommendations
        createAssociation(laptop1.getId(), laptopBag.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        createAssociation(laptop1.getId(), mouse.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.8);
        createAssociation(laptop1.getId(), keyboard.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.75);
        
        createAssociation(laptop2.getId(), laptopBag.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.85);
        createAssociation(laptop2.getId(), mouse.getId(), 
            ProductAssociation.AssociationType.COMPLEMENTARY, 0.8);
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

