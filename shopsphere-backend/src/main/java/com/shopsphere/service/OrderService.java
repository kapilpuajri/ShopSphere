package com.shopsphere.service;

import com.shopsphere.model.*;
import com.shopsphere.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private RecommendationService recommendationService;
    
    @Transactional
    public Order createOrder(Map<String, Object> orderData) {
        try {
            System.out.println("OrderService: Creating order with data: " + orderData);
            
            if (orderData.get("userId") == null) {
                throw new RuntimeException("User ID is required");
            }
            
            Long userId = Long.valueOf(orderData.get("userId").toString());
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            
            if (orderData.get("items") == null) {
                throw new RuntimeException("Order items are required");
            }
            
            Order order = new Order();
            order.setUser(user);
            order.setTotalAmount(new BigDecimal(orderData.get("totalAmount").toString()));
            order.setShippingAddress(orderData.get("shippingAddress").toString());
            order.setPaymentMethod(orderData.get("paymentMethod").toString());
            order.setStatus(Order.OrderStatus.PENDING);
            
            List<OrderItem> orderItems = new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
            
            if (items == null || items.isEmpty()) {
                throw new RuntimeException("Order must contain at least one item");
            }
            
            for (Map<String, Object> itemData : items) {
                if (itemData.get("productId") == null) {
                    throw new RuntimeException("Product ID is required for all items");
                }
                
                Long productId = Long.valueOf(itemData.get("productId").toString());
                Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
                
                Integer quantity = Integer.valueOf(itemData.get("quantity").toString());
                if (product.getStock() < quantity) {
                    throw new RuntimeException("Insufficient stock for product: " + product.getName());
                }
                
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setProduct(product);
                orderItem.setQuantity(quantity);
                orderItem.setPrice(new BigDecimal(itemData.get("price").toString()));
                
                orderItems.add(orderItem);
                
                // Update product stock
                product.setStock(product.getStock() - quantity);
                productRepository.save(product);
            }
            
            order.setOrderItems(orderItems);
            // Use saveAndFlush to ensure order is immediately committed to database
            Order savedOrder = orderRepository.saveAndFlush(order);
            System.out.println("OrderService: Order saved with ID: " + savedOrder.getId());
            System.out.println("OrderService: Order user ID: " + savedOrder.getUser().getId());
            System.out.println("OrderService: Order user ID type: " + savedOrder.getUser().getId().getClass());
            System.out.println("OrderService: Order items count: " + (savedOrder.getOrderItems() != null ? savedOrder.getOrderItems().size() : 0));
            System.out.println("OrderService: Order total amount: " + savedOrder.getTotalAmount());
            System.out.println("OrderService: Order flushed to database");
            
            // Force a refresh to ensure all relationships are loaded
            orderRepository.flush();
            
            // Save shipping address to user profile for future use
            String shippingAddress = orderData.get("shippingAddress").toString();
            if (shippingAddress != null && !shippingAddress.isEmpty()) {
                // Parse shipping address (format: "address, city, zipCode, country")
                String[] addressParts = shippingAddress.split(",");
                if (addressParts.length >= 4) {
                    user.setAddress(addressParts[0].trim());
                    user.setCity(addressParts[1].trim());
                    user.setZipCode(addressParts[2].trim());
                    user.setCountry(addressParts[3].trim());
                } else if (addressParts.length >= 1) {
                    user.setAddress(shippingAddress);
                }
            }
            
            // Save phone if provided in order data
            if (orderData.containsKey("phone") && orderData.get("phone") != null) {
                user.setPhone(orderData.get("phone").toString());
            }
            
            // Save address fields if provided separately
            if (orderData.containsKey("city") && orderData.get("city") != null) {
                user.setCity(orderData.get("city").toString());
            }
            if (orderData.containsKey("zipCode") && orderData.get("zipCode") != null) {
                user.setZipCode(orderData.get("zipCode").toString());
            }
            if (orderData.containsKey("country") && orderData.get("country") != null) {
                user.setCountry(orderData.get("country").toString());
            }
            
            userRepository.save(user);
            
            // Clear user's cart
            cartRepository.deleteByUserId(userId);
            
            // Refresh ML recommendation models with new order data
            recommendationService.evictCache();
            recommendationService.initializeMLModels();
            
            return savedOrder;
        } catch (Exception e) {
            System.err.println("OrderService: Error creating order: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create order: " + e.getMessage(), e);
        }
    }
}









