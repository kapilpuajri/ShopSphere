package com.shopsphere.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> orderItems;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20) // Ensure enough space for "OUT_FOR_DELIVERY"
    private OrderStatus status = OrderStatus.PENDING;
    
    private String shippingAddress;
    private String paymentMethod;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (pendingDate == null) {
            pendingDate = now;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<OrderStatusHistory> statusHistory;
    
    // Status timestamps
    private LocalDateTime pendingDate;
    private LocalDateTime confirmedDate;
    private LocalDateTime pickedUpDate;
    private LocalDateTime inTransitDate;
    private LocalDateTime outForDeliveryDate;
    private LocalDateTime deliveredDate;
    
    public enum OrderStatus {
        PENDING, CONFIRMED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    }
    
    // Helper method to update status and timestamp
    public void updateStatus(OrderStatus newStatus) {
        this.status = newStatus;
        LocalDateTime now = LocalDateTime.now();
        
        switch (newStatus) {
            case PENDING:
                if (pendingDate == null) pendingDate = now;
                break;
            case CONFIRMED:
                if (confirmedDate == null) confirmedDate = now;
                break;
            case PICKED_UP:
                if (pickedUpDate == null) pickedUpDate = now;
                break;
            case IN_TRANSIT:
                if (inTransitDate == null) inTransitDate = now;
                break;
            case OUT_FOR_DELIVERY:
                if (outForDeliveryDate == null) outForDeliveryDate = now;
                break;
            case DELIVERED:
                if (deliveredDate == null) deliveredDate = now;
                break;
            case CANCELLED:
                // No timestamp needed for cancelled orders
                break;
        }
        updatedAt = now;
    }
}










