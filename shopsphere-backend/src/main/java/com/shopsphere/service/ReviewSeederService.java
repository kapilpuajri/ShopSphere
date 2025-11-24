package com.shopsphere.service;

import com.shopsphere.model.Review;
import com.shopsphere.model.Product;
import com.shopsphere.model.User;
import com.shopsphere.repository.ReviewRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@Order(2) // Run after DataSeederService
public class ReviewSeederService implements CommandLineRunner {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private final Random random = new Random();
    
    // Realistic reviewer names
    private final List<String> reviewerNames = Arrays.asList(
        "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
        "Anjali Mehta", "Rahul Gupta", "Kavita Nair", "Suresh Iyer", "Meera Joshi",
        "Arjun Desai", "Divya Rao", "Karan Malhotra", "Neha Agarwal", "Rohan Verma",
        "Pooja Shah", "Aditya Kapoor", "Shreya Menon", "Varun Chawla", "Anita Das"
    );
    
    // Review templates for different product categories
    private final List<String> electronicsPositiveReviews = Arrays.asList(
        "Excellent product! The quality is outstanding and it works perfectly. Highly recommended!",
        "Great value for money. The features are amazing and the build quality is solid.",
        "Love this product! It exceeded my expectations. Fast delivery and excellent packaging.",
        "Best purchase I've made this year. The performance is top-notch and it looks great too.",
        "Very satisfied with this product. It's exactly as described and works flawlessly.",
        "Amazing quality! Worth every rupee. The product arrived in perfect condition.",
        "Highly recommend this product. Great features and excellent customer service.",
        "Perfect product for my needs. The quality is excellent and it's very user-friendly."
    );
    
    private final List<String> electronicsMixedReviews = Arrays.asList(
        "Good product overall, but could be better. The price is reasonable though.",
        "Decent quality, but some features could be improved. Still worth buying.",
        "It's okay for the price. Not the best but not bad either. Does the job.",
        "Average product. Works fine but nothing exceptional. Good for basic needs."
    );
    
    private final List<String> clothingPositiveReviews = Arrays.asList(
        "Perfect fit and great quality fabric! Very comfortable to wear.",
        "Love the design and color. The material is soft and durable.",
        "Excellent quality! Fits perfectly and looks exactly like the picture.",
        "Great purchase! The fabric is high quality and it's very comfortable.",
        "Beautiful product! Good quality and fast shipping. Highly recommend!"
    );
    
    private final List<String> homeKitchenPositiveReviews = Arrays.asList(
        "Great addition to my kitchen! Very useful and well-made.",
        "Excellent quality product. Makes my daily tasks much easier.",
        "Love this product! It's durable and works perfectly for my needs.",
        "High quality and great value. Very satisfied with this purchase."
    );
    
    @Override
    @Transactional
    public void run(String... args) {
        List<Product> products = productRepository.findAll();
        List<User> users = userRepository.findAll();
        
        if (products.isEmpty() || users.isEmpty()) {
            System.out.println("No products or users found, skipping review seeding.");
            return;
        }
        
        // Check if reviews already exist for products
        long existingReviewCount = reviewRepository.count();
        if (existingReviewCount > 0) {
            System.out.println("Reviews already exist (" + existingReviewCount + "), skipping review seeding.");
            return;
        }
        
        System.out.println("Seeding reviews for " + products.size() + " products...");
        
        // Generate reviews for each product
        for (Product product : products) {
            int reviewCount = product.getReviewCount() != null ? product.getReviewCount() : 0;
            
            // Generate reviews based on product's reviewCount, but at least 5-10 reviews per product
            // If reviewCount is 0 or very low, generate a minimum number
            int numReviews = reviewCount > 0 ? Math.min(reviewCount, 20) : (5 + random.nextInt(6)); // 5-10 reviews
            
            for (int i = 0; i < numReviews; i++) {
                // Select a random user (or create a review with a random name)
                User reviewer = users.get(random.nextInt(users.size()));
                
                // Determine rating based on product category and randomness
                int rating = generateRating(product);
                
                // Generate review comment based on category and rating
                String comment = generateComment(product, rating);
                
                // Generate random reviewer name (or use user's name)
                String reviewerName = reviewerNames.get(random.nextInt(reviewerNames.size()));
                
                // Random date within last 6 months
                LocalDateTime reviewDate = LocalDateTime.now()
                    .minusDays(random.nextInt(180))
                    .minusHours(random.nextInt(24))
                    .minusMinutes(random.nextInt(60));
                
                Review review = new Review();
                review.setUser(reviewer);
                review.setProduct(product);
                review.setRating(rating);
                review.setComment(comment);
                review.setReviewerName(reviewerName);
                review.setVerifiedPurchase(random.nextDouble() > 0.3); // 70% verified purchases
                review.setCreatedAt(reviewDate);
                review.setUpdatedAt(reviewDate);
                
                reviewRepository.save(review);
            }
        }
        
        System.out.println("Review seeding completed!");
    }
    
    private int generateRating(Product product) {
        // Most products should have good ratings (4-5), some average (3-4), few bad (1-3)
        double rand = random.nextDouble();
        if (rand < 0.7) {
            // 70% chance of 4-5 stars
            return 4 + random.nextInt(2);
        } else if (rand < 0.9) {
            // 20% chance of 3-4 stars
            return 3 + random.nextInt(2);
        } else {
            // 10% chance of 1-3 stars
            return 1 + random.nextInt(3);
        }
    }
    
    private String generateComment(Product product, int rating) {
        String category = product.getCategory() != null ? product.getCategory().toLowerCase() : "";
        List<String> comments;
        
        if (rating >= 4) {
            // Positive reviews
            if (category.contains("electronics") || category.contains("accessories")) {
                comments = electronicsPositiveReviews;
            } else if (category.contains("clothing")) {
                comments = clothingPositiveReviews;
            } else if (category.contains("home") || category.contains("kitchen")) {
                comments = homeKitchenPositiveReviews;
            } else {
                comments = electronicsPositiveReviews; // Default
            }
        } else if (rating == 3) {
            comments = electronicsMixedReviews;
        } else {
            // Negative reviews
            comments = Arrays.asList(
                "Not as expected. Quality could be better.",
                "Average product. Expected more for the price.",
                "Could be improved. Not very satisfied.",
                "Not worth the money. Disappointed with the quality."
            );
        }
        
        return comments.get(random.nextInt(comments.size()));
    }
}

