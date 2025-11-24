package com.shopsphere.service;

import com.shopsphere.model.Order;
import com.shopsphere.model.OrderStatusHistory;
import com.shopsphere.repository.OrderRepository;
import com.shopsphere.repository.OrderStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class OrderStatusUpdateService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderStatusHistoryRepository statusHistoryRepository;
    
    // Auto-update order statuses every 5 minutes
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    @Transactional
    public void updateOrderStatuses() {
        List<Order> pendingOrders = orderRepository.findAll().stream()
            .filter(o -> o.getStatus() != Order.OrderStatus.DELIVERED && 
                        o.getStatus() != Order.OrderStatus.CANCELLED)
            .toList();
        
        LocalDateTime now = LocalDateTime.now();
        
        for (Order order : pendingOrders) {
            LocalDateTime orderDate = order.getCreatedAt();
            long hoursSinceOrder = ChronoUnit.HOURS.between(orderDate, now);
            
            Order.OrderStatus currentStatus = order.getStatus();
            Order.OrderStatus newStatus = null;
            
            // Progress status based on time since order
            switch (currentStatus) {
                case PENDING:
                    if (hoursSinceOrder >= 1) { // After 1 hour, confirm
                        newStatus = Order.OrderStatus.CONFIRMED;
                    }
                    break;
                case CONFIRMED:
                    if (hoursSinceOrder >= 6) { // After 6 hours, picked up
                        newStatus = Order.OrderStatus.PICKED_UP;
                    }
                    break;
                case PICKED_UP:
                    if (hoursSinceOrder >= 12) { // After 12 hours, in transit
                        newStatus = Order.OrderStatus.IN_TRANSIT;
                    }
                    break;
                case IN_TRANSIT:
                    if (hoursSinceOrder >= 24) { // After 24 hours, out for delivery
                        newStatus = Order.OrderStatus.OUT_FOR_DELIVERY;
                    }
                    break;
                case OUT_FOR_DELIVERY:
                    if (hoursSinceOrder >= 30) { // After 30 hours, delivered
                        newStatus = Order.OrderStatus.DELIVERED;
                    }
                    break;
                case DELIVERED:
                case CANCELLED:
                    // No status change for delivered or cancelled orders
                    break;
            }
            
            if (newStatus != null && newStatus != currentStatus) {
                order.updateStatus(newStatus);
                orderRepository.save(order);
                
                // Create status history entry
                OrderStatusHistory history = new OrderStatusHistory();
                history.setOrder(order);
                history.setStatus(newStatus);
                history.setStatusDate(LocalDateTime.now());
                history.setDescription(getStatusDescription(newStatus));
                statusHistoryRepository.save(history);
                
                System.out.println("Order #" + order.getId() + " status updated to: " + newStatus);
            }
        }
    }
    
    private String getStatusDescription(Order.OrderStatus status) {
        switch (status) {
            case CONFIRMED:
                return "Order confirmed by seller";
            case PICKED_UP:
                return "Item picked up from seller";
            case IN_TRANSIT:
                return "Item in transit to your city";
            case OUT_FOR_DELIVERY:
                return "Out for delivery";
            case DELIVERED:
                return "Order delivered successfully";
            default:
                return "";
        }
    }
    
    // Manual status update method (can be called from controller)
    @Transactional
    public void updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (order.getStatus() == Order.OrderStatus.DELIVERED || 
            order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot update status of delivered or cancelled order");
        }
        
        order.updateStatus(newStatus);
        orderRepository.save(order);
        
        // Create status history entry
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setStatus(newStatus);
        history.setStatusDate(LocalDateTime.now());
        history.setDescription(getStatusDescription(newStatus));
        statusHistoryRepository.save(history);
    }
}

