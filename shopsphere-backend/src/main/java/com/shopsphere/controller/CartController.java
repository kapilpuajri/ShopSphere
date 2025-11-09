package com.shopsphere.controller;

import com.shopsphere.model.Cart;
import com.shopsphere.model.Product;
import com.shopsphere.model.User;
import com.shopsphere.repository.CartRepository;
import com.shopsphere.repository.ProductRepository;
import com.shopsphere.repository.UserRepository;
import com.shopsphere.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = "http://localhost:3000")
public class CartController {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RecommendationService recommendationService;
    
    @GetMapping("/{userId}")
    public ResponseEntity<List<Cart>> getCart(@PathVariable Long userId) {
        return ResponseEntity.ok(cartRepository.findByUserId(userId));
    }
    
    @PostMapping("/{userId}/add")
    public ResponseEntity<Cart> addToCart(@PathVariable Long userId, 
                                          @RequestParam Long productId,
                                          @RequestParam(defaultValue = "1") Integer quantity) {
        Cart cart = cartRepository.findByUserIdAndProductId(userId, productId)
            .orElse(new Cart());
        
        if (cart.getId() == null) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
            cart.setUser(user);
            cart.setProduct(product);
            cart.setQuantity(quantity);
        } else {
            cart.setQuantity(cart.getQuantity() + quantity);
        }
        
        return ResponseEntity.ok(cartRepository.save(cart));
    }
    
    @DeleteMapping("/{userId}/remove/{productId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable Long userId, 
                                              @PathVariable Long productId) {
        cartRepository.findByUserIdAndProductId(userId, productId)
            .ifPresent(cartRepository::delete);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{userId}/recommendations")
    public ResponseEntity<List<Product>> getCartRecommendations(@PathVariable Long userId) {
        List<Long> productIds = cartRepository.findByUserId(userId).stream()
            .map(c -> c.getProduct().getId())
            .collect(Collectors.toList());
        return ResponseEntity.ok(recommendationService.getCartRecommendations(productIds));
    }
}

