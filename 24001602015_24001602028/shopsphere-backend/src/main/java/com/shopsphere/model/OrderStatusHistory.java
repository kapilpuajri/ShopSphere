package com.shopsphere.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Order.OrderStatus status;
    
    @Column(nullable = false)
    private LocalDateTime statusDate;
    
    private String description; // Optional description for the status
    
    @PrePersist
    protected void onCreate() {
        if (statusDate == null) {
            statusDate = LocalDateTime.now();
        }
    }
}

