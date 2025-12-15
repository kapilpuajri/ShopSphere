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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
    
    // Review templates for different product categories - More diverse reviews
    private final List<String> electronicsPositiveReviews = Arrays.asList(
        "Excellent product! The quality is outstanding and it works perfectly. Highly recommended!",
        "Great value for money. The features are amazing and the build quality is solid.",
        "Love this product! It exceeded my expectations. Fast delivery and excellent packaging.",
        "Best purchase I've made this year. The performance is top-notch and it looks great too.",
        "Very satisfied with this product. It's exactly as described and works flawlessly.",
        "Amazing quality! Worth every rupee. The product arrived in perfect condition.",
        "Highly recommend this product. Great features and excellent customer service.",
        "Perfect product for my needs. The quality is excellent and it's very user-friendly.",
        "Outstanding performance! This product has made my daily tasks so much easier.",
        "Premium build quality. The attention to detail is impressive. Worth the investment!",
        "Fast and reliable. Exactly what I was looking for. Great customer support too!",
        "Impressive features for the price. The design is sleek and modern. Very happy with my purchase!",
        "Works like a charm! No issues so far. The battery life is excellent.",
        "Top-notch quality! This product has exceeded all my expectations. Highly satisfied!"
    );
    
    private final List<String> electronicsMixedReviews = Arrays.asList(
        "Good product overall, but could be better. The price is reasonable though.",
        "Decent quality, but some features could be improved. Still worth buying.",
        "It's okay for the price. Not the best but not bad either. Does the job.",
        "Average product. Works fine but nothing exceptional. Good for basic needs.",
        "Satisfactory performance. Some minor issues but overall acceptable for the price.",
        "Does what it's supposed to do. Could use some improvements in design."
    );
    
    private final List<String> clothingPositiveReviews = Arrays.asList(
        "Perfect fit and great quality fabric! Very comfortable to wear.",
        "Love the design and color. The material is soft and durable.",
        "Excellent quality! Fits perfectly and looks exactly like the picture.",
        "Great purchase! The fabric is high quality and it's very comfortable.",
        "Beautiful product! Good quality and fast shipping. Highly recommend!",
        "Comfortable and stylish. The fit is perfect and the material feels premium.",
        "Great value for money. The quality is much better than expected. Very satisfied!",
        "Love the design! It's exactly as shown in the pictures. Great quality fabric.",
        "Perfect for everyday wear. Comfortable, durable, and looks great!",
        "Excellent purchase! The fit is perfect and the material is of high quality."
    );
    
    private final List<String> homeKitchenPositiveReviews = Arrays.asList(
        "Great addition to my kitchen! Very useful and well-made.",
        "Excellent quality product. Makes my daily tasks much easier.",
        "Love this product! It's durable and works perfectly for my needs.",
        "High quality and great value. Very satisfied with this purchase.",
        "Makes cooking so much easier! The quality is excellent and it's very durable.",
        "Perfect for my kitchen. Well-designed and functional. Highly recommend!",
        "Great investment! This product has improved my cooking experience significantly.",
        "Excellent build quality. Easy to use and clean. Very happy with this purchase!"
    );
    
    private final List<String> sportsPositiveReviews = Arrays.asList(
        "Perfect for my workout routine! Great quality and very durable.",
        "Excellent product for fitness enthusiasts. Highly recommend!",
        "Comfortable and well-made. Perfect for my exercise needs.",
        "Great value for money. The quality is excellent and it's very functional.",
        "Love this product! It has improved my workout experience significantly.",
        "Durable and reliable. Exactly what I needed for my fitness goals.",
        "High-quality product. Very satisfied with the performance and build quality."
    );
    
    private final List<String> beautyPositiveReviews = Arrays.asList(
        "Amazing product! Works wonders on my skin. Highly recommend!",
        "Great quality and effective. Very satisfied with the results.",
        "Love this product! It's gentle and effective. Perfect for my skincare routine.",
        "Excellent value for money. The quality is outstanding and it works great!",
        "Perfect addition to my beauty routine. The results are impressive!",
        "High-quality product. Very effective and gentle on the skin."
    );
    
    @Override
    public void run(String... args) {
        try {
            List<Product> products = productRepository.findAll();
            List<User> users = userRepository.findAll();
            
            if (products.isEmpty() || users.isEmpty()) {
                System.out.println("No products or users found, skipping review seeding.");
                return;
            }
            
            System.out.println("Seeding reviews for " + products.size() + " products...");
            
            int savedCount = 0;
            int skippedCount = 0;
            
            // Generate reviews for each product
            for (Product product : products) {
                // Get existing review count for this product
                long existingReviewsForProduct = reviewRepository.findByProductIdOrderByCreatedAtDesc(product.getId()).size();
                
                // Target number of reviews per product (2-3 reviews as requested)
                int targetReviews = 2 + random.nextInt(2); // 2-3 reviews
                
                // Always ensure at least 2 reviews per product
                int numReviewsToAdd = Math.max(0, (int)(targetReviews - existingReviewsForProduct));
                
                // If product has no reviews, add at least 2
                if (existingReviewsForProduct == 0) {
                    numReviewsToAdd = targetReviews;
                }
                
                // Skip if product already has enough reviews
                if (numReviewsToAdd <= 0) {
                    continue;
                }
                
                int numReviews = numReviewsToAdd;
            
            for (int i = 0; i < numReviews; i++) {
                // Select a random user (or create a review with a random name)
                User reviewer = users.get(random.nextInt(users.size()));
                
                // Check if this user has already reviewed this product
                Optional<Review> existingReview = reviewRepository.findByUserIdAndProductId(reviewer.getId(), product.getId());
                if (existingReview.isPresent()) {
                    // Skip this review if user already reviewed this product
                    continue;
                }
                
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
                
                try {
                    reviewRepository.save(review);
                    savedCount++;
                } catch (Exception e) {
                    // Skip if there's a constraint violation (duplicate entry)
                    skippedCount++;
                    // Don't print for every skip to avoid log spam
                    if (skippedCount % 10 == 0) {
                        System.out.println("Skipped " + skippedCount + " duplicate reviews so far...");
                    }
                    continue;
                }
            }
        }
        
            System.out.println("Review seeding completed! Saved: " + savedCount + ", Skipped: " + skippedCount);
        } catch (Exception e) {
            System.err.println("Error during review seeding: " + e.getMessage());
            e.printStackTrace();
            // Don't throw - allow app to continue starting
        }
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
            } else if (category.contains("sports")) {
                comments = sportsPositiveReviews;
            } else if (category.contains("beauty")) {
                comments = beautyPositiveReviews;
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
                "Not worth the money. Disappointed with the quality.",
                "Had some issues with this product. Customer service was helpful though.",
                "Decent but not great. Expected better quality for the price."
            );
        }
        
        return comments.get(random.nextInt(comments.size()));
    }
}

