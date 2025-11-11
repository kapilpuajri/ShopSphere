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
    
    @Transactional
    public Order createOrder(Map<String, Object> orderData) {
        Long userId = Long.valueOf(orderData.get("userId").toString());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Order order = new Order();
        order.setUser(user);
        order.setTotalAmount(new BigDecimal(orderData.get("totalAmount").toString()));
        order.setShippingAddress(orderData.get("shippingAddress").toString());
        order.setPaymentMethod(orderData.get("paymentMethod").toString());
        order.setStatus(Order.OrderStatus.PENDING);
        
        List<OrderItem> orderItems = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) orderData.get("items");
        
        for (Map<String, Object> itemData : items) {
            Long productId = Long.valueOf(itemData.get("productId").toString());
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(Integer.valueOf(itemData.get("quantity").toString()));
            orderItem.setPrice(new BigDecimal(itemData.get("price").toString()));
            
            orderItems.add(orderItem);
            
            // Update product stock
            product.setStock(product.getStock() - orderItem.getQuantity());
            productRepository.save(product);
        }
        
        order.setOrderItems(orderItems);
        Order savedOrder = orderRepository.save(order);
        
        // Clear user's cart
        cartRepository.deleteByUserId(userId);
        
        return savedOrder;
    }
}




