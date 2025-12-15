package com.shopsphere.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "product_associations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductAssociation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "associated_product_id", nullable = false)
    private Product associatedProduct;
    
    @Column(nullable = false)
    private Double associationStrength = 1.0; // Weight of the association
    
    @Enumerated(EnumType.STRING)
    private AssociationType type = AssociationType.COMPLEMENTARY;
    
    public enum AssociationType {
        COMPLEMENTARY, // e.g., phone + phone cover
        SIMILAR,       // e.g., similar products
        FREQUENTLY_BOUGHT_TOGETHER
    }
}

