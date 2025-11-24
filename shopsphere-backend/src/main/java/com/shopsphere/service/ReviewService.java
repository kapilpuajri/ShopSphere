package com.shopsphere.service;

import com.shopsphere.model.Review;
import com.shopsphere.model.Product;
import com.shopsphere.model.User;
import com.shopsphere.model.Order;
import com.shopsphere.model.OrderItem;
import com.shopsphere.repository.ReviewRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
    
    public List<Review> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserId(userId);
    }
    
    @Transactional
    public Review createReview(Long userId, Long productId, Integer rating, String comment) {
        // Check if user has already reviewed this product
        Optional<Review> existingReview = reviewRepository.findByUserIdAndProductId(userId, productId);
        if (existingReview.isPresent()) {
            throw new RuntimeException("You have already reviewed this product");
        }
        
        // Check if user has purchased this product (for verified purchase badge)
        boolean hasPurchased = hasUserPurchasedProduct(userId, productId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);
        review.setVerifiedPurchase(hasPurchased);
        review.setReviewerName(user.getFirstName() != null ? user.getFirstName() : "Customer");
        
        Review savedReview = reviewRepository.save(review);
        
        // Update product rating and review count
        updateProductRating(productId);
        
        return savedReview;
    }
    
    @Transactional
    public Review updateReview(Long reviewId, Long userId, Integer rating, String comment) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only update your own reviews");
        }
        
        review.setRating(rating);
        review.setComment(comment);
        
        Review updatedReview = reviewRepository.save(review);
        
        // Update product rating
        updateProductRating(review.getProduct().getId());
        
        return updatedReview;
    }
    
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own reviews");
        }
        
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        
        // Update product rating
        updateProductRating(productId);
    }
    
    private boolean hasUserPurchasedProduct(Long userId, Long productId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        for (Order order : orders) {
            if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct().getId().equals(productId)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    @Transactional
    private void updateProductRating(Long productId) {
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        Long reviewCount = reviewRepository.getReviewCountByProductId(productId);
        
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setRating(avgRating != null ? avgRating : 0.0);
        product.setReviewCount(reviewCount != null ? reviewCount.intValue() : 0);
        
        productRepository.save(product);
    }
    
    public boolean canUserReview(Long userId, Long productId) {
        // User can review if they haven't reviewed yet AND they have purchased the product
        if (reviewRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            return false; // Already reviewed
        }
        
        // Check if user has purchased this product (any order status, not just delivered)
        List<Order> orders = orderRepository.findByUserId(userId);
        for (Order order : orders) {
            // Allow review if order is not cancelled
            if (order.getStatus() != Order.OrderStatus.CANCELLED) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct().getId().equals(productId)) {
                        return true; // User has ordered this product
                    }
                }
            }
        }
        
        return false; // User hasn't ordered this product
    }
}

