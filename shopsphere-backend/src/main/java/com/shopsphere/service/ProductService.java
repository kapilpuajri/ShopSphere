package com.shopsphere.service;

import com.shopsphere.model.Product;
import com.shopsphere.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    @Cacheable(value = "products", key = "#id")
    public Optional<Product> getProductById(Long id) {
        try {
            Optional<Product> product = productRepository.findById(id);
            if (product.isPresent()) {
                // Force initialization of lazy associations to avoid serialization issues
                Product p = product.get();
                if (p.getAssociations() != null) {
                    p.getAssociations().size(); // Force initialization
                }
            }
            return product;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }
    
    public List<Product> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.searchProducts(query.trim());
    }
    
    public List<Product> getTopRatedProducts() {
        return productRepository.findTopRatedProducts();
    }
    
    @CacheEvict(value = "products", key = "#product.id")
    public Product saveProduct(Product product) {
        Product saved = productRepository.save(product);
        // Also evict all entries to ensure category changes are reflected
        return saved;
    }
    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}

