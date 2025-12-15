package com.shopsphere.controller;

import com.shopsphere.model.Product;
import com.shopsphere.service.ProductService;
import com.shopsphere.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    @Autowired
    private RecommendationService recommendationService;
    
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        try {
            return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getProductsByCategory(category));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String q) {
        return ResponseEntity.ok(productService.searchProducts(q));
    }
    
    @GetMapping("/top-rated")
    public ResponseEntity<List<Product>> getTopRatedProducts() {
        return ResponseEntity.ok(productService.getTopRatedProducts());
    }
    
    @GetMapping("/{id}/recommendations")
    public ResponseEntity<List<Product>> getRecommendations(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(recommendationService.getRecommendations(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of()); // Return empty list on error instead of 500
        }
    }
    
    @GetMapping("/{id}/frequently-bought-together")
    public ResponseEntity<List<Product>> getFrequentlyBoughtTogether(@PathVariable Long id) {
        try {
            List<Product> result = recommendationService.getFrequentlyBoughtTogether(id);
            System.out.println("Frequently bought together for product " + id + ": " + result.size() + " products");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error in getFrequentlyBoughtTogether: " + e.getMessage());
            return ResponseEntity.ok(List.of()); // Return empty list on error instead of 500
        }
    }
    
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productService.saveProduct(product));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        try {
            return productService.getProductById(id)
                .map(existingProduct -> {
                    // Update fields
                    if (product.getName() != null) existingProduct.setName(product.getName());
                    if (product.getDescription() != null) existingProduct.setDescription(product.getDescription());
                    if (product.getPrice() != null) existingProduct.setPrice(product.getPrice());
                    if (product.getImageUrl() != null) existingProduct.setImageUrl(product.getImageUrl());
                    if (product.getCategory() != null) existingProduct.setCategory(product.getCategory());
                    if (product.getStock() != null) existingProduct.setStock(product.getStock());
                    if (product.getRating() != null) existingProduct.setRating(product.getRating());
                    if (product.getReviewCount() != null) existingProduct.setReviewCount(product.getReviewCount());
                    return ResponseEntity.ok(productService.saveProduct(existingProduct));
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        try {
            if (productService.getProductById(id).isPresent()) {
                productService.deleteProduct(id);
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}

