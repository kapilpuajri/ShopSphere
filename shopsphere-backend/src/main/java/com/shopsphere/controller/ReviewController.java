package com.shopsphere.controller;

import com.shopsphere.model.Review;
import com.shopsphere.service.ReviewService;
import com.shopsphere.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getReviewsByProduct(@PathVariable Long productId) {
        try {
            List<Review> reviews = reviewService.getReviewsByProductId(productId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReviewsByUser(@PathVariable Long userId) {
        try {
            List<Review> reviews = reviewService.getReviewsByUserId(userId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> reviewData) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authorization required");
                return ResponseEntity.status(401).body(error);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(authHeader);
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid token");
                return ResponseEntity.status(401).body(error);
            }
            
            Long productId = Long.valueOf(reviewData.get("productId").toString());
            Integer rating = Integer.valueOf(reviewData.get("rating").toString());
            String comment = reviewData.get("comment") != null ? reviewData.get("comment").toString() : "";
            
            Review review = reviewService.createReview(userId, productId, rating, comment);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long reviewId,
            @RequestBody Map<String, Object> reviewData) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authorization required");
                return ResponseEntity.status(401).body(error);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(authHeader);
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid token");
                return ResponseEntity.status(401).body(error);
            }
            
            Integer rating = Integer.valueOf(reviewData.get("rating").toString());
            String comment = reviewData.get("comment") != null ? reviewData.get("comment").toString() : "";
            
            Review review = reviewService.updateReview(reviewId, userId, rating, comment);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long reviewId) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authorization required");
                return ResponseEntity.status(401).body(error);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(authHeader);
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid token");
                return ResponseEntity.status(401).body(error);
            }
            
            reviewService.deleteReview(reviewId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/can-review/{productId}")
    public ResponseEntity<?> canUserReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long productId) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, Object> response = new HashMap<>();
                response.put("canReview", false);
                response.put("reason", "Please login to review");
                return ResponseEntity.ok(response);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(authHeader);
            if (userId == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("canReview", false);
                response.put("reason", "Invalid token");
                return ResponseEntity.ok(response);
            }
            
            boolean canReview = reviewService.canUserReview(userId, productId);
            Map<String, Object> response = new HashMap<>();
            response.put("canReview", canReview);
            if (!canReview) {
                // Check if already reviewed
                if (reviewService.getReviewsByUserId(userId).stream()
                    .anyMatch(r -> r.getProductId().equals(productId))) {
                    response.put("reason", "You have already reviewed this product");
                } else {
                    response.put("reason", "Please purchase this product to write a review");
                }
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("canReview", false);
            response.put("reason", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}

