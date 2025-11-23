package com.shopsphere.controller;

import com.shopsphere.model.Order;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.service.OrderService;
import com.shopsphere.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> orderData) {
        try {
            System.out.println("Received order data: " + orderData);
            Order order = orderService.createOrder(orderData);
            System.out.println("Order created successfully: " + order.getId() + " for user: " + order.getUser().getId());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error creating order: " + e.getMessage());
            System.err.println("Stack trace: ");
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create order: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserOrders(@PathVariable Long userId) {
        try {
            System.out.println("=== Fetching orders for user ID: " + userId + " (type: " + userId.getClass() + ") ===");
            
            // First, let's check if there are ANY orders in the database
            List<Order> allOrders = orderRepository.findAll();
            System.out.println("Total orders in database: " + allOrders.size());
            if (!allOrders.isEmpty()) {
                System.out.println("Sample order user ID: " + allOrders.get(0).getUser().getId() + " (type: " + allOrders.get(0).getUser().getId().getClass() + ")");
            }
            
            // Try the primary query method
            List<Order> orders = orderRepository.findByUserId(userId);
            System.out.println("Primary query found " + orders.size() + " orders for user " + userId);
            
            // If no orders found, try alternative query
            if (orders.isEmpty()) {
                System.out.println("Trying alternative query method...");
                orders = orderRepository.findByUser_Id(userId);
                System.out.println("Alternative query found " + orders.size() + " orders for user " + userId);
            }
            
            // If still no orders, check all orders and filter manually
            if (orders.isEmpty()) {
                System.out.println("No orders found with queries. Checking all orders manually...");
                for (Order o : allOrders) {
                    Long orderUserId = o.getUser().getId();
                    System.out.println("Order ID: " + o.getId() + 
                        ", User ID: " + orderUserId + 
                        " (type: " + orderUserId.getClass() + ")" +
                        ", Requested User ID: " + userId + 
                        " (type: " + userId.getClass() + ")" +
                        ", Match: " + orderUserId.equals(userId));
                    
                    if (orderUserId.equals(userId)) {
                        orders.add(o);
                    }
                }
                System.out.println("Manually filtered orders: " + orders.size());
            }
            
            if (!orders.isEmpty()) {
                System.out.println("Orders found! First order ID: " + orders.get(0).getId());
            } else {
                System.out.println("WARNING: No orders found for user " + userId);
            }
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching orders: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch orders: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Authorization header required");
                return ResponseEntity.status(401).body(error);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(authHeader);
            if (userId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Invalid token");
                return ResponseEntity.status(401).body(error);
            }
            
            System.out.println("=== Fetching orders for authenticated user ID: " + userId + " ===");
            
            // Try multiple methods to fetch orders
            List<Order> orders = orderRepository.findByUserId(userId);
            System.out.println("Primary query found " + orders.size() + " orders");
            
            // If no orders, try alternative
            if (orders.isEmpty()) {
                orders = orderRepository.findByUser_Id(userId);
                System.out.println("Alternative query found " + orders.size() + " orders");
            }
            
            // If still empty, check all orders manually
            if (orders.isEmpty()) {
                List<Order> allOrders = orderRepository.findAll();
                System.out.println("Total orders in DB: " + allOrders.size());
                for (Order o : allOrders) {
                    if (o.getUser() != null && o.getUser().getId().equals(userId)) {
                        orders.add(o);
                        System.out.println("Found matching order: " + o.getId() + " for user " + userId);
                    }
                }
            }
            
            System.out.println("Final result: Found " + orders.size() + " orders for user " + userId);
            if (!orders.isEmpty()) {
                System.out.println("First order ID: " + orders.get(0).getId());
                System.out.println("First order items count: " + (orders.get(0).getOrderItems() != null ? orders.get(0).getOrderItems().size() : 0));
            }
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching orders: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch orders: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    // Debug endpoint to see all orders
    @GetMapping("/debug/all")
    public ResponseEntity<?> getAllOrders() {
        try {
            List<Order> allOrders = orderRepository.findAll();
            System.out.println("=== ALL ORDERS IN DATABASE ===");
            for (Order order : allOrders) {
                System.out.println("Order ID: " + order.getId() + 
                    ", User ID: " + order.getUser().getId() + 
                    ", Total: " + order.getTotalAmount() +
                    ", Status: " + order.getStatus());
            }
            return ResponseEntity.ok(allOrders);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}









